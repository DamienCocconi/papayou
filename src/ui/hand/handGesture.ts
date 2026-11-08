/**
 * États du geste sur l'éventail, dans un réducteur pur (l'équivalent d'une machine à états) :
 * un état et un événement donnent un nouvel état et des effets à exécuter, que le hook applique.
 * Aucune règle du jeu ici, ni de destination : `canPlay` dit si la carte peut partir (coup légal en phase
 * de jeu, place libre pendant l'échange), et l'effet `release` laisse l'écran décider de ce qu'elle devient.
 */
import { designateCard, holdLineY, isAboveLine } from './emphasis'
import type { CardSize } from './emphasis'
import type { FanSlot } from './fanLayout'

export type GestureState =
  | { phase: 'idle' }
  | { phase: 'hover'; cardId: string }
  | {
      phase: 'scrubbing'
      pointerId: number
      cardId: string
      /** Geste à la souris : un simple clic ne retient pas la carte, contrairement à un toucher. */
      mouse: boolean
      /** Point de départ de la mesure de la prise : l'appui, ou le dernier changement de carte. */
      anchorX: number
      anchorY: number
      /** La carte a déjà résisté : elle ne redonne pas de message avant d'avoir changé. */
      refused: boolean
      /** Appui sur la carte agrandie : elle reste désignée tant que le pointeur ne s'en éloigne pas. */
      pressed: boolean
    }
  | {
      phase: 'holding'
      pointerId: number
      cardId: string
      x: number
      y: number
      /** Ligne de cette prise : celle qui est affichée, et que le bas de la carte doit franchir. */
      lineY: number
      aboveLine: boolean
    }
  | { phase: 'pending'; cardId: string; x: number; y: number }

export type GestureEvent =
  /** `cardId` : survol de la carte en emphase agrandie, qui reste alors désignée. */
  | { type: 'hoverMove'; x: number; cardId?: string | undefined }
  | { type: 'leave' }
  /** `cardId` : appui directement sur la carte en emphase, qui reste alors désignée. */
  | { type: 'down'; pointerId: number; x: number; y: number; cardId?: string | undefined; mouse?: boolean | undefined }
  | { type: 'move'; pointerId: number; x: number; y: number }
  | { type: 'up'; pointerId: number }
  | { type: 'cancel'; pointerId: number }
  | { type: 'handChanged' }
  /** Le coup en attente est terminé : refusé, ou sans réponse dans le délai. */
  | { type: 'settled' }

export type GestureEffect =
  /** Carte relâchée au-dessus de la ligne : jouée, ou placée dans un emplacement d'échange. */
  | { type: 'release'; cardId: string }
  | { type: 'refuse'; cardId: string }
  /** Emphase conservée après le relâchement : toucher, ou carte tirée puis relâchée sous la ligne (`null` : aucune). */
  | { type: 'select'; cardId: string | null }

/** Ce que le réducteur lit de la situation au moment de l'événement. */
export interface GestureContext {
  cardIds: readonly string[]
  slots: readonly FanSlot[]
  cardSize: CardSize
  lineY: number
  /** Haut de l'écran dans le repère de la main : limite de la ligne de jeu. */
  screenTop: number
  /** Carte en emphase conservée d'un geste précédent. */
  emphasizedId: string | null
  /** Vrai si la carte peut partir de la main maintenant. */
  canPlay: (cardId: string) => boolean
}

export interface GestureResult {
  state: GestureState
  effects: GestureEffect[]
}

/** Montée à dépasser pour prendre la carte. Elle doit aussi dominer le déplacement horizontal. */
export const PULL_THRESHOLD = 30
/** Déplacement horizontal, en largeur de carte de repos, qui fait quitter une carte agrandie pressée. */
const PRESSED_RELEASE_RATIO = 1.5

export const IDLE: GestureState = { phase: 'idle' }

/** Carte visée par le geste, s'il y en a une. */
export function gestureCardId(state: GestureState): string | null {
  return state.phase === 'idle' ? null : state.cardId
}

/** Résumé de ce que l'écran affiche : un nouveau rendu n'est utile que s'il change. */
export function gestureViewKey(state: GestureState): string {
  switch (state.phase) {
    case 'idle':
      return 'idle'
    case 'hover':
      return `hover:${state.cardId}`
    case 'scrubbing':
      return `scrubbing:${state.cardId}:${state.refused}`
    case 'holding':
      return `holding:${state.cardId}:${state.aboveLine}`
    case 'pending':
      return `pending:${state.cardId}`
  }
}

function designate(x: number, currentId: string | null, ctx: GestureContext): string | null {
  const current = currentId === null ? -1 : ctx.cardIds.indexOf(currentId)
  const index = designateCard(x, ctx.slots, ctx.cardSize, current < 0 ? null : current)
  return index === null ? null : (ctx.cardIds[index] ?? null)
}

