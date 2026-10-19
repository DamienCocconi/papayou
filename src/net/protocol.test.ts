import { describe, expect, it } from 'vitest'
import { MAX_NAME_LENGTH, cleanPlayerName, parseGuestMessage, parseHostMessage } from './protocol'

describe('parseGuestMessage', () => {
  it('accepte les messages valides', () => {
    expect(parseGuestMessage({ type: 'hello', name: 'Alice' })).toEqual({ type: 'hello', name: 'Alice' })
    expect(parseGuestMessage({ type: 'claim', seat: 2, name: 'Bruno' })).toEqual({ type: 'claim', seat: 2, name: 'Bruno' })
    expect(parseGuestMessage({ type: 'nextRound' })).toEqual({ type: 'nextRound' })
    expect(parseGuestMessage({ type: 'action', action: { type: 'playCard', seat: 1, cardId: 'hearts-7' } })).toEqual({
      type: 'action',
      action: { type: 'playCard', seat: 1, cardId: 'hearts-7' },
    })
    expect(
      parseGuestMessage({ type: 'action', action: { type: 'giveCards', seat: 0, cardIds: ['a', 'b', 'c'] } }),
    ).not.toBeNull()
    expect(parseGuestMessage({ type: 'action', action: { type: 'choosePapayou', seat: 0, suit: 'spades' } })).not.toBeNull()
  })

  it('refuse les champs manquants ou de mauvais type', () => {
    expect(parseGuestMessage(null)).toBeNull()
    expect(parseGuestMessage('hello')).toBeNull()
    expect(parseGuestMessage([])).toBeNull()
    expect(parseGuestMessage({ type: 'hello' })).toBeNull()
    expect(parseGuestMessage({ type: 'hello', name: 42 })).toBeNull()
    expect(parseGuestMessage({ type: 'claim', seat: '1', name: 'A' })).toBeNull()
    expect(parseGuestMessage({ type: 'claim', seat: -1, name: 'A' })).toBeNull()
    expect(parseGuestMessage({ type: 'claim', seat: 1.5, name: 'A' })).toBeNull()
    expect(parseGuestMessage({ type: 'action', action: { type: 'playCard', seat: 1 } })).toBeNull()
    expect(parseGuestMessage({ type: 'action', action: { type: 'giveCards', seat: 1, cardIds: [1] } })).toBeNull()
    expect(parseGuestMessage({ type: 'action', action: { type: 'choosePapayou', seat: 1, suit: 'stars' } })).toBeNull()
    expect(parseGuestMessage({ type: 'inconnu' })).toBeNull()
  })

  it("refuse tout message d'administration envoyé par un invité", () => {
    expect(parseGuestMessage({ type: 'kick', seat: 1 })).toBeNull()
    expect(parseGuestMessage({ type: 'replaceWithBot', seat: 1 })).toBeNull()
    expect(parseGuestMessage({ type: 'start', botCount: 1 })).toBeNull()
  })

  it('refuse nextRound passé comme action de jeu (il a son propre message)', () => {
    expect(parseGuestMessage({ type: 'action', action: { type: 'nextRound', seat: 0 } })).toBeNull()
  })
})

describe('parseHostMessage', () => {
  it('accepte lobby, seats, error et closed', () => {
    expect(parseHostMessage({ type: 'lobby', players: ['A', 'B'], you: null })).toEqual({
      type: 'lobby',
      players: ['A', 'B'],
      you: null,
    })
    expect(parseHostMessage({ type: 'seats', seats: [{ kind: 'bot' }, { kind: 'free', lastName: 'Bruno' }] })).not.toBeNull()
    expect(parseHostMessage({ type: 'error', code: 'paused' })).toEqual({ type: 'error', code: 'paused' })
    expect(parseHostMessage({ type: 'closed', reason: 'kicked' })).toEqual({ type: 'closed', reason: 'kicked' })
  })

  it('refuse les messages mal formés', () => {
    expect(parseHostMessage({ type: 'lobby', players: 'A', you: null })).toBeNull()
    expect(parseHostMessage({ type: 'lobby', players: [], you: 3 })).toBeNull()
    expect(parseHostMessage({ type: 'seats', seats: [{ kind: 'alien' }] })).toBeNull()
    expect(parseHostMessage({ type: 'closed', reason: 'autre' })).toBeNull()
    expect(parseHostMessage({ type: 'state', version: 1, view: {}, session: {} })).toBeNull()
    expect(parseHostMessage({ type: 'inconnu' })).toBeNull()
  })

  it('accepte un message state complet', () => {
    const message = {
      type: 'state',
      version: 3,
      view: { seat: 0, playerCount: 3, phase: 'exchange', hand: [], handSizes: [0, 0, 0] },
      session: {
        seats: [{ kind: 'human', name: 'A', isHost: true }, { kind: 'bot' }, { kind: 'free', lastName: 'C' }],
        paused: true,
        roundEnd: { remainingMs: 1000, waitingFor: 2, iRequested: false },
      },
    }
    expect(parseHostMessage(message)).not.toBeNull()
  })
})

describe('cleanPlayerName', () => {
  it('retire les espaces autour', () => {
    expect(cleanPlayerName('  Alice ')).toBe('Alice')
  })
  it('refuse un nom vide ou trop long', () => {
    expect(cleanPlayerName('   ')).toBeNull()
    expect(cleanPlayerName('x'.repeat(MAX_NAME_LENGTH + 1))).toBeNull()
    expect(cleanPlayerName('x'.repeat(MAX_NAME_LENGTH))).not.toBeNull()
  })
})
