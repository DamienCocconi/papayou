import { describe, expect, it } from 'vitest'
import { numberInkShift } from './numberInk'

describe('numberInkShift', () => {
  it('remonte un chiffre bas (1) vers le centre', () => {
    // Encre de 0 à 0,42 em au-dessus de la ligne de base (0,865) : centre à 0,66, à remonter de 0,16 em.
    expect(numberInkShift('1')).toBeCloseTo(-0.16, 3)
  })

  it('remonte davantage un chiffre qui descend sous la ligne (4)', () => {
    expect(numberInkShift('4')).toBeCloseTo(-0.27, 3)
  })

  it('remonte peu un chiffre qui monte (8)', () => {
    expect(numberInkShift('8')).toBeCloseTo(-0.07, 3)
  })

  it("prend l'encre de tous les chiffres d'un nombre (16 : le 6 monte, le 1 est bas)", () => {
    expect(numberInkShift('16')).toBeCloseTo(-0.085, 3)
  })

  it('combine un chiffre qui monte et un chiffre qui descend (18 et 19)', () => {
    // 19 : haut 0,44, bas 0,12 ; centre 0,865 - 0,16 = 0,705.
    expect(numberInkShift('19')).toBeCloseTo(-0.205, 3)
  })

  it('ne décale pas un texte sans chiffre', () => {
    expect(numberInkShift('')).toBe(0)
  })
})
