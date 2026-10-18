// Outils réservés aux tests : construction d'états précis et parties simulées.
// Pas importé par le code de production.
import { EXCUSE, suitCard, trumpCard } from './cards'
import { applyAction, createGame } from './game'
import { createRng } from './rng'
import { legalPlays } from './rules'
import type { Card, GameState, Play, Suit } from './types'

/** Raccourcis : "H7" = 7 de cœur, "T12" = atout 12, "X" = excuse. Couleurs : H cœur, D carreau, C trèfle, S pique. */
export function c(code: string): Card {
  if (code === 'X') return EXCUSE
  const letter = code.charAt(0)
  const n = Number(code.slice(1))
  if (letter === 'T') return trumpCard(n)
  const suits: Record<string, Suit> = { H: 'hearts', D: 'diamonds', C: 'clubs', S: 'spades' }
  const suit = suits[letter]
  if (suit === undefined) throw new Error(`Code de carte inconnu : ${code}`)
  return suitCard(suit, n)
}

/** Construit un état en phase de jeu avec des mains et un pli en cours choisis à la main. */
export function playingState(opts: {
  playerCount: number
  hands: string[][]
  trick?: { seat: number; card: string }[]
  trickLeader?: number
  papayouSuit?: Suit
}): GameState {
  const base = createGame(opts.playerCount, 1)
  const trick: Play[] = (opts.trick ?? []).map((p) => ({ seat: p.seat, card: c(p.card) }))
  return {
    ...base,
    phase: 'playing',
    hands: opts.hands.map((h) => h.map(c)),
    gifts: base.gifts.map(() => null),
    papayouSuit: opts.papayouSuit ?? 'hearts',
    trickLeader: opts.trickLeader ?? 0,
    trick,
    won: base.won.map(() => []),
  }
}

/** Joue une partie complète avec des coups légaux aléatoires et renvoie l'état final et les états de fin de manche. */
export function simulateGame(
  playerCount: number,
  seed: number,
  onState?: (state: GameState) => void,
): GameState {
  const rng = createRng(seed * 7919 + 13)
  let state = createGame(playerCount, seed)
  onState?.(state)
  const apply = (action: Parameters<typeof applyAction>[1]): void => {
    const r = applyAction(state, action)
    if (!r.ok) throw new Error(`Action refusée (${r.error}) : ${JSON.stringify(action)}`)
    state = r.state
    onState?.(state)
  }
  while (state.phase !== 'gameEnd') {
    if (state.phase === 'exchange') {
      for (let seat = 0; seat < playerCount; seat++) {
        const hand = [...(state.hands[seat] as Card[])]
        const ids: string[] = []
        for (let k = 0; k < 3; k++) ids.push((hand.splice(rng.nextInt(hand.length), 1)[0] as Card).id)
        apply({ type: 'giveCards', seat, cardIds: ids })
      }
    } else if (state.phase === 'choosePapayou') {
      const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']
      apply({ type: 'choosePapayou', seat: state.roundLeader, suit: suits[rng.nextInt(4)] as Suit })
    } else if (state.phase === 'playing') {
      const seat = (state.trickLeader + state.trick.length) % playerCount
      const legal = legalPlays(state, seat)
      if (legal.length === 0) throw new Error('Aucun coup légal')
      apply({ type: 'playCard', seat, cardId: (legal[rng.nextInt(legal.length)] as Card).id })
    } else {
      apply({ type: 'nextRound' })
    }
  }
  return state
}
