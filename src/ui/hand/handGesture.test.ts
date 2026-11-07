import { describe, expect, it } from 'vitest'
import { emphasisLayout, restBandCenter } from './emphasis'
import { fanLayout } from './fanLayout'
import { gestureCardId, gestureViewKey, IDLE, PULL_THRESHOLD, reduceGesture } from './handGesture'
import type { GestureContext, GestureEffect, GestureEvent, GestureState } from './handGesture'

const CARD_SIZE = { width: 56, height: 84 }
const IDS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const SLOTS = fanLayout(IDS.length, 336)
const LINE_Y = -200

function centerOf(id: string): number {
  return restBandCenter(SLOTS, IDS.indexOf(id), CARD_SIZE)
}

function ctx(overrides: Partial<GestureContext> = {}): GestureContext {
  return { cardIds: IDS, slots: SLOTS, cardSize: CARD_SIZE, lineY: LINE_Y, screenTop: -600, emphasizedId: null, canPlay: () => true, ...overrides }
}

/** Rejoue une suite d'événements et cumule les effets, comme le ferait le hook. */
function run(events: GestureEvent[], context = ctx(), from: GestureState = IDLE): { state: GestureState; effects: GestureEffect[] } {
  let state = from
  const effects: GestureEffect[] = []
  for (const event of events) {
    const result = reduceGesture(state, event, context)
    state = result.state
    effects.push(...result.effects)
  }
  return { state, effects }
}

const P = 1
const down = (x: number, y = 40, pointerId = P): GestureEvent => ({ type: 'down', pointerId, x, y })
const move = (x: number, y = 40, pointerId = P): GestureEvent => ({ type: 'move', pointerId, x, y })
const up = (pointerId = P): GestureEvent => ({ type: 'up', pointerId })
const X = centerOf('d')
/** Appui sur la carte d, puis montée jusqu'à la prendre. */
const TAKE: GestureEvent[] = [down(X), move(X, 40 - PULL_THRESHOLD - 1)]
/** Hauteur où la carte tenue est au-dessus de la ligne, ou encore en dessous. */
const ABOVE = LINE_Y - 10
const BELOW = LINE_Y + 100

const plays = (effects: GestureEffect[]) => effects.filter((e) => e.type === 'play')
const refusals = (effects: GestureEffect[]) => effects.filter((e) => e.type === 'refuse')

