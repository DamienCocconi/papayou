import { describe, expect, it } from 'vitest'
import { handSize, legalPlaysFromView } from '../../engine'
import type { Action } from '../../engine'
import { createLocalGame, HUMAN_SEAT } from './local'
import type { BotKind, Scheduler } from './local'
import type { GameController } from './types'

/** Ordonnanceur manuel : on décide quand les coups de bots ont lieu, sans attendre de temps réel. */
function manualScheduler() {
  const queue: { fn: () => void; ms: number; cancelled: boolean }[] = []
  const scheduler: Scheduler = (fn, ms) => {
    const entry = { fn, ms, cancelled: false }
    queue.push(entry)
    return () => {
      entry.cancelled = true
    }
  }
  /** Exécute le prochain coup en attente ; faux s'il n'y en a pas. */
  function step(): boolean {
    while (queue.length > 0) {
      const entry = queue.shift()
      if (entry !== undefined && !entry.cancelled) {
        entry.fn()
        return true
      }
    }
    return false
  }
  function flush(): void {
    let guard = 0
    while (step()) if (++guard > 100_000) throw new Error('Boucle infinie')
  }
  return {
    scheduler,
    step,
    flush,
    pending: () => queue.filter((e) => !e.cancelled),
  }
}

function newGame(playerCount: number, botKind: BotKind = 'random', seed = 7) {
  const s = manualScheduler()
  const game = createLocalGame({ playerCount, botKind, seed, scheduler: s.scheduler })
  return { game, ...s }
}

/** Fait agir l'humain si le moteur l'attend ; renvoie faux s'il n'a rien à faire. */
function humanActs(game: GameController): boolean {
  const { view, legalPlays } = game.getSnapshot()
  let action: Action | null = null
  if (view.phase === 'exchange' && view.myGift === null) {
    action = { type: 'giveCards', seat: HUMAN_SEAT, cardIds: view.hand.slice(0, 3).map((c) => c.id) }
  } else if (view.phase === 'choosePapayou' && view.roundLeader === HUMAN_SEAT) {
    action = { type: 'choosePapayou', seat: HUMAN_SEAT, suit: 'hearts' }
  } else if (view.phase === 'playing' && legalPlays[0] !== undefined) {
    action = { type: 'playCard', seat: HUMAN_SEAT, cardId: legalPlays[0].id }
  } else if (view.phase === 'roundEnd') {
    action = { type: 'nextRound' }
  }
  if (action === null) return false
  expect(game.dispatch(action)).toEqual({ ok: true })
  return true
}

/** Joue une partie entière : l'humain agit dès que possible, les bots jouent quand on les laisse faire. */
function playToEnd(game: GameController, flush: () => void, step: () => boolean): void {
  let guard = 0
  while (game.getSnapshot().view.phase !== 'gameEnd') {
    if (++guard > 100_000) throw new Error('Partie sans fin')
    if (humanActs(game)) continue
    if (step()) continue
    flush()
    if (!humanActs(game)) throw new Error(`Blocage en phase ${game.getSnapshot().view.phase}`)
  }
}

describe('création', () => {
  it.each([3, 4, 5, 6])('démarre en phase d\'échange à %i joueurs', (n) => {
    const { game } = newGame(n)
    const { view } = game.getSnapshot()
    expect(view.phase).toBe('exchange')
    expect(view.playerCount).toBe(n)
    expect(view.seat).toBe(HUMAN_SEAT)
    expect(view.hand).toHaveLength(handSize(n))
  })

  it('refuse 2 et 7 joueurs', () => {
    expect(() => createLocalGame({ playerCount: 2, botKind: 'random', seed: 1 })).toThrow(RangeError)
    expect(() => createLocalGame({ playerCount: 7, botKind: 'random', seed: 1 })).toThrow(RangeError)
  })

  it('renvoie la même référence tant que rien ne change', () => {
    const { game } = newGame(4)
    expect(game.getSnapshot()).toBe(game.getSnapshot())
  })

  it('ne fournit que la main de l\'humain', () => {
    const { game } = newGame(4)
    const json = JSON.stringify(game.getSnapshot())
    expect(json).not.toContain('rngState')
    expect(json).not.toContain('"hands"')
    expect(game.getSnapshot().view.handSizes).toEqual([19, 19, 19, 19])
  })
})

