// Règles d'un pli : coups légaux et gagnant. Fonctions pures.
import { isTrumpOrExcuse, trumpStrength } from './cards'
import type { Card, GameState, Play } from './types'

/**
 * Cartes jouables avec la main `hand` quand `trick` contient les cartes déjà posées.
 * Pli vide : toute carte sauf l'excuse (sauf si c'est la seule carte : dernier pli, entame forcée).
 * Excuse en entame (dernier pli) : aucune couleur demandée, chaque joueur n'a qu'une carte.
 */
export function legalCards(hand: readonly Card[], trick: readonly Play[]): Card[] {
  const first = trick[0]
  if (first === undefined) {
    const notExcuse = hand.filter((c) => c.kind !== 'excuse')
    return notExcuse.length > 0 ? notExcuse : [...hand]
  }
  const lead = first.card
  if (lead.kind === 'excuse') return [...hand]
  if (lead.kind === 'suit') {
    const sameSuit = hand.filter((c) => c.kind === 'suit' && c.suit === lead.suit)
    if (sameSuit.length > 0) return sameSuit
  }
  // Atout demandé, ou plus de la couleur demandée : atout obligatoire (excuse comprise).
  const trumps = hand.filter(isTrumpOrExcuse)
  return trumps.length > 0 ? trumps : [...hand]
}

/** Cartes que `seat` peut jouer maintenant (liste vide si ce n'est pas son tour). */
export function legalPlays(state: GameState, seat: number): Card[] {
  if (state.phase !== 'playing') return []
  if (currentPlayer(state) !== seat) return []
  const hand = state.hands[seat]
  if (hand === undefined) return []
  return legalCards(hand, state.trick)
}

/** Joueur dont c'est le tour de poser une carte (null hors phase de jeu). */
export function currentPlayer(state: GameState): number | null {
  if (state.phase !== 'playing') return null
  return (state.trickLeader + state.trick.length) % state.playerCount
}

/**
 * Gagnant d'un pli complet.
 * - Excuse en entame (dernier pli) : victoire automatique.
 * - Sinon le plus gros atout (excuse = 0), sinon la plus haute carte de la couleur demandée.
 */
export function trickWinner(plays: readonly Play[]): number {
  const first = plays[0]
  if (first === undefined) throw new Error('trickWinner : pli vide')
  if (first.card.kind === 'excuse') return first.seat

  const trumpPlays = plays.filter((p) => isTrumpOrExcuse(p.card))
  if (trumpPlays.length > 0) {
    let best = trumpPlays[0] as Play
    for (const p of trumpPlays) {
      if (trumpStrength(p.card) > trumpStrength(best.card)) best = p
    }
    return best.seat
  }

  const leadCard = first.card
  if (leadCard.kind !== 'suit') throw new Error('trickWinner : entame inattendue')
  let best = first
  for (const p of plays) {
    if (p.card.kind === 'suit' && p.card.suit === leadCard.suit) {
      if (p.card.rank > (best.card as typeof leadCard).rank) best = p
    }
  }
  return best.seat
}