describe('survol', () => {
  it('met en emphase la carte survolée, sans effet', () => {
    const { state, effects } = run([{ type: 'hoverMove', x: X }])
    expect(state).toEqual({ phase: 'hover', cardId: 'd' })
    expect(effects).toEqual([])
  })

  it('suit la souris de carte en carte et s’arrête quand elle quitte la main', () => {
    const over = run([{ type: 'hoverMove', x: centerOf('b') }, { type: 'hoverMove', x: centerOf('f') }])
    expect(gestureCardId(over.state)).toBe('f')
    expect(run([{ type: 'hoverMove', x: X }, { type: 'leave' }]).state).toEqual(IDLE)
  })

  it('garde la carte agrandie tant que la souris reste dessus, même au-dessus d’une autre bande', () => {
    const over = run([{ type: 'hoverMove', x: X }, { type: 'hoverMove', x: centerOf('h'), cardId: 'd' }])
    expect(gestureCardId(over.state)).toBe('d')
  })

  it('ne pose pas la sélection', () => {
    const { effects } = run([{ type: 'hoverMove', x: X }, { type: 'hoverMove', x: centerOf('f') }, { type: 'leave' }])
    expect(effects).toEqual([])
  })

  describe('clic et emphase maintenue à la souris', () => {
    const mouseDown = (x: number): GestureEvent => ({ type: 'down', pointerId: P, x, y: 40, mouse: true })

    it('un clic sans tirer ne joue rien, ne retient rien, et la carte reste survolée', () => {
      const { state, effects } = run([{ type: 'hoverMove', x: X }, mouseDown(X), up()])
      expect(state).toEqual({ phase: 'hover', cardId: 'd' })
      expect(effects).toEqual([])
    })

    it('après un clic, quitter la main retire l’emphase', () => {
      expect(run([mouseDown(X), up(), { type: 'leave' }]).state).toEqual(IDLE)
    })

    it('le toucher, lui, retient la carte au lever du doigt', () => {
      expect(run([down(X), up()]).effects).toEqual([{ type: 'select', cardId: 'd' }])
    })

    it('une carte tirée puis relâchée sous la ligne reste en emphase maintenue', () => {
      const { state, effects } = run([mouseDown(X), move(X, 40 - PULL_THRESHOLD - 1), up()])
      expect(state).toEqual(IDLE)
      expect(effects).toEqual([{ type: 'select', cardId: 'd' }])
    })

    it('le survol d’une autre carte arrête l’emphase maintenue', () => {
      const { effects } = run([{ type: 'hoverMove', x: centerOf('f') }], ctx({ emphasizedId: 'd' }))
      expect(effects).toEqual([{ type: 'select', cardId: null }])
    })

    it('survoler ou cliquer la carte maintenue ne l’arrête pas', () => {
      const context = ctx({ emphasizedId: 'd' })
      expect(run([{ type: 'hoverMove', x: X }, { type: 'leave' }], context).effects).toEqual([])
      expect(run([mouseDown(X), up()], context).effects).toEqual([])
    })

    it('garde la carte maintenue au retour de la souris, près de la frontière avec sa voisine', () => {
      let x = X
      while (gestureCardId(run([{ type: 'hoverMove', x }]).state) === 'd') x += 1
      const { state, effects } = run([{ type: 'hoverMove', x }], ctx({ emphasizedId: 'd' }))
      expect(gestureCardId(state)).toBe('d')
      expect(effects).toEqual([])
    })

    it('une carte tirée puis relâchée au-dessus de la ligne est jouée, sans rester maintenue', () => {
      const { effects } = run([mouseDown(X), move(X, 40 - PULL_THRESHOLD - 1), move(X, ABOVE), up()])
      expect(effects).toEqual([
        { type: 'select', cardId: null },
        { type: 'play', cardId: 'd' },
      ])
    })

    it('une carte refusée résiste, reste survolée et n’est pas retenue', () => {
      const context = ctx({ canPlay: () => false })
      const { state, effects } = run([mouseDown(X), move(X, 40 - PULL_THRESHOLD - 1), up()], context)
      expect(state).toEqual({ phase: 'hover', cardId: 'd' })
      expect(effects).toEqual([{ type: 'refuse', cardId: 'd' }])
    })

    it('une annulation laisse l’emphase maintenue intacte', () => {
      const cancel: GestureEvent = { type: 'cancel', pointerId: P }
      const { effects } = run([mouseDown(X), move(centerOf('f')), cancel], ctx({ emphasizedId: 'd' }))
      expect(effects).toEqual([])
    })

    it('un clic après un balayage sur une autre carte arrête l’emphase maintenue', () => {
      const { effects } = run([mouseDown(X), move(centerOf('f')), up()], ctx({ emphasizedId: 'd' }))
      expect(effects).toEqual([{ type: 'select', cardId: null }])
    })
  })

  it('est ignoré pendant un geste', () => {
    const { state } = run([...TAKE, { type: 'hoverMove', x: centerOf('a') }])
    expect(state.phase).toBe('holding')
    expect(gestureCardId(state)).toBe('d')
  })

  it('passe à la prise quand on appuie sur la carte survolée, puis qu’on tire', () => {
    const { state } = run([{ type: 'hoverMove', x: X }, ...TAKE])
    expect(state.phase).toBe('holding')
    expect(gestureCardId(state)).toBe('d')
  })
})