describe('abonnement', () => {
  it('prévient à chaque coup de bot et plus après désabonnement', () => {
    const { game, step } = newGame(3)
    let calls = 0
    const unsubscribe = game.subscribe(() => calls++)
    const before = game.getSnapshot()
    expect(step()).toBe(true) // un bot donne ses cartes
    expect(calls).toBe(1)
    expect(game.getSnapshot()).not.toBe(before)
    unsubscribe()
    step()
    expect(calls).toBe(1)
  })
})

describe('bots', () => {
  it('jouent seuls l\'échange, puis attendent l\'humain', () => {
    const { game, flush } = newGame(4)
    flush()
    // Les bots ont donné, l'humain pas encore : l'échange n'est pas fini.
    expect(game.getSnapshot().view.phase).toBe('exchange')
    expect(game.getSnapshot().view.hasGiven).toEqual([false, true, true, true])
    humanActs(game)
    expect(game.getSnapshot().view.phase).not.toBe('exchange')
  })

  it('ne jouent jamais à la place de l\'humain', () => {
    const { game, flush } = newGame(4)
    flush()
    expect(game.getSnapshot().view.myGift).toBeNull()
    expect(game.getSnapshot().botsPending).toBe(false)
  })

  it('un bot entameur choisit le papayou et entame', () => {
    const { game, flush } = newGame(4)
    flush()
    humanActs(game) // don de l'humain : la place 0 est entameur de la manche 0
    expect(game.getSnapshot().view.phase).toBe('choosePapayou')
    humanActs(game)
    flush()
    expect(game.getSnapshot().view.phase).toBe('playing')
    expect(game.getSnapshot().view.papayouSuit).toBe('hearts')
  })

  it('espacent leurs coups par le délai demandé, plus long après un pli', () => {
    const s = manualScheduler()
    const game = createLocalGame({
      playerCount: 3,
      botKind: 'random',
      seed: 3,
      botDelayMs: 10,
      trickPauseMs: 99,
      scheduler: s.scheduler,
    })
    expect(s.pending().map((e) => e.ms)).toEqual([10])
    // Joue jusqu'à la fin de deux plis ; on note les délais programmés juste après chaque fin de pli.
    const delaysAfterTrick: number[] = []
    let guard = 0
    while (game.getSnapshot().view.tricksPlayed < 2) {
      if (++guard > 1000) throw new Error('Pas de pli terminé')
      const tricksBefore = game.getSnapshot().view.tricksPlayed
      if (!humanActs(game)) s.step()
      if (game.getSnapshot().view.tricksPlayed > tricksBefore) {
        delaysAfterTrick.push(...s.pending().map((e) => e.ms))
      }
    }
    expect(delaysAfterTrick).toContain(99)
    expect(s.pending().every((e) => e.ms === 10 || e.ms === 99)).toBe(true)
  })

  it('un délai nul programme les coups sans attente', () => {
    const s = manualScheduler()
    createLocalGame({ playerCount: 3, botKind: 'random', seed: 1, botDelayMs: 0, trickPauseMs: 0, scheduler: s.scheduler })
    expect(s.pending().map((e) => e.ms)).toEqual([0])
  })
})

describe('actions de l\'humain', () => {
  it('refuse une carte illégale sans changer l\'état', () => {
    const { game, flush } = newGame(3)
    flush()
    humanActs(game)
    humanActs(game)
    flush() // l'humain entame la manche 0 : il joue en premier
    const before = game.getSnapshot()
    const result = game.dispatch({ type: 'playCard', seat: HUMAN_SEAT, cardId: 'carte-inconnue' })
    expect(result).toEqual({ ok: false, error: 'cardNotInHand' })
    expect(game.getSnapshot()).toBe(before)
  })

  it('refuse une action hors tour', () => {
    const { game } = newGame(3)
    const before = game.getSnapshot()
    const card = before.view.hand[0]
    const result = game.dispatch({ type: 'playCard', seat: HUMAN_SEAT, cardId: card?.id ?? '' })
    expect(result).toEqual({ ok: false, error: 'wrongPhase' })
    expect(game.getSnapshot()).toBe(before)
  })

  it('impose la place de l\'humain', () => {
    const { game } = newGame(4)
    const ids = game.getSnapshot().view.hand.slice(0, 3).map((c) => c.id)
    // Le seat fourni (2) est ignoré : c'est l'humain (0) qui donne.
    expect(game.dispatch({ type: 'giveCards', seat: 2, cardIds: ids })).toEqual({ ok: true })
    expect(game.getSnapshot().view.myGift).not.toBeNull()
  })

  it('dispose annule les minuteries en attente', () => {
    const { game, pending } = newGame(3)
    expect(pending()).toHaveLength(1)
    game.dispose()
    expect(pending()).toHaveLength(0)
    expect(game.dispatch({ type: 'nextRound' }).ok).toBe(false)
  })
})

