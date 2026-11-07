import { useLayoutEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

/**
 * Largeur réelle d'un élément, mise à jour quand il est redimensionné (rotation de l'appareil comprise).
 * `enabled` : l'élément n'existe que dans certains rendus ; la mesure repart quand il apparaît.
 */
export function useElementWidth<T extends HTMLElement>(enabled: boolean): [RefObject<T>, number] {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    const el = ref.current
    if (!enabled || el === null) return
    setWidth(el.getBoundingClientRect().width)
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[entries.length - 1]
      if (entry !== undefined) setWidth(entry.contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [enabled])

  return [ref, width]
}
