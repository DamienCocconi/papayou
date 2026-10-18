import { describe, expect, it } from 'vitest'
import { applyAction, createGame, createRng, getBotView, legalPlaysFromView } from '../engine'
import type { GameState } from '../engine'
import { createRandomBot } from './random'
import { playBotGame } from './testing'

const bot = createRandomBot()

describe('bot aléatoire', () => {
  it('donne 3 cartes distinctes de sa main', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const s = createGame(4, seed)
      const view = getBotView(s, 2)
      const ids = bot.chooseGift(view, createRng(seed))
      expect(ids).toHaveLength(3)
      expect(new Set(ids).size).toBe(3)
      const handIds = new Set(view.hand.map((c) => c.id))
      for (const id of ids) expect(handIds.has(id)).toBe(true)
    }
  })

  it('joue toujours une carte légale', () => {
    let played = 0
    playBotGame([bot, bot, bot], 5, 6, (state: GameState) => {
      if (state.phase !== 'playing') return
      const seat = (state.trickLeader + state.trick.length) % 3
      const view = getBotView(state, seat)
      const id = bot.choosePlay(view, createRng(played++))
      expect(legalPlaysFromView(view).map((c) => c.id)).toContain(id)
    })
    expect(played).toBeGreaterThan(0)
  })

  it('choisit une couleur valide', () => {
    const s = createGame(3, 1)
    expect(['hearts', 'diamonds', 'clubs', 'spades']).toContain(bot.choosePapayou(getBotView(s, 0), createRng(1)))
  })
})

/** Aucune carte perdue ni dupliquée, à chaque étape d'une manche en cours. */
function checkCards(state: GameState): void {
  const total = 78 - state.removedCards.length
  if (state.phase === 'exchange' || state.phase === 'choosePapayou' || state.phase === 'playing') {
    const ids = [...state.hands.flat(), ...state.won.flat(), ...state.trick.map((p) => p.card)].map((c) => c.id)
    expect(ids).toHaveLength(total)
    expect(new Set(ids).size).toBe(total)
  }
}

describe('parties complètes de bots aléatoires', () => {
  for (const playerCount of [3, 4, 5, 6]) {
    it(`${playerCount} joueurs : aucune action refusée, invariants respectés`, () => {
      const bots = Array.from({ length: playerCount }, () => bot)
      for (let seed = 1; seed <= 25; seed++) {
        const end = playBotGame(bots, seed, seed * 31, checkCards)
        expect(end.phase).toBe('gameEnd')
        expect(end.roundScores).toHaveLength(playerCount)
        for (const row of end.roundScores) expect(row.reduce((a, b) => a + b, 0)).toBe(390)
        expect(end.ranking).not.toBeNull()
      }
    })
  }

  it('deux parties de mêmes graines sont identiques', () => {
    const bots = [bot, bot, bot, bot]
    const a = playBotGame(bots, 7, 8)
    expect(playBotGame(bots, 7, 8)).toEqual(a)
    expect(playBotGame(bots, 7, 9)).not.toEqual(a)
  })
})

describe('décision à partir de la seule vue', () => {
  it('prend la même décision quand seules les mains des autres changent', () => {
    const s = createGame(4, 12)
    const other = createGame(4, 13)
    const altered: GameState = { ...s, hands: s.hands.map((h, i) => (i === 0 ? h : (other.hands[i] ?? h))) }
    const ids1 = bot.chooseGift(getBotView(s, 0), createRng(3))
    expect(bot.chooseGift(getBotView(altered, 0), createRng(3))).toEqual(ids1)
    expect(applyAction(s, { type: 'giveCards', seat: 0, cardIds: ids1 }).ok).toBe(true)
  })
})