describe('balayage', () => {
  it('désigne la carte sous le doigt et change avec lui', () => {
    expect(gestureCardId(run([down(centerOf('b'))]).state)).toBe('b')
    expect(gestureCardId(run([down(centerOf('b')), move(centerOf('g'))]).state)).toBe('g')
  })

  it('ne joue rien, et conserve l’emphase au lever du doigt', () => {
    const { state, effects } = run([down(centerOf('b')), move(centerOf('e')), move(centerOf('g')), up()])
    expect(state).toEqual(IDLE)
    expect(effects).toEqual([{ type: 'select', cardId: 'g' }])
  })

  it('ne prend pas la carte sur un mouvement surtout horizontal, même en montant un peu', () => {
    const { state } = run([down(X), move(X + 60, 40 - PULL_THRESHOLD - 5)])
    expect(state.phase).toBe('scrubbing')
  })

  it('ne prend pas la carte sur une diagonale qui change sans cesse de carte', () => {
    const steps = Array.from({ length: 20 }, (_, i) => move(centerOf('a') + i * 12, 40 - i * 6))
    const { state } = run([down(centerOf('a')), ...steps])
    expect(state.phase).toBe('scrubbing')
  })

  it('ne prend pas la carte sous le seuil de montée', () => {
    expect(run([down(X), move(X, 40 - PULL_THRESHOLD)]).state.phase).toBe('scrubbing')
  })

  it('passe à la prise après un balayage, sans repartir de l’appui initial', () => {
    const atF = centerOf('f')
    const { state } = run([down(centerOf('a')), move(atF), move(atF, 40 - PULL_THRESHOLD - 1)])
    expect(state.phase).toBe('holding')
    expect(gestureCardId(state)).toBe('f')
  })

  it('deux touchers sur la même carte ne jouent rien', () => {
    const { state, effects } = run([down(X), up(), down(X), up()], ctx({ emphasizedId: 'd' }))
    expect(state).toEqual(IDLE)
    expect(plays(effects)).toEqual([])
  })

  describe('appui sur la carte agrandie', () => {
    const box = { ...CARD_SIZE, lift: 14 }
    const screens = [
      { name: '360 x 640', bounds: { left: -12, right: 348, top: -523, bottom: 117 }, width: 336 },
      { name: '640 x 360', bounds: { left: -12, right: 628, top: -257, bottom: 103 }, width: 616 },
    ]
    for (const { name, bounds, width } of screens) {
      for (const count of [8, 13, 19, 26]) {
        it(`tire cette carte où que soit l'appui sur elle, à ${count} cartes en ${name}`, () => {
          const ids = Array.from({ length: count }, (_, i) => `c${i}`)
          const slots = fanLayout(count, width)
          const context = ctx({ cardIds: ids, slots, lineY: -100 })
          ids.forEach((cardId, index) => {
            const shown = emphasisLayout(slots, index, box, bounds)[index]
            if (shown === undefined) throw new Error('position absente')
            const half = (box.width * shown.scale) / 2 - 1
            for (const offset of [-half, 0, half]) {
              const x = shown.x + box.width / 2 + offset
              const press: GestureEvent = { type: 'down', pointerId: P, x, y: -50, cardId }
              const { state, effects } = run([press, move(x, -90), move(x, -300), up()], context)
              expect(state).toMatchObject({ phase: 'pending', cardId })
              expect(plays(effects)).toEqual([{ type: 'play', cardId }])
            }
          })
        })
      }
    }

    it('laisse repartir en balayage quand le pointeur s’en éloigne', () => {
      const press: GestureEvent = { type: 'down', pointerId: P, x: centerOf('d'), y: -50, cardId: 'd' }
      expect(gestureCardId(run([press, move(centerOf('h'), -50)]).state)).toBe('h')
    })
  })

  it('ne fait rien sans carte en main', () => {
    expect(run([down(100)], ctx({ cardIds: [], slots: [] })).state).toEqual(IDLE)
  })
})

