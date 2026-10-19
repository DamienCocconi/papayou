// Façade entre l'interface et la partie : l'UI lit une vue et envoie des actions, rien d'autre.
// Trois implémentations : locale (bots), hôte d'une salle en réseau, invité d'une salle en réseau.
import type { Action, Card, PlayerView } from '../../engine'
import type { RoomErrorCode, SessionInfo } from '../../net/protocol'

/** Informations propres à une partie en réseau (absentes d'une partie locale). */
export interface ControllerSession extends SessionInfo {
  /** Dernier refus de l'hôte pour une action de cet invité, jusqu'à la vue suivante. */
  error: RoomErrorCode | null
  /** Heure (ms) à laquelle ces informations ont été reçues : le compte à rebours part de là. */
  receivedAt: number
}

/** Ce que l'interface lit. Contient la main de l'humain seulement, jamais l'état complet. */
export interface ControllerSnapshot {
  view: PlayerView
  /** Cartes que l'humain peut jouer maintenant (vide hors de son tour), selon le moteur. */
  legalPlays: Card[]
  /** Vrai tant qu'un bot doit encore agir : l'humain attend. */
  botsPending: boolean
  /** Places, pause et fin de manche en réseau ; null pour une partie locale contre des bots. */
  session: ControllerSession | null
}

/** Résultat d'une action de l'humain : l'état complet n'est jamais renvoyé. */
export type DispatchResult = { ok: true } | { ok: false; error: RoomErrorCode }

export interface GameController {
  /** Même référence tant que rien n'a changé (exigé par useSyncExternalStore). */
  getSnapshot(): ControllerSnapshot
  /** Prévient à chaque changement de vue. Renvoie la fonction de désabonnement. */
  subscribe(listener: () => void): () => void
  /** Action de l'humain. Sa place est imposée par le contrôleur. */
  dispatch(action: Action): DispatchResult
  /** Arrête les minuteries en attente. */
  dispose(): void
}
