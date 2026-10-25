// Règles d'un pli : coups légaux et gagnant. Fonctions pures.
import { isTrumpOrExcuse, trumpStrength } from './cards'
import type { Card, GameState, Play, PlayerView } from './types'

/**
 * Cartes jouables avec la main `hand` quand `trick` contient les cartes déjà posées.
 * Pli vide : toute carte sauf l'excuse (sauf si c'est la seule carte : dernier pli, entame forcée).
 * Couleur demandée : fournir si possible, sinon toute la main. Atout demandé : atout (excuse comprise) si possible.
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
    // Couleur demandée : on fournit si on peut, sinon défausse libre (pas d'obligation de couper).
    const sameSuit = hand.filter((c) => c.kind === 'suit' && c.suit === lead.suit)
    return sameSuit.length > 0 ? sameSuit : [...hand]
  }
  // Atout demandé : atout obligatoire (excuse comprise), sinon n'importe quelle carte.
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

/** Mêmes coups légaux que `legalPlays`, calculés depuis la seule vue du joueur (sans l'état complet). */
export function legalPlaysFromView(view: PlayerView): Card[] {
  if (view.phase !== 'playing') return []
  if ((view.trickLeader + view.trick.length) % view.playerCount !== view.seat) return []
  return legalCards(view.hand, view.trick)
}

/** Joueur dont c'est le tour de poser une carte (null hors phase de jeu). */
export function currentPlayer(state: GameState): number | null {
  if (state.phase !== 'playing') return null
  return (state.trickLeader + state.trick.length) % state.playerCount
}

/**
 * Gagnant d'un pli complet : l'atout est une cinquième couleur, il ne gagne que s'il est entamé.
 * - Excuse en entame (dernier pli) : victoire automatique.
 * - Atout entamé : le plus gros atout (excuse = 0).
 * - Couleur entamée : la plus haute carte de cette couleur ; les atouts et l'excuse défaussés ne gagnent jamais.
 */
export function trickWinner(plays: readonly Play[]): number {
  const first = plays[0]
  if (first === undefined) throw new Error('trickWinner : pli vide')
  if (first.card.kind === 'excuse') return first.seat

  if (first.card.kind === 'trump') {
    let best = first
    for (const p of plays) {
      if (isTrumpOrExcuse(p.card) && trumpStrength(p.card) > trumpStrength(best.card)) best = p
    }
    return best.seat
  }

  const leadCard = first.card
  let best = first
  for (const p of plays) {
    if (p.card.kind === 'suit' && p.card.suit === leadCard.suit) {
      if (p.card.rank > (best.card as typeof leadCard).rank) best = p
    }
  }
  return best.seat
}
