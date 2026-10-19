// Planification de minuteries injectable (les tests fournissent un ordonnanceur manuel).

/** Planifie `fn` dans `ms` millisecondes et renvoie la fonction qui l'annule. */
export type Scheduler = (fn: () => void, ms: number) => () => void

export const defaultScheduler: Scheduler = (fn, ms) => {
  const id = setTimeout(fn, ms)
  return () => clearTimeout(id)
}

export type BotKind = 'random' | 'heuristic'
