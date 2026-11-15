import { describe, expect, it } from 'vitest'
import { EXCUSE, suitCard, trumpCard } from '../../engine'
import { isPapayouCard } from './papayouContext'

describe('reconnaissance de la carte papayou', () => {
  it("hors de l'écran de jeu, aucune carte n'est le papayou", () => {
    expect(isPapayouCard(suitCard('hearts', 10), null)).toBe(false)
  })

  it("tant que la couleur n'est pas choisie, aucune carte n'est le papayou", () => {
    expect(isPapayouCard(suitCard('hearts', 10), { papayouSuit: null, playerCount: 4 })).toBe(false)
    expect(isPapayouCard(suitCard('hearts', 7), { papayouSuit: null, playerCount: 3 })).toBe(false)
  })

  it('à 4 joueurs, le 10 de la couleur choisie est reconnu, pas le 7 ni le 10 des autres couleurs', () => {
    const info = { papayouSuit: 'hearts' as const, playerCount: 4 }
    expect(isPapayouCard(suitCard('hearts', 10), info)).toBe(true)
    expect(isPapayouCard(suitCard('hearts', 7), info)).toBe(false)
    expect(isPapayouCard(suitCard('spades', 10), info)).toBe(false)
    expect(isPapayouCard(trumpCard(10), info)).toBe(false)
    expect(isPapayouCard(EXCUSE, info)).toBe(false)
  })

  it('à 3 joueurs, le 7 de la couleur choisie est reconnu', () => {
    const info = { papayouSuit: 'clubs' as const, playerCount: 3 }
    expect(isPapayouCard(suitCard('clubs', 7), info)).toBe(true)
    expect(isPapayouCard(suitCard('clubs', 10), info)).toBe(false)
  })
})
