import { describe, expect, it } from 'vitest'
import {
  EXCUSE,
  SUITS,
  cardPoints,
  compareCards,
  createDeck,
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
    expect(cardPoints(EXCUSE, null)).toBe(100)
    expect(cardPoints(trumpCard(21), null)).toBe(30)
    for (let v = 1; v <= 20; v++) expect(cardPoints(trumpCard(v), null)).toBe(v)
  })

  it('le papayou (7 de la couleur choisie) vaut 50, les autres cartes de couleur 0', () => {
    expect(cardPoints(suitCard('hearts', 7), 'hearts')).toBe(50)
    expect(cardPoints(suitCard('hearts', 7), 'spades')).toBe(0)
    expect(cardPoints(suitCard('hearts', 7), null)).toBe(0)
    expect(cardPoints(suitCard('hearts', 14), 'hearts')).toBe(0)
  })

  it('le paquet complet vaut 390 points quelle que soit la couleur du papayou', () => {
    for (const suit of SUITS) expect(pilePoints(createDeck(), suit)).toBe(390)
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
