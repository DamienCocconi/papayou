import { describe, expect, it } from 'vitest'
import { FAN_CARD_HEIGHT, FAN_CARD_WIDTH, FAN_MARGIN, FAN_MAX_SCALE, fanCardSize, fanLayout, fanScale } from './fanLayout'

const COUNTS = [1, 3, 13, 15, 19, 26]
const WIDTHS = [360, 375, 640, 812]
const EPS = 1e-6

/** Accès indexé sûr : le test échoue clairement si la position manque. */
function at<T>(items: readonly T[], i: number): T {
  const item = items[i]
  if (item === undefined) throw new Error(`position ${i} absente`)
  return item
}

describe('fanLayout', () => {
  it('ne renvoie rien pour une main vide', () => {
    expect(fanLayout(0, 360)).toEqual([])
  })

  for (const count of COUNTS) {
    for (const width of WIDTHS) {
      describe(`${count} cartes à ${width} px`, () => {
        const slots = fanLayout(count, width)

        it('renvoie une position par carte', () => {
          expect(slots).toHaveLength(count)
        })

        it('garde les cartes dans la largeur', () => {
          for (const s of slots) {
            expect(s.x).toBeGreaterThanOrEqual(FAN_MARGIN - EPS)
            expect(s.x + FAN_CARD_WIDTH).toBeLessThanOrEqual(width - FAN_MARGIN + EPS)
          }
        })

        it('garde dans l’écran le coin haut gauche, une fois la carte tournée autour de son bas', () => {
          for (const s of slots) {
            const r = (s.rotation * Math.PI) / 180
            // Coin haut gauche par rapport au pivot (milieu du bas de la carte).
            const dx = -FAN_CARD_WIDTH / 2
            const dy = -FAN_CARD_HEIGHT
            const cornerX = s.x + FAN_CARD_WIDTH / 2 + dx * Math.cos(r) - dy * Math.sin(r)
            expect(cornerX).toBeGreaterThanOrEqual(0)
          }
        })

        it('range les cartes de gauche à droite', () => {
          for (let i = 1; i < slots.length; i++) expect(at(slots, i).x).toBeGreaterThan(at(slots, i - 1).x)
        })

        it('dessine un arc symétrique', () => {
          for (let i = 0; i < count; i++) {
            const slot = at(slots, i)
            const mirror = at(slots, count - 1 - i)
            expect(slot.y).toBeCloseTo(mirror.y, 6)
            expect(slot.rotation).toBeCloseTo(-mirror.rotation, 6)
            // Symétrie par rapport au centre de l'écran.
            expect(slot.x + mirror.x + FAN_CARD_WIDTH).toBeCloseTo(width, 6)
          }
        })

        it('plafonne la rotation et ne remonte jamais les cartes au-dessus du centre', () => {
          for (const s of slots) {
            expect(Math.abs(s.rotation)).toBeLessThanOrEqual(12 + EPS)
            expect(s.y).toBeGreaterThanOrEqual(-EPS)
          }
        })
      })
    }
  }

  it('garde une petite main groupée au centre', () => {
    const slots = fanLayout(3, 812)
    const span = at(slots, 2).x + FAN_CARD_WIDTH - at(slots, 0).x
    expect(span).toBeLessThan(200)
  })

  it('étale une grande main sur la largeur disponible', () => {
    const slots = fanLayout(19, 360)
    // Les extrémités s'écartent des bords de la marge ajoutée par la rotation, de façon symétrique.
    expect(at(slots, 0).x).toBeGreaterThanOrEqual(FAN_MARGIN)
    expect(at(slots, 0).x + at(slots, 18).x + FAN_CARD_WIDTH).toBeCloseTo(360, 6)
  })

  it('met une carte seule au centre, à plat', () => {
    expect(fanLayout(1, 360)).toEqual([{ x: (360 - FAN_CARD_WIDTH) / 2, y: 0, rotation: 0 }])
  })
})

describe('fanScale', () => {
  it('garde (à peu près) la taille de base sur téléphone, en portrait comme en paysage', () => {
    expect(fanScale(360, 640)).toBe(1)
    expect(fanScale(375, 667)).toBeLessThan(1.05)
    expect(fanScale(640, 360)).toBe(1)
    expect(fanScale(812, 375)).toBe(1)
  })

  it('ne descend jamais sous la taille de base, même sur un écran minuscule', () => {
    expect(fanScale(200, 300)).toBe(1)
  })

  it('agrandit les cartes sur un écran de PC', () => {
    const k = fanScale(1920, 1000)
    expect(k).toBeGreaterThan(1)
    expect(k).toBeLessThanOrEqual(FAN_MAX_SCALE)
  })

  it('plafonne l’agrandissement', () => {
    expect(fanScale(4000, 3000)).toBe(FAN_MAX_SCALE)
  })

  it('suit le côté le plus contraint, pour qu’un écran large et bas ne donne pas des cartes démesurées', () => {
    expect(fanScale(1920, 700)).toBeCloseTo(700 / 640, 6)
  })

  it('croît avec la taille de la fenêtre', () => {
    expect(fanScale(900, 800)).toBeLessThanOrEqual(fanScale(1200, 1000))
  })
})

describe('fanLayout avec échelle', () => {
  const scale = fanScale(1920, 1000)
  const { width: cardWidth, height: cardHeight } = fanCardSize(scale)

  it('agrandit les cartes proportionnellement (2:3)', () => {
    expect(cardWidth).toBeGreaterThan(FAN_CARD_WIDTH)
    expect(cardHeight / cardWidth).toBeCloseTo(FAN_CARD_HEIGHT / FAN_CARD_WIDTH, 1)
  })

  for (const count of COUNTS) {
    it(`garde ${count} cartes et leur coin tourné dans la largeur à 1920 px`, () => {
      const slots = fanLayout(count, 1920, scale)
      expect(slots).toHaveLength(count)
      for (const s of slots) {
        const r = (s.rotation * Math.PI) / 180
        const cornerX = s.x + cardWidth / 2 + (-cardWidth / 2) * Math.cos(r) + cardHeight * Math.sin(r)
        expect(cornerX).toBeGreaterThanOrEqual(0)
        expect(s.x + cardWidth).toBeLessThanOrEqual(1920 - FAN_MARGIN + EPS)
      }
    })
  }

  it('garde 19 cartes lisibles : la part visible de chaque carte croît avec l’échelle', () => {
    const base = fanLayout(19, 360, 1)
    const wide = fanLayout(19, 360 * scale, scale)
    const visibleBase = at(base, 1).x - at(base, 0).x
    const visibleWide = at(wide, 1).x - at(wide, 0).x
    expect(visibleWide).toBeGreaterThanOrEqual(visibleBase * scale * 0.95)
  })
})
