import { useEffect, useState } from 'react'

/**
 * Secondes restantes d'un compte à rebours reçu de l'hôte : `remainingMs` valait ce temps à l'instant
 * `receivedAt`, l'appareil décompte ensuite seul (pas de trafic réseau par seconde).
 */
export function useCountdown(remainingMs: number, receivedAt: number): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [remainingMs, receivedAt])
  return Math.max(0, Math.ceil((remainingMs - (now - receivedAt)) / 1000))
}
