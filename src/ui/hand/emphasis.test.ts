import { describe, expect, it } from 'vitest'
import { designateCard, emphasisLayout, restBandCenter, emphasisScale, EMPHASIS_SCALE, heldLayout, holdLineY, isAboveLine, playLineY } from './emphasis'
import type { CardBox, DisplayedSlot, ScreenBounds } from './emphasis'
import { FAN_LIFT, fanCardSize, fanLayout, fanScale } from './fanLayout'

const EPS = 1e-6

/** Écran donné, avec une main en bas et une marge latérale, comme dans l'écran de jeu. */
function setup(screenWidth: number, screenHeight: number, handTop: number) {
  const left = 12
  const width = screenWidth - 2 * left
  const scale = fanScale(screenWidth, screenHeight)
  const size = fanCardSize(scale)
  const box: CardBox = { width: size.width, height: size.height, lift: FAN_LIFT * scale }
  const bounds: ScreenBounds = { left: -left, right: screenWidth - left, top: -handTop, bottom: screenHeight - handTop }
  return { width, scale, box, bounds }
}

const SCREENS = [
  { name: '360 x 640', ...setup(360, 640, 523) },
  { name: '640 x 360', ...setup(640, 360, 257) },
  { name: '1920 x 1000', ...setup(1920, 1000, 830) },
]

function at<T>(items: readonly T[], i: number): T {
  const item = items[i]
  if (item === undefined) throw new Error(`position ${i} absente`)
  return item
}

/** Coins d'une carte affichée, tournée puis agrandie autour du milieu de son bord bas. */
function corners(slot: DisplayedSlot, box: CardBox): { x: number; y: number }[] {
  const r = (slot.rotation * Math.PI) / 180
  const pivotX = slot.x + box.width / 2
  const pivotY = box.lift + slot.y + box.height
  return [
    [-box.width / 2, -box.height],
    [box.width / 2, -box.height],
    [-box.width / 2, 0],
    [box.width / 2, 0],
  ].map(([dx = 0, dy = 0]) => ({
    x: pivotX + slot.scale * (dx * Math.cos(r) - dy * Math.sin(r)),
    y: pivotY + slot.scale * (dx * Math.sin(r) + dy * Math.cos(r)),
  }))
}

