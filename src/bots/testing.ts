// Outil de test : joue une partie complète où chaque place est tenue par un bot.
import { applyAction, createGame, createRng, getBotView } from '../engine'
import type { GameState } from '../engine'
import { botAction } from './driver'
import type { Bot } from './types'

/**
 * Joue une partie jusqu'à la fin. `bots[seat]` joue la place `seat`.
 * Lève une erreur si le moteur refuse une action ou si plus personne ne peut agir.
 */
export function playBotGame(
  bots: readonly Bot[],
  gameSeed: number,
  botSeed: number,
  onState?: (state: GameState) => void,
): GameState {
  const rng = createRng(botSeed)
  let state = createGame(bots.length, gameSeed)
  onState?.(state)
  while (state.phase !== 'gameEnd') {
    if (state.phase === 'roundEnd') {
      const r = applyAction(state, { type: 'nextRound' })
      if (!r.ok) throw new Error(`nextRound refusé (${r.error})`)
      state = r.state
      onState?.(state)
      continue
    }
    let acted = false
    for (let seat = 0; seat < bots.length; seat++) {
      const bot = bots[seat]
      if (bot === undefined) continue
      const action = botAction(bot, getBotView(state, seat), rng)
      if (action === null) continue
      const r = applyAction(state, action)
      if (!r.ok) throw new Error(`Action refusée (${r.error}) : ${JSON.stringify(action)}`)
      state = r.state
      acted = true
      onState?.(state)
    }
    if (!acted) throw new Error(`Blocage en phase ${state.phase}`)
  }
  return state
}
