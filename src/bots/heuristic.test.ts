import { describe, expect, it } from 'vitest'
import { createGame, createRng, getBotView } from '../engine'
import type { BotView, GameState } from '../engine'
import { c, playingState } from '../engine/testing'
import { createHeuristicBot } from './heuristic'
import { createRandomBot } from './random'
import { playBotGame } from './testing'

const bot = createHeuristicBot()

/** Vue du joueur `seat` dans un pli en cours (papayou : cœur par défaut). */
function viewOf(opts: Parameters<typeof playingState>[0], seat: number, won: string[][] = []): BotView {
  const base = playingState(opts)
  const state: GameState = { ...base, won: base.won.map((_, i) => (won[i] ?? []).map(c)) }
  return getBotView(state, seat)
}

const play = (view: BotView): string => bot.choosePlay(view, createRng(1))

describe('bot heuristique : don et papayou', () => {
  it("donne l'excuse, l'atout 21 et la troisième carte la plus chère", () => {
    const hand = ['X', 'T21', 'T12', 'T3', 'H2', 'D9', 'C4', 'S5'].map(c)
    const view = { ...getBotView(createGame(4, 1), 0), hand }
    expect(new Set(bot.chooseGift(view, createRng(1)))).toEqual(new Set(['excuse', 'trump-21', 'trump-12']))
  })

  it('choisit un papayou dont il ne possède pas le 7', () => {
    const hand = ['H7', 'S7', 'D2', 'C3'].map(c)
    const view = { ...getBotView(createGame(4, 1), 0), hand }
    for (let seed = 1; seed <= 20; seed++) {
      expect(['diamonds', 'clubs']).toContain(bot.choosePapayou(view, createRng(seed)))
    }
  })

  it('choisit une couleur quelconque quand il a les quatre 7', () => {
    const hand = ['H7', 'S7', 'D7', 'C7'].map(c)
    const view = { ...getBotView(createGame(4, 1), 0), hand }
    expect(['hearts', 'diamonds', 'clubs', 'spades']).toContain(bot.choosePapayou(view, createRng(1)))
  })
})

describe('bot heuristique : suite de pli', () => {
  it('se débarrasse de la carte la plus chère parmi celles qui ne gagnent pas', () => {
    // Joueur 0 entame un atout 15 ; le joueur 1 a deux atouts plus faibles : il perd avec les deux et donne le plus cher.
    const view = viewOf(
      { playerCount: 3, hands: [['T15', 'H2'], ['T10', 'T4', 'D5'], ['T20', 'H3']], trick: [{ seat: 0, card: 'T15' }] },
      1,
    )
    expect(play(view)).toBe(c('T10').id)
  })

  it("joue l'excuse quand elle perd et qu'elle est la carte la plus chère à donner", () => {
    // Atout 9 demandé : X (0) et T2 perdent tous les deux ; X vaut 100 points, elle part chez le gagnant.
    const view = viewOf(
      { playerCount: 3, hands: [['T9'], ['X', 'T2'], ['H5']], trick: [{ seat: 0, card: 'T9' }] },
      1,
    )
    expect(play(view)).toBe('excuse')
  })

  it("garde l'excuse quand elle gagnerait le pli et qu'un atout numéroté gagne aussi", () => {
    // Trèfle demandé, plus de trèfle : atout obligatoire. Aucun atout dans le pli, donc X (seul atout) et T3 gagnent tous les deux.
    const view = viewOf(
      { playerCount: 3, hands: [['C9'], ['X', 'T3'], ['C5']], trick: [{ seat: 0, card: 'C9' }] },
      1,
    )
    expect(play(view)).toBe(c('T3').id)
  })

  it("joue l'excuse quand c'est le seul atout en main et qu'un atout est demandé", () => {
    const view = viewOf(
      { playerCount: 3, hands: [['T9'], ['X', 'H2'], ['H5']], trick: [{ seat: 0, card: 'T9' }] },
      1,
    )
    expect(play(view)).toBe('excuse')
  })

  it('joue la plus faible quand toutes ses cartes légales gagnent le pli', () => {
    const view = viewOf(
      { playerCount: 3, hands: [['H3'], ['H12', 'H13', 'H9'], ['H5']], trick: [{ seat: 0, card: 'H3' }] },
      1,
    )
    expect(play(view)).toBe(c('H9').id)
  })

  it("joue l'excuse quand elle est la seule carte légale (entame forcée au dernier pli)", () => {
    const view = viewOf({ playerCount: 3, hands: [['X'], ['H4'], ['H5']] }, 0)
    expect(play(view)).toBe('excuse')
  })
})

