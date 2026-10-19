import { describe, expect, it } from 'vitest'
import { joinRoomAsGuest } from './session-guest'
import type { GuestSession } from './session-guest'
import type { Link, Transport } from './transport'
import { NO_HEARTBEAT, createTestRoom, flush } from './session-testing'
import type { TestRoom } from './session-testing'

async function guestIn(room: TestRoom): Promise<GuestSession> {
  const guest = joinRoomAsGuest(room.hub.transport, 'AAAAA', NO_HEARTBEAT)
  await flush()
  return guest
}

describe('session invité : connexion', () => {
  it("passe de la connexion au lobby et annonce le nom accepté", async () => {
    const room = await createTestRoom()
    const guest = joinRoomAsGuest(room.hub.transport, 'AAAAA', NO_HEARTBEAT)
    expect(guest.getSnapshot()).toEqual({ stage: 'connecting' })
    await flush()
    expect(guest.getSnapshot()).toMatchObject({ stage: 'lobby', players: ['Hôte'], you: null })
    guest.hello('Alice')
    expect(guest.getSnapshot()).toMatchObject({ stage: 'lobby', players: ['Hôte', 'Alice'], you: 'Alice' })
  })

  it('signale une salle introuvable', async () => {
    const room = await createTestRoom()
    const guest = joinRoomAsGuest(room.hub.transport, 'ZZZZZ', NO_HEARTBEAT)
    await flush()
    expect(guest.getSnapshot()).toEqual({ stage: 'failed', error: 'roomNotFound' })
  })

  it("rapporte le refus d'un nom pris dans le lobby", async () => {
    const room = await createTestRoom()
    const guest = await guestIn(room)
    guest.hello('hôte')
    expect(guest.getSnapshot()).toMatchObject({ stage: 'lobby', you: null, error: 'nameTaken' })
    guest.hello('Alice')
    expect(guest.getSnapshot()).toMatchObject({ you: 'Alice', error: null })
  })
})

describe('session invité : partie', () => {
  async function startedWithGuest(): Promise<{ room: TestRoom; guest: GuestSession }> {
    const room = await createTestRoom({ seed: 7 })
    const guest = await guestIn(room)
    guest.hello('Alice')
    room.host.setBots(1, 'heuristic')
    room.host.start()
    return { room, guest }
  }

  it('affiche la vue reçue et notifie à chaque changement', async () => {
    const { guest } = await startedWithGuest()
    let notified = 0
    guest.subscribe(() => notified++)
    const snapshot = guest.getSnapshot()
    if (snapshot.stage !== 'playing') throw new Error('partie attendue')
    expect(snapshot.view.seat).toBe(1)

    const ids = snapshot.view.hand.slice(0, 3).map((c) => c.id)
    expect(guest.dispatch({ type: 'giveCards', seat: 1, cardIds: ids })).toEqual({ ok: true })
    expect(notified).toBeGreaterThan(0)
    const next = guest.getSnapshot()
    expect(next).toMatchObject({ stage: 'playing', error: null })
    if (next.stage === 'playing') expect(next.view.hasGiven[1]).toBe(true)
  })

  it("rapporte le refus d'une action et le garde jusqu'à la vue suivante", async () => {
    const { guest } = await startedWithGuest()
    guest.dispatch({ type: 'giveCards', seat: 1, cardIds: ['trump-97', 'trump-98', 'trump-99'] })
    expect(guest.getSnapshot()).toMatchObject({ stage: 'playing', error: 'cardNotInHand' })
  })

  it('ignore une vue de version inférieure ou égale à la dernière affichée', async () => {
    let deliver: (data: unknown) => void = () => undefined
    const link: Link = {
      send: () => undefined,
      close: () => undefined,
      onMessage: (listener) => {
        deliver = listener
      },
      onClose: () => undefined,
    }
    const transport: Transport = {
      openRoom: () => Promise.reject(new Error('inutilisé')),
      joinRoom: () => Promise.resolve(link),
    }
    const guest = joinRoomAsGuest(transport, 'AAAAA', NO_HEARTBEAT)
    await flush()

    const state = (version: number, phase: string) => ({
      type: 'state',
      version,
      view: { seat: 1, playerCount: 3, phase, hand: [], handSizes: [0, 0, 0] },
      session: { seats: [{ kind: 'bot' }], paused: false, roundEnd: null },
    })
    deliver(state(13, 'playing'))
    deliver(state(12, 'exchange'))
    deliver(state(13, 'roundEnd'))
    const snapshot = guest.getSnapshot()
    expect(snapshot).toMatchObject({ stage: 'playing', version: 13 })
    if (snapshot.stage === 'playing') expect(snapshot.view.phase).toBe('playing')
    deliver(state(14, 'roundEnd'))
    expect(guest.getSnapshot()).toMatchObject({ version: 14 })
  })

  it("passe à « partie interrompue » quand l'hôte disparaît", async () => {
    const { room, guest } = await startedWithGuest()
    room.host.dispose()
    expect(guest.getSnapshot()).toEqual({ stage: 'closed', reason: 'roomClosed' })
  })

  it('indique le renvoi', async () => {
    const { room, guest } = await startedWithGuest()
    room.host.kick(1)
    expect(guest.getSnapshot()).toEqual({ stage: 'closed', reason: 'kicked' })
  })

  it("arrête de notifier après dispose et ferme la connexion", async () => {
    const { room, guest } = await startedWithGuest()
    let notified = 0
    guest.subscribe(() => notified++)
    guest.dispose()
    const view = room.host.getSnapshot()
    if (view.stage !== 'playing') throw new Error('partie attendue')
    room.host.dispatch({ type: 'giveCards', seat: 0, cardIds: view.view.hand.slice(0, 3).map((c) => c.id) })
    expect(notified).toBe(0)
    // L'hôte voit la place d'Alice libre : la connexion a bien été fermée.
    const after = room.host.getSnapshot()
    if (after.stage === 'playing') expect(after.session.seats[1]).toEqual({ kind: 'free', lastName: 'Alice' })
  })
})

describe('session invité : écran des places', () => {
  it('reçoit la liste des places puis prend une place libre', async () => {
    const room = await createTestRoom({ seed: 7 })
    const first = await guestIn(room)
    first.hello('Alice')
    const second = await guestIn(room)
    second.hello('Bruno')
    room.host.setBots(1, 'heuristic')
    room.host.start()
    first.dispose()

    const returning = await guestIn(room)
    expect(returning.getSnapshot()).toMatchObject({ stage: 'seats' })
    returning.claim(1, 'Alicia')
    expect(returning.getSnapshot()).toMatchObject({ stage: 'playing', error: null })
  })

  it('garde le motif du refus avec la liste mise à jour', async () => {
    const room = await createTestRoom({ seed: 7 })
    const alice = await guestIn(room)
    alice.hello('Alice')
    room.host.setBots(2, 'heuristic')
    room.host.start()

    const newcomer = await guestIn(room)
    newcomer.claim(0, 'Voleur')
    expect(newcomer.getSnapshot()).toMatchObject({ stage: 'seats', error: 'seatTaken' })
  })
})
