import { describe, expect, it } from 'vitest'
import { createRng, nextInt, nextRandom, shuffle } from './rng'

describe('rng', () => {
  it('est déterministe pour une même graine', () => {
    expect(nextRandom(42)).toEqual(nextRandom(42))
    const a = createRng(7)
    const b = createRng(7)
    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()])
  })

  it('donne des valeurs dans [0, 1) et des entiers bornés', () => {
    let state = 1
    for (let i = 0; i < 1000; i++) {
      const r = nextRandom(state)
      state = r.state
      expect(r.value).toBeGreaterThanOrEqual(0)
      expect(r.value).toBeLessThan(1)
      const n = nextInt(state, 6)
      state = n.state
      expect(n.value).toBeGreaterThanOrEqual(0)
      expect(n.value).toBeLessThan(6)
    }
  })

  it("mélange sans perdre ni dupliquer et sans modifier l'entrée", () => {
    const input = Array.from({ length: 50 }, (_, i) => i)
    const copy = [...input]
    const r = shuffle(input, 123)
    expect(input).toEqual(copy)
    expect([...r.items].sort((x, y) => x - y)).toEqual(input)
    expect(r.items).not.toEqual(input)
    expect(shuffle(input, 123).items).toEqual(r.items)
  })

  it('des graines différentes donnent des mélanges différents', () => {
    const input = Array.from({ length: 30 }, (_, i) => i)
    expect(shuffle(input, 1).items).not.toEqual(shuffle(input, 2).items)
  })
})
