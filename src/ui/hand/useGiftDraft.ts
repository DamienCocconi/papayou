import { useCallback, useState } from 'react'
import { add, EMPTY_DRAFT, remove, toggle } from './giftDraft'
import type { GiftDraft } from './giftDraft'

export interface GiftDraftState {
  draft: GiftDraft
  add: (cardId: string) => void
  remove: (cardId: string) => void
  toggle: (cardId: string) => void
}

/**
 * Choix du don, partagé par la main et les emplacements : l'état est remonté dans leur parent commun
 * (*lifting state up*). Comme la sélection de la main, il est stocké avec la `resetKey` pour laquelle
 * il vaut : si la clé change (nouvelle manche, fin de l'échange), il est considéré comme vide.
 */
export function useGiftDraft(resetKey: string): GiftDraftState {
  const [stored, setStored] = useState<{ key: string; draft: GiftDraft }>({ key: resetKey, draft: EMPTY_DRAFT })
  const draft = stored.key === resetKey ? stored.draft : EMPTY_DRAFT

  // Mise à jour fonctionnelle : deux actions rapprochées partent chacune du dernier état.
  const update = useCallback(
    (change: (draft: GiftDraft) => GiftDraft) =>
      setStored((cur) => ({ key: resetKey, draft: change(cur.key === resetKey ? cur.draft : EMPTY_DRAFT) })),
    [resetKey],
  )

  return {
    draft,
    add: useCallback((cardId: string) => update((d) => add(d, cardId)), [update]),
    remove: useCallback((cardId: string) => update((d) => remove(d, cardId)), [update]),
    toggle: useCallback((cardId: string) => update((d) => toggle(d, cardId)), [update]),
  }
}
