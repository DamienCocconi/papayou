import { describe, expect, it } from 'vitest'
import { applyAction, createGame } from './game'
import { getPlayerView } from './view'
import { simulateGame } from './testing'
import type { Card, GameState } from './types'

/** Tous les identifiants de cartes qui apparaissent dans un objet JSON quelconque. */
function cardIdsIn(value: unknown): Set<string> {
  const found = new Set<string>()
  const text = JSON.stringify(value)
  for (const m of text.matchAll(/"id":"([^"]+)"/g)) found.add(m[1] as string)
  return found
}

describe('vue par joueur', () => {
  it('ne contient que la main du joueur, jamais celles des autres', () => {
    const s = createGame(4, 21)
    for (let seat = 0; seat < 4; seat++) {
      const view = getPlayerView(s, seat)
      expect(view.hand).toEqual(s.hands[seat])
      const seen = cardIdsIn(view)
      for (let other = 0; other < 4; other++) {
        if (other === seat) continue
        for (const card of s.hands[other] as Card[]) expect(seen.has(card.id)).toBe(false)
      }
      expect(view.handSizes).toEqual(s.hands.map((h) => h.length))
    }
  })

  it('n\'expose ni la graine ni l\'état du générateur', () => {
    const s = createGame(3, 5)
    const view = getPlayerView(s, 0) as unknown as Record<string, unknown>
    expect('rngState' in view).toBe(false)
    expect('hands' in view).toBe(false)
    expect('gifts' in view).toBe(false)
  })

  it('pendant l\'échange, ne révèle pas les cartes données par les autres', () => {
    let s: GameState = createGame(4, 21)
    // Les joueurs 1, 2 et 3 donnent leurs 3 premières cartes ; le joueur 0 n'a pas encore choisi.
    for (const seat of [1, 2, 3]) {
      const ids = (s.hands[seat] as Card[]).slice(0, 3).map((x) => x.id)
      const r = applyAction(s, { type: 'giveCards', seat, cardIds: ids })
      if (!r.ok) throw new Error(r.error)
      s = r.state
    }
    const view = getPlayerView(s, 0)
    expect(view.hasGiven).toEqual([false, true, true, true])
    expect(view.myGift).toBeNull()
    // Le joueur 0 recevra les cartes du joueur 3 : elles ne doivent pas apparaître dans sa vue
    // (sauf si elles sont déjà dans sa propre main, ce qui est impossible).
    const seen = cardIdsIn(view)
    for (const seat of [1, 2, 3]) {
      for (const card of (s.gifts[seat] ?? []) as Card[]) expect(seen.has(card.id)).toBe(false)
    }
  })

  it('rend à un joueur ses propres cartes données', () => {
    let s: GameState = createGame(3, 2)
    const ids = (s.hands[1] as Card[]).slice(0, 3).map((x) => x.id)
    const r = applyAction(s, { type: 'giveCards', seat: 1, cardIds: ids })
    if (!r.ok) throw new Error(r.error)
    s = r.state
    expect(getPlayerView(s, 1).myGift?.map((x) => x.id)).toEqual(ids)
  })

  it('reste sans fuite à chaque étape d\'une partie complète', () => {
    simulateGame(5, 77, (state) => {
      for (let seat = 0; seat < state.playerCount; seat++) {
        const view = getPlayerView(state, seat)
        const seen = cardIdsIn(view)
        for (let other = 0; other < state.playerCount; other++) {
          if (other === seat) continue
          const mine = new Set((state.hands[seat] as Card[]).map((x) => x.id))
          for (const card of state.hands[other] as Card[]) {
            // Une carte d'un autre joueur ne peut apparaître que si elle est publique (pli en cours, dernier pli).
            if (mine.has(card.id)) continue
            const publicIds = cardIdsIn([state.trick, state.lastTrick, state.removedCards, view.myGift])
            if (!publicIds.has(card.id)) expect(seen.has(card.id)).toBe(false)
          }
        }
      }
    })
  })

  it('refuse une place invalide', () => {
    expect(() => getPlayerView(createGame(3, 1), 3)).toThrow(RangeError)
  })
})
