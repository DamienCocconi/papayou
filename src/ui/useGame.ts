import { useSyncExternalStore } from 'react'
import type { ControllerSnapshot, GameController } from './controller/types'

/**
 * Lit l'état d'une partie et se réabonne à chaque changement.
 * useSyncExternalStore est l'idiome React 18 pour une source externe à React (ici le contrôleur) :
 * il appelle `subscribe` une fois et relit `getSnapshot` à chaque notification.
 */
export function useGame(controller: GameController): ControllerSnapshot {
  return useSyncExternalStore(controller.subscribe, controller.getSnapshot)
}
