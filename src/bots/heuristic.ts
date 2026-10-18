// Bot heuristique : le but du jeu est de faire le moins de points possible, donc on évite de gagner les plis.
import { cardPoints, createDeck, legalPlaysFromView, SUITS, trickWinner } from '../engine'
import type { BotView, Card, Suit } from '../engine'
import type { Bot } from './types'

/** Ordre de force servant aux départages : cartes de couleur par rang, puis atouts, l'excuse en dernier (la plus coûteuse). */
function order(card: Card): number {
  switch (card.kind) {
    case 'suit':
      return card.rank
    case 'trump':
      return 100 + card.value
    case 'excuse':
      return 1000
  }
}

/** Cartes ni dans ma main, ni déjà jouées, ni retirées de la partie : elles sont dans les mains des autres. */
function unseenCards(view: BotView): Card[] {
  const known = new Set<string>([
    ...view.hand.map((c) => c.id),
    ...view.playedCards.map((c) => c.id),
    ...view.removedCards.map((c) => c.id),
  ])
  return createDeck().filter((c) => !known.has(c.id))
}

/** Nombre de cartes plus fortes, de la même famille (même couleur, ou atouts), qui sont encore chez les autres joueurs. */
function outstandingHigher(card: Card, unseen: readonly Card[]): number {
  if (card.kind === 'excuse') return 0
  return unseen.filter((other) => {
    if (card.kind === 'suit') return other.kind === 'suit' && other.suit === card.suit && other.rank > card.rank
    return other.kind === 'trump' && other.value > card.value
  }).length
}

/** Le plus petit élément d'après `key` (le premier en cas d'égalité). */
function minBy<T>(items: readonly T[], key: (item: T) => number[]): T {
  const compare = (a: number[], b: number[]): number => {
    for (let i = 0; i < a.length; i++) {
      const diff = (a[i] as number) - (b[i] as number)
      if (diff !== 0) return diff
    }
    return 0
  }
  let best = items[0] as T
  for (const item of items) if (compare(key(item), key(best)) < 0) best = item
  return best
}

function lead(view: BotView, legal: readonly Card[]): Card {
  const unseen = unseenCards(view)
  // Le plus de cartes plus fortes chez les autres = le plus de chances de perdre ; départage : moins de points, puis plus faible.
  return minBy(legal, (card) => [-outstandingHigher(card, unseen), cardPoints(card, view.papayouSuit), order(card)])
}

function follow(view: BotView, legal: readonly Card[]): Card {
  const losing = legal.filter((card) => trickWinner([...view.trick, { seat: view.seat, card }]) !== view.seat)
  if (losing.length > 0) {
    // Je ne gagne pas : autant me débarrasser de la carte la plus chère (puis de la plus forte).
    return minBy(losing, (card) => [-cardPoints(card, view.papayouSuit), -order(card)])
  }
  // Toutes mes cartes gagnent le pli : je joue la plus faible.
  return minBy(legal, (card) => [order(card)])
}

export function createHeuristicBot(): Bot {
  return {
    chooseGift(view) {
      // Le papayou n'est pas encore connu : on donne les cartes qui valent le plus de points sans lui.
      const ranked = [...view.hand].sort((a, b) => cardPoints(b, null) - cardPoints(a, null) || order(b) - order(a))
      return ranked.slice(0, 3).map((c) => c.id)
    },
    choosePapayou(view, rng): Suit {
      const withoutSeven = SUITS.filter(
        (suit) => !view.hand.some((c) => c.kind === 'suit' && c.suit === suit && c.rank === 7),
      )
      const candidates = withoutSeven.length > 0 ? withoutSeven : SUITS
      return candidates[rng.nextInt(candidates.length)] ?? 'hearts'
    },
    choosePlay(view) {
      const legal = legalPlaysFromView(view)
      if (legal.length === 0) throw new Error('Aucun coup légal')
      return (view.trick.length === 0 ? lead(view, legal) : follow(view, legal)).id
    },
  }
}