describe('bot heuristique : entame', () => {
  it('entame la carte qui a le plus de cartes plus fortes encore chez les autres', () => {
    // H13 a 1 carte plus forte chez les autres (H14), S9 en a 5 (S10 à S14) : S9 a plus de chances de perdre.
    const hands = [['H13', 'S9'], ['D2', 'D3'], ['C2', 'C3']]
    expect(play(viewOf({ playerCount: 3, hands }, 0))).toBe(c('S9').id)
  })

  it("tient compte des cartes déjà jouées : sans carte plus forte restante en pique, il entame le cœur", () => {
    // Toutes les piques plus fortes que S9 sont sorties : S9 gagnerait. H13 a encore le roi de cœur chez les autres.
    const hands = [['H13', 'S9'], ['D2', 'D3'], ['C2', 'C3']]
    const spadesGone = [[], ['S10', 'S11', 'S12', 'S13', 'S14'], []]
    expect(play(viewOf({ playerCount: 3, hands }, 0, spadesGone))).toBe(c('H13').id)
  })

  it("n'entame pas la dame quand le roi est sorti, si une autre couleur a encore des cartes plus fortes en jeu", () => {
    // Roi de cœur joué : la dame gagnerait. Le 5 de carreau a 9 cartes plus fortes chez les autres.
    const hands = [['H13', 'D5'], ['C2', 'C3'], ['S2', 'S3']]
    expect(play(viewOf({ playerCount: 3, hands }, 0, [[], ['H14'], []]))).toBe(c('D5').id)
  })

  it('départage à risque égal par le moins de points', () => {
    // H7 (papayou cœur, 50 points) et S7 : 7 cartes plus fortes chacun chez les autres. Le 7 de pique ne coûte rien.
    const hands = [['H7', 'S7'], ['D2', 'D3'], ['C2', 'C3']]
    expect(play(viewOf({ playerCount: 3, hands }, 0))).toBe(c('S7').id)
  })
})

describe('bot heuristique : parties complètes', () => {
  for (const playerCount of [3, 4, 5, 6]) {
    it(`${playerCount} joueurs : aucune action refusée contre des bots aléatoires`, () => {
      const random = createRandomBot()
      for (let seed = 1; seed <= 25; seed++) {
        const bots = Array.from({ length: playerCount }, (_, i) => (i === seed % playerCount ? bot : random))
        expect(playBotGame(bots, seed, seed * 17).phase).toBe('gameEnd')
      }
    })
  }

  it('est déterministe à graines égales', () => {
    const bots = [bot, bot, bot, bot]
    expect(playBotGame(bots, 3, 4)).toEqual(playBotGame(bots, 3, 4))
  })
})

describe('bot heuristique : force de jeu', () => {
  it('marque en moyenne moins de points que le bot aléatoire, à chaque place', () => {
    const random = createRandomBot()
    const playerCount = 4
    const games = 100
    let heuristicTotal = 0
    let randomTotal = 0
    let heuristicGames = 0
    let randomGames = 0
    for (let seat = 0; seat < playerCount; seat++) {
      for (let seed = 1; seed <= games; seed++) {
        const bots = Array.from({ length: playerCount }, (_, i) => (i === seat ? bot : random))
        const end = playBotGame(bots, seed, seed * 13 + seat)
        end.totals.forEach((points, i) => {
          if (i === seat) {
            heuristicTotal += points
            heuristicGames++
          } else {
            randomTotal += points
            randomGames++
          }
        })
      }
    }
    const heuristicMean = heuristicTotal / heuristicGames
    const randomMean = randomTotal / randomGames
    console.log(`Points moyens par partie : heuristique ${heuristicMean.toFixed(1)}, aléatoire ${randomMean.toFixed(1)}`)
    expect(heuristicMean).toBeLessThan(randomMean)
  })
})