describe('designateCard', () => {
  const slots = fanLayout(10, 336)
  const size = { width: 56, height: 84 }
  const center = (i: number) => restBandCenter(slots, i, size)

  it('ne désigne rien sans carte', () => {
    expect(designateCard(100, [], size, null)).toBeNull()
  })

  it('désigne la carte dont la partie visible est sous le pointeur, aussi quand elles se recouvrent', () => {
    for (const count of [3, 19, 26]) {
      const many = fanLayout(count, 336)
      for (let i = 0; i < count; i++) expect(designateCard(restBandCenter(many, i, size), many, size, null)).toBe(i)
    }
  })

  it('désigne la carte dont le bord gauche, seule partie visible, est sous le pointeur', () => {
    const flat = fanLayout(2, 336).map((slot) => ({ ...slot, rotation: 0 }))
    expect(designateCard(at(flat, 0).x + 1, flat, size, null)).toBe(0)
    expect(designateCard(at(flat, 1).x + 1, flat, size, null)).toBe(1)
    expect(designateCard(at(flat, 1).x + 50, flat, size, null)).toBe(1)
  })

  it('désigne chaque carte quand on la vise, y compris sous l’arrondi de l’éventail', () => {
    for (let i = 0; i < slots.length; i++) expect(designateCard(center(i), slots, size, null)).toBe(i)
  })

  it('désigne les extrémités au-delà de la main', () => {
    expect(designateCard(-50, slots, size, null)).toBe(0)
    expect(designateCard(1000, slots, size, null)).toBe(9)
  })

  it('reste sur la carte courante malgré les tremblements du doigt à la frontière', () => {
    const border = (center(4) + center(5)) / 2
    let current: number | null = 4
    for (const shake of [1, -1, 1.5, -1, 1, -1.5]) {
      current = designateCard(border + shake, slots, size, current)
      expect(current).toBe(4)
    }
  })

  it('change une seule fois par carte pendant un balayage lent, sans va-et-vient', () => {
    const changes: number[] = []
    let current: number | null = 0
    for (let x = center(0); x <= center(9); x += 0.5) {
      const next = designateCard(x, slots, size, current)
      if (next !== current && next !== null) changes.push(next)
      current = next
    }
    expect(changes).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  for (const count of [19, 26]) {
    it(`passe par chaque carte, une seule fois, pendant un balayage lent à ${count} cartes`, () => {
      const many = fanLayout(count, 336)
      const changes: number[] = []
      let current: number | null = 0
      for (let x = restBandCenter(many, 0, size); x <= restBandCenter(many, count - 1, size); x += 0.25) {
        const next = designateCard(x, many, size, current)
        if (next !== current && next !== null) changes.push(next)
        current = next
      }
      expect(changes).toEqual(Array.from({ length: count - 1 }, (_, i) => i + 1))
    })
  }

  it('finit par quitter la carte courante quand le pointeur s’éloigne franchement', () => {
    expect(designateCard(center(7), slots, size, 2)).toBe(7)
  })
})

describe('emphasisLayout', () => {
  it('rend les positions de repos sans emphase', () => {
    const { width, scale, box, bounds } = at(SCREENS, 0)
    const slots = fanLayout(13, width, scale)
    expect(emphasisLayout(slots, null, box, bounds)).toEqual(slots.map((s) => ({ ...s, scale: 1 })))
  })

  for (const { name, width, scale, box, bounds } of SCREENS) {
    describe(name, () => {
      for (const count of [1, 3, 13, 19, 26]) {
        const slots = fanLayout(count, width, scale)

        it(`garde les ${count} cartes dans la largeur, quelle que soit l'emphase`, () => {
          for (let index = 0; index < count; index++) {
            for (const slot of emphasisLayout(slots, index, box, bounds)) {
              for (const corner of corners(slot, box)) {
                expect(corner.x).toBeGreaterThanOrEqual(bounds.left - EPS)
                expect(corner.x).toBeLessThanOrEqual(bounds.right + EPS)
              }
            }
          }
        })

        it(`affiche la carte en emphase redressée, agrandie et entière, avec ${count} cartes`, () => {
          for (let index = 0; index < count; index++) {
            const slot = at(emphasisLayout(slots, index, box, bounds), index)
            expect(slot.rotation).toBe(0)
            expect(slot.scale).toBeGreaterThan(1)
            for (const corner of corners(slot, box)) {
              expect(corner.y).toBeGreaterThanOrEqual(bounds.top - EPS)
              expect(corner.y).toBeLessThanOrEqual(bounds.bottom + EPS)
            }
          }
        })
      }

      it('place la carte en emphase au-dessus du doigt qui touche la main', () => {
        const slots = fanLayout(19, width, scale)
        for (const index of [0, 9, 18]) {
          const slot = at(emphasisLayout(slots, index, box, bounds), index)
          // Le coin (rang et couleur) reste bien au-dessus du haut de l'éventail, où se pose le doigt.
          const top = Math.min(...corners(slot, box).map((c) => c.y))
          expect(top).toBeLessThan(0)
          expect(box.lift + slot.y + box.height).toBeLessThanOrEqual(box.lift + box.height * 0.2)
        }
      })
    })
  }

  it('écarte les voisines de chaque côté, de moins en moins avec la distance', () => {
    const { width, scale, box, bounds } = at(SCREENS, 0)
    const slots = fanLayout(19, width, scale)
    const index = 9
    const shown = emphasisLayout(slots, index, box, bounds)
    const shift = (i: number) => at(shown, i).x - at(slots, i).x
    for (let d = 1; d <= 4; d++) {
      expect(shift(index - d)).toBeLessThan(0)
      expect(shift(index + d)).toBeGreaterThan(0)
      expect(Math.abs(shift(index - d))).toBeGreaterThan(Math.abs(shift(index - d - 1)))
      expect(Math.abs(shift(index + d))).toBeGreaterThan(Math.abs(shift(index + d + 1)))
    }
  })

  for (const count of [19, 26]) {
    it(`garde les cartes dans leur ordre de gauche à droite, à ${count} cartes et pour chaque emphase`, () => {
      const { width, scale, box, bounds } = at(SCREENS, 0)
      const slots = fanLayout(count, width, scale)
      for (let index = 0; index < count; index++) {
        const shown = emphasisLayout(slots, index, box, bounds)
        for (let i = 1; i < count; i++) {
          if (i === index || i - 1 === index) continue
          expect(at(shown, i).x, `emphase ${index}, carte ${i}`).toBeGreaterThan(at(shown, i - 1).x)
        }
      }
    })
  }
})

describe('emphasisScale', () => {
  it('atteint l’agrandissement visé quand la place suffit', () => {
    const { box, bounds } = at(SCREENS, 0)
    expect(emphasisScale(box, bounds)).toBe(EMPHASIS_SCALE)
  })

  it('se réduit sur un écran très bas, sans passer sous la taille de repos', () => {
    const { box } = setup(640, 200, 90)
    const low = { left: -12, right: 628, top: -90, bottom: 110 }
    const k = emphasisScale(box, low)
    expect(k).toBeLessThan(EMPHASIS_SCALE)
    expect(k).toBeGreaterThanOrEqual(1)
  })
})

describe('heldLayout', () => {
  for (const { name, box, bounds } of SCREENS) {
    it(`reste entièrement dans l'écran, où que soit le pointeur (${name})`, () => {
      const xs = [bounds.left - 50, 0, bounds.right + 50]
      const ys = [bounds.top - 50, 0, bounds.bottom + 50]
      for (const x of xs) {
        for (const y of ys) {
          for (const corner of corners(heldLayout(x, y, box, bounds), box)) {
            expect(corner.x).toBeGreaterThanOrEqual(bounds.left - EPS)
            expect(corner.x).toBeLessThanOrEqual(bounds.right + EPS)
            expect(corner.y).toBeGreaterThanOrEqual(bounds.top - EPS)
            expect(corner.y).toBeLessThanOrEqual(bounds.bottom + EPS)
          }
        }
      }
    })
  }

  it('suit le pointeur en restant au-dessus de lui', () => {
    const { box, bounds } = at(SCREENS, 0)
    const held = heldLayout(100, -100, box, bounds)
    expect(held.x + box.width / 2).toBe(100)
    expect(box.lift + held.y + box.height).toBeLessThan(-100)
  })
})

describe('playLineY', () => {
  for (const { name, bounds } of SCREENS) {
    it(`reste au-dessus de la main et dans l'écran (${name})`, () => {
      const line = playLineY(bounds)
      expect(line).toBeLessThan(0)
      expect(line).toBeGreaterThan(bounds.top)
    })
  }

  it('dépend de la hauteur de l’écran', () => {
    expect(playLineY(at(SCREENS, 0).bounds)).not.toBe(playLineY(at(SCREENS, 1).bounds))
  })

  it('reste au-dessus de la main même si elle occupe presque tout l’écran', () => {
    expect(playLineY({ left: 0, right: 360, top: -40, bottom: 400 })).toBeLessThan(0)
  })
})

describe('holdLineY', () => {
  it('garde la ligne de l’écran quand le bas de la carte en est assez loin', () => {
    expect(holdLineY(-200, 10, -500)).toBe(-200)
  })

  it('place la ligne 70 px au-dessus du bas de la carte quand il en est trop proche', () => {
    const line = holdLineY(-42, -60, -300)
    expect(line).toBe(-60 - 24 - 70)
    expect(isAboveLine(-60, line)).toBe(false)
    expect(isAboveLine(-60 - 69, line)).toBe(false)
    expect(isAboveLine(-60 - 71, line)).toBe(true)
  })

  it('reste à 70 px du haut de l’écran et franchissable, même pour une prise tout en haut', () => {
    const screenTop = -240
    const line = holdLineY(-42, screenTop + 5, screenTop)
    expect(line).toBe(screenTop + 70)
    expect(isAboveLine(screenTop, line)).toBe(true)
  })

  it('ne descend jamais sous la ligne de l’écran', () => {
    expect(holdLineY(-42, 200, -60)).toBe(-42)
  })
})

describe('isAboveLine', () => {
  it('compare le bas de la carte tenue, pas le pointeur', () => {
    // Le pointeur a passé la ligne depuis longtemps, ou la carte juste assez, ou pas encore.
    expect(isAboveLine(-120, -100)).toBe(true)
    expect(isAboveLine(-100 + 23, -100)).toBe(true)
    expect(isAboveLine(-100 + 25, -100)).toBe(false)
  })
})
