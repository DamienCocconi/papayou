// Contrôleur de l'invité : expose sa session (déjà en partie) sous la forme GameController.
// Il envoie ses actions à l'hôte ; l'hôte décide, le refus éventuel arrive dans `session.error`.
import { legalPlaysFromView } from '../../engine'
import type { GuestSession, GuestSnapshot } from '../../net/session-guest'
import type { ControllerSnapshot, DispatchResult, GameController } from './types'

type PlayingGuestSnapshot = Extract<GuestSnapshot, { stage: 'playing' }>

export function createGuestController(session: GuestSession, now: () => number = Date.now): GameController {
  let cachedFor: PlayingGuestSnapshot | null = null
  let cached: ControllerSnapshot | null = null

  function getSnapshot(): ControllerSnapshot {
    const current = session.getSnapshot()
    // Connexion perdue ou renvoi : on garde la dernière vue, l'interface bascule sur son écran dédié.
    if (current.stage !== 'playing') {
      if (cached === null) throw new Error("La partie n'a pas démarré")
      return cached
    }
    if (current !== cachedFor || cached === null) {
      cachedFor = current
      cached = {
        view: current.view,
        // Les coups légaux se déduisent de la vue : ils ne transitent pas par le réseau.
        legalPlays: legalPlaysFromView(current.view),
        botsPending: false,
        session: { ...current.session, error: current.error, receivedAt: now() },
      }
    }
    return cached
  }

  return {
    getSnapshot,
    subscribe: session.subscribe,
    dispatch(action): DispatchResult {
      return action.type === 'nextRound' ? session.requestNextRound() : session.dispatch(action)
    },
    dispose() {
      session.dispose()
    },
  }
}
