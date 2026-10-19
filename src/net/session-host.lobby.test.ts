import { describe, expect, it } from 'vitest'
import { connectRawGuest, createTestRoom, flush, joinLobby } from './session-testing'

describe('lobby : arrivée et noms', () => {
  it("montre l'hôte seul au départ", async () => {
    const room = await createTestRoom()
    const snapshot = room.host.getSnapshot()
    expect(snapshot).toMatchObject({ stage: 'lobby', code: 'AAAAA', players: ['Hôte'], botCount: 0, canStart: false })
  })

  it('diffuse la liste à tous quand un invité rejoint', async () => {
    const room = await createTestRoom()
    const alice = await joinLobby(room, 'Alice')
    const bruno = await joinLobby(room, 'Bruno')
    await flush()
    expect(room.host.getSnapshot()).toMatchObject({ players: ['Hôte', 'Alice', 'Bruno'] })
    expect(alice.last('lobby')).toEqual({ type: 'lobby', players: ['Hôte', 'Alice', 'Bruno'], you: 'Alice' })
    expect(bruno.last('lobby')).toEqual({ type: 'lobby', players: ['Hôte', 'Alice', 'Bruno'], you: 'Bruno' })
  })

  it('annonce la salle à un arrivant avant son nom (you est null)', async () => {
    const room = await createTestRoom()
    const guest = await connectRawGuest(room.hub)
    expect(guest.last('lobby')).toEqual({ type: 'lobby', players: ['Hôte'], you: null })
  })

  it('refuse un nom vide ou trop long', async () => {
    const room = await createTestRoom()
    const guest = await connectRawGuest(room.hub)
    guest.send({ type: 'hello', name: '   ' })
    guest.send({ type: 'hello', name: 'x'.repeat(21) })
    expect(guest.errors()).toEqual(['invalidName', 'invalidName'])
    expect(room.host.getSnapshot()).toMatchObject({ players: ['Hôte'] })
  })

  it('refuse un nom déjà pris, sans tenir compte de la casse, y compris celui de l hôte', async () => {
    const room = await createTestRoom()
    await joinLobby(room, 'Alice')
    const second = await connectRawGuest(room.hub)
    second.send({ type: 'hello', name: 'ALICE' })
    second.send({ type: 'hello', name: 'hôte' })
    expect(second.errors()).toEqual(['nameTaken', 'nameTaken'])
    second.send({ type: 'hello', name: 'Chloé' })
    expect(second.errors()).toHaveLength(2)
    expect(room.host.getSnapshot()).toMatchObject({ players: ['Hôte', 'Alice', 'Chloé'] })
  })

  it('retire un invité qui part avant le démarrage', async () => {
    const room = await createTestRoom()
    const alice = await joinLobby(room, 'Alice')
    await joinLobby(room, 'Bruno')
    alice.link.close()
    expect(room.host.getSnapshot()).toMatchObject({ players: ['Hôte', 'Bruno'] })
  })

  it('refuse un septième humain : salle pleine', async () => {
    const room = await createTestRoom()
    for (const name of ['A', 'B', 'C', 'D', 'E']) await joinLobby(room, name)
    expect(room.host.getSnapshot()).toMatchObject({ players: ['Hôte', 'A', 'B', 'C', 'D', 'E'] })
    const late = await connectRawGuest(room.hub)
    late.send({ type: 'hello', name: 'Retard' })
    expect(late.errors()).toEqual(['roomFull'])
  })

  it('ignore un message mal formé', async () => {
    const room = await createTestRoom()
    const guest = await connectRawGuest(room.hub)
    guest.send({ type: 'hello', name: 42 })
    guest.send('nimporte quoi')
    expect(guest.errors()).toEqual([])
  })
})

describe('lobby : bots et démarrage', () => {
  it('démarre à 4 joueurs avec 3 humains et 1 bot', async () => {
    const room = await createTestRoom()
    const alice = await joinLobby(room, 'Alice')
    const bruno = await joinLobby(room, 'Bruno')
    room.host.setBots(1, 'random')
    expect(room.host.getSnapshot()).toMatchObject({ botCount: 1, botKind: 'random', canStart: true })
    expect(room.host.start()).toEqual({ ok: true })

    const snapshot = room.host.getSnapshot()
    if (snapshot.stage !== 'playing') throw new Error('la partie devrait être démarrée')
    expect(snapshot.view.playerCount).toBe(4)
    expect(snapshot.view.seat).toBe(0)
    expect(snapshot.session.seats).toEqual([
      { kind: 'human', name: 'Hôte', isHost: true },
      { kind: 'human', name: 'Alice', isHost: false },
      { kind: 'human', name: 'Bruno', isHost: false },
      { kind: 'bot' },
    ])
    expect(alice.state()?.view.seat).toBe(1)
    expect(bruno.state()?.view.seat).toBe(2)
  })

  it("refuse le démarrage si le total n'atteint pas 3", async () => {
    const room = await createTestRoom()
    room.host.setBots(1, 'heuristic')
    expect(room.host.getSnapshot()).toMatchObject({ canStart: false })
    expect(room.host.start()).toEqual({ ok: false, error: 'tooFewPlayers' })
    expect(room.host.getSnapshot().stage).toBe('lobby')
  })

  it('refuse un total supérieur à 6', async () => {
    const room = await createTestRoom()
    await joinLobby(room, 'Alice')
    await joinLobby(room, 'Bruno')
    room.host.setBots(4, 'heuristic')
    expect(room.host.start()).toEqual({ ok: false, error: 'tooManyPlayers' })
  })

  it("ne laisse démarrer que l'hôte : un invité ne dispose d'aucun message de démarrage", async () => {
    const room = await createTestRoom()
    const alice = await joinLobby(room, 'Alice')
    await joinLobby(room, 'Bruno')
    alice.send({ type: 'start', botCount: 0 })
    expect(room.host.getSnapshot().stage).toBe('lobby')
  })

  it('refuse un second démarrage', async () => {
    const room = await createTestRoom()
    room.host.setBots(2, 'random')
    expect(room.host.start()).toEqual({ ok: true })
    expect(room.host.start()).toEqual({ ok: false, error: 'alreadyStarted' })
  })

  it('diffuse le nombre de bots dans le snapshot du lobby', async () => {
    const room = await createTestRoom()
    let notified = 0
    room.host.subscribe(() => notified++)
    room.host.setBots(2, 'random')
    expect(notified).toBe(1)
    expect(room.host.getSnapshot()).toMatchObject({ botCount: 2, botKind: 'random', canStart: true })
  })
})
