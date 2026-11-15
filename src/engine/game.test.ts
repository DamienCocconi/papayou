import { describe, expect, it } from 'vitest'
import { createDeck } from './cards'
import { applyAction, createGame, handSize } from './game'
import { legalPlays } from './rules'
import { simulateGame } from './testing'
import type { Card, GameState, Suit } from './types'

const SIZES: Record<number, number> = { 3: 20, 4: 19, 5: 15, 6: 13 }

const isFace = (card: Card): boolean => card.kind === 'suit' && card.rank >= 11

function allCardIds(state: GameState): string[] {
  return [
    ...state.hands.flat(),
    ...state.won.flat(),
    ...state.trick.map((p) => p.card),
    ...state.removedCards,
  ].map((x) => x.id)
}

function mustApply(state: GameState, action: Parameters<typeof applyAction>[1]): GameState {
  const r = applyAction(state, action)
  if (!r.ok) throw new Error(`refusé : ${r.error}`)
  return r.state
}

/** Chaque joueur donne ses 3 premières cartes. */
function exchangeFirstThree(state: GameState): GameState {
  let s = state
  for (let seat = 0; seat < s.playerCount; seat++) {
    const ids = (state.hands[seat] as Card[]).slice(0, 3).map((x) => x.id)
    s = mustApply(s, { type: 'giveCards', seat, cardIds: ids })
  }
  return s
}

describe('création de partie', () => {
  it.each([3, 4, 5, 6])('%i joueurs : bon nombre de cartes, aucune perdue ni dupliquée', (n) => {
    const s = createGame(n, 99)
    expect(handSize(n)).toBe(SIZES[n])
    for (const hand of s.hands) expect(hand).toHaveLength(SIZES[n] as number)
    const ids = allCardIds(s)
    expect(ids).toHaveLength(78)
    expect(new Set(ids)).toEqual(new Set(createDeck().map((x) => x.id)))
    expect(new Set(ids).size).toBe(78)
  })

  it('retire 2, 2, 3, 0 cartes « 1 » (18, 2, 3, 0 cartes au total) pour 3, 4, 5, 6 joueurs', () => {
    const ones = (n: number): Card[] =>
      createGame(n, 5).removedCards.filter((card) => card.kind === 'suit' && card.rank === 1)
    expect([3, 4, 5, 6].map((n) => ones(n).length)).toEqual([2, 2, 3, 0])
    expect([3, 4, 5, 6].map((n) => createGame(n, 5).removedCards.length)).toEqual([18, 2, 3, 0])
    for (const n of [4, 5]) {
      for (const card of createGame(n, 5).removedCards) {
        expect(card.kind === 'suit' && card.rank === 1).toBe(true)
      }
    }
  })

  it('à 3 joueurs, retire les 16 figures et 2 « 1 », et garde 60 cartes en jeu', () => {
    for (let seed = 0; seed < 20; seed++) {
      const s = createGame(3, seed)
      const faces = s.removedCards.filter(isFace)
      expect(faces).toHaveLength(16)
      expect(new Set(faces.map((x) => x.id)).size).toBe(16)
      const others = s.removedCards.filter((card) => !isFace(card))
      expect(others).toHaveLength(2)
      for (const card of others) expect(card.kind === 'suit' && card.rank === 1).toBe(true)
      expect(s.hands.flat()).toHaveLength(60)
    }
  })

  it("à 3 joueurs, aucune figure n'est distribuée, à aucune manche", () => {
    for (const seed of [1, 2, 3]) {
      simulateGame(3, seed, (state) => {
        if (state.phase === 'exchange') {
          expect(state.hands.flat().filter(isFace)).toEqual([])
          expect(state.removedCards).toEqual(createGame(3, seed).removedCards)
        }
      })
    }
  })

  it('à 3 joueurs, chaque manche compte 20 plis', () => {
    for (const seed of [1, 2, 3]) {
      let rounds = 0
      simulateGame(3, seed, (state) => {
        if (state.phase === 'roundEnd' || state.phase === 'gameEnd') {
          expect(state.tricksPlayed).toBe(20)
          if (state.phase === 'gameEnd') rounds = state.roundIndex + 1
        }
      })
      expect(rounds).toBe(3)
    }
  })

  it('aucune figure retirée à 4, 5 et 6 joueurs', () => {
    for (const n of [4, 5, 6]) expect(createGame(n, 5).removedCards.filter(isFace)).toEqual([])
  })

  it('le 7 de chaque couleur est toujours en jeu', () => {
    for (let seed = 0; seed < 20; seed++) {
      for (const n of [3, 4, 5, 6]) {
        const ids = createGame(n, seed).hands.flat().map((x) => x.id)
        for (const suit of ['hearts', 'diamonds', 'clubs', 'spades']) expect(ids).toContain(`${suit}-7`)
      }
    }
  })

  it('refuse un nombre de joueurs invalide', () => {
    for (const n of [0, 2, 7, 3.5, -1]) expect(() => createGame(n, 1)).toThrow(RangeError)
  })

  // Valeurs relevées avant le change reduce-deck-three-players : à 4, 5 et 6 joueurs, le tirage est inchangé.
  it.each([
    [4, ['hearts-1', 'spades-1'], [
      'hearts-6', 'hearts-7', 'hearts-13', 'diamonds-3', 'clubs-5', 'clubs-8', 'clubs-9', 'clubs-10',
      'spades-3', 'spades-8', 'spades-14', 'trump-3', 'trump-7', 'trump-10', 'trump-11', 'trump-12',
      'trump-15', 'trump-18', 'trump-21',
    ]],
    [5, ['hearts-1', 'spades-1', 'diamonds-1'], [
      'hearts-6', 'hearts-13', 'diamonds-2', 'diamonds-4', 'diamonds-10', 'diamonds-13', 'clubs-5', 'clubs-9',
      'clubs-10', 'spades-5', 'spades-14', 'trump-9', 'trump-10', 'trump-11', 'trump-16',
    ]],
    [6, [], [
      'hearts-5', 'hearts-6', 'hearts-8', 'hearts-13', 'diamonds-5', 'diamonds-9', 'clubs-4', 'clubs-9',
      'clubs-10', 'spades-4', 'trump-3', 'trump-11', 'trump-18',
    ]],
  ])("à %i joueurs, la graine 42 donne la même distribution qu'avant le paquet réduit", (n, removed, hand0) => {
    const s = createGame(n, 42)
    expect(s.removedCards.map((x) => x.id)).toEqual(removed)
    expect((s.hands[0] as Card[]).map((x) => x.id)).toEqual(hand0)
  })

  it('est déterministe sous graine et varie avec la graine', () => {
    expect(createGame(4, 42)).toEqual(createGame(4, 42))
    expect(createGame(4, 42).hands).not.toEqual(createGame(4, 43).hands)
  })

  it('ne modifie pas l\'état passé à applyAction', () => {
    const s = createGame(3, 1)
    const copy = JSON.stringify(s)
    applyAction(s, { type: 'giveCards', seat: 0, cardIds: (s.hands[0] as Card[]).slice(0, 3).map((x) => x.id) })
    expect(JSON.stringify(s)).toBe(copy)
  })
})

