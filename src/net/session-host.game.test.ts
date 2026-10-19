import { describe, expect, it } from 'vitest'
import { createGame } from '../engine'
import { connectRawGuest, createTestRoom, guestParticipant, hostParticipant, joinLobby, playUntil } from './session-testing'
import type { RawGuest, TestRoom } from './session-testing'

const SEED = 7

/** Hôte + deux invités + un bot, partie démarrée. */
async function startFourPlayers(): Promise<{ room: TestRoom; alice: RawGuest; bruno: RawGuest }> {
  const room = await createTestRoom({ seed: SEED })
  const alice = await joinLobby(room, 'Alice')
  const bruno = await joinLobby(room, 'Bruno')
  room.host.setBots(1, 'heuristic')
  room.host.start()
  return { room, alice, bruno }
}

describe('vues par joueur', () => {
  it("n'envoie à chaque invité que sa main, jamais celle d'un autre ni l'état du générateur", async () => {
    const { room, alice, bruno } = await startFourPlayers()
    const full = createGame(4, SEED)
    expect(room.hub.sentByHost.some((record) => record.json.includes('"type":"state"'))).toBe(true)

    const guests = [
      { guest: alice, seat: 1 },
      { guest: bruno, seat: 2 },
    ]
    for (const { guest, seat } of guests) {
      const view = guest.state()?.view
      expect(view?.hand.map((c) => c.id)).toEqual(full.hands[seat]?.map((c) => c.id))
    }
    for (const record of room.hub.sentByHost) {
      if (!record.json.includes('"type":"state"')) continue
      expect(record.json).not.toContain('rngState')
      expect(record.json).not.toContain('"hands"')
    }
    // La main d'Alice (place 1) n'apparaît jamais dans ce que reçoit Bruno, et inversement.
    const aliceIds = full.hands[1]?.map((c) => c.id) ?? []
    const brunoJson = JSON.stringify(bruno.messages)
    for (const id of aliceIds) expect(brunoJson).not.toContain(`"id":"${id}"`)
    const brunoIds = full.hands[2]?.map((c) => c.id) ?? []
    const aliceJson = JSON.stringify(alice.messages)
    for (const id of brunoIds) expect(aliceJson).not.toContain(`"id":"${id}"`)
  })

  it('numérote les vues avec une version qui croît à chaque changement', async () => {
    const { room, alice } = await startFourPlayers()
    const first = alice.state()?.version ?? 0
    const view = alice.state()?.view
    if (!view) throw new Error('vue absente')
    alice.send({
      type: 'action',
      action: { type: 'giveCards', seat: 1, cardIds: view.hand.slice(0, 3).map((c) => c.id) },
    })
    const second = alice.state()?.version ?? 0
    expect(second).toBeGreaterThan(first)
    const versions = alice.messages.flatMap((m) => (m.type === 'state' ? [m.version] : []))
    expect(versions).toEqual([...versions].sort((a, b) => a - b))
    expect(new Set(versions).size).toBe(versions.length)
    expect(room.host.getSnapshot()).toMatchObject({ stage: 'playing', version: second })
  })

  it('envoie à tous la nouvelle vue quand un joueur agit', async () => {
    const { alice, bruno } = await startFourPlayers()
    const before = bruno.state()?.version ?? 0
    const view = alice.state()?.view
    if (!view) throw new Error('vue absente')
    alice.send({ type: 'action', action: { type: 'giveCards', seat: 1, cardIds: view.hand.slice(0, 3).map((c) => c.id) } })
    expect(bruno.state()?.version).toBeGreaterThan(before)
    expect(bruno.state()?.view.hasGiven[1]).toBe(true)
  })
})

describe('actions des invités validées par l hôte', () => {
  it('refuse une carte illégale : état inchangé, erreur au seul invité concerné', async () => {
    const { room, alice, bruno } = await startFourPlayers()
    const before = room.host.getSnapshot()
    const bruno0 = bruno.messages.length
    alice.send({ type: 'action', action: { type: 'giveCards', seat: 1, cardIds: ['trump-99', 'trump-98', 'trump-97'] } })
    expect(alice.errors()).toEqual(['cardNotInHand'])
    expect(room.host.getSnapshot()).toBe(before)
    expect(bruno.messages.length).toBe(bruno0)
  })

  it('refuse une action hors phase ou hors tour', async () => {
    const { alice } = await startFourPlayers()
    alice.send({ type: 'action', action: { type: 'playCard', seat: 1, cardId: 'hearts-2' } })
    expect(alice.errors()).toEqual(['wrongPhase'])
  })

  it("traite une action portant la place d'un autre comme venant de la place de l'invité", async () => {
    const { room, alice } = await startFourPlayers()
    const view = alice.state()?.view
    if (!view) throw new Error('vue absente')
    // Alice (place 1) prétend agir pour la place 0 (l'hôte).
    alice.send({ type: 'action', action: { type: 'giveCards', seat: 0, cardIds: view.hand.slice(0, 3).map((c) => c.id) } })
    const snapshot = room.host.getSnapshot()
    if (snapshot.stage !== 'playing') throw new Error('partie attendue')
    expect(alice.errors()).toEqual([])
    expect(snapshot.view.hasGiven[0]).toBe(false)
    expect(snapshot.view.hasGiven[1]).toBe(true)
  })

  it('ignore un message mal formé sans rien changer', async () => {
    const { room, alice } = await startFourPlayers()
    const before = room.host.getSnapshot()
    alice.send({ type: 'action', action: { type: 'playCard', seat: 1 } })
    alice.send({ nimportequoi: true })
    expect(alice.errors()).toEqual([])
    expect(room.host.getSnapshot()).toBe(before)
  })

  it("refuse l'action d'un arrivant qui n'a pas de place", async () => {
    const room = await createTestRoom({ seed: SEED })
    await joinLobby(room, 'Alice')
    await joinLobby(room, 'Bruno')
    room.host.start()
    const stranger = await connectRawGuest(room.hub)
    stranger.send({ type: 'action', action: { type: 'playCard', seat: 0, cardId: 'hearts-2' } })
    expect(stranger.errors()).toEqual(['notSeated'])
  })
})

