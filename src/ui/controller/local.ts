// Partie locale : l'état complet vit ici, l'humain occupe la place 0, des bots tiennent les autres.
import { applyAction, createGame, createRng, getBotView, getPlayerView, legalPlaysFromView } from '../../engine'
import type { Action, GameState } from '../../engine'
import { botAction, createHeuristicBot, createRandomBot } from '../../bots'
import type { Bot } from '../../bots'
import type { ControllerSnapshot, DispatchResult, GameController } from './types'

/** Place de l'humain. La manche 0 commence par la place 0 : l'humain est le premier entameur. */
export const HUMAN_SEAT = 0

export type BotKind = 'random' | 'heuristic'

/** Planifie `fn` dans `ms` millisecondes et renvoie la fonction qui l'annule. */
export type Scheduler = (fn: () => void, ms: number) => () => void

export interface LocalGameOptions {
  /** Nombre de joueurs, humain compris (3 à 6). */
  playerCount: number
  botKind: BotKind
  /** Graine de la partie ; celle des bots en est dérivée. */
  seed: number
  /** Délai entre deux coups de bots. */
  botDelayMs?: number
  /** Délai avant le coup suivant d'un bot quand un pli vient de se terminer. */
  trickPauseMs?: number
  scheduler?: Scheduler
}

const defaultScheduler: Scheduler = (fn, ms) => {
  const id = setTimeout(fn, ms)
  return () => clearTimeout(id)
}

function createBot(kind: BotKind): Bot {
  return kind === 'heuristic' ? createHeuristicBot() : createRandomBot()
}

/**
 * Crée une partie locale. Lève une RangeError si le nombre de joueurs n'est pas compris entre 3 et 6.
 */
export function createLocalGame(options: LocalGameOptions): GameController {
  const { playerCount, botKind, seed } = options
  const botDelayMs = options.botDelayMs ?? 600
  const trickPauseMs = options.trickPauseMs ?? 1500
  const scheduler = options.scheduler ?? defaultScheduler

  let state: GameState = createGame(playerCount, seed)
  // Générateur des bots distinct de celui du moteur (caché dans state.rngState).
  const botRng = createRng((seed ^ 0x9e3779b9) >>> 0)
  const bot = createBot(botKind)
  const listeners = new Set<() => void>()
  let cancelPending: (() => void) | null = null
  let disposed = false

  /** Prochaine action de bot attendue par le moteur, dans l'ordre des places. */
  function nextBotMove(): Action | null {
    for (let seat = 0; seat < playerCount; seat++) {
      if (seat === HUMAN_SEAT) continue
      const action = botAction(bot, getBotView(state, seat), botRng)
      if (action !== null) return action
    }
    return null
  }

  /** Vrai si un bot a une action à jouer. Générateur jetable : seul le null / non-null de botAction compte ici. */
  function botsPending(): boolean {
    if (state.phase === 'roundEnd' || state.phase === 'gameEnd') return false
    const probe = createRng(0)
    for (let seat = 0; seat < playerCount; seat++) {
      if (seat === HUMAN_SEAT) continue
      if (botAction(bot, getBotView(state, seat), probe) !== null) return true
    }
    return false
  }

  function buildSnapshot(): ControllerSnapshot {
    const view = getPlayerView(state, HUMAN_SEAT)
    return { view, legalPlays: legalPlaysFromView(view), botsPending: botsPending(), session: null }
  }

  let snapshot = buildSnapshot()

  function commit(next: GameState): void {
    const trickEnded = next.tricksPlayed !== state.tricksPlayed
    state = next
    snapshot = buildSnapshot()
    for (const listener of [...listeners]) listener()
    scheduleBots(trickEnded ? trickPauseMs : botDelayMs)
  }

  function scheduleBots(delay: number): void {
    cancelPending?.()
    cancelPending = null
    if (disposed || !snapshot.botsPending) return
    cancelPending = scheduler(() => {
      cancelPending = null
      const action = nextBotMove()
      if (action === null) return
      const result = applyAction(state, action)
      if (!result.ok) throw new Error(`Action de bot refusée (${result.error}) : ${JSON.stringify(action)}`)
      commit(result.state)
    }, delay)
  }

  scheduleBots(botDelayMs)

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    dispatch(action): DispatchResult {
      // Partie quittée : aucun code d'erreur dédié dans le moteur, on refuse comme hors phase.
      if (disposed) return { ok: false, error: 'wrongPhase' }
      const own: Action = action.type === 'nextRound' ? action : { ...action, seat: HUMAN_SEAT }
      const result = applyAction(state, own)
      if (!result.ok) return { ok: false, error: result.error }
      commit(result.state)
      return { ok: true }
    },
    dispose() {
      disposed = true
      cancelPending?.()
      cancelPending = null
    },
  }
}
