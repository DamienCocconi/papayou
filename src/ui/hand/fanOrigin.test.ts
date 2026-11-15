import { describe, expect, it } from 'vitest'
import { nextOrigin } from './fanOrigin'

describe('nextOrigin', () => {
  const current = { left: 12, top: 540 }

  it('garde la même référence quand la position ne change pas', () => {
    expect(nextOrigin(current, { left: 12, top: 540 })).toBe(current)
  })

  it('ignore les fractions de pixel : pas de nouveau rendu pour un tremblement de mesure', () => {
    expect(nextOrigin(current, { left: 12.3, top: 539.6 })).toBe(current)
    expect(nextOrigin(current, { left: 11.8, top: 540.4 })).toBe(current)
  })

  it('ignore une mesure non numérique (NaN ne vaut jamais NaN : la boucle serait infinie)', () => {
    expect(nextOrigin(current, { left: Number.NaN, top: 540 })).toBe(current)
    expect(nextOrigin(current, { left: 12, top: Number.POSITIVE_INFINITY })).toBe(current)
  })

  it('retient une vraie nouvelle position, arrondie au pixel', () => {
    expect(nextOrigin(current, { left: 0, top: 380.7 })).toEqual({ left: 0, top: 381 })
  })

  it('se stabilise : une mesure répétée ne produit plus de changement', () => {
    const moved = nextOrigin(current, { left: 4.4, top: 300.2 })
    expect(nextOrigin(moved, { left: 4.4, top: 300.2 })).toBe(moved)
  })
})
