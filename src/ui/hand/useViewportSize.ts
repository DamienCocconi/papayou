import { useEffect, useState } from 'react'

/** Taille de l'écran de jeu (la fenêtre, dont la hauteur change avec la barre d'adresse mobile et la rotation). */
export function useViewportSize(): { width: number; height: number } {
  const [size, setSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return size
}