describe('bots tenus par l hôte', () => {
  it("fait jouer le bot sans intervention humaine, et seulement quand l'humain a fini d'agir", async () => {
    const room = await createTestRoom({ seed: SEED })
    const alice = await joinLobby(room, 'Alice')
    room.host.setBots(1, 'heuristic')
    room.host.start()
    const host = hostParticipant(room.host)
    const guest = guestParticipant(alice)

    room.clock.advance(5000)
    // Les humains n'ont pas encore donné : le bot (place 2) a donné, les humains non.
    expect(alice.state()?.view.hasGiven).toEqual([false, false, true])

    host.act({ type: 'giveCards', seat: 0, cardIds: (host.view()?.hand ?? []).slice(0, 3).map((c) => c.id) })
    expect(alice.state()?.view.phase).toBe('exchange')
    guest.act({ type: 'giveCards', seat: 1, cardIds: (guest.view()?.hand ?? []).slice(0, 3).map((c) => c.id) })
    expect(alice.state()?.view.phase).toBe('choosePapayou')
  })

  it('enchaîne les coups de bots avec le délai configuré', async () => {
    const room = await createTestRoom({ seed: SEED, botDelayMs: 600 })
    room.host.setBots(2, 'random')
    room.host.start()
    const view = () => {
      const s = room.host.getSnapshot()
      return s.stage === 'playing' ? s.view : null
    }
    expect(view()?.hasGiven).toEqual([false, false, false])
    room.clock.advance(599)
    expect(view()?.hasGiven.filter(Boolean)).toHaveLength(0)
    room.clock.advance(1)
    expect(view()?.hasGiven.filter(Boolean)).toHaveLength(1)
    room.clock.advance(600)
    expect(view()?.hasGiven).toEqual([false, true, true])
  })
})

describe('partie complète en mémoire', () => {
  for (const total of [3, 4, 5, 6]) {
    it(`mène une partie à ${total} places jusqu'à la fin avec un classement`, async () => {
      const room = await createTestRoom({ seed: SEED })
      const alice = await joinLobby(room, 'Alice')
      room.host.setBots(total - 2, 'heuristic')
      room.host.start()
      const participants = [hostParticipant(room.host), guestParticipant(alice)]

      playUntil(room, participants, 'gameEnd')

      const snapshot = room.host.getSnapshot()
      if (snapshot.stage !== 'playing') throw new Error('partie attendue')
      expect(snapshot.view.playerCount).toBe(total)
      expect(snapshot.view.ranking).not.toBeNull()
      expect(snapshot.session.roundEnd).toBeNull()
      expect(room.clock.pending()).toBe(0)
      // Chaque manche vaut 390 points (invariant du moteur) : les totaux le reflètent.
      const sum = snapshot.view.totals.reduce((a, b) => a + b, 0)
      expect(sum).toBe(390 * total)
      // Les vues d'un invité restent cohérentes : main sans doublon, taille annoncée.
      for (const message of alice.messages) {
        if (message.type !== 'state') continue
        const ids = message.view.hand.map((c) => c.id)
        expect(new Set(ids).size).toBe(ids.length)
        expect(message.view.handSizes[message.view.seat]).toBe(ids.length)
      }
    })
  }

  it('est reproductible avec la même graine', async () => {
    async function finalTotals(): Promise<number[]> {
      const room = await createTestRoom({ seed: SEED })
      const alice = await joinLobby(room, 'Alice')
      room.host.setBots(2, 'heuristic')
      room.host.start()
      playUntil(room, [hostParticipant(room.host), guestParticipant(alice)], 'gameEnd')
      const snapshot = room.host.getSnapshot()
      if (snapshot.stage !== 'playing') throw new Error('partie attendue')
      return snapshot.view.totals
    }
    expect(await finalTotals()).toEqual(await finalTotals())
  })
})
