// Générateur pseudo-aléatoire à graine (mulberry32), sans Math.random.
// Version fonctionnelle : l'état du générateur est un simple entier stocké dans GameState.

/** Normalise une graine quelconque en entier 32 bits non signé. */
export function normalizeSeed(seed: number): number {
  return seed >>> 0
}

/** Tire un réel dans [0, 1) et renvoie le nouvel état du générateur. */
export function nextRandom(state: number): { value: number; state: number } {
  const next = (state + 0x6d2b79f5) >>> 0
  let t = next
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296
  return { value, state: next }
}

/** Tire un entier dans [0, max[ et renvoie le nouvel état. */
export function nextInt(state: number, max: number): { value: number; state: number } {
  const r = nextRandom(state)
  return { value: Math.floor(r.value * max), state: r.state }
}

/** Mélange de Fisher-Yates : renvoie une nouvelle liste, l'entrée n'est pas modifiée. */
export function shuffle<T>(items: readonly T[], state: number): { items: T[]; state: number } {
  const result = [...items]
  let current = state
  for (let i = result.length - 1; i > 0; i--) {
    const r = nextInt(current, i + 1)
    current = r.state
    const a = result[i] as T
    const b = result[r.value] as T
    result[i] = b
    result[r.value] = a
  }
  return { items: result, state: current }
}

/** Petit générateur à état interne, pratique pour les simulations et les bots (hors moteur). */
export function createRng(seed: number): { next(): number; nextInt(max: number): number } {
  let state = normalizeSeed(seed)
  return {
    next() {
      const r = nextRandom(state)
      state = r.state
      return r.value
    },
    nextInt(max: number) {
      const r = nextInt(state, max)
      state = r.state
      return r.value
    },
  }
}
