// Contrôleur de l'hôte : expose sa session de salle (déjà démarrée) sous la forme GameController.
// L'hôte joue sur sa propre place ; les invités et les bots sont gérés par la session.
import { legalPlaysFromView } from '../../engine'
import type { HostSession, PlayingSnapshot } from '../../net/session-host'
import type { ControllerSnapshot, DispatchResult, GameController } from './types'

export function createHostController(session: HostSession, now: () => number = Date.now): GameController {
  let cachedFor: PlayingSnapshot | null = null
  let cached: ControllerSnapshot | null = null

  function getSnapshot(): ControllerSnapshot {
    const current = session.getSnapshot()
    // Hors partie (lobby), on garde le dernier instantané : l'interface n'utilise ce contrôleur qu'en jeu.
    if (current.stage !== 'playing') {
      if (cached === null) throw new Error("La partie n'a pas démarré")
      return cached
    }
    if (current !== cachedFor || cached === null) {
      cachedFor = current
      cached = {
        view: current.view,
        legalPlays: legalPlaysFromView(current.view),
        botsPending: current.botsPending,
        session: { ...current.session, error: null, receivedAt: now() },
      }
    }
    return cached
  }

  return {
    getSnapshot,
    subscribe: session.subscribe,
    dispatch(action): DispatchResult {
      const result = action.type === 'nextRound' ? session.requestNextRound() : session.dispatch(action)
      return result
    },
    dispose() {
      session.dispose()
    },
  }
}
