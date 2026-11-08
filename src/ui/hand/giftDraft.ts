/**
 * Choix des cartes à donner, avant l'envoi : état d'interface, que le moteur ignore.
 * Un tableau de GIFT_SIZE places, éventuellement vides (`null`). Les trous permettent aux autres
 * cartes de ne pas bouger quand on en retire une, et à la carte suivante de reprendre la place libre.
 * Le même tableau sert aux deux affichages : emplacements en éventail, sélection en étalé.
 */
import { GIFT_SIZE } from '../../engine'

export type GiftDraft = readonly (string | null)[]

export const EMPTY_DRAFT: GiftDraft = Array.from({ length: GIFT_SIZE }, () => null)

/** Place la carte dans la première place vide. Sans effet si elle y est déjà ou si tout est plein. */
export function add(draft: GiftDraft, cardId: string): GiftDraft {
  if (draft.includes(cardId)) return draft
  const free = draft.indexOf(null)
  if (free < 0) return draft
  return draft.map((id, i) => (i === free ? cardId : id))
}

/** Retire la carte en laissant sa place vide. Sans effet si elle n'est pas placée. */
export function remove(draft: GiftDraft, cardId: string): GiftDraft {
  return draft.includes(cardId) ? draft.map((id) => (id === cardId ? null : id)) : draft
}

/** Retire la carte si elle est placée, la place sinon : un clic en étalé. */
export function toggle(draft: GiftDraft, cardId: string): GiftDraft {
  return draft.includes(cardId) ? remove(draft, cardId) : add(draft, cardId)
}

/** Cartes placées, dans l'ordre des places. */
export function ids(draft: GiftDraft): string[] {
  return draft.filter((id): id is string => id !== null)
}

/** Vrai quand toutes les places sont remplies : le don peut être proposé. */
export function isComplete(draft: GiftDraft): boolean {
  return !draft.includes(null)
}

/** Vrai quand une place reste libre : une carte peut encore être placée. */
export function hasRoom(draft: GiftDraft): boolean {
  return draft.includes(null)
}
