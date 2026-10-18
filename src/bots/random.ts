// Bot aléatoire : 3 cartes au hasard, couleur au hasard, carte légale au hasard.
import { legalPlaysFromView, SUITS } from '../engine'
import type { Bot } from './types'

export function createRandomBot(): Bot {
  return {
    chooseGift(view, rng) {
      const hand = [...view.hand]
      const ids: string[] = []
      for (let k = 0; k < 3; k++) {
        const [card] = hand.splice(rng.nextInt(hand.length), 1)
        if (card !== undefined) ids.push(card.id)
      }
      return ids
    },
    choosePapayou(_view, rng) {
      return SUITS[rng.nextInt(SUITS.length)] ?? 'hearts'
    },
    choosePlay(view, rng) {
      const legal = legalPlaysFromView(view)
      const card = legal[rng.nextInt(legal.length)]
      if (card === undefined) throw new Error('Aucun coup légal')
      return card.id
    },
  }
}
