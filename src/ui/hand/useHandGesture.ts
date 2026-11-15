import { useCallback, useEffect, useLayoutEffect, useReducer, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent, RefObject, SyntheticEvent } from 'react'
import { INSPECT_DELAY_MS } from '../cards/longPress'
import { gestureViewKey, IDLE, reduceGesture } from './handGesture'
import type { GestureContext, GestureEvent, GestureState } from './handGesture'

/** Sans réponse de l'hôte après ce délai, la carte en attente retourne dans la main. */
const PENDING_TIMEOUT_MS = 5000

interface Options {
  containerRef: RefObject<HTMLElement>
  /** Situation à jour : relue à chaque événement du pointeur. */
  context: GestureContext
  /**
   * Carte relâchée au-dessus de la ligne. Renvoie vrai si elle attend une réponse (coup envoyé) ; faux si
   * l'affaire est réglée tout de suite (coup refusé, ou carte placée dans un emplacement).
   */
  onRelease: (cardId: string) => boolean
  onRefuse: (cardId: string) => void
  onSelect: (cardId: string | null) => void
  /** Déplace la carte tenue : appelé à chaque mouvement, sans passer par un rendu React. */
  onHeldMove: (x: number, y: number) => void
  /** Refus de l'hôte, qui arrive après l'envoi du coup : change à chaque refus (null : aucun). */
  remoteRefusal: number | null
  /** Appui long au doigt sur la carte en emphase : l'écran l'agrandit s'il le peut. */
  onInspect: (cardId: string) => void
}

export interface HandGesture {
  state: GestureState
  handlers: {
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => void
    onPointerUp: (e: ReactPointerEvent<HTMLElement>) => void
    onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => void
    onLostPointerCapture: (e: ReactPointerEvent<HTMLElement>) => void
    onPointerLeave: () => void
    onContextMenu: (e: SyntheticEvent) => void
  }
}

/** Seule la carte en emphase reçoit le pointeur : s'il est sur elle, c'est elle qu'il vise. */
function cardUnder(e: ReactPointerEvent<HTMLElement>): string | undefined {
  return e.target instanceof Element ? e.target.closest<HTMLElement>('[data-card-id]')?.dataset['cardId'] : undefined
}

/**
 * Branche le réducteur du geste sur les événements du pointeur.
 * L'état complet vit dans une `ref` (comme un champ d'instance en Java : le modifier ne provoque pas
 * de rendu), et un rendu n'est demandé que si ce que l'écran montre change. C'est ce qui garde le
 * mouvement fluide : la carte tenue suit le doigt par écriture directe dans son `style`.
 */
