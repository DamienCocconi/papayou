import { useEffect, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { cancelsLongPress, INSPECT_DELAY_MS } from './longPress'

export interface LongPress {
  handlers: {
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => void
    onPointerUp: () => void
    onPointerCancel: () => void
  }
}

/**
 * Appui long au doigt ou au stylet : `onLongPress` est appelé quand le pointeur principal reste immobile
 * `INSPECT_DELAY_MS` sur l'élément. La souris est ignorée (elle passe par le clic droit). `null` : désactivé.
 */
export function useLongPress(onLongPress: (() => void) | null): LongPress {
  const timer = useRef<number | null>(null)
  const start = useRef<{ x: number; y: number } | null>(null)
  // Toujours la dernière version du rappel, lue au déclenchement.
  const latest = useRef(onLongPress)
  latest.current = onLongPress

  function stop() {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
    start.current = null
  }

  // Plus de minuteur en cours après le démontage de la carte (pli ramassé, carte jouée...).
  useEffect(() => stop, [])

  const handlers: LongPress['handlers'] = {
    onPointerDown(e) {
      if (latest.current === null || e.pointerType === 'mouse' || !e.isPrimary) return
      stop()
      start.current = { x: e.clientX, y: e.clientY }
      timer.current = window.setTimeout(() => {
        stop()
        latest.current?.()
      }, INSPECT_DELAY_MS)
    },
    onPointerMove(e) {
      if (start.current === null || !e.isPrimary) return
      if (cancelsLongPress(e.clientX - start.current.x, e.clientY - start.current.y)) stop()
    },
    onPointerUp: stop,
    onPointerCancel: stop,
  }

  return { handlers }
}
