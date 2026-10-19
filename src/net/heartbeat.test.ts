import { describe, expect, it } from 'vitest'
import { parseGuestMessage, parseHostMessage } from './protocol'
import { joinRoomAsGuest } from './session-guest'
import type { GuestSession } from './session-guest'
import { connectRawGuest, createTestRoom, flush, joinLobby } from './session-testing'
import type { TestRoom } from './session-testing'

describe('protocole du battement de cœur', () => {
  it('accepte ping et pong et le motif de fermeture timeout', () => {
    expect(parseGuestMessage({ type: 'ping' })).toEqual({ type: 'ping' })
    expect(parseHostMessage({ type: 'pong' })).toEqual({ type: 'pong' })
    expect(parseHostMessage({ type: 'closed', reason: 'timeout' })).toEqual({ type: 'closed', reason: 'timeout' })
  })
})

function playing(room: TestRoom) {
  const snapshot = room.host.getSnapshot()
  if (snapshot.stage !== 'playing') throw new Error('partie attendue')
  return snapshot
}

describe('hôte : connexion silencieuse', () => {
  it("répond pong à un ping", async () => {
    const room = await createTestRoom({ heartbeatTimeoutMs: 15_000 })
    const guest = await connectRawGuest(room.hub)
    guest.send({ type: 'ping' })
    expect(guest.messages.some((m) => m.type === 'pong')).toBe(true)
  })

  it("libère la place d'un joueur muet et met la partie en pause", async () => {
    const room = await createTestRoom({ seed: 7, heartbeatTimeoutMs: 15_000 })
    const alice = await joinLobby(room, 'Alice')
    const bruno = await joinLobby(room, 'Bruno')
    room.host.setBots(1, 'heuristic')
    room.host.start()

    // Bruno continue à envoyer des ping, Alice se tait (téléphone perdu, mais sa connexion reste ouverte).
    for (let i = 0; i < 4; i++) {
      room.clock.advance(5000)
      bruno.send({ type: 'ping' })
    }
    expect(playing(room).session.seats[1]).toEqual({ kind: 'free', lastName: 'Alice' })
    expect(playing(room).session.seats[2]).toMatchObject({ kind: 'human', name: 'Bruno' })
    expect(playing(room).session.paused).toBe(true)
    expect(alice.last('closed')).toEqual({ type: 'closed', reason: 'timeout' })
    expect(alice.closed).toBe(true)
  })

  it('laisse une place reprise après la détection, même quand la place semblait pleine', async () => {
    const room = await createTestRoom({ seed: 7, heartbeatTimeoutMs: 15_000 })
    await joinLobby(room, 'Alice')
    room.host.setBots(1, 'heuristic')
    room.host.start()
    room.clock.advance(20_000)
    expect(playing(room).session.paused).toBe(true)

    const back = await connectRawGuest(room.hub)
    back.send({ type: 'claim', seat: 1, name: 'Alice' })
    expect(back.state()?.view.seat).toBe(1)
    expect(playing(room).session.paused).toBe(false)
  })

  it("retire du lobby un invité muet : la salle n'est plus pleine à cause de lui", async () => {
    const room = await createTestRoom({ heartbeatTimeoutMs: 15_000 })
    const talkers = []
    for (const name of ['A', 'B', 'C', 'D', 'E']) talkers.push(await joinLobby(room, name))
    expect(room.host.getSnapshot()).toMatchObject({ players: ['Hôte', 'A', 'B', 'C', 'D', 'E'] })
    for (let i = 0; i < 4; i++) {
      room.clock.advance(5000)
      for (const t of talkers.slice(1)) t.send({ type: 'ping' })
    }
    expect(room.host.getSnapshot()).toMatchObject({ players: ['Hôte', 'B', 'C', 'D', 'E'] })
    const late = await connectRawGuest(room.hub)
    late.send({ type: 'hello', name: 'Zoé' })
    expect(late.errors()).toEqual([])
  })

  it("ne touche pas un invité qui parle : n'importe quel message prouve qu'il est vivant", async () => {
    const room = await createTestRoom({ seed: 7, heartbeatTimeoutMs: 15_000 })
    const alice = await joinLobby(room, 'Alice')
    room.host.setBots(1, 'heuristic')
    room.host.start()
    for (let i = 0; i < 6; i++) {
      room.clock.advance(10_000)
      alice.send({ type: 'ping' })
    }
    expect(playing(room).session.seats[1]).toMatchObject({ kind: 'human', name: 'Alice' })
  })

  it('arrête la surveillance à la fermeture de la salle', async () => {
    const room = await createTestRoom({ heartbeatTimeoutMs: 15_000 })
    await joinLobby(room, 'Alice')
    expect(room.clock.pending()).toBeGreaterThan(0)
    room.host.dispose()
    expect(room.clock.pending()).toBe(0)
  })
})

describe('invité : hôte silencieux', () => {
  async function guestWithClock(room: TestRoom): Promise<GuestSession> {
    const guest = joinRoomAsGuest(room.hub.transport, 'AAAAA', {
      pingMs: 5000,
      timeoutMs: 15_000,
      scheduler: room.clock.scheduler,
      now: room.clock.now,
    })
    await flush()
    return guest
  }

  it("envoie un ping régulier et reste connecté tant que l'hôte répond", async () => {
    const room = await createTestRoom({ heartbeatTimeoutMs: 15_000 })
    const guest = await guestWithClock(room)
    guest.hello('Alice')
    for (let i = 0; i < 10; i++) room.clock.advance(5000)
    expect(guest.getSnapshot()).toMatchObject({ stage: 'lobby', you: 'Alice' })
    expect(room.host.getSnapshot()).toMatchObject({ players: ['Hôte', 'Alice'] })
  })

  it("passe en « hôte parti » après un long silence sans fermeture signalée", async () => {
    const room = await createTestRoom({ heartbeatTimeoutMs: 0 })
    // Hôte factice : accepte la connexion mais ne répond jamais.
    const hub = room.hub
    const guest = joinRoomAsGuest(
      {
        openRoom: hub.transport.openRoom,
        joinRoom: async () => ({
          send: () => undefined,
          close: () => undefined,
          onMessage: () => undefined,
          onClose: () => undefined,
        }),
      },
      'AAAAA',
      { pingMs: 5000, timeoutMs: 15_000, scheduler: room.clock.scheduler, now: room.clock.now },
    )
    await flush()
    room.clock.advance(5000)
    expect(guest.getSnapshot()).toEqual({ stage: 'connecting' })
    room.clock.advance(15_000)
    expect(guest.getSnapshot()).toEqual({ stage: 'closed', reason: 'hostLeft' })
    expect(room.clock.pending()).toBe(0)
  })
})
