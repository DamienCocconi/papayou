// Libellés d'affichage : noms des joueurs, symboles des couleurs, rangs. Aucune règle du jeu ici.
import type { Card, PlayerView, Suit } from '../engine'

export const SUIT_SYMBOL: Record<Suit, string> = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }
export const SUIT_NAME: Record<Suit, string> = { hearts: 'Cœur', diamonds: 'Carreau', clubs: 'Trèfle', spades: 'Pique' }

const FIGURES: Record<number, string> = { 11: 'V', 12: 'C', 13: 'D', 14: 'R' }

export function rankLabel(rank: number): string {
  return FIGURES[rank] ?? String(rank)
}

/** Texte lisible d'une carte, pour les info-bulles et l'accessibilité. */
export function cardName(card: Card): string {
  switch (card.kind) {
    case 'suit':
      return `${rankLabel(card.rank)} de ${SUIT_NAME[card.suit].toLowerCase()}`
    case 'trump':
      return `Atout ${card.value}`
    case 'excuse':
      return 'Excuse'
  }
}

export function playerName(seat: number, humanSeat: number): string {
  return seat === humanSeat ? 'Vous' : `Joueur ${seat + 1}`
}

/**
 * Place dont c'est le tour de poser une carte. Simple lecture d'affichage de la vue
 * (le moteur reste seul juge des coups légaux : voir `legalPlays` du contrôleur).
 */
export function turnSeat(view: PlayerView): number | null {
  if (view.phase !== 'playing') return null
  return (view.trickLeader + view.trick.length) % view.playerCount
}
