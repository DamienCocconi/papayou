import { describe, expect, it } from 'vitest'
import { applyAction } from './game'
import { deserializeState, serializeState } from './serialization'
import { simulateGame } from './testing'
import { legalPlays } from './rules'
import type { Card, GameState } from './types'

describe('sérialisation JSON', () => {
  it('aller-retour identique à chaque étape d\'une partie', () => {
    simulateGame(4, 31, (state) => {
      expect(deserializeState(serializeState(state))).toEqual(state)
    })
  })

  it('la partie peut continuer à l\'identique après reprise', () => {
    let a: GameState | null = null
    simulateGame(3, 9, (state) => {
      if (a === null && state.phase === 'playing') a = state
    })
    const original = a as unknown as GameState
    const restored = deserializeState(serializeState(original))
    const seat = (original.trickLeader + original.trick.length) % original.playerCount
    const card = legalPlays(original, seat)[0] as Card
    const action = { type: 'playCard' as const, seat, cardId: card.id }
    expect(applyAction(restored, action)).toEqual(applyAction(original, action))
  })

  it('refuse un texte qui n\'est pas un état reconnu', () => {
    expect(() => deserializeState('42')).toThrow()
    expect(() => deserializeState('{"version":2}')).toThrow()
    expect(() => deserializeState('pas du json')).toThrow()
  })
})