describe('échange de cartes', () => {
  it('un seul joueur a choisi : aucun échange, mains inchangées', () => {
    const s = createGame(4, 3)
    const ids = (s.hands[0] as Card[]).slice(0, 3).map((x) => x.id)
    const s2 = mustApply(s, { type: 'giveCards', seat: 0, cardIds: ids })
    expect(s2.phase).toBe('exchange')
    expect(s2.hands).toEqual(s.hands)
  })

  it('échange simultané : chacun reçoit les 3 cartes de son prédécesseur (indice - 1)', () => {
    const s = createGame(4, 3)
    const s2 = exchangeFirstThree(s)
    expect(s2.phase).toBe('choosePapayou')
    for (let seat = 0; seat < 4; seat++) {
      const prev = (seat + 3) % 4
      const received = (s.hands[prev] as Card[]).slice(0, 3).map((x) => x.id)
      const given = (s.hands[seat] as Card[]).slice(0, 3).map((x) => x.id)
      const ids = (s2.hands[seat] as Card[]).map((x) => x.id)
      for (const id of received) expect(ids).toContain(id)
      for (const id of given) expect(ids).not.toContain(id)
    }
  })

  it.each([3, 4, 5, 6])('%i joueurs : tailles de main conservées, aucune carte perdue', (n) => {
    const s = exchangeFirstThree(createGame(n, 8))
    for (const hand of s.hands) expect(hand).toHaveLength(SIZES[n] as number)
    const ids = allCardIds(s)
    expect(new Set(ids).size).toBe(78)
  })

  it('l\'excuse et les atouts peuvent être donnés', () => {
    const s = createGame(3, 1)
    // On force une main contenant l'excuse et des atouts.
    const hands = s.hands.map((h) => [...h])
    const hand0 = hands[0] as Card[]
    const wanted = ['excuse', 'trump-21', 'trump-1']
    const pool = hands.flat()
    // Échange de cartes entre mains pour donner au joueur 0 les 3 cartes voulues.
    for (const id of wanted) {
      if (hand0.some((x) => x.id === id)) continue
      const owner = hands.findIndex((h, i) => i !== 0 && h.some((x) => x.id === id))
      const card = (hands[owner] as Card[]).find((x) => x.id === id) as Card
      const swap = hand0.find((x) => !wanted.includes(x.id)) as Card
      hands[owner] = (hands[owner] as Card[]).map((x) => (x.id === id ? swap : x))
      hands[0] = (hands[0] as Card[]).map((x) => (x.id === swap.id ? card : x))
      hand0.splice(0, hand0.length, ...(hands[0] as Card[]))
    }
    expect(pool).toHaveLength(78 - s.removedCards.length)
    const forced: GameState = { ...s, hands }
    const r = applyAction(forced, { type: 'giveCards', seat: 0, cardIds: wanted })
    expect(r.ok).toBe(true)
  })

  it('refuse : mauvais nombre de cartes, doublon, carte absente, déjà donné, mauvaise place', () => {
    const s = createGame(3, 1)
    const h = (s.hands[0] as Card[]).map((x) => x.id)
    const other = (s.hands[1] as Card[])[0] as Card
    const code = (a: Parameters<typeof applyAction>[1]): unknown => {
      const r = applyAction(s, a)
      return r.ok ? 'ok' : r.error
    }
    expect(code({ type: 'giveCards', seat: 0, cardIds: h.slice(0, 2) })).toBe('wrongCardCount')
    expect(code({ type: 'giveCards', seat: 0, cardIds: h.slice(0, 4) })).toBe('wrongCardCount')
    expect(code({ type: 'giveCards', seat: 0, cardIds: [h[0] as string, h[0] as string, h[1] as string] })).toBe(
      'duplicateCard',
    )
    expect(code({ type: 'giveCards', seat: 0, cardIds: [h[0] as string, h[1] as string, other.id] })).toBe(
      'cardNotInHand',
    )
    expect(code({ type: 'giveCards', seat: 9, cardIds: h.slice(0, 3) })).toBe('invalidSeat')
    const once = mustApply(s, { type: 'giveCards', seat: 0, cardIds: h.slice(0, 3) })
    const again = applyAction(once, { type: 'giveCards', seat: 0, cardIds: h.slice(3, 6) })
    expect(again).toEqual({ ok: false, error: 'alreadyGave' })
  })

  it('refuse de jouer une carte pendant l\'échange', () => {
    const s = createGame(3, 1)
    expect(applyAction(s, { type: 'playCard', seat: 0, cardId: (s.hands[0] as Card[])[0]?.id ?? '' })).toEqual({
      ok: false,
      error: 'wrongPhase',
    })
  })
})

