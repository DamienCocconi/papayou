/** Affichage de la main : en arc (`fan`) ou en grille qui défile (`spread`). */
export type HandLayout = 'fan' | 'spread'

export const LAYOUT_KEY = 'papayou.handLayout'

/** Le strict nécessaire de `Storage`, pour pouvoir passer un faux stockage dans les tests. */
export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

/** Lit le choix mémorisé. Valeur absente, inconnue ou stockage indisponible : l'éventail. */
export function readLayout(storage: StorageLike | null): HandLayout {
  try {
    return storage?.getItem(LAYOUT_KEY) === 'spread' ? 'spread' : 'fan'
  } catch {
    return 'fan'
  }
}

/** Mémorise le choix. Un stockage indisponible ou plein n'est jamais une erreur. */
export function writeLayout(storage: StorageLike | null, layout: HandLayout): void {
  try {
    storage?.setItem(LAYOUT_KEY, layout)
  } catch {
    // Le choix vaut alors pour la session seulement.
  }
}

/** `window.localStorage`, ou `null` si l'accès lui-même lève une exception (navigation privée, cookies bloqués). */
export function browserStorage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}