/** Une autre carte passe en emphase par survol ou clic : l'emphase conservée s'arrête. */
function releaseKept(cardId: string, ctx: GestureContext): GestureEffect[] {
  return ctx.emphasizedId !== null && ctx.emphasizedId !== cardId ? [{ type: 'select', cardId: null }] : []
}

export function reduceGesture(state: GestureState, event: GestureEvent, ctx: GestureContext): GestureResult {
  const unchanged: GestureResult = { state, effects: [] }
  switch (event.type) {
    case 'hoverMove': {
      if (state.phase !== 'idle' && state.phase !== 'hover') return unchanged
      const overId = event.cardId !== undefined && ctx.cardIds.includes(event.cardId) ? event.cardId : null
      const cardId = overId ?? designate(event.x, state.phase === 'hover' ? state.cardId : ctx.emphasizedId, ctx)
      if (cardId === null) return { state: IDLE, effects: [] }
      return { state: { phase: 'hover', cardId }, effects: releaseKept(cardId, ctx) }
    }

    case 'leave':
      return state.phase === 'hover' ? { state: IDLE, effects: [] } : unchanged

    case 'down': {
      // Un deuxième doigt, ou un appui pendant l'attente de la réponse, ne fait rien.
      if (state.phase !== 'idle' && state.phase !== 'hover') return unchanged
      const pressedId = event.cardId !== undefined && ctx.cardIds.includes(event.cardId) ? event.cardId : null
      const cardId = pressedId ?? designate(event.x, state.phase === 'hover' ? state.cardId : ctx.emphasizedId, ctx)
      if (cardId === null) return unchanged
      return {
        state: { phase: 'scrubbing', pointerId: event.pointerId, cardId, mouse: event.mouse === true, anchorX: event.x, anchorY: event.y, refused: false, pressed: pressedId !== null },
        effects: [],
      }
    }

    case 'move': {
      if (state.phase === 'holding' && state.pointerId === event.pointerId) {
        return { state: { ...state, x: event.x, y: event.y, aboveLine: isAboveLine(event.y, state.lineY) }, effects: [] }
      }
      if (state.phase !== 'scrubbing' || state.pointerId !== event.pointerId) return unchanged

      // La carte agrandie est bien plus large que sa partie visible au repos : on ne la quitte qu'en s'en éloignant.
      const keepsPressed = state.pressed && Math.abs(event.x - state.anchorX) < ctx.cardSize.width * PRESSED_RELEASE_RATIO
      const cardId = keepsPressed ? state.cardId : designate(event.x, state.cardId, ctx)
      if (cardId !== null && cardId !== state.cardId) {
        return { state: { ...state, cardId, anchorX: event.x, anchorY: event.y, refused: false, pressed: false }, effects: [] }
      }

      const rise = state.anchorY - event.y
      if (rise <= PULL_THRESHOLD || rise <= Math.abs(event.x - state.anchorX)) return unchanged
      if (ctx.canPlay(state.cardId)) {
        const lineY = holdLineY(ctx.lineY, event.y, ctx.screenTop)
        return {
          state: {
            phase: 'holding',
            pointerId: state.pointerId,
            cardId: state.cardId,
            x: event.x,
            y: event.y,
            lineY,
            aboveLine: isAboveLine(event.y, lineY),
          },
          effects: [],
        }
      }
      if (state.refused) return unchanged
      return { state: { ...state, refused: true }, effects: [{ type: 'refuse', cardId: state.cardId }] }
    }

    case 'up': {
      if ((state.phase !== 'scrubbing' && state.phase !== 'holding') || state.pointerId !== event.pointerId) return unchanged
      // Un clic à la souris ne retient rien : la carte reste en emphase parce qu'elle est survolée.
      if (state.phase === 'scrubbing' && state.mouse) {
        return { state: { phase: 'hover', cardId: state.cardId }, effects: releaseKept(state.cardId, ctx) }
      }
      const select: GestureEffect = { type: 'select', cardId: state.cardId }
      if (state.phase === 'scrubbing' || !state.aboveLine) return { state: IDLE, effects: [select] }
      // La situation a pu changer depuis la prise (pause, tour) : on relit la légalité au relâchement.
      if (!ctx.canPlay(state.cardId)) return { state: IDLE, effects: [select, { type: 'refuse', cardId: state.cardId }] }
      return {
        state: { phase: 'pending', cardId: state.cardId, x: state.x, y: state.y },
        effects: [
          { type: 'select', cardId: null },
          { type: 'release', cardId: state.cardId },
        ],
      }
    }

    case 'cancel':
      if ((state.phase !== 'scrubbing' && state.phase !== 'holding') || state.pointerId !== event.pointerId) return unchanged
      return { state: IDLE, effects: [] }

    case 'handChanged': {
      const cardId = gestureCardId(state)
      return cardId !== null && !ctx.cardIds.includes(cardId) ? { state: IDLE, effects: [] } : unchanged
    }

    case 'settled':
      return state.phase === 'pending' ? { state: IDLE, effects: [] } : unchanged
  }
}
