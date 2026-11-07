/**
 * Calculs de l'emphase de l'éventail : carte désignée, positions affichées, carte tenue, ligne de jeu.
 * Fonctions pures : pas de DOM, testables sans navigateur. Toutes les coordonnées sont relatives au
 * coin haut gauche du conteneur de l'éventail.
 */
import { FAN_MARGIN } from './fanLayout'
import type { FanSlot } from './fanLayout'

export interface CardSize {
  width: number
  height: number
}

/** Dimensions d'une carte de l'éventail, et décalage du haut de sa place dans le conteneur. */
export interface CardBox extends CardSize {
  lift: number
}

/** Bords de l'écran, dans le repère du conteneur (`left` et `top` sont donc négatifs ou nuls). */
export interface ScreenBounds {
  left: number
  right: number
  top: number
  bottom: number
}

export interface DisplayedSlot extends FanSlot {
  /** Échelle de la carte, autour du milieu de son bord bas. */
  scale: number
}

/** Agrandissement visé de la carte en emphase, réduit si la place manque. */
export const EMPHASIS_SCALE = 1.8
/** Part de la hauteur de la carte de repos que la carte en emphase recouvre : elle reste reliée à l'éventail. */
const EMPHASIS_OVERLAP = 0.15
/** Écart des voisines immédiates, en largeur de carte, et décroissance à chaque carte plus loin. */
const PUSH_RATIO = 0.5
const PUSH_DECAY = 0.7
/** Écart minimal entre deux voisines écartées, pour qu'elles gardent leur ordre. */
const MIN_NEIGHBOR_GAP = 1
/** Seuil à franchir pour quitter la carte désignée : une part de l'écart entre cartes, plafonnée. */
const HYSTERESIS_RATIO = 0.3
const HYSTERESIS_MAX = 6
/** Hauteur où se pose le doigt, en part de la carte depuis son bas : les cartes tournées y sont décalées. */
const TOUCH_HEIGHT_RATIO = 0.6
/** Espace entre le bas de la carte tenue et le pointeur : le doigt ne la cache pas. */
const HELD_FINGER_GAP = 24
/** Ligne de jeu : part de la hauteur de l'écran, et écart minimal au-dessus de la main. */
const LINE_RATIO = 0.55
const LINE_MIN_GAP = 12
/** Écart minimal entre le bas de la carte, quand elle est prise, et la ligne : un petit coup ne la joue pas. */
const LINE_MIN_RISE = 70
/** Écart minimal entre le haut de l'écran et la ligne : il reste une bande confortable où poser la carte. */
const LINE_TOP_MARGIN = 70

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Bande visible de chaque carte de repos, à la hauteur où se pose le doigt : du bord gauche de la
 * carte à celui de la suivante (les cartes se recouvrent), et la carte entière pour la dernière.
 */
function restBands(slots: readonly FanSlot[], size: CardSize): { left: number; right: number }[] {
  const leftOf = (slot: FanSlot) => slot.x + size.height * TOUCH_HEIGHT_RATIO * Math.sin((slot.rotation * Math.PI) / 180)
  return slots.map((slot, i) => {
    const next = slots[i + 1]
    return { left: leftOf(slot), right: next === undefined ? leftOf(slot) + size.width : leftOf(next) }
  })
}

/** Milieu de la partie visible d'une carte : là où le doigt la désigne sans ambiguïté. */
export function restBandCenter(slots: readonly FanSlot[], index: number, size: CardSize): number {
  const band = restBands(slots, size)[index]
  if (band === undefined) throw new Error(`carte ${index} absente`)
  return (band.left + band.right) / 2
}

/**
 * Carte désignée par une abscisse : celle dont la partie visible est sous le pointeur, d'après les
 * positions de repos seulement, pour que l'écart des voisines ne change pas la cible. `current` reste
 * désignée tant que le pointeur ne s'éloigne pas d'elle du seuil d'hystérésis (tremblements du doigt).
 */
export function designateCard(x: number, slots: readonly FanSlot[], size: CardSize, current: number | null): number | null {
  const bands = restBands(slots, size)
  if (bands.length === 0) return null
  const distance = (band: { left: number; right: number }) => Math.max(0, band.left - x, x - band.right)
  const distances = bands.map(distance)
  const best = distances.indexOf(Math.min(...distances))
  const currentDistance = current === null ? undefined : distances[current]
  if (current === null || currentDistance === undefined) return best
  const first = bands[0]
  const step = first === undefined ? 0 : first.right - first.left
  const margin = Math.min(HYSTERESIS_MAX, step * HYSTERESIS_RATIO)
  return currentDistance <= (distances[best] ?? 0) + margin ? current : best
}

/** Bas de la carte en emphase : juste sur le haut de l'éventail, au-dessus du doigt qui le balaie. */
function emphasisBottom(box: CardBox): number {
  return box.lift + box.height * EMPHASIS_OVERLAP
}

