import { describe, expect, it } from 'vitest'
import { createGame, legalPlaysFromView } from '../engine'
import type { GameAction } from './protocol'
import { connectRawGuest, createTestRoom, guestParticipant, hostParticipant, joinLobby, playUntil } from './session-testing'
import type { Participant, RawGuest, TestRoom } from './session-testing'

/** Hôte + Alice + Bruno + un bot, partie démarrée (places 0 à 3). */
async function startGame(): Promise<{ room: TestRoom; alice: RawGuest; bruno: RawGuest }> {
  const room = await createTestRoom({ seed: 7 })
  const alice = await joinLobby(room, 'Alice')
  const bruno = await joinLobby(room, 'Bruno')
  room.host.setBots(1, 'heuristic')
  room.host.start()
  return { room, alice, bruno }
}

function playing(room: TestRoom) {
  const snapshot = room.host.getSnapshot()
  if (snapshot.stage !== 'playing') throw new Error('partie attendue')
  return snapshot
}

function giveFirstThree(guest: RawGuest, seat: number): void {
  const view = guest.state()?.view
  if (!view) throw new Error('vue absente')
  guest.send({ type: 'action', action: { type: 'giveCards', seat, cardIds: view.hand.slice(0, 3).map((c) => c.id) } })
}

describe('pause quand un joueur est absent', () => {
  it('met la partie en pause, libère la place avec le dernier nom et prévient tout le monde', async () => {
    const { room, alice, bruno } = await startGame()
    alice.link.close()

    const snapshot = playing(room)
    expect(snapshot.session.paused).toBe(true)
    expect(snapshot.session.seats[1]).toEqual({ kind: 'free', lastName: 'Alice' })
    const seenByBruno = bruno.state()
    expect(seenByBruno?.session.paused).toBe(true)
    expect(seenByBruno?.session.seats[1]).toEqual({ kind: 'free', lastName: 'Alice' })
  })

  it('refuse toute action de jeu pendant la pause, hôte compris', async () => {
    const { room, alice, bruno } = await startGame()
    alice.link.close()
    const before = room.host.getSnapshot()

    const view = playing(room).view
    const result = room.host.dispatch({ type: 'giveCards', seat: 0, cardIds: view.hand.slice(0, 3).map((c) => c.id) })
    expect(result).toEqual({ ok: false, error: 'paused' })
    giveFirstThree(bruno, 2)
    expect(bruno.errors()).toEqual(['paused'])
    expect(room.host.getSnapshot()).toBe(before)
  })

  it('arrête les bots pendant la pause', async () => {
    const { room, alice } = await startGame()
    alice.link.close()
    room.clock.advance(10_000)
    // Le bot (place 3) n'a pas donné ses cartes.
    expect(playing(room).view.hasGiven[3]).toBe(false)
  })

  it('reprend là où la partie en était quand la place est reprise', async () => {
    const { room, alice } = await startGame()
    alice.link.close()
    const returning = await connectRawGuest(room.hub)
    returning.send({ type: 'claim', seat: 1, name: 'Alice' })

    expect(playing(room).session.paused).toBe(false)
    expect(returning.state()?.session.paused).toBe(false)
    room.clock.advance(1000)
    expect(playing(room).view.hasGiven[3]).toBe(true)
  })
})

