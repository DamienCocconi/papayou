import { createContext, useContext } from 'react'
import type { Card } from '../../engine'

/**
 * Agrandissement d'un atout illustré, fourni par l'écran de jeu à toutes les cartes qu'il affiche
 * (sièges, dernier pli, emplacements d'échange, main). Absent (`null`) hors de l'écran de jeu, et dans
 * le calque lui-même : la carte n'y est alors pas agrandissable.
 */
export const CardInspectContext = createContext<((card: Card) => void) | null>(null)

/** Fonction qui agrandit une carte, ou `null` si aucun écran ne le permet ici. */
export function useCardInspect(): ((card: Card) => void) | null {
  return useContext(CardInspectContext)
}
