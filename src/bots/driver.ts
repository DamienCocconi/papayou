// Transforme la décision d'un bot en action du moteur, selon la phase et le tour.
import { legalPlaysFromView } from '../engine'
import type { Action, BotView } from '../engine'
import type { Bot, Rng } from './types'

/**
 * Action que le moteur attend de ce bot maintenant, ou null si ce n'est pas à lui d'agir.
 * La logique « quelle phase, à qui le tour » est écrite ici une seule fois pour tous les bots.
 */
export function botAction(bot: Bot, view: BotView, rng: Rng): Action | null {
  const seat = view.seat
  switch (view.phase) {
    case 'exchange':
      if (view.myGift !== null) return null
      return { type: 'giveCards', seat, cardIds: bot.chooseGift(view, rng) }
    case 'choosePapayou':
      if (view.roundLeader !== seat) return null
      return { type: 'choosePapayou', seat, suit: bot.choosePapayou(view, rng) }
    case 'playing':
      if (legalPlaysFromView(view).length === 0) return null
      return { type: 'playCard', seat, cardId: bot.choosePlay(view, rng) }
    default:
      return null
  }
}