/** Échelle de la carte en emphase : elle tient toujours entre le haut de l'écran et l'éventail, et dans la largeur. */
export function emphasisScale(box: CardBox, bounds: ScreenBounds): number {
  const height = (emphasisBottom(box) - bounds.top - FAN_MARGIN) / box.height
  const width = (bounds.right - bounds.left - 2 * FAN_MARGIN) / box.width
  return Math.max(1, Math.min(EMPHASIS_SCALE, height, width))
}

/** Abscisse d'une carte agrandie de `scale` dont on vise le centre, bornée à l'écran. */
function boundedX(centerX: number, scale: number, box: CardBox, bounds: ScreenBounds): number {
  const half = (box.width * scale) / 2
  return clamp(centerX, bounds.left + FAN_MARGIN + half, bounds.right - FAN_MARGIN - half) - box.width / 2
}

/** Abscisse d'une carte tournée, bornée pour que tous ses coins restent dans l'écran. */
function boundedRotatedX(slot: FanSlot, x: number, box: CardBox, bounds: ScreenBounds): number {
  const r = (slot.rotation * Math.PI) / 180
  const half = (box.width / 2) * Math.cos(r)
  const top = box.height * Math.sin(r)
  const offsets = [-half + top, -half, half + top, half]
  return clamp(
    x,
    bounds.left + FAN_MARGIN - box.width / 2 - Math.min(...offsets),
    bounds.right - FAN_MARGIN - box.width / 2 - Math.max(...offsets),
  )
}

/**
 * Positions affichées : la carte `index` redressée, agrandie et bornée à l'écran, ses voisines poussées
 * de chaque côté d'autant moins qu'elles sont loin. Sans emphase (`null`), les positions de repos.
 */
export function emphasisLayout(slots: readonly FanSlot[], index: number | null, box: CardBox, bounds: ScreenBounds): DisplayedSlot[] {
  const shown = pushedLayout(slots, index, box, bounds)
  if (index === null) return shown
  // Le bornage dépend de la rotation et peut croiser deux voisines : on rétablit l'ordre depuis les
  // bords, qui restent ainsi dans l'écran, vers la carte en emphase.
  for (let i = 1; i < index; i++) {
    const [card, outer] = [shown[i], shown[i - 1]]
    if (card !== undefined && outer !== undefined) card.x = Math.max(card.x, outer.x + MIN_NEIGHBOR_GAP)
  }
  for (let i = shown.length - 2; i > index; i--) {
    const [card, outer] = [shown[i], shown[i + 1]]
    if (card !== undefined && outer !== undefined) card.x = Math.min(card.x, outer.x - MIN_NEIGHBOR_GAP)
  }
  return shown
}

function pushedLayout(slots: readonly FanSlot[], index: number | null, box: CardBox, bounds: ScreenBounds): DisplayedSlot[] {
  return slots.map((slot, i) => {
    if (index === null) return { ...slot, scale: 1 }
    if (i === index) {
      const scale = emphasisScale(box, bounds)
      return {
        x: boundedX(slot.x + box.width / 2, scale, box, bounds),
        y: emphasisBottom(box) - box.lift - box.height,
        rotation: 0,
        scale,
      }
    }
    const distance = Math.abs(i - index)
    const push = box.width * PUSH_RATIO * PUSH_DECAY ** (distance - 1)
    return { ...slot, x: boundedRotatedX(slot, slot.x + (i < index ? -push : push), box, bounds), scale: 1 }
  })
}

/** Position de la carte tenue : au-dessus du pointeur, à plat, bornée à l'écran. */
export function heldLayout(pointerX: number, pointerY: number, box: CardBox, bounds: ScreenBounds): DisplayedSlot {
  const scale = emphasisScale(box, bounds)
  const bottom = clamp(pointerY - HELD_FINGER_GAP, bounds.top + FAN_MARGIN + box.height * scale, bounds.bottom - FAN_MARGIN)
  return { x: boundedX(pointerX, scale, box, bounds), y: bottom - box.lift - box.height, rotation: 0, scale }
}

/** Ordonnée de la ligne de jeu : proportionnelle à la hauteur de l'écran, toujours au-dessus de la main. */
export function playLineY(bounds: ScreenBounds): number {
  return Math.min(bounds.top + (bounds.bottom - bounds.top) * LINE_RATIO, -LINE_MIN_GAP)
}

/**
 * Ligne de jeu d'une prise, fixée une fois pour toutes au moment où la carte est prise : la ligne de
 * l'écran, remontée si le bas de la carte (`pointerY` moins l'écart au doigt) en est trop proche.
 * Elle reste à distance du haut de l'écran (`screenTop`), quitte à réduire l'écart avec la carte.
 */
export function holdLineY(lineY: number, pointerY: number, screenTop: number): number {
  const raised = pointerY - HELD_FINGER_GAP - LINE_MIN_RISE
  const highest = screenTop + LINE_TOP_MARGIN
  return Math.min(lineY, Math.max(raised, highest))
}

/** Vrai quand la carte tenue par un pointeur à `pointerY` est entièrement au-dessus de la ligne. */
export function isAboveLine(pointerY: number, lineY: number): boolean {
  return pointerY - HELD_FINGER_GAP < lineY
}
