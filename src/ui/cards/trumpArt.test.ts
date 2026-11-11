import { describe, expect, it } from 'vitest'
import { EXCUSE, suitCard, trumpCard } from '../../engine'
import { TRUMP_ART, trumpArt, trumpArtImages, type TrumpArtTable } from './trumpArt'

const table: TrumpArtTable = {
  16: { title: 'La tour', image: '/assets/trump-16.webp' },
  3: { title: 'Le partage', image: '/assets/trump-03.webp' },
  7: { title: 'Sans image', image: '' },
}

describe('trumpArt', () => {
  it("renvoie l'habillage d'un atout illustré", () => {
    expect(trumpArt(trumpCard(16), table)).toEqual({ title: 'La tour', image: '/assets/trump-16.webp' })
  })

  it('renvoie null pour un atout absent de la table', () => {
    expect(trumpArt(trumpCard(5), table)).toBeNull()
  })

  it("renvoie null pour un atout sans image : il faut à la fois un titre et une image", () => {
    expect(trumpArt(trumpCard(7), table)).toBeNull()
  })

  it("renvoie null pour l'excuse", () => {
    expect(trumpArt(EXCUSE, table)).toBeNull()
  })

  it('renvoie null pour une carte de couleur', () => {
    expect(trumpArt(suitCard('spades', 13), table)).toBeNull()
  })
})

describe('trumpArtImages', () => {
  it('liste les images à précharger, sans les entrées incomplètes', () => {
    const withEmptyTitle: TrumpArtTable = { ...table, 9: { title: '', image: '/assets/trump-09.webp' } }
    expect(trumpArtImages(withEmptyTitle).sort()).toEqual(['/assets/trump-03.webp', '/assets/trump-16.webp'])
  })
})

describe('trumpArt avec un titre vide', () => {
  it("renvoie null : un atout sans titre n'est pas illustré", () => {
    expect(trumpArt(trumpCard(9), { 9: { title: '', image: '/assets/trump-09.webp' } })).toBeNull()
  })
})

describe('TRUMP_ART (table réelle)', () => {
  it("n'a que des atouts de 1 à 21, chacun avec un titre et une image", () => {
    for (const [key, art] of Object.entries(TRUMP_ART)) {
      const value = Number(key)
      expect(Number.isInteger(value) && value >= 1 && value <= 21).toBe(true)
      expect(art?.title).not.toBe('')
      expect(art?.image).not.toBe('')
    }
  })
})
