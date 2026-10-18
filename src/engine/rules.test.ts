import { describe, expect, it } from 'vitest'
import { applyAction } from './game'
import { legalPlays, legalPlaysFromView, trickWinner } from './rules'
import { createGame } from './game'
import { c, playingState, simulateGame } from './testing'
import { getPlayerView } from './view'
import type { Card, GameState, Play } from './types'

const ids = (cards: Card[]): string[] => cards.map((x) => x.id).sort()
const codes = (list: string[]): string[] => list.map((x) => c(x).id).sort()

function plays(list: [number, string][]): Play[] {
  return list.map(([seat, code]) => ({ seat, card: c(code) }))
}

function play(state: GameState, seat: number, code: string): GameState {
  const r = applyAction(state, { type: 'playCard', seat, cardId: c(code).id })
  if (!r.ok) throw new Error(`refusé : ${r.error}`)
  return r.state
}

describe('entame', () => {
  it('toute carte peut entamer, atout compris, sauf l\'excuse', () => {
    const s = playingState({ playerCount: 3, hands: [['H3', 'T5', 'X'], ['H4'], ['H5']] })
    expect(ids(legalPlays(s, 0))).toEqual(codes(['H3', 'T5']))
  })

  it('l\'excuse est refusée en entame quand le joueur a d\'autres cartes', () => {
    const s = playingState({ playerCount: 3, hands: [['H3', 'X'], ['H4'], ['H5']] })
    const r = applyAction(s, { type: 'playCard', seat: 0, cardId: 'excuse' })
    expect(r).toEqual({ ok: false, error: 'illegalPlay' })
  })

  it('un atout peut entamer et devient la couleur demandée', () => {
    const s = playingState({
      playerCount: 3,
      hands: [['T5', 'H3'], ['H4', 'T2'], ['H5', 'T9']],
    })
    const s2 = play(s, 0, 'T5')
    // Le joueur 1 a un atout : il doit en jouer un.
    expect(ids(legalPlays(s2, 1))).toEqual(codes(['T2']))
  })

  it('un joueur hors de son tour n\'a aucun coup légal', () => {
    const s = playingState({ playerCount: 3, hands: [['H3'], ['H4'], ['H5']] })
    expect(legalPlays(s, 1)).toEqual([])
    expect(applyAction(s, { type: 'playCard', seat: 1, cardId: 'hearts-4' })).toEqual({
      ok: false,
      error: 'notYourTurn',
    })
  })
})

