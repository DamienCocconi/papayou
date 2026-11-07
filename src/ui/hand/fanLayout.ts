/** Géométrie de la main en éventail. Fonction pure : pas de DOM, testable sans navigateur. */

export interface FanSlot {
  /** Décalage horizontal du bord gauche de la carte, en px. */
  x: number
  /** Descente par rapport au centre de l'arc, en px (0 au centre, positive vers le bas). */
  y: number
  /** Rotation en degrés, négative à gauche du centre et positive à droite. */
  rotation: number
}

/** Taille des cartes de l'éventail (le coin reste lisible à 19 cartes sur 360 px). */
export const FAN_CARD_WIDTH = 56
export const FAN_CARD_HEIGHT = 84
/** Marge minimale entre le coin haut d'une carte des extrémités (tournée) et le bord de l'écran. */
export const FAN_MARGIN = 4
/** Espace laissé au-dessus de l'éventail pour la carte sélectionnée, qui se lève. */
export const FAN_LIFT = 14
/** Part de la hauteur des cartes qui reste à l'écran : le bas peut dépasser. */
export const FAN_VISIBLE_RATIO = 0.8

/** Écran de référence : à cette taille ou moins, les cartes gardent leur taille de base. */
const REF_WIDTH = 360
const REF_HEIGHT = 640
/** Agrandissement maximal des cartes (environ 100 x 150 px). */
export const FAN_MAX_SCALE = 1.8

/**
 * Facteur d'échelle des cartes selon la taille de l'écran de jeu : 1 sur téléphone (taille de base,
 * jamais en dessous), jusqu'à FAN_MAX_SCALE sur un grand écran. Le plus petit des deux rapports
 * s'applique, pour qu'un écran large mais bas ne donne pas des cartes démesurées.
 */
export function fanScale(width: number, height: number): number {
  const k = Math.min(width / REF_WIDTH, height / REF_HEIGHT)
  return Math.min(FAN_MAX_SCALE, Math.max(1, k))
}

/** Taille d'une carte pour un facteur d'échelle. */
export function fanCardSize(scale: number): { width: number; height: number } {
  return { width: Math.round(FAN_CARD_WIDTH * scale), height: Math.round(FAN_CARD_HEIGHT * scale) }
}

/** Hauteur de la zone de l'éventail pour un facteur d'échelle (le bas des cartes peut dépasser). */
export function fanHeight(scale: number): number {
  return Math.round(FAN_LIFT * scale) + Math.round(fanCardSize(scale).height * FAN_VISIBLE_RATIO)
}

/** Écart maximal entre deux cartes : au-delà, une petite main reste groupée au centre. */
const MAX_STEP = 32
/** Rotation totale maximale, de la première à la dernière carte. */
const MAX_TOTAL_ROTATION = 24
const ROTATION_PER_CARD = 2.5
/** Descente maximale des cartes des extrémités. */
const MAX_DROP = 14

/**
 * Position de chaque carte, dans l'ordre de la main.
 * L'écart vaut `(largeur - marges - carte) / (n - 1)`, plafonné pour qu'une petite main reste groupée.
 */
export function fanLayout(count: number, width: number, scale = 1): FanSlot[] {
  if (count <= 0) return []
  const { width: cardWidth, height: cardHeight } = fanCardSize(scale)
  const totalRotation = Math.min(MAX_TOTAL_ROTATION, (count - 1) * ROTATION_PER_CARD)
  // La rotation se fait autour du bas de la carte : le coin haut des cartes des extrémités se décale
  // vers l'extérieur. On réserve cet écart pour que ce coin, le seul visible, reste dans l'écran.
  const edge = (totalRotation / 2) * (Math.PI / 180)
  const inset = FAN_MARGIN + Math.max(0, cardHeight * Math.sin(edge) - (cardWidth / 2) * (1 - Math.cos(edge)))
  const available = Math.max(0, width - 2 * inset - cardWidth)
  const step = count > 1 ? Math.min(MAX_STEP * scale, available / (count - 1)) : 0
  const startX = (width - cardWidth - (count - 1) * step) / 2
  const drop = MAX_DROP * scale * (totalRotation / MAX_TOTAL_ROTATION)
  return Array.from({ length: count }, (_, i) => {
    // t va de -1 (première carte) à +1 (dernière) ; 0 au centre.
    const t = count > 1 ? (i - (count - 1) / 2) / ((count - 1) / 2) : 0
    return { x: startX + i * step, y: drop * t * t, rotation: (t * totalRotation) / 2 }
  })
}
