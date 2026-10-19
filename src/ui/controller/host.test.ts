import { describe, expect, it } from 'vitest'
import { createTestRoom, guestParticipant, hostParticipant, joinLobby, playUntil } from '../../net/session-testing'
import { createHostController } from './host'

async function startedHost() {
  const room = await createTestRoom({ seed: 7 })
  const alice = await joinLobby(room, 'Alice')
  room.host.setBots(1, 'heuristic')
  room.host.start()
  const controller = createHostController(room.host, () => 1234)
  return { room, alice, controller }
}

describe('contrôleur de l hôte', () => {
  it('expose la vue de la place de l hôte, les coups légaux et la session', async () => {
    const { controller } = await startedHost()
    const snapshot = controller.getSnapshot()
    expect(snapshot.view.seat).toBe(0)
    expect(snapshot.view.hand).toHaveLength(snapshot.view.handSizes[0] ?? -1)
    expect(snapshot.legalPlays).toEqual([])
    expect(snapshot.session).toMatchObject({ paused: false, roundEnd: null, error: null, receivedAt: 1234 })
    expect(snapshot.session?.seats).toHaveLength(3)
  })

  it('renvoie la même référence tant que rien ne change', async () => {
    const { controller } = await startedHost()
    expect(controller.getSnapshot()).toBe(controller.getSnapshot())
  })

  it('transmet les actions à la session et notifie les changements', async () => {
    const { controller } = await startedHost()
    let notified = 0
    controller.subscribe(() => notified++)
    const before = controller.getSnapshot()
    const ids = before.view.hand.slice(0, 3).map((c) => c.id)
    expect(controller.dispatch({ type: 'giveCards', seat: 0, cardIds: ids })).toEqual({ ok: true })
    expect(notified).toBeGreaterThan(0)
    expect(controller.getSnapshot()).not.toBe(before)
    expect(controller.getSnapshot().view.hasGiven[0]).toBe(true)
  })

  it('rapporte le refus du moteur sans changer l état', async () => {
    const { controller } = await startedHost()
    const before = controller.getSnapshot()
    expect(controller.dispatch({ type: 'playCard', seat: 0, cardId: 'hearts-2' })).toEqual({ ok: false, error: 'wrongPhase' })
    expect(controller.getSnapshot()).toBe(before)
  })

  it('indique la pause quand un invité part', async () => {
    const { alice, controller } = await startedHost()
    alice.link.close()
    expect(controller.getSnapshot().session).toMatchObject({ paused: true })
  })

  it('traduit « manche suivante » en demande à la session (vote en réseau)', async () => {
    const room = await createTestRoom({ seed: 7 })
    const alice = await joinLobby(room, 'Alice')
    room.host.setBots(1, 'heuristic')
    room.host.start()
    const controller = createHostController(room.host)
    playUntil(room, [hostParticipant(room.host), guestParticipant(alice)], 'roundEnd')

    expect(controller.dispatch({ type: 'nextRound' })).toEqual({ ok: true })
    const snapshot = controller.getSnapshot()
    expect(snapshot.view.phase).toBe('roundEnd')
    expect(snapshot.session?.roundEnd).toMatchObject({ iRequested: true, waitingFor: 1 })
  })

  it('ferme la salle à l arrêt', async () => {
    const { alice, controller } = await startedHost()
    controller.dispose()
    expect(alice.last('closed')).toEqual({ type: 'closed', reason: 'roomClosed' })
  })
})
