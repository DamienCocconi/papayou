import { describe, expect, it } from 'vitest'
import { c } from './testing'
import { computeRoundScores, rankPlayers } from './scoring'

describe('classement de compétition', () => {
  it('places 1 à n quand les totaux sont tous différents', () => {
    expect(rankPlayers([30, 10, 20])).toEqual([3, 1, 2])
  })

  it('égalité pour la deuxième place sur 5 joueurs : 1, 2, 2, 4, 5', () => {
    const places = rankPlayers([10, 20, 20, 30, 40])
    expect(places).toEqual([1, 2, 2, 4, 5])
  })

  it('égalité en tête : 1, 1, 3', () => {
    expect(rankPlayers([5, 5, 9])).toEqual([1, 1, 3])
  })

  it('tous à égalité : tous premiers', () => {
    expect(rankPlayers([7, 7, 7, 7])).toEqual([1, 1, 1, 1])
  })
})

describe('décompte', () => {
  it('additionne les points des tas, papayou (le 7) compris à 3 joueurs', () => {
    const scores = computeRoundScores(
      [[c('X'), c('H7')], [c('T21'), c('S7')], [c('T5'), c('H10')]],
      'hearts',
      3,
    )
    expect(scores).toEqual([150, 30, 5])
  })

  it('additionne les points des tas, papayou (le 10) compris à 4 joueurs', () => {
    const scores = computeRoundScores(
      [[c('X'), c('H7')], [c('T21'), c('S10')], [c('T5'), c('H10')], []],
      'hearts',
      4,
    )
    expect(scores).toEqual([100, 30, 55, 0])
  })
})
