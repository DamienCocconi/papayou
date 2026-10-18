// Création de partie et machine à états (applyAction). Fonctions pures : l'état d'entrée n'est jamais modifié.
import { SUITS, cardPoints, createDeck, pilePoints, sortHand, suitCard } from './cards'
import { normalizeSeed, shuffle } from './rng'
import { currentPlayer, legalCards, trickWinner } from './rules'
import { computeRoundScores, rankPlayers } from './scoring'
import type { Action, ActionErrorCode, ActionResult, Card, GameState } from './types'

export const MIN_PLAYERS = 3
export const MAX_PLAYERS = 6
export const GIFT_SIZE = 3

/** Nombre de cartes « 1 » de couleur retirées selon le nombre de joueurs. */
function removedCount(playerCount: number): number {
  if (playerCount === 4) return 2
  if (playerCount === 5) return 3
  return 0
}

/** Nombre de cartes par joueur pour un nombre de joueurs donné (26, 19, 15, 13). */
export function handSize(playerCount: number): number {
  return (78 - removedCount(playerCount)) / playerCount
}

/**
 * Crée une partie. Tire une seule fois les « 1 » retirés, puis distribue la première manche.
 * @throws RangeError si le nombre de joueurs n'est pas compris entre 3 et 6.
 */
export function createGame(playerCount: number, seed: number): GameState {
  if (!Number.isInteger(playerCount) || playerCount < MIN_PLAYERS || playerCount > MAX_PLAYERS) {
    throw new RangeError(`Nombre de joueurs invalide : ${playerCount} (attendu : 3 à 6)`)
  }
  let rngState = normalizeSeed(seed)
  const ones = shuffle(
    SUITS.map((suit) => suitCard(suit, 1)),
    rngState,
  )
  rngState = ones.state
  const removedCards = ones.items.slice(0, removedCount(playerCount))

  const base: GameState = {
    version: 1,
    playerCount,
    rngState,
    removedCards,
    phase: 'exchange',
    roundIndex: 0,
    roundLeader: 0,
    hands: [],
    gifts: [],
    papayouSuit: null,
    trickLeader: 0,
    trick: [],
    lastTrick: null,
    won: [],
    tricksPlayed: 0,
    roundScores: [],
    totals: new Array<number>(playerCount).fill(0),
    ranking: null,
  }
  return dealRound(base, 0)
}

/** Mélange les cartes en jeu et les distribue pour la manche `roundIndex`. */
function dealRound(state: GameState, roundIndex: number): GameState {
  const removedIds = new Set(state.removedCards.map((c) => c.id))
  const inPlay = createDeck().filter((c) => !removedIds.has(c.id))
  const shuffled = shuffle(inPlay, state.rngState)
  const size = inPlay.length / state.playerCount
  const hands: Card[][] = []
  for (let seat = 0; seat < state.playerCount; seat++) {
    hands.push(sortHand(shuffled.items.slice(seat * size, (seat + 1) * size)))
  }
  const leader = roundIndex % state.playerCount
  return {
    ...state,
    rngState: shuffled.state,
    phase: 'exchange',
    roundIndex,
    roundLeader: leader,
    hands,
    gifts: new Array<Card[] | null>(state.playerCount).fill(null),
    papayouSuit: null,
    trickLeader: leader,
    trick: [],
    lastTrick: null,
    won: hands.map(() => []),
    tricksPlayed: 0,
  }
}

function fail(error: ActionErrorCode): ActionResult {
  return { ok: false, error }
}

function validSeat(state: GameState, seat: number): boolean {
  return Number.isInteger(seat) && seat >= 0 && seat < state.playerCount
}

/** Applique une action. Renvoie un nouvel état, ou une erreur sans toucher à l'état. */
export function applyAction(state: GameState, action: Action): ActionResult {
  switch (action.type) {
    case 'giveCards':
      return giveCards(state, action.seat, action.cardIds)
    case 'choosePapayou':
      return choosePapayou(state, action.seat, action.suit)
    case 'playCard':
      return playCard(state, action.seat, action.cardId)
    case 'nextRound':
      if (state.phase !== 'roundEnd') return fail('wrongPhase')
      return { ok: true, state: dealRound(state, state.roundIndex + 1) }
  }
}

