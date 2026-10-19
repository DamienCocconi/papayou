import { describe, expect, it } from 'vitest'
import { connectRawGuest, createTestRoom, guestParticipant, hostParticipant, joinLobby, playUntil } from './session-testing'
import type { RawGuest, TestRoom } from './session-testing'

function playing(room: TestRoom) {
  const snapshot = room.host.getSnapshot()
  if (snapshot.stage !== 'playing') throw new Error('partie attendue')
  return snapshot
}

/** Hôte + Alice + Bruno (3 places humaines), amenés à la fin de la première manche. */
async function threeHumansAtRoundEnd(): Promise<{ room: TestRoom; alice: RawGuest; bruno: RawGuest }> {
  const room = await createTestRoom({ seed: 7 })
  const alice = await joinLobby(room, 'Alice')
  const bruno = await joinLobby(room, 'Bruno')
  room.host.start()
  playUntil(room, [hostParticipant(room.host), guestParticipant(alice), guestParticipant(bruno)], 'roundEnd')
  return { room, alice, bruno }
}

describe('fin de manche avec chronomètre', () => {
  it("annonce à tous le temps restant et le nombre de joueurs attendus", async () => {
    const { room, alice, bruno } = await threeHumansAtRoundEnd()
    const expected = { remainingMs: 30_000, waitingFor: 3, iRequested: false }
    expect(playing(room).session.roundEnd).toEqual(expected)
    expect(alice.state()?.session.roundEnd).toEqual(expected)
    expect(bruno.state()?.session.roundEnd).toEqual(expected)
  })

  it("passe tout de suite à la manche suivante quand tous les humains ont cliqué", async () => {
    const { room, alice, bruno } = await threeHumansAtRoundEnd()
    room.host.requestNextRound()
    expect(playing(room).view.phase).toBe('roundEnd')
    expect(playing(room).session.roundEnd).toMatchObject({ waitingFor: 2, iRequested: true })
    alice.send({ type: 'nextRound' })
    expect(bruno.state()?.session.roundEnd).toMatchObject({ waitingFor: 1, iRequested: false })
    bruno.send({ type: 'nextRound' })

    expect(playing(room).view.phase).toBe('exchange')
    expect(playing(room).view.roundIndex).toBe(1)
    expect(playing(room).session.roundEnd).toBeNull()
    expect(room.clock.pending()).toBe(0)
  })

  it("passe à la manche suivante quand les 30 secondes sont écoulées", async () => {
    const { room, alice } = await threeHumansAtRoundEnd()
    room.host.requestNextRound()
    room.clock.advance(29_999)
    expect(playing(room).view.phase).toBe('roundEnd')
    room.clock.advance(1)
    expect(playing(room).view.phase).toBe('exchange')
    expect(alice.state()?.view.roundIndex).toBe(1)
  })

  it('décompte à partir du temps écoulé dans les vues renvoyées en cours de route', async () => {
    const { room, alice } = await threeHumansAtRoundEnd()
    room.clock.advance(10_000)
    alice.send({ type: 'nextRound' })
    expect(alice.state()?.session.roundEnd).toMatchObject({ remainingMs: 20_000, iRequested: true })
  })

  it("ne compte qu'une fois une demande répétée", async () => {
    const { room, alice } = await threeHumansAtRoundEnd()
    alice.send({ type: 'nextRound' })
    alice.send({ type: 'nextRound' })
    alice.send({ type: 'nextRound' })
    expect(playing(room).session.roundEnd).toMatchObject({ waitingFor: 2 })
    expect(playing(room).view.phase).toBe('roundEnd')
  })

  it("n'attend plus un joueur qui se déconnecte pendant le compte à rebours", async () => {
    const { room, alice, bruno } = await threeHumansAtRoundEnd()
    room.host.requestNextRound()
    alice.send({ type: 'nextRound' })
    expect(playing(room).session.roundEnd).toMatchObject({ waitingFor: 1 })

    bruno.link.close()
    // Plus personne à attendre : la manche suivante démarre (la place de Bruno est libre, la partie est en pause).
    expect(playing(room).view.phase).toBe('exchange')
    expect(playing(room).session.paused).toBe(true)
  })

  it("laisse le compte à rebours courir quand un joueur part sans que tous aient cliqué", async () => {
    const { room, alice, bruno } = await threeHumansAtRoundEnd()
    room.host.requestNextRound()
    bruno.link.close()
    expect(playing(room).view.phase).toBe('roundEnd')
    expect(playing(room).session.roundEnd).toMatchObject({ waitingFor: 1 })
    alice.send({ type: 'nextRound' })
    expect(playing(room).view.phase).toBe('exchange')
  })

  it("n'attend pas les bots", async () => {
    const room = await createTestRoom({ seed: 7 })
    const alice = await joinLobby(room, 'Alice')
    room.host.setBots(1, 'heuristic')
    room.host.start()
    playUntil(room, [hostParticipant(room.host), guestParticipant(alice)], 'roundEnd')
    expect(playing(room).session.roundEnd).toMatchObject({ waitingFor: 2 })
  })

  it("un joueur qui reprend une place pendant le compte à rebours peut demander la manche suivante", async () => {
    const { room, alice } = await threeHumansAtRoundEnd()
    alice.send({ type: 'nextRound' })
    alice.link.close()
    const returning = await connectRawGuest(room.hub)
    returning.send({ type: 'claim', seat: 1, name: 'Alice' })
    expect(returning.state()?.session.roundEnd).toMatchObject({ iRequested: false })
    returning.send({ type: 'nextRound' })
    expect(returning.errors()).toEqual([])
  })

  it("passe immédiatement quand l'hôte est le seul humain", async () => {
    const room = await createTestRoom({ seed: 7 })
    room.host.setBots(2, 'heuristic')
    room.host.start()
    playUntil(room, [hostParticipant(room.host)], 'roundEnd')
    expect(playing(room).session.roundEnd).toBeNull()
    expect(room.clock.pending()).toBe(0)
    room.host.requestNextRound()
    expect(playing(room).view.roundIndex).toBe(1)
  })

  it('ne lance aucun compte à rebours après la dernière manche', async () => {
    const { room, alice, bruno } = await threeHumansAtRoundEnd()
    playUntil(room, [hostParticipant(room.host), guestParticipant(alice), guestParticipant(bruno)], 'gameEnd')
    expect(playing(room).session.roundEnd).toBeNull()
    expect(playing(room).view.ranking).not.toBeNull()
    expect(room.clock.pending()).toBe(0)
  })

  it('refuse une demande hors fin de manche', async () => {
    const room = await createTestRoom({ seed: 7 })
    const alice = await joinLobby(room, 'Alice')
    room.host.setBots(1, 'heuristic')
    room.host.start()
    alice.send({ type: 'nextRound' })
    expect(alice.errors()).toEqual(['wrongPhase'])
  })

  it("n'attend pas une place libre : les présents ayant cliqué lancent la manche", async () => {
    const { room, alice, bruno } = await threeHumansAtRoundEnd()
    bruno.link.close()
    expect(playing(room).view.phase).toBe('roundEnd')
    room.host.requestNextRound()
    alice.send({ type: 'nextRound' })
    expect(playing(room).view.phase).toBe('exchange')
  })

  it("conclut le vote quand un renvoi laisse l'hôte seul humain après son clic", async () => {
    const room = await createTestRoom({ seed: 7 })
    const alice = await joinLobby(room, 'Alice')
    room.host.setBots(1, 'heuristic')
    room.host.start()
    playUntil(room, [hostParticipant(room.host), guestParticipant(alice)], 'roundEnd')
    room.host.requestNextRound()
    expect(playing(room).session.roundEnd).toMatchObject({ waitingFor: 1 })

    room.host.kick(1)
    expect(playing(room).session.roundEnd).toBeNull()
    expect(room.clock.pending()).toBe(0)
    expect(room.host.requestNextRound()).toEqual({ ok: true })
    expect(playing(room).view.roundIndex).toBe(1)
  })

  it("supprime le compte à rebours quand le remplacement d'un absent laisse une seule place humaine", async () => {
    const room = await createTestRoom({ seed: 7 })
    const alice = await joinLobby(room, 'Alice')
    room.host.setBots(1, 'heuristic')
    room.host.start()
    playUntil(room, [hostParticipant(room.host), guestParticipant(alice)], 'roundEnd')
    alice.link.close()
    expect(playing(room).session.roundEnd).not.toBeNull()
    room.host.replaceWithBot(1)
    expect(playing(room).session.roundEnd).toBeNull()
    expect(room.clock.pending()).toBe(0)
  })
})
