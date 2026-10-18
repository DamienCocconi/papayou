// Tâche 8.1 : parties complètes simulées avec des coups légaux aléatoires (PRNG à graine).
import { describe, expect, it } from 'vitest'
import { createDeck } from './cards'
import { handSize } from './game'
import { simulateGame } from './testing'
import type { GameState } from './types'

const FULL = createDeck().map((x) => x.id).sort()

function cardsInPlay(state: GameState): string[] {
  return [
    ...state.hands.flat(),
    ...state.won.flat(),
    ...state.trick.map((p) => p.card),
    ...state.removedCards,
  ]
    .map((x) => x.id)
    .sort()
}

describe.each([3, 4, 5, 6])('partie simulée à %i joueurs', (n) => {
  for (const seed of [1, 2, 3, 4, 5]) {
    it(`graine ${seed} : invariants respectés du début à la fin`, () => {
      const rounds: GameState[] = []
      let lastRoundIndex = -1
      const final = simulateGame(n, seed, (state) => {
        // Aucune carte perdue ni dupliquée, à chaque étape.
        expect(cardsInPlay(state)).toEqual(FULL)
        // Les mains, une fois l'échange passé, restent à égalité de taille à chaque début de pli.
        if (state.phase === 'playing' && state.trick.length === 0) {
          for (const hand of state.hands) expect(hand.length).toBe(handSize(n) - state.tricksPlayed)
        }
        if (state.phase === 'roundEnd' || state.phase === 'gameEnd') {
          if (state.roundIndex !== lastRoundIndex) {
            lastRoundIndex = state.roundIndex
            rounds.push(state)
          }
        }
      })

      expect(final.phase).toBe('gameEnd')
      expect(rounds).toHaveLength(n)
      expect(final.roundScores).toHaveLength(n)
      // Somme des points de chaque manche = 390.
      for (const scores of final.roundScores) {
        expect(scores).toHaveLength(n)
        expect(scores.reduce((a, b) => a + b, 0)).toBe(390)
      }
      expect(final.totals.reduce((a, b) => a + b, 0)).toBe(390 * n)
      // Rotation de l'entameur : chaque joueur entame une manche (roundLeader = numéro de manche).
      expect(rounds.map((r) => r.roundLeader)).toEqual(Array.from({ length: n }, (_, i) => i))
      // Mêmes cartes retirées pendant toute la partie.
      for (const r of rounds) expect(r.removedCards).toEqual(final.removedCards)
      // Classement cohérent : la meilleure place est 1, le total minimal est premier.
      expect(final.ranking).not.toBeNull()
      const min = Math.min(...final.totals)
      final.totals.forEach((t, i) => {
        if (t === min) expect(final.ranking?.[i]).toBe(1)
      })
      // Toutes les mains sont vides en fin de partie.
      for (const hand of final.hands) expect(hand).toHaveLength(0)
    })
  }

  it('est déterministe sous graine', () => {
    expect(simulateGame(n, 12)).toEqual(simulateGame(n, 12))
  })
})
