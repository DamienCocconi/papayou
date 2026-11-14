import { describe, expect, it } from 'vitest'
import { EXCUSE, suitCard, trumpCard } from '../engine'
import type { TrumpArtTable } from './cards/trumpArt'
import { cardName } from './labels'

const table: TrumpArtTable = { 16: { title: 'La tour', image: '/assets/trump-16.webp' } }

describe('cardName', () => {
  it("ajoute le titre d'un atout illustré", () => {
    expect(cardName(trumpCard(16), table)).toBe('Atout 16, La tour')
  })

  it("ne nomme un atout non illustré que par son numéro", () => {
    expect(cardName(trumpCard(5), table)).toBe('Atout 5')
  })

  it("ne change ni l'excuse ni les cartes de couleur", () => {
    expect(cardName(EXCUSE, table)).toBe('Excuse')
    expect(cardName(suitCard('spades', 13), table)).toBe('D de pique')
  })
})
