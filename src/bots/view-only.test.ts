// Un bot décide à partir de sa seule vue : il ignore les mains adverses et ne garde aucune mémoire.
import { describe, expect, it } from 'vitest'
import { createRng, getBotView } from '../engine'
import type { Card, GameState } from '../engine'
import { botAction } from './driver'
import { createHeuristicBot } from './heuristic'
import { createRandomBot } from './random'
import { playBotGame } from './testing'

const bots = { aléatoire: createRandomBot(), heuristique: createHeuristicBot() }

/** Même état, mais les cartes des autres joueurs (mains et dons) sont redistribuées autrement, tailles inchangées. */
function shuffleOthers(state: GameState, seat: number): GameState {
  const others = state.hands.map((_, i) => i).filter((i) => i !== seat)
  const pool: Card[] = others.flatMap((i) => state.hands[i] ?? []).reverse()
  const hands = state.hands.map((h) => h)
  for (const i of others) hands[i] = pool.splice(0, (state.hands[i] ?? []).length)
  const givers = others.filter((i) => state.gifts[i] !== null)
  const giftPool: Card[] = givers.flatMap((i) => state.gifts[i] ?? []).reverse()
  const gifts = state.gifts.map((g) => g)
  for (const i of givers) gifts[i] = giftPool.splice(0, (state.gifts[i] ?? []).length)
  return { ...state, hands, gifts }
}

describe.each(Object.entries(bots))('bot %s', (_name, bot) => {
  it('prend la même décision quand seules les mains et les dons des autres changent (toutes phases)', () => {
    let compared = 0
    for (const playerCount of [3, 5]) {
      const players = Array.from({ length: playerCount }, () => bot)
      playBotGame(players, 4, 9, (state) => {
        for (let seat = 0; seat < playerCount; seat++) {
          const real = botAction(bot, getBotView(state, seat), createRng(7))
          const altered = botAction(bot, getBotView(shuffleOthers(state, seat), seat), createRng(7))
          expect(altered).toEqual(real)
          if (real !== null) compared++
        }
      })
    }
    expect(compared).toBeGreaterThan(100)
  })

  it("ne garde aucune mémoire : la même vue et la même graine donnent la même décision, quoi qu'il se soit passé entre-temps", () => {
    const players = [bot, bot, bot, bot]
    let compared = 0
    playBotGame(players, 2, 3, (state) => {
      for (let seat = 0; seat < 4; seat++) {
        const view = getBotView(state, seat)
        const first = botAction(bot, view, createRng(5))
        // Décisions intercalées pour d'autres places et d'autres graines.
        for (let other = 0; other < 4; other++) botAction(bot, getBotView(state, other), createRng(99 + other))
        expect(botAction(bot, view, createRng(5))).toEqual(first)
        if (first !== null) compared++
      }
    })
    expect(compared).toBeGreaterThan(100)
  })
})
