import { describe, expect, it } from 'vitest'
import { add, EMPTY_DRAFT, hasRoom, ids, isComplete, remove, toggle } from './giftDraft'
import type { GiftDraft } from './giftDraft'

const fill = (...cardIds: string[]): GiftDraft => cardIds.reduce(add, EMPTY_DRAFT)

describe('giftDraft', () => {
  it('commence avec 3 places vides', () => {
    expect(EMPTY_DRAFT).toEqual([null, null, null])
    expect(ids(EMPTY_DRAFT)).toEqual([])
    expect(isComplete(EMPTY_DRAFT)).toBe(false)
    expect(hasRoom(EMPTY_DRAFT)).toBe(true)
  })

  it('place une carte dans la première place vide', () => {
    expect(add(EMPTY_DRAFT, 'a')).toEqual(['a', null, null])
    expect(add(['a', null, null], 'b')).toEqual(['a', 'b', null])
  })

  it('ne place pas deux fois la même carte', () => {
    const draft = fill('a')
    expect(add(draft, 'a')).toBe(draft)
  })

  it('est sans effet quand les places sont pleines', () => {
    const draft = fill('a', 'b', 'c')
    expect(add(draft, 'd')).toBe(draft)
    expect(isComplete(draft)).toBe(true)
    expect(hasRoom(draft)).toBe(false)
  })

  it('laisse un trou au retrait, sans déplacer les autres cartes', () => {
    expect(remove(fill('a', 'b', 'c'), 'b')).toEqual(['a', null, 'c'])
  })

  it("est sans effet au retrait d'une carte non placée", () => {
    const draft = fill('a')
    expect(remove(draft, 'z')).toBe(draft)
  })

  it('comble le trou avec la carte suivante', () => {
    expect(add(remove(fill('a', 'b', 'c'), 'b'), 'd')).toEqual(['a', 'd', 'c'])
  })

  it('comble le premier trou quand il y en a plusieurs', () => {
    const draft = remove(remove(fill('a', 'b', 'c'), 'c'), 'a')
    expect(draft).toEqual([null, 'b', null])
    expect(add(draft, 'd')).toEqual(['d', 'b', null])
  })

  it("donne les cartes placées dans l'ordre des places", () => {
    expect(ids([null, 'b', 'a'])).toEqual(['b', 'a'])
    expect(ids(fill('c', 'a', 'b'))).toEqual(['c', 'a', 'b'])
  })

  it('toggle place puis retire une carte', () => {
    const placed = toggle(EMPTY_DRAFT, 'a')
    expect(placed).toEqual(['a', null, null])
    expect(toggle(placed, 'a')).toEqual([null, null, null])
  })

  it('scénario « Aller-retour » : A, B, C restent dans le même ordre', () => {
    // Placement en éventail ; en étalé, le même tableau est lu sans conversion. Un clic sur une carte
    // non placée alors que tout est plein n'y change rien, et l'éventail retrouve le même ordre.
    const fan = fill('A', 'B', 'C')
    const spread = toggle(fan, 'D')
    expect(spread).toBe(fan)
    expect(ids(spread)).toEqual(['A', 'B', 'C'])
  })

  it('scénario « Retrait en étalé » : désélectionner B puis sélectionner D donne A, D, C', () => {
    const fan = fill('A', 'B', 'C')
    const spread = toggle(toggle(fan, 'B'), 'D')
    expect(spread).toEqual(['A', 'D', 'C'])
  })

  it("scénario « De l'étalé vers l'éventail » : l'ordre de sélection donne l'ordre des places", () => {
    expect(toggle(toggle(EMPTY_DRAFT, 'X'), 'Y')).toEqual(['X', 'Y', null])
  })
})