describe('phase de jeu', () => {
  /** Amène la partie à 3 joueurs au premier pli, l'humain étant entameur (donc à jouer). */
  function toFirstTrick() {
    const g = newGame(3, 'random', 9)
    g.flush()
    humanActs(g.game) // don
    humanActs(g.game) // papayou
    return g
  }

  it('fournit les coups légaux de l\'humain, et aucun hors de son tour', () => {
    const { game } = toFirstTrick()
    const { view, legalPlays: legal } = game.getSnapshot()
    expect(view.phase).toBe('playing')
    expect(legal.length).toBeGreaterThan(0)
    expect(legal.map((c) => c.id)).toEqual(legalPlaysFromView(view).map((c) => c.id))
    const handIds = new Set(view.hand.map((c) => c.id))
    expect(legal.every((c) => handIds.has(c.id))).toBe(true)
    expect(legal.some((c) => c.kind === 'excuse')).toBe(false) // l'excuse n'entame pas

    humanActs(game) // il joue : ce n'est plus son tour
    expect(game.getSnapshot().legalPlays).toEqual([])
  })

  it('montre la carte posée par un bot dans le pli', () => {
    const { game, step } = toFirstTrick()
    humanActs(game)
    expect(game.getSnapshot().view.trick).toHaveLength(1)
    expect(step()).toBe(true) // le joueur 2 pose sa carte
    const { trick } = game.getSnapshot().view
    expect(trick).toHaveLength(2)
    expect(trick[1]?.seat).toBe(1)
  })

  it('refuse une action hors tour en phase de jeu', () => {
    const { game } = toFirstTrick()
    humanActs(game) // c'est maintenant au tour d'un bot
    const before = game.getSnapshot()
    const card = before.view.hand[0]
    const result = game.dispatch({ type: 'playCard', seat: HUMAN_SEAT, cardId: card?.id ?? '' })
    expect(result).toEqual({ ok: false, error: 'notYourTurn' })
    expect(game.getSnapshot()).toBe(before)
  })
})

describe('partie complète', () => {
  const kinds: BotKind[] = ['random', 'heuristic']
  for (const n of [3, 4, 5, 6]) {
    for (const kind of kinds) {
      it(`va au bout à ${n} joueurs avec des bots ${kind}`, () => {
        const { game, flush, step } = newGame(n, kind, 11 + n)
        let humanHandsSeen = 0
        game.subscribe(() => {
          const snap = game.getSnapshot()
          expect(snap.view.hand.length).toBeLessThanOrEqual(handSize(n))
          humanHandsSeen++
        })
        playToEnd(game, flush, step)
        const { view } = game.getSnapshot()
        expect(view.phase).toBe('gameEnd')
        expect(view.ranking).not.toBeNull()
        expect(view.roundScores).toHaveLength(n)
        for (const scores of view.roundScores) expect(scores.reduce((a, b) => a + b, 0)).toBe(390)
        expect(humanHandsSeen).toBeGreaterThan(0)
      })
    }
  }

  it('est reproductible avec la même graine', () => {
    const run = () => {
      const { game, flush, step } = newGame(4, 'heuristic', 42)
      playToEnd(game, flush, step)
      return game.getSnapshot().view.totals
    }
    expect(run()).toEqual(run())
  })

  it('attend l\'humain entre deux manches', () => {
    const { game, flush, step } = newGame(3, 'random', 5)
    let guard = 0
    while (game.getSnapshot().view.phase !== 'roundEnd') {
      if (++guard > 10_000) throw new Error('Pas de fin de manche')
      if (humanActs(game)) continue
      if (!step()) flush()
    }
    flush()
    expect(game.getSnapshot().view.phase).toBe('roundEnd')
    expect(game.getSnapshot().botsPending).toBe(false)
  })
})