describe('choix du papayou', () => {
  const afterExchange = exchangeFirstThree(createGame(4, 11))

  it('l\'entameur choisit : le papayou est fixé et la phase de jeu commence', () => {
    const s = mustApply(afterExchange, { type: 'choosePapayou', seat: afterExchange.roundLeader, suit: 'clubs' })
    expect(s.phase).toBe('playing')
    expect(s.papayouSuit).toBe('clubs')
    expect(s.trickLeader).toBe(afterExchange.roundLeader)
  })

  it('l\'entameur peut choisir une couleur dont il n\'a pas le 7 (choix libre, décision validée)', () => {
    const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']
    const leaderHand = afterExchange.hands[afterExchange.roundLeader] ?? []
    const missing = suits.filter((suit) => !leaderHand.some((card) => card.kind === 'suit' && card.suit === suit && card.rank === 7))
    // Avec 19 cartes sur 76, il est quasi certain qu'au moins un 7 manque ; la graine fixe rend ce test stable.
    expect(missing.length).toBeGreaterThan(0)
    for (const suit of missing) {
      const s = mustApply(afterExchange, { type: 'choosePapayou', seat: afterExchange.roundLeader, suit })
      expect(s.phase).toBe('playing')
      expect(s.papayouSuit).toBe(suit)
    }
  })

  it('un autre joueur est refusé', () => {
    const other = (afterExchange.roundLeader + 1) % 4
    expect(applyAction(afterExchange, { type: 'choosePapayou', seat: other, suit: 'hearts' })).toEqual({
      ok: false,
      error: 'notYourTurn',
    })
  })

  it('refuse une couleur inconnue et une phase incorrecte', () => {
    const bad = applyAction(afterExchange, {
      type: 'choosePapayou',
      seat: 0,
      suit: 'stars' as unknown as Suit,
    })
    expect(bad).toEqual({ ok: false, error: 'invalidSuit' })
    expect(applyAction(createGame(4, 11), { type: 'choosePapayou', seat: 0, suit: 'hearts' })).toEqual({
      ok: false,
      error: 'wrongPhase',
    })
  })

  it('le premier pli est entamé par l\'entameur, puis on joue dans le sens horaire', () => {
    let s = mustApply(afterExchange, { type: 'choosePapayou', seat: 0, suit: 'hearts' })
    const order: number[] = []
    for (let i = 0; i < 4; i++) {
      const seat = (s.trickLeader + s.trick.length) % 4
      order.push(seat)
      const card = legalPlays(s, seat)[0] as Card
      s = mustApply(s, { type: 'playCard', seat, cardId: card.id })
    }
    expect(order).toEqual([0, 1, 2, 3])
    // Le gagnant entame le pli suivant.
    expect(s.trickLeader).toBe(s.lastTrick?.winner)
  })
})
