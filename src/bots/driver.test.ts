import { describe, expect, it } from 'vitest'
import { applyAction, createGame, createRng, getBotView, legalPlaysFromView } from '../engine'
import type { GameState } from '../engine'
import { botAction } from './driver'
import { createRandomBot } from './random'

const bot = createRandomBot()

function give(state: GameState, seat: number): GameState {
  const action = botAction(bot, getBotView(state, seat), createRng(seat + 1))
  if (action === null) throw new Error('aucune action')
  const r = applyAction(state, action)
  if (!r.ok) throw new Error(r.error)
  return r.state
}

describe('botAction', () => {
  it("échange : propose le don de 3 cartes tant que le bot n'a pas donné", () => {
    const s = createGame(4, 3)
    const action = botAction(bot, getBotView(s, 1), createRng(1))
    expect(action).toMatchObject({ type: 'giveCards', seat: 1 })
    expect(action?.type === 'giveCards' && action.cardIds).toHaveLength(3)
    const handIds = new Set(getBotView(s, 1).hand.map((x) => x.id))
    if (action?.type === 'giveCards') for (const id of action.cardIds) expect(handIds.has(id)).toBe(true)
  })

  it("échange : ne propose rien quand le bot a déjà donné", () => {
    const s = give(createGame(4, 3), 1)
    expect(botAction(bot, getBotView(s, 1), createRng(1))).toBeNull()
  })

  it("choix du papayou : seul l'entameur agit", () => {
    let s = createGame(4, 3)
    for (let seat = 0; seat < 4; seat++) s = give(s, seat)
    expect(s.phase).toBe('choosePapayou')
    for (let seat = 0; seat < 4; seat++) {
      const action = botAction(bot, getBotView(s, seat), createRng(1))
      if (seat === s.roundLeader) expect(action).toMatchObject({ type: 'choosePapayou', seat })
      else expect(action).toBeNull()
    }
  })

  it("jeu : seul le joueur dont c'est le tour pose une carte", () => {
    let s = createGame(3, 9)
    for (let seat = 0; seat < 3; seat++) s = give(s, seat)
    const r = applyAction(s, { type: 'choosePapayou', seat: s.roundLeader, suit: 'hearts' })
    if (!r.ok) throw new Error(r.error)
    s = r.state
    expect(s.phase).toBe('playing')
    for (let seat = 0; seat < 3; seat++) {
      const action = botAction(bot, getBotView(s, seat), createRng(1))
      if (seat === s.trickLeader) {
        expect(action).toMatchObject({ type: 'playCard', seat })
        const legal = legalPlaysFromView(getBotView(s, seat)).map((x) => x.id)
        expect(action?.type === 'playCard' && legal.includes(action.cardId)).toBe(true)
      }
      else expect(action).toBeNull()
    }
  })

  it('ne propose rien en fin de manche ni de partie', () => {
    const s = createGame(3, 1)
    expect(botAction(bot, getBotView({ ...s, phase: 'roundEnd' }, 0), createRng(1))).toBeNull()
    expect(botAction(bot, getBotView({ ...s, phase: 'gameEnd' }, 0), createRng(1))).toBeNull()
  })
})
