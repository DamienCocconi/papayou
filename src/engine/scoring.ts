// Décompte d'une manche et classement final.
import { pilePoints } from './cards'
import type { Card, Suit } from './types'

/** Points de chaque joueur pour une manche, à partir des tas de plis gagnés. */
export function computeRoundScores(won: readonly (readonly Card[])[], papayouSuit: Suit): number[] {
  return won.map((pile) => pilePoints(pile, papayouSuit))
}

/**
 * Classement de compétition : moins de points = meilleure place, les égalités partagent
 * la même place et la suivante est sautée (1, 2, 2, 4, 5). Renvoie la place de chaque joueur.
 */
export function rankPlayers(totals: readonly number[]): number[] {
  return totals.map((t) => 1 + totals.filter((other) => other < t).length)
}
