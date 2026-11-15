// Ce que les cartes doivent savoir pour reconnaître le papayou : la couleur choisie et le nombre de joueurs.
// La règle elle-même (7 ou 10) reste dans le moteur, via isPapayou.
import { createContext, useContext } from 'react'
import { isPapayou } from '../../engine'
import type { Card, Suit } from '../../engine'

export interface PapayouInfo {
  papayouSuit: Suit | null
  playerCount: number
}

/** Fourni par l'écran de jeu à toutes les cartes qu'il affiche ; `null` ailleurs (aucune carte n'est alors le papayou). */
export const PapayouContext = createContext<PapayouInfo | null>(null)

/** Vrai si la carte est le papayou de la manche, d'après les informations du contexte. */
export function isPapayouCard(card: Card, info: PapayouInfo | null): boolean {
  return info !== null && isPapayou(card, info.papayouSuit, info.playerCount)
}

/** Vrai si la carte (absente pour un dos de carte) est le papayou de la manche affichée. */
export function useIsPapayou(card: Card | undefined): boolean {
  const info = useContext(PapayouContext)
  return card !== undefined && isPapayouCard(card, info)
}
