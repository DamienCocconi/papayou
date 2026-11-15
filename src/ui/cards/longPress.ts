/**
 * Appui long qui agrandit une carte : délai et tolérance au mouvement, partagés par toutes les cartes
 * (éventail compris), pour qu'il n'y ait qu'un seul geste à apprendre. Purement visuel, aucune règle du jeu.
 */

/** Durée pendant laquelle le doigt doit rester immobile sur la carte. */
export const INSPECT_DELAY_MS = 700

/** Déplacement toléré, en pixels, depuis le point d'appui : au-delà, l'appui long est abandonné. */
export const INSPECT_TOLERANCE_PX = 10

/** Vrai si un déplacement (dx, dy) depuis le point d'appui annule l'appui long. */
export function cancelsLongPress(dx: number, dy: number): boolean {
  return Math.hypot(dx, dy) > INSPECT_TOLERANCE_PX
}