describe('prise et relâchement', () => {
  it('prend la carte quand elle est tirée vers le haut', () => {
    const { state, effects } = run(TAKE)
    expect(state.phase).toBe('holding')
    expect(effects).toEqual([])
  })

  it('ne change plus de carte une fois prise', () => {
    expect(gestureCardId(run([...TAKE, move(centerOf('a'), BELOW)]).state)).toBe('d')
  })

  it('signale le franchissement de la ligne, dans les deux sens', () => {
    const above = run([...TAKE, move(X, ABOVE)]).state
    expect(above).toMatchObject({ phase: 'holding', aboveLine: true })
    const back = run([...TAKE, move(X, ABOVE), move(X, BELOW)]).state
    expect(back).toMatchObject({ phase: 'holding', aboveLine: false })
  })

  it('joue la carte relâchée au-dessus de la ligne, et attend la réponse à sa position', () => {
    const { state, effects } = run([...TAKE, move(X, ABOVE), up()])
    expect(state).toEqual({ phase: 'pending', cardId: 'd', x: X, y: ABOVE })
    expect(plays(effects)).toEqual([{ type: 'play', cardId: 'd' }])
  })

  it('remet dans la main la carte relâchée sous la ligne, sans rien jouer', () => {
    const { state, effects } = run([...TAKE, move(X, BELOW), up()])
    expect(state).toEqual(IDLE)
    expect(effects).toEqual([{ type: 'select', cardId: 'd' }])
  })

  it('ne joue pas sur un petit coup vers le haut quand la carte est prise au-dessus de la ligne', () => {
    const press = down(X, LINE_Y - 30)
    const { state, effects } = run([press, move(X, LINE_Y - 30 - PULL_THRESHOLD - 1), up()])
    expect(state).toEqual(IDLE)
    expect(plays(effects)).toEqual([])
  })

  it('remonte la ligne quand la carte est prise haut après une diagonale : elle n’est pas encore jouable', () => {
    const atF = centerOf('f')
    const taken = -150 - PULL_THRESHOLD - 1
    const { state, effects } = run([down(centerOf('a')), move(atF, -150), move(atF, taken), up()])
    expect(state).toEqual(IDLE)
    expect(plays(effects)).toEqual([])
    const held = run([down(centerOf('a')), move(atF, -150), move(atF, taken)]).state
    expect(held).toMatchObject({ phase: 'holding', cardId: 'f', aboveLine: false, lineY: taken - 94 })
  })

  it('garde la ligne de l’écran quand la carte est prise assez bas', () => {
    expect(run(TAKE).state).toMatchObject({ lineY: LINE_Y })
  })

  it('fixe la ligne à la prise, et le franchissement a lieu exactement à cette ligne', () => {
    const y = LINE_Y - 30 - PULL_THRESHOLD - 1
    const press = down(X, LINE_Y - 30)
    const taken = run([press, move(X, y)]).state
    expect(taken).toMatchObject({ phase: 'holding', lineY: y - 94, aboveLine: false })
    const moved = run([press, move(X, y), move(X, y - 69)]).state
    expect(moved).toMatchObject({ lineY: y - 94, aboveLine: false })
    const crossed = run([press, move(X, y), move(X, y - 71), up()])
    expect(plays(crossed.effects)).toEqual([{ type: 'play', cardId: 'd' }])
  })

  it('ne joue pas si le pointeur est revenu sous la ligne avant de relâcher', () => {
    expect(plays(run([...TAKE, move(X, ABOVE), move(X, BELOW), up()]).effects)).toEqual([])
  })
})

describe('carte refusée', () => {
  const refused = ctx({ canPlay: () => false })

  it('ne passe pas en prise, résiste et demande un message', () => {
    const { state, effects } = run(TAKE, refused)
    expect(state).toMatchObject({ phase: 'scrubbing', cardId: 'd', refused: true })
    expect(effects).toEqual([{ type: 'refuse', cardId: 'd' }])
  })

  it('ne répète pas le message tant que la carte ne change pas', () => {
    const { effects } = run([...TAKE, move(X, 40 - PULL_THRESHOLD - 20), move(X, 40 - PULL_THRESHOLD - 40)], refused)
    expect(refusals(effects)).toHaveLength(1)
  })

  it('redonne le message sur une autre carte tirée à son tour', () => {
    const atF = centerOf('f')
    const { effects } = run([...TAKE, move(atF, 40), move(atF, 40 - PULL_THRESHOLD - 1)], refused)
    expect(refusals(effects)).toEqual([
      { type: 'refuse', cardId: 'd' },
      { type: 'refuse', cardId: 'f' },
    ])
  })

  it('reste lisible : le balayage sur une carte grisée la met en emphase', () => {
    expect(gestureCardId(run([down(X)], refused).state)).toBe('d')
  })

  it('n’empêche pas de prendre une carte jouable juste après', () => {
    const atF = centerOf('f')
    const onlyF = ctx({ canPlay: (id) => id === 'f' })
    const { state } = run([...TAKE, move(atF, 40), move(atF, 40 - PULL_THRESHOLD - 1)], onlyF)
    expect(state.phase).toBe('holding')
    expect(gestureCardId(state)).toBe('f')
  })
})