describe('obligations pour suivre', () => {
  const trick = [{ seat: 0, card: 'S10' }]

  it('obligation de fournir : ni excuse ni atout si on a la couleur', () => {
    const s = playingState({
      playerCount: 3,
      hands: [['S10'], ['S3', 'H2', 'T4', 'X'], ['H1']],
      trick,
      trickLeader: 0,
    })
    expect(ids(legalPlays(s, 1))).toEqual(codes(['S3']))
  })

  it('obligation de couper : atouts et excuse jouables si plus de la couleur', () => {
    const s = playingState({
      playerCount: 3,
      hands: [['S10'], ['H2', 'T4', 'X'], ['H1']],
      trick,
    })
    expect(ids(legalPlays(s, 1))).toEqual(codes(['T4', 'X']))
  })

  it('défausse libre sans la couleur ni atout', () => {
    const s = playingState({ playerCount: 3, hands: [['S10'], ['H2', 'D3', 'C9'], ['H1']], trick })
    expect(ids(legalPlays(s, 1))).toEqual(codes(['H2', 'D3', 'C9']))
  })

  it('atout demandé : atouts et excuse obligatoires', () => {
    const s = playingState({
      playerCount: 3,
      hands: [['T9'], ['H2', 'T4', 'X'], ['H1']],
      trick: [{ seat: 0, card: 'T9' }],
    })
    expect(ids(legalPlays(s, 1))).toEqual(codes(['T4', 'X']))
  })

  it('atout demandé sans atout : n\'importe quelle carte', () => {
    const s = playingState({
      playerCount: 3,
      hands: [['T9'], ['H2', 'D3'], ['H1']],
      trick: [{ seat: 0, card: 'T9' }],
    })
    expect(ids(legalPlays(s, 1))).toEqual(codes(['H2', 'D3']))
  })

  it('excuse seul atout en main, atout demandé : obligation de la jouer', () => {
    const s = playingState({
      playerCount: 3,
      hands: [['T9'], ['H2', 'D3', 'X'], ['H1']],
      trick: [{ seat: 0, card: 'T9' }],
    })
    expect(ids(legalPlays(s, 1))).toEqual(['excuse'])
  })

  it('excuse seul atout en main, plus de la couleur demandée : obligation de la jouer', () => {
    const s = playingState({ playerCount: 3, hands: [['S10'], ['H2', 'X'], ['H1']], trick })
    expect(ids(legalPlays(s, 1))).toEqual(['excuse'])
  })

  it('pas d\'obligation de surcouper', () => {
    const s = playingState({
      playerCount: 3,
      hands: [['S10'], ['T20'], ['T2', 'T15']],
      trick: [
        { seat: 0, card: 'S10' },
        { seat: 1, card: 'T20' },
      ],
      trickLeader: 0,
    })
    expect(ids(legalPlays(s, 2))).toEqual(codes(['T2', 'T15']))
    // Jouer l'atout faible est accepté.
    const after = play(s, 2, 'T2')
    expect(after.lastTrick?.plays).toHaveLength(3)
    expect(after.lastTrick?.winner).toBe(1)
  })

  it('un atout sous-coupe est accepté même quand on pourrait surcouper (atout demandé)', () => {
    const s = playingState({
      playerCount: 3,
      hands: [['T9'], ['T20'], ['T3', 'T15']],
      trick: [
        { seat: 0, card: 'T9' },
        { seat: 1, card: 'T20' },
      ],
    })
    expect(ids(legalPlays(s, 2))).toEqual(codes(['T3', 'T15']))
  })
})

describe('gagnant d\'un pli', () => {
  it('exemple 1 : sans atout, la plus haute carte de la couleur demandée gagne', () => {
    expect(trickWinner(plays([[0, 'S14'], [1, 'S3'], [2, 'S13'], [3, 'S10']]))).toBe(0)
  })

  it('les cartes d\'une autre couleur ne gagnent jamais', () => {
    expect(trickWinner(plays([[0, 'S2'], [1, 'H14'], [2, 'D14'], [3, 'S3']]))).toBe(3)
  })

  it('exemple 2 : la coupe l\'emporte sur un roi de la couleur demandée', () => {
    expect(trickWinner(plays([[0, 'H7'], [1, 'H2'], [2, 'T8'], [3, 'H14']]))).toBe(2)
  })

  it('exemple 3 : l\'excuse perd contre n\'importe quel atout, même le 1', () => {
    expect(trickWinner(plays([[0, 'C5'], [1, 'T14'], [2, 'X'], [3, 'C9']]))).toBe(1)
    expect(trickWinner(plays([[0, 'C5'], [1, 'T1'], [2, 'X'], [3, 'C9']]))).toBe(1)
  })

  it('exemple 4 : excuse seul atout du pli (sans entamer) : son joueur gagne', () => {
    expect(trickWinner(plays([[0, 'C5'], [1, 'C2'], [2, 'X'], [3, 'C9']]))).toBe(2)
  })

  it('atout demandé : le plus fort atout gagne', () => {
    expect(trickWinner(plays([[0, 'T9'], [1, 'T20'], [2, 'T3']]))).toBe(1)
  })

  it('le plus fort atout gagne quel que soit l\'ordre de jeu', () => {
    expect(trickWinner(plays([[2, 'S1'], [0, 'T21'], [1, 'T4']]))).toBe(0)
  })
})

