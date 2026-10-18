// Façade entre l'interface et la partie : l'UI lit une vue et envoie des actions, rien d'autre.
// Une version locale (bots) existe ; le réseau fournira plus tard la même interface.
import type { Action, ActionErrorCode, Card, PlayerView } from '../../engine'

/** Ce que l'interface lit. Contient la main de l'humain seulement, jamais l'état complet. */
export interface ControllerSnapshot {
  view: PlayerView
  /** Cartes que l'humain peut jouer maintenant (vide hors de son tour), selon le moteur. */
  legalPlays: Card[]
  /** Vrai tant qu'un bot doit encore agir : l'humain attend. */
  botsPending: boolean
}

/** Résultat d'une action de l'humain : l'état complet n'est jamais renvoyé. */
export type DispatchResult = { ok: true } | { ok: false; error: ActionErrorCode }

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