describe('rejoindre une partie en cours par les places', () => {
  it('montre la liste des places à un arrivant : humain, bot, libre avec ancien nom', async () => {
    const { room, alice } = await startGame()
    alice.link.close()
    const newcomer = await connectRawGuest(room.hub)
    expect(newcomer.last('seats')?.seats).toEqual([
      { kind: 'human', name: 'Hôte', isHost: true },
      { kind: 'free', lastName: 'Alice' },
      { kind: 'human', name: 'Bruno', isHost: false },
      { kind: 'bot' },
    ])
  })

  it('rend sa main à un joueur qui reprend sa place, sous le même nom ou un autre', async () => {
    const { room, alice } = await startGame()
    const hand = alice.state()?.view.hand.map((c) => c.id)
    alice.link.close()

    const returning = await connectRawGuest(room.hub)
    returning.send({ type: 'claim', seat: 1, name: 'Alicia' })
    expect(returning.state()?.view.hand.map((c) => c.id)).toEqual(hand)
    expect(playing(room).session.seats[1]).toEqual({ kind: 'human', name: 'Alicia', isHost: false })
  })

  it("laisse un nouvel arrivant remplacer un bot, qui hérite de sa main et ne joue plus", async () => {
    const { room } = await startGame()
    const botHand = createGame(4, 7).hands[3]?.map((c) => c.id)
    const newcomer = await connectRawGuest(room.hub)
    newcomer.send({ type: 'claim', seat: 3, name: 'Chloé' })

    expect(newcomer.errors()).toEqual([])
    const view = newcomer.state()?.view
    expect(view?.seat).toBe(3)
    expect(view?.hand.map((c) => c.id)).toEqual(botHand)
    expect(playing(room).session.seats[3]).toEqual({ kind: 'human', name: 'Chloé', isHost: false })

    // Le bot ne joue plus : tant que Chloé n'a pas donné, personne ne le fait à sa place.
    room.clock.advance(10_000)
    expect(playing(room).view.hasGiven[3]).toBe(false)
  })

  it("refuse la place d'un joueur connecté", async () => {
    const { room } = await startGame()
    const newcomer = await connectRawGuest(room.hub)
    newcomer.send({ type: 'claim', seat: 0, name: 'Voleur' })
    newcomer.send({ type: 'claim', seat: 2, name: 'Voleur' })
    expect(newcomer.errors()).toEqual(['seatTaken', 'seatTaken'])
    expect(newcomer.last('seats')).toBeDefined()
    expect(playing(room).session.seats[2]).toEqual({ kind: 'human', name: 'Bruno', isHost: false })
  })

  it('donne la place à la première demande et refuse la seconde avec la liste à jour', async () => {
    const { room, alice } = await startGame()
    alice.link.close()
    const first = await connectRawGuest(room.hub)
    const second = await connectRawGuest(room.hub)
    first.send({ type: 'claim', seat: 1, name: 'Premier' })
    second.send({ type: 'claim', seat: 1, name: 'Second' })

    expect(first.errors()).toEqual([])
    expect(first.state()?.view.seat).toBe(1)
    expect(second.errors()).toEqual(['seatTaken'])
    expect(second.last('seats')?.seats[1]).toEqual({ kind: 'human', name: 'Premier', isHost: false })
  })

  it('refuse un nom déjà porté par un joueur connecté et un nom invalide', async () => {
    const { room, alice } = await startGame()
    alice.link.close()
    const newcomer = await connectRawGuest(room.hub)
    newcomer.send({ type: 'claim', seat: 1, name: 'bruno' })
    newcomer.send({ type: 'claim', seat: 1, name: '  ' })
    newcomer.send({ type: 'claim', seat: 9, name: 'Zoé' })
    expect(newcomer.errors()).toEqual(['nameTaken', 'invalidName', 'invalidSeat'])
    expect(playing(room).session.paused).toBe(true)
  })

  it('refuse une seconde place au joueur déjà assis', async () => {
    const { room, alice } = await startGame()
    alice.send({ type: 'claim', seat: 3, name: 'Alice' })
    expect(alice.errors()).toEqual(['alreadySeated'])
    expect(playing(room).session.seats[3]).toEqual({ kind: 'bot' })
  })

  it("refuse une demande de place avant le démarrage", async () => {
    const room = await createTestRoom()
    const guest = await connectRawGuest(room.hub)
    guest.send({ type: 'claim', seat: 1, name: 'Zoé' })
    expect(guest.errors()).toEqual(['notStarted'])
  })

  it("n'accepte pas de nouvel humain par hello une fois la partie lancée : il reçoit les places", async () => {
    const { room } = await startGame()
    const guest = await connectRawGuest(room.hub)
    guest.clear()
    guest.send({ type: 'hello', name: 'Zoé' })
    expect(guest.last('seats')).toBeDefined()
    expect(guest.errors()).toEqual([])
  })
})

