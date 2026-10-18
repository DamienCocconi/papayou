// Projection de l'état pour un joueur : sa main uniquement, jamais celles des autres.
import { sortHand } from './cards'
import type { Card, GameState, PlayerView } from './types'

/**
 * Vue réservée aux bots : la vue du joueur plus les cartes déjà jouées dans la manche.
 * Elle ne part jamais vers les humains, qui doivent se fier à leur mémoire.
 */
export interface BotView extends PlayerView {
  /** Cartes déjà posées dans la manche (plis terminés et pli en cours), triées : l'ordre ne dit pas qui a gagné quoi. */
  playedCards: Card[]
}

/** Vue d'un bot : `getPlayerView` + `playedCards`. Les cartes jouées ont été vues par toute la table ; le tri cache la composition des tas. */
export function getBotView(state: GameState, seat: number): BotView {
  const view = getPlayerView(state, seat)
  const playedCards = sortHand([...state.won.flat(), ...state.trick.map((p) => p.card)])
  return { ...view, playedCards }
}

/**
 * Vue du joueur `seat`. N'expose ni les autres mains, ni les cartes données par les autres
 * pendant l'échange, ni l'état du générateur aléatoire, ni les tas de plis des autres.
 */
export function getPlayerView(state: GameState, seat: number): PlayerView {
  if (!Number.isInteger(seat) || seat < 0 || seat >= state.playerCount) {
    throw new RangeError(`Place invalide : ${seat}`)
  }
  return {
    seat,
    playerCount: state.playerCount,
    removedCards: state.removedCards,
    phase: state.phase,
    roundIndex: state.roundIndex,
    roundLeader: state.roundLeader,
    hand: state.hands[seat] ?? [],
    handSizes: state.hands.map((h) => h.length),
    hasGiven: state.gifts.map((g) => g !== null),
    myGift: state.gifts[seat] ?? null,
    papayouSuit: state.papayouSuit,
    trickLeader: state.trickLeader,
    trick: state.trick,
    lastTrick: state.lastTrick,
    myWon: state.won[seat] ?? [],
    wonCounts: state.won.map((w) => w.length),
    tricksPlayed: state.tricksPlayed,
    roundScores: state.roundScores,
    totals: state.totals,
    ranking: state.ranking,
  }
}
