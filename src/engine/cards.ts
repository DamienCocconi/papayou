// Cartes : création du paquet, comparaison, points.
import type { Card, ExcuseCard, Suit, SuitCard, TrumpCard } from './types'

export const SUITS: readonly Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']

/** Rangs des cartes de couleur : 1 à 10, valet 11, cavalier 12, dame 13, roi 14. */
export const MAX_SUIT_RANK = 14
export const TRUMP_COUNT = 21

export const EXCUSE: ExcuseCard = { kind: 'excuse', id: 'excuse' }

export function suitCard(suit: Suit, rank: number): SuitCard {
  return { kind: 'suit', id: `${suit}-${rank}`, suit, rank }
}

export function trumpCard(value: number): TrumpCard {
  return { kind: 'trump', id: `trump-${value}`, value }
}

/** Paquet complet de 78 cartes, dans un ordre fixe. */
export function createDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (let rank = 1; rank <= MAX_SUIT_RANK; rank++) deck.push(suitCard(suit, rank))
  }
  for (let value = 1; value <= TRUMP_COUNT; value++) deck.push(trumpCard(value))
  deck.push(EXCUSE)
  return deck
}

/** Hauteur du papayou : le 7 à 3 joueurs (couleurs de 1 à 10), le 10 à partir de 4 joueurs (figures jouées). */
export function papayouRank(playerCount: number): number {
  return playerCount <= 3 ? 7 : 10
}

/** Vrai si la carte est le papayou de la manche. Faux tant que la couleur n'est pas choisie. */
export function isPapayou(card: Card, papayouSuit: Suit | null, playerCount: number): boolean {
  return card.kind === 'suit' && card.suit === papayouSuit && card.rank === papayouRank(playerCount)
}

/** Points d'une carte. Le papayou dépend de la couleur choisie et du nombre de joueurs. */
export function cardPoints(card: Card, papayouSuit: Suit | null, playerCount: number): number {
  switch (card.kind) {
    case 'excuse':
      return 100
    case 'trump':
      return card.value === 21 ? 30 : card.value
    case 'suit':
      return isPapayou(card, papayouSuit, playerCount) ? 50 : 0
  }
}

export function pilePoints(cards: readonly Card[], papayouSuit: Suit | null, playerCount: number): number {
  return cards.reduce((sum, c) => sum + cardPoints(c, papayouSuit, playerCount), 0)
}

/** Vrai pour les atouts numérotés et pour l'excuse (qui compte comme atout). */
export function isTrumpOrExcuse(card: Card): boolean {
  return card.kind !== 'suit'
}

/** Force d'un atout pour désigner le gagnant : excuse 0, atout n = n. */
export function trumpStrength(card: Card): number {
  if (card.kind === 'excuse') return 0
  if (card.kind === 'trump') return card.value
  throw new Error("trumpStrength : ce n'est pas un atout")
}

const SUIT_INDEX: Record<Suit, number> = { hearts: 0, diamonds: 1, clubs: 2, spades: 3 }

function sortKey(card: Card): number {
  switch (card.kind) {
    case 'suit':
      return SUIT_INDEX[card.suit] * 100 + card.rank
    case 'trump':
      return 1000 + card.value
    case 'excuse':
      return 2000
  }
}

/** Ordre d'affichage d'une main : couleurs, puis atouts, puis excuse. */
export function compareCards(a: Card, b: Card): number {
  return sortKey(a) - sortKey(b)
}

export function sortHand(cards: readonly Card[]): Card[] {
  return [...cards].sort(compareCards)
}