describe('attente de la réponse', () => {
  const played = run([...TAKE, move(X, ABOVE), up()]).state

  it('se termine quand la carte quitte la main (coup confirmé)', () => {
    const left = ctx({ cardIds: IDS.filter((id) => id !== 'd'), slots: SLOTS.slice(1) })
    const { state, effects } = run([{ type: 'handChanged' }], left, played)
    expect(state).toEqual(IDLE)
    expect(effects).toEqual([])
  })

  it('continue tant que la carte reste dans la main', () => {
    expect(run([{ type: 'handChanged' }], ctx(), played).state).toEqual(played)
  })

  it('se termine sur un refus ou un délai dépassé, sans rejouer', () => {
    const { state, effects } = run([{ type: 'settled' }], ctx(), played)
    expect(state).toEqual(IDLE)
    expect(effects).toEqual([])
  })

  it('ignore les appuis et les déplacements', () => {
    expect(run([down(centerOf('a'), 40, 2), move(0, 0, P), up()], ctx(), played).state).toEqual(played)
  })

  it('ignore une fin d’attente quand rien n’est en attente', () => {
    const holding = run(TAKE).state
    expect(run([{ type: 'settled' }], ctx(), holding).state).toEqual(holding)
  })
})

describe('interruptions', () => {
  it('annule une prise sans rien envoyer (pointercancel)', () => {
    const { state, effects } = run([...TAKE, move(X, ABOVE), { type: 'cancel', pointerId: P }])
    expect(state).toEqual(IDLE)
    expect(effects).toEqual([])
  })

  it('annule un balayage sans poser d’emphase', () => {
    const { state, effects } = run([down(X), { type: 'cancel', pointerId: P }])
    expect(state).toEqual(IDLE)
    expect(effects).toEqual([])
  })

  it('ignore un second pointeur : appui, déplacement, relâchement et annulation', () => {
    const other = 2
    const before = run([...TAKE, move(X, ABOVE)]).state
    const { state, effects } = run(
      [down(centerOf('a'), 40, other), move(centerOf('a'), BELOW, other), up(other), { type: 'cancel', pointerId: other }],
      ctx(),
      before,
    )
    expect(state).toEqual(before)
    expect(effects).toEqual([])
    // Le geste du premier doigt continue normalement.
    expect(plays(run([up()], ctx(), state).effects)).toEqual([{ type: 'play', cardId: 'd' }])
  })

  it('ignore un second pointeur pendant le balayage', () => {
    const before = run([down(X)]).state
    expect(run([move(centerOf('a'), 40, 2), up(2)], ctx(), before).state).toEqual(before)
  })

  it('ne joue pas si `canPlay` devient faux avant le relâchement (pause), et remet la carte', () => {
    const before = run([...TAKE, move(X, ABOVE)]).state
    const { state, effects } = run([up()], ctx({ canPlay: () => false }), before)
    expect(state).toEqual(IDLE)
    expect(plays(effects)).toEqual([])
    expect(refusals(effects)).toEqual([{ type: 'refuse', cardId: 'd' }])
  })

  it('annule la prise si la carte quitte la main', () => {
    const before = run(TAKE).state
    const left = ctx({ cardIds: IDS.filter((id) => id !== 'd'), slots: SLOTS.slice(1) })
    const { state, effects } = run([{ type: 'handChanged' }], left, before)
    expect(state).toEqual(IDLE)
    expect(effects).toEqual([])
  })

  it('garde la prise si la main change sans perdre la carte', () => {
    const before = run(TAKE).state
    expect(run([{ type: 'handChanged' }], ctx(), before).state).toEqual(before)
  })
})

describe('gestureViewKey', () => {
  it('ne change pas quand seule la position de la carte tenue change', () => {
    const a = run([...TAKE, move(X, BELOW)]).state
    const b = run([...TAKE, move(X + 5, BELOW - 5)]).state
    expect(gestureViewKey(a)).toBe(gestureViewKey(b))
  })

  it('change au franchissement de la ligne, à la résistance et au changement de carte', () => {
    const below = run([...TAKE, move(X, BELOW)]).state
    const above = run([...TAKE, move(X, ABOVE)]).state
    expect(gestureViewKey(below)).not.toBe(gestureViewKey(above))
    const free = run([down(X)]).state
    const blocked = run(TAKE, ctx({ canPlay: () => false })).state
    expect(gestureViewKey(free)).not.toBe(gestureViewKey(blocked))
    expect(gestureViewKey(free)).not.toBe(gestureViewKey(run([down(centerOf('a'))]).state))
  })
})
