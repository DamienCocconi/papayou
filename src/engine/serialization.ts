// Sauvegarde et reprise de l'état en JSON (localStorage, reconnexion).
import type { GameState } from './types'

export function serializeState(state: GameState): string {
  return JSON.stringify(state)
}

/**
 * Relit un état sauvegardé. Vérifie seulement la version et la structure de base :
 * le JSON vient de notre propre sauvegarde, pas d'un joueur.
 * @throws Error si le texte n'est pas un état reconnu.
 */
export function deserializeState(text: string): GameState {
  const data: unknown = JSON.parse(text)
  if (typeof data !== 'object' || data === null) throw new Error('État invalide')
  const obj = data as Partial<GameState>
  if (obj.version !== 1) throw new Error(`Version d'état non supportée : ${String(obj.version)}`)
  if (!Array.isArray(obj.hands) || typeof obj.playerCount !== 'number') throw new Error('État invalide')
  return obj as GameState
}
