import { describe, expect, it } from 'vitest'
import {
  EXCUSE,
  SUITS,
  cardPoints,
  compareCards,
  createDeck,
  isPapayou,
  papayouRank,
  pilePoints,
  sortHand,
  suitCard,
  trumpCard,
  trumpStrength,
} from './cards'

describe('paquet', () => {
  const deck = createDeck()

  it('contient 78 cartes distinctes', () => {
    expect(deck).toHaveLength(78)
    expect(new Set(deck.map((c) => c.id)).size).toBe(78)
  })

  it("contient 4x14 cartes de couleur, 21 atouts et l'excuse", () => {
    expect(deck.filter((c) => c.kind === 'suit')).toHaveLength(56)
    for (const suit of SUITS) {
      const ranks = deck.flatMap((c) => (c.kind === 'suit' && c.suit === suit ? [c.rank] : []))
      expect(ranks.sort((a, b) => a - b)).toEqual(Array.from({ length: 14 }, (_, i) => i + 1))
    }
    expect(deck.filter((c) => c.kind === 'trump')).toHaveLength(21)
    expect(deck.filter((c) => c.kind === 'excuse')).toHaveLength(1)
  })

  it('ordre des cartes de couleur : le 1 est la plus faible, le roi la plus forte', () => {
    expect(suitCard('hearts', 1).rank).toBeLessThan(suitCard('hearts', 2).rank)
    expect(suitCard('hearts', 14).rank).toBeGreaterThan(suitCard('hearts', 13).rank)
  })
})

describe('points', () => {
  it('excuse 100, atout 21 à 30, atouts 1-20 faciaux', () => {
    for (const n of [3, 4]) {
      expect(cardPoints(EXCUSE, null, n)).toBe(100)
      expect(cardPoints(trumpCard(21), null, n)).toBe(30)
      for (let v = 1; v <= 20; v++) expect(cardPoints(trumpCard(v), null, n)).toBe(v)
    }
  })

  it('hauteur du papayou : le 7 à 3 joueurs, le 10 à 4, 5 et 6 joueurs', () => {
    expect(papayouRank(3)).toBe(7)
    for (const n of [4, 5, 6]) expect(papayouRank(n)).toBe(10)
  })

  it('à 3 joueurs, le 7 de la couleur choisie vaut 50 et le 10 vaut 0', () => {
    expect(cardPoints(suitCard('hearts', 7), 'hearts', 3)).toBe(50)
    expect(cardPoints(suitCard('hearts', 10), 'hearts', 3)).toBe(0)
  })

  it('à 4, 5 et 6 joueurs, le 10 de la couleur choisie vaut 50 et le 7 vaut 0', () => {
    for (const n of [4, 5, 6]) {
      expect(cardPoints(suitCard('hearts', 10), 'hearts', n)).toBe(50)
      expect(cardPoints(suitCard('hearts', 7), 'hearts', n)).toBe(0)
      expect(cardPoints(suitCard('hearts', 14), 'hearts', n)).toBe(0)
    }
  })

  it('le 7 et le 10 des autres couleurs valent 0', () => {
    for (const n of [3, 4, 5, 6]) {
      for (const rank of [7, 10]) {
        expect(cardPoints(suitCard('hearts', rank), 'spades', n)).toBe(0)
        expect(cardPoints(suitCard('hearts', rank), null, n)).toBe(0)
      }
    }
  })

  it("isPapayou est faux tant que la couleur n'est pas choisie", () => {
    expect(isPapayou(suitCard('hearts', 7), null, 3)).toBe(false)
    expect(isPapayou(suitCard('hearts', 10), null, 4)).toBe(false)
    expect(isPapayou(suitCard('hearts', 7), 'hearts', 3)).toBe(true)
    expect(isPapayou(suitCard('hearts', 10), 'hearts', 4)).toBe(true)
    expect(isPapayou(trumpCard(10), 'hearts', 4)).toBe(false)
  })

  it('les cartes en jeu valent 390 points pour chaque nombre de joueurs et chaque couleur du papayou', () => {
    for (const n of [3, 4, 5, 6]) {
      // À 3 joueurs, les figures sont retirées ; les « 1 » retirés ne valent rien, on les garde ici.
      const inPlay = createDeck().filter((c) => n !== 3 || c.kind !== 'suit' || c.rank <= 10)
      for (const suit of SUITS) expect(pilePoints(inPlay, suit, n)).toBe(390)
    }
  })
})

describe('utilitaires', () => {
  it("force d'atout : excuse 0", () => {
    expect(trumpStrength(EXCUSE)).toBe(0)
    expect(trumpStrength(trumpCard(5))).toBe(5)
    expect(() => trumpStrength(suitCard('clubs', 3))).toThrow()
  })

  it('trie une main sans la modifier', () => {
    const hand = [EXCUSE, trumpCard(3), suitCard('spades', 2), suitCard('hearts', 9)]
    const sorted = sortHand(hand)
    expect(sorted.map((c) => c.id)).toEqual(['hearts-9', 'spades-2', 'trump-3', 'excuse'])
    expect(hand[0]).toBe(EXCUSE)
    expect(compareCards(suitCard('hearts', 1), suitCard('hearts', 2))).toBeLessThan(0)
  })
})