export function useHandGesture(options: Options): HandGesture {
  const { containerRef, remoteRefusal } = options
  const stateRef = useRef<GestureState>(IDLE)
  const [, forceRender] = useReducer((n: number) => n + 1, 0)

  // Dernières options, lues par les gestionnaires qui, eux, ne changent pas.
  const latest = useRef(options)
  useLayoutEffect(() => {
    latest.current = options
  })

  // Minuteur de l'appui long, et élément qui a capturé le pointeur (pour le lui rendre à l'agrandissement).
  const longPressTimer = useRef<number | null>(null)
  const captured = useRef<{ element: HTMLElement; pointerId: number } | null>(null)
  const stopLongPress = useCallback(() => {
    if (longPressTimer.current !== null) window.clearTimeout(longPressTimer.current)
    longPressTimer.current = null
  }, [])
  useEffect(() => stopLongPress, [stopLongPress])

  const send = useCallback((event: GestureEvent) => {
    const { context, onRelease, onRefuse, onSelect, onHeldMove, onInspect } = latest.current
    const before = stateRef.current
    const { state, effects } = reduceGesture(before, event, context)
    stateRef.current = state
    // Hors du balayage (prise, relâchement, annulation), l'appui long n'a plus d'objet.
    if (state.phase !== 'scrubbing') stopLongPress()
    if (state.phase === 'holding') onHeldMove(state.x, state.y)
    if (gestureViewKey(state) !== gestureViewKey(before)) forceRender()
    for (const effect of effects) {
      switch (effect.type) {
        case 'select':
          onSelect(effect.cardId)
          break
        case 'refuse':
          onRefuse(effect.cardId)
          break
        case 'release':
          // Refus immédiat (contrôleur local) ou carte placée : la carte n'attend pas.
          if (!onRelease(effect.cardId)) send({ type: 'settled' })
          break
        case 'inspect': {
          // Le doigt encore posé ne pilote plus la main : on rend le pointeur avant d'ouvrir le calque.
          const capture = captured.current
          if (capture?.element.hasPointerCapture(capture.pointerId)) capture.element.releasePointerCapture(capture.pointerId)
          onInspect(effect.cardId)
          break
        }
      }
    }
  }, [stopLongPress])

  // La main a changé : la carte visée l'a peut-être quittée (coup confirmé, nouvelle manche...).
  const handKey = options.context.cardIds.join(',')
  useLayoutEffect(() => {
    send({ type: 'handChanged' })
  }, [handKey, send])

  // Fin de l'attente sur refus de l'hôte (seul un refus nouveau compte, pas celui d'un coup précédent).
  useEffect(() => {
    if (remoteRefusal !== null) send({ type: 'settled' })
  }, [remoteRefusal, send])

  // Fin de l'attente sans réponse.
  const phase = stateRef.current.phase
  useEffect(() => {
    if (phase !== 'pending') return
    const timer = window.setTimeout(() => send({ type: 'settled' }), PENDING_TIMEOUT_MS)
    return () => window.clearTimeout(timer)
  }, [phase, send])

  /** Position du pointeur dans le repère du conteneur. */
  const point = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      const rect = containerRef.current?.getBoundingClientRect()
      return { x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0) }
    },
    [containerRef],
  )

  const handlers = useRef<HandGesture['handlers']>({
    onPointerDown(e) {
      if (e.button !== 0) return
      send({ type: 'down', pointerId: e.pointerId, ...point(e), cardId: cardUnder(e), mouse: e.pointerType === 'mouse' })
      // Le pointeur reste suivi même s'il sort de la main ; le navigateur ne récupère pas le geste.
      const state = stateRef.current
      if (state.phase === 'scrubbing' && state.pointerId === e.pointerId) {
        e.currentTarget.setPointerCapture(e.pointerId)
        captured.current = { element: e.currentTarget, pointerId: e.pointerId }
        // Doigt posé sur la carte en emphase : le délai de l'appui long démarre (le réducteur juge à l'échéance).
        if (state.pressed && !state.mouse) {
          stopLongPress()
          const pointerId = e.pointerId
          longPressTimer.current = window.setTimeout(() => {
            longPressTimer.current = null
            send({ type: 'longPress', pointerId })
          }, INSPECT_DELAY_MS)
        }
      }
    },
    onPointerMove(e) {
      const { phase: current } = stateRef.current
      if (current === 'scrubbing' || current === 'holding') {
        send({ type: 'move', pointerId: e.pointerId, ...point(e) })
      } else if (e.pointerType !== 'touch' && e.buttons === 0) {
        send({ type: 'hoverMove', x: point(e).x, cardId: cardUnder(e) })
      }
    },
    onPointerUp(e) {
      send({ type: 'up', pointerId: e.pointerId })
    },
    onPointerCancel(e) {
      send({ type: 'cancel', pointerId: e.pointerId })
    },
    // Sans effet après un relâchement normal : l'état est déjà sorti du geste.
    onLostPointerCapture(e) {
      send({ type: 'cancel', pointerId: e.pointerId })
    },
    onPointerLeave() {
      send({ type: 'leave' })
    },
    // Pas de menu sur un appui long ni de clic droit sur la main.
    onContextMenu(e) {
      e.preventDefault()
    },
  })

  return { state: stateRef.current, handlers: handlers.current }
}
