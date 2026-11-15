import { describe, expect, it } from 'vitest'
import { cancelsLongPress, INSPECT_DELAY_MS, INSPECT_TOLERANCE_PX } from './longPress'

describe('appui long', () => {
  it('attend 700 ms avec une tolérance de 10 px', () => {
    expect(INSPECT_DELAY_MS).toBe(700)
    expect(INSPECT_TOLERANCE_PX).toBe(10)
  })

  it("ne s'annule pas pour un doigt immobile", () => {
    expect(cancelsLongPress(0, 0)).toBe(false)
  })

  it("ne s'annule pas juste sous la tolérance, ni à la tolérance exacte", () => {
    expect(cancelsLongPress(9.9, 0)).toBe(false)
    expect(cancelsLongPress(0, -10)).toBe(false)
  })

  it("s'annule juste au-dessus de la tolérance, dans tous les sens", () => {
    expect(cancelsLongPress(10.1, 0)).toBe(true)
    expect(cancelsLongPress(-10.1, 0)).toBe(true)
    expect(cancelsLongPress(0, 10.1)).toBe(true)
    expect(cancelsLongPress(0, -10.1)).toBe(true)
  })

  it('mesure la distance en diagonale, pas chaque axe séparément', () => {
    // 8 px sur chaque axe : moins de 10 sur chacun, mais plus de 11 px de distance.
    expect(cancelsLongPress(8, 8)).toBe(true)
    expect(cancelsLongPress(6, 6)).toBe(false)
  })
})