describe('excuse : cas limites du dernier pli', () => {
  it('entame forcée : seule carte restante, l\'excuse est jouable en entame', () => {
    const s = playingState({ playerCount: 4, hands: [['X'], ['T21'], ['H14'], ['T20']] })
    expect(ids(legalPlays(s, 0))).toEqual(['excuse'])
  })

  it('excuse en entame au dernier pli : victoire automatique malgré les gros atouts', () => {
    let s = playingState({ playerCount: 4, hands: [['X'], ['T21'], ['T20'], ['T19']], papayouSuit: 'hearts' })
    s = play(s, 0, 'X')
    // Sans couleur demandée, les autres peuvent jouer leur unique carte.
    expect(ids(legalPlays(s, 1))).toEqual(['trump-21'])
    s = play(s, 1, 'T21')
    s = play(s, 2, 'T20')
    s = play(s, 3, 'T19')
    expect(s.lastTrick?.winner).toBe(0)
    // 100 + 30 + 20 + 19 pour le joueur 0.
    expect(s.roundScores[0]?.[0]).toBe(169)
  })

  it('excuse jouée au dernier pli sans entamer : perd contre un autre atout', () => {
    let s = playingState({ playerCount: 3, hands: [['T3'], ['X'], ['S2']] })
    s = play(s, 0, 'T3')
    s = play(s, 1, 'X')
    s = play(s, 2, 'S2')
    expect(s.lastTrick?.winner).toBe(0)
    expect(s.roundScores[0]?.[0]).toBe(103)
  })

  it('excuse jouée au dernier pli sans entamer et seul atout : elle gagne et garde ses 100 points', () => {
    let s = playingState({ playerCount: 3, hands: [['S9'], ['X'], ['S2']] })
    s = play(s, 0, 'S9')
    s = play(s, 1, 'X')
    s = play(s, 2, 'S2')
    expect(s.lastTrick?.winner).toBe(1)
    expect(s.roundScores[0]?.[1]).toBe(100)
  })

  it('excuse seul atout du pli hors dernier pli : son joueur gagne et entame le pli suivant', () => {
    let s = playingState({
      playerCount: 3,
      hands: [['C5', 'H2'], ['X', 'H3'], ['C9', 'H4']],
    })
    s = play(s, 0, 'C5')
    s = play(s, 1, 'X')
    s = play(s, 2, 'C9')
    expect(s.lastTrick?.winner).toBe(1)
    expect(s.trickLeader).toBe(1)
    expect(s.won[1]?.map((x) => x.id)).toContain('excuse')
  })
})

describe('coups légaux depuis une vue', () => {
  it('donne les mêmes cartes que legalPlays à chaque étape de parties simulées (3 à 6 joueurs)', () => {
    for (const playerCount of [3, 4, 5, 6]) {
      for (const seed of [1, 2, 3]) {
        simulateGame(playerCount, seed, (state) => {
          for (let seat = 0; seat < playerCount; seat++) {
            const fromView = legalPlaysFromView(getPlayerView(state, seat))
            expect(ids(fromView)).toEqual(ids(legalPlays(state, seat)))
          }
        })
      }
    }
  })

  it("renvoie une liste vide quand ce n'est pas le tour du joueur", () => {
    const s = playingState({ playerCount: 3, hands: [['H3'], ['H4'], ['H5']] })
    expect(legalPlaysFromView(getPlayerView(s, 1))).toEqual([])
  })

  it('renvoie une liste vide hors de la phase de jeu', () => {
    const s = simulateGame(3, 1, () => {})
    expect(s.phase).toBe('gameEnd')
    expect(legalPlaysFromView(getPlayerView(s, 0))).toEqual([])
  })

  it("renvoie une liste vide pendant l'échange et le choix du papayou", () => {
    const s = createGame(3, 1)
    expect(s.phase).toBe('exchange')
    expect(legalPlaysFromView(getPlayerView(s, 0))).toEqual([])
    expect(legalPlaysFromView(getPlayerView({ ...s, phase: 'choosePapayou' }, 0))).toEqual([])
  })

  it('applique les obligations de suivre depuis la vue', () => {
    const s = playingState({
      playerCount: 3,
      hands: [['H3'], ['H4', 'D2', 'T5'], ['H5']],
      trick: [{ seat: 0, card: 'H3' }],
      trickLeader: 0,
    })
    expect(ids(legalPlaysFromView(getPlayerView(s, 1)))).toEqual(codes(['H4']))
  })
})