describe('administration par l hôte', () => {
  it("renvoie un joueur présent dont la connexion est restée ouverte : sa place passe à un bot", async () => {
    const { room, alice } = await startGame()
    expect(room.host.kick(1)).toBe(true)

    expect(alice.last('closed')).toEqual({ type: 'closed', reason: 'kicked' })
    expect(alice.closed).toBe(true)
    expect(playing(room).session.seats[1]).toEqual({ kind: 'bot' })
    expect(playing(room).session.paused).toBe(false)
    room.clock.advance(1000)
    expect(playing(room).view.hasGiven[1]).toBe(true)
  })

  it('remplace par un bot un joueur absent et relance la partie', async () => {
    const { room, alice } = await startGame()
    alice.link.close()
    expect(playing(room).session.paused).toBe(true)
    expect(room.host.replaceWithBot(1)).toBe(true)
    expect(playing(room).session.paused).toBe(false)
    expect(playing(room).session.seats[1]).toEqual({ kind: 'bot' })
  })

  it("n'accepte ni de se renvoyer soi-même, ni de remplacer un joueur présent, ni une place inexistante", async () => {
    const { room } = await startGame()
    expect(room.host.kick(0)).toBe(false)
    expect(room.host.replaceWithBot(2)).toBe(false)
    expect(room.host.replaceWithBot(3)).toBe(false)
    expect(room.host.kick(3)).toBe(false)
    expect(room.host.kick(9)).toBe(false)
  })

  it('laisse un joueur renvoyé revenir par le lien et reprendre la place du bot', async () => {
    const { room } = await startGame()
    room.host.kick(1)
    const back = await connectRawGuest(room.hub)
    expect(back.last('seats')?.seats[1]).toEqual({ kind: 'bot' })
    back.send({ type: 'claim', seat: 1, name: 'Alice' })
    expect(back.state()?.view.seat).toBe(1)
    expect(playing(room).session.seats[1]).toEqual({ kind: 'human', name: 'Alice', isHost: false })
  })

  it("n'a pas de commande d'administration côté réseau : les messages d'un invité sont ignorés", async () => {
    const { room, bruno } = await startGame()
    const before = room.host.getSnapshot()
    bruno.send({ type: 'kick', seat: 1 })
    bruno.send({ type: 'replaceWithBot', seat: 1 })
    expect(room.host.getSnapshot()).toBe(before)
    expect(bruno.errors()).toEqual([])
  })
})

describe('fermeture de la salle', () => {
  it('prévient les invités et ferme leurs connexions', async () => {
    const { room, alice } = await startGame()
    room.host.dispose()
    expect(alice.last('closed')).toEqual({ type: 'closed', reason: 'roomClosed' })
    expect(alice.closed).toBe(true)
  })

  it('ne laisse aucune minuterie en attente', async () => {
    const { room } = await startGame()
    room.host.dispose()
    expect(room.clock.pending()).toBe(0)
  })
})

describe('reprise de place au milieu d une manche', () => {
  it("laisse la partie aller à son terme après une déconnexion puis une reprise", async () => {
    const room = await createTestRoom({ seed: 11 })
    const alice = await joinLobby(room, 'Alice')
    const bruno = await joinLobby(room, 'Bruno')
    room.host.setBots(1, 'heuristic')
    room.host.start()

    const host = hostParticipant(room.host)
    let participants = [host, guestParticipant(alice), guestParticipant(bruno)]
    playUntil(room, participants, 'playing')
    // Quelques coups, puis Bruno disparaît.
    for (let i = 0; i < 6; i++) {
      room.clock.advance(1)
      for (const p of participants) if (p.view()?.phase === 'playing') p.act(nextPlay(p))
    }
    bruno.link.close()
    expect(playing(room).session.paused).toBe(true)

    const returning = await connectRawGuest(room.hub)
    returning.send({ type: 'claim', seat: 2, name: 'Bruno' })
    participants = [host, guestParticipant(alice), guestParticipant(returning)]
    playUntil(room, participants, 'gameEnd')
    expect(playing(room).view.ranking).not.toBeNull()
  })
})

/** Une carte légale à jouer pour ce participant (s'il en a une), sinon une action sans effet. */
function nextPlay(p: Participant): GameAction {
  const view = p.view()
  const card = view ? legalPlaysFromView(view)[0] : undefined
  return { type: 'playCard', seat: view?.seat ?? 0, cardId: card?.id ?? 'none' }
}