function giveCards(state: GameState, seat: number, cardIds: readonly string[]): ActionResult {
  if (state.phase !== 'exchange') return fail('wrongPhase')
  if (!validSeat(state, seat)) return fail('invalidSeat')
  if (state.gifts[seat] !== null) return fail('alreadyGave')
  if (cardIds.length !== GIFT_SIZE) return fail('wrongCardCount')
  if (new Set(cardIds).size !== cardIds.length) return fail('duplicateCard')
  const hand = state.hands[seat] as Card[]
  const chosen: Card[] = []
  for (const id of cardIds) {
    const card = hand.find((c) => c.id === id)
    if (card === undefined) return fail('cardNotInHand')
    chosen.push(card)
  }
  const gifts = state.gifts.map((g, i) => (i === seat ? chosen : g))

  if (gifts.some((g) => g === null)) {
    return { ok: true, state: { ...state, gifts } }
  }

  // Tous les joueurs ont choisi : échange simultané vers le joueur suivant (indice + 1).
  const n = state.playerCount
  const hands = state.hands.map((h, i) => {
    const given = new Set((gifts[i] as Card[]).map((c) => c.id))
    const received = gifts[(i - 1 + n) % n] as Card[]
    return sortHand([...h.filter((c) => !given.has(c.id)), ...received])
  })
  return { ok: true, state: { ...state, gifts, hands, phase: 'choosePapayou' } }
}

/**
 * Choix de la couleur du papayou par l'entameur. Toute couleur est acceptée, que l'entameur
 * possède ou non le 7 (le 7 de chaque couleur est toujours en jeu).
 */
function choosePapayou(state: GameState, seat: number, suit: string): ActionResult {
  if (state.phase !== 'choosePapayou') return fail('wrongPhase')
  if (!validSeat(state, seat)) return fail('invalidSeat')
  if (seat !== state.roundLeader) return fail('notYourTurn')
  const chosen = SUITS.find((s) => s === suit)
  if (chosen === undefined) return fail('invalidSuit')
  return {
    ok: true,
    state: { ...state, phase: 'playing', papayouSuit: chosen, trickLeader: state.roundLeader, trick: [] },
  }
}

function playCard(state: GameState, seat: number, cardId: string): ActionResult {
  if (state.phase !== 'playing') return fail('wrongPhase')
  if (!validSeat(state, seat)) return fail('invalidSeat')
  if (currentPlayer(state) !== seat) return fail('notYourTurn')
  const hand = state.hands[seat] as Card[]
  const card = hand.find((c) => c.id === cardId)
  if (card === undefined) return fail('cardNotInHand')
  if (!legalCards(hand, state.trick).some((c) => c.id === cardId)) return fail('illegalPlay')

  const hands = state.hands.map((h, i) => (i === seat ? h.filter((c) => c.id !== cardId) : h))
  const trick = [...state.trick, { seat, card }]
  if (trick.length < state.playerCount) {
    return { ok: true, state: { ...state, hands, trick } }
  }
  return { ok: true, state: finishTrick({ ...state, hands, trick }) }
}

/** Le pli est complet : le gagnant ramasse les cartes, puis on enchaîne ou on termine la manche. */
function finishTrick(state: GameState): GameState {
  const winner = trickWinner(state.trick)
  const cards = state.trick.map((p) => p.card)
  const won = state.won.map((pile, i) => (i === winner ? [...pile, ...cards] : pile))
  const lastTrick = {
    leader: state.trickLeader,
    plays: state.trick,
    winner,
    points: pilePoints(cards, state.papayouSuit),
  }
  const tricksPlayed = state.tricksPlayed + 1
  const next: GameState = { ...state, won, lastTrick, tricksPlayed, trick: [], trickLeader: winner }

  if (state.hands.some((h) => h.length > 0)) return next
  return finishRound(next)
}

function finishRound(state: GameState): GameState {
  const scores = computeRoundScores(state.won, state.papayouSuit as NonNullable<GameState['papayouSuit']>)
  const totals = state.totals.map((t, i) => t + (scores[i] as number))
  const roundScores = [...state.roundScores, scores]
  const last = state.roundIndex + 1 >= state.playerCount
  return {
    ...state,
    roundScores,
    totals,
    phase: last ? 'gameEnd' : 'roundEnd',
    ranking: last ? rankPlayers(totals) : null,
  }
}

/** Points d'une carte dans la manche en cours (utile à l'affichage). */
export function pointsOf(state: GameState, card: Card): number {
  return cardPoints(card, state.papayouSuit)
}
