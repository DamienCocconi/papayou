import { describe, expect, it } from 'vitest'
import { joinRoomAsGuest } from '../../net/session-guest'
import { NO_HEARTBEAT, createTestRoom, flush } from '../../net/session-testing'
import type { TestRoom } from '../../net/session-testing'
import { createGuestController } from './guest'

async function startedGuest(room: TestRoom) {
  const session = joinRoomAsGuest(room.hub.transport, 'AAAAA', NO_HEARTBEAT)
  await flush()
  session.hello('Alice')
  room.host.setBots(1, 'heuristic')
  room.host.start()
  return { session, controller: createGuestController(session, () => 99) }
}

describe('contrôleur de l invité', () => {
  it('expose la vue reçue, sans main adverse, et la session', async () => {
    const room = await createTestRoom({ seed: 7 })
    const { controller } = await startedGuest(room)
    const snapshot = controller.getSnapshot()
    expect(snapshot.view.seat).toBe(1)
    expect(snapshot.botsPending).toBe(false)
    expect(snapshot.session).toMatchObject({ paused: false, error: null, receivedAt: 99 })
    expect(JSON.stringify(snapshot)).not.toContain('rngState')
  })

  it('envoie l action à l hôte et notifie la vue qui revient', async () => {
    const room = await createTestRoom({ seed: 7 })
    const { controller } = await startedGuest(room)
    let notified = 0
    controller.subscribe(() => notified++)
    const ids = controller.getSnapshot().view.hand.slice(0, 3).map((c) => c.id)
    expect(controller.dispatch({ type: 'giveCards', seat: 1, cardIds: ids })).toEqual({ ok: true })
    expect(notified).toBeGreaterThan(0)
    expect(controller.getSnapshot().view.hasGiven[1]).toBe(true)
  })

  it('rapporte le refus de l hôte dans la session', async () => {
    const room = await createTestRoom({ seed: 7 })
    const { controller } = await startedGuest(room)
    controller.dispatch({ type: 'giveCards', seat: 1, cardIds: ['trump-97', 'trump-98', 'trump-99'] })
    expect(controller.getSnapshot().session?.error).toBe('cardNotInHand')
  })

  it('garde la dernière vue quand l hôte disparaît', async () => {
    const room = await createTestRoom({ seed: 7 })
    const { controller, session } = await startedGuest(room)
    const before = controller.getSnapshot()
    room.host.dispose()
    expect(session.getSnapshot()).toMatchObject({ stage: 'closed' })
    expect(controller.getSnapshot()).toBe(before)
  })

  it('ferme la connexion à l arrêt et ne notifie plus', async () => {
    const room = await createTestRoom({ seed: 7 })
    const { controller } = await startedGuest(room)
    let notified = 0
    controller.subscribe(() => notified++)
    controller.dispose()
    const host = room.host.getSnapshot()
    if (host.stage !== 'playing') throw new Error('partie attendue')
    // La connexion est fermée : l'hôte voit la place d'Alice libre et la partie en pause.
    expect(host.session.seats[1]).toEqual({ kind: 'free', lastName: 'Alice' })
    expect(notified).toBe(0)
  })
})
