// Messages échangés entre l'hôte et les invités. Tout est du JSON pur.
// Les invités parlent à l'hôte (hello, claim, action, nextRound) ; l'hôte leur renvoie à chacun
// sa vue entière et versionnée (state), jamais l'état complet ni la main d'un autre joueur.
import { SUITS } from '../engine'
import type { Action, ActionErrorCode, PlayerView, Suit } from '../engine'

export const MAX_NAME_LENGTH = 20

/** Une place vue de l'extérieur : le nom d'un humain, un bot, ou une place libre (dernier occupant). */
export type SeatInfo =
  | { kind: 'human'; name: string; isHost: boolean }
  | { kind: 'bot' }
  | { kind: 'free'; lastName: string }

/** Fin de manche à plusieurs humains : ce que chaque joueur voit du compte à rebours. */
export interface RoundEndInfo {
  /** Temps restant au moment de l'envoi ; chaque appareil décompte ensuite localement. */
  remainingMs: number
  /** Humains connectés qui n'ont pas encore demandé la manche suivante. */
  waitingFor: number
  /** Ce joueur a-t-il déjà demandé la manche suivante ? */
  iRequested: boolean
}

/** Informations de partie en réseau jointes à chaque vue. */
export interface SessionInfo {
  seats: SeatInfo[]
  /** Vrai tant qu'une place est libre : personne ne joue. */
  paused: boolean
  roundEnd: RoundEndInfo | null
}

export type RoomErrorCode =
  | ActionErrorCode
  | 'paused'
  | 'notSeated'
  | 'notStarted'
  | 'invalidName'
  | 'nameTaken'
  | 'roomFull'
  | 'seatTaken'
  | 'alreadySeated'

export type ClosedReason = 'kicked' | 'roomClosed' | 'timeout'

/** Action de jeu d'un joueur (la manche suivante a son propre message). */
export type GameAction = Exclude<Action, { type: 'nextRound' }>

// --- Invité -> hôte ---

export type GuestMessage =
  | { type: 'hello'; name: string }
  | { type: 'claim'; seat: number; name: string }
  | { type: 'action'; action: GameAction }
  | { type: 'nextRound' }
  /** Battement de cœur : prouve à l'hôte que la connexion est vivante. */
  | { type: 'ping' }

// --- Hôte -> invité ---

export type HostMessage =
  /** Salle avant le démarrage. `you` est null tant que l'invité n'a pas donné un nom accepté. */
  | { type: 'lobby'; players: string[]; you: string | null }
  /** Partie en cours : l'écran des places. */
  | { type: 'seats'; seats: SeatInfo[] }
  | { type: 'state'; version: number; view: PlayerView; session: SessionInfo }
  | { type: 'error'; code: RoomErrorCode }
  | { type: 'closed'; reason: ClosedReason }
  /** Réponse au ping : prouve à l'invité que l'hôte est vivant. */
  | { type: 'pong' }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSeatIndex(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function isSuit(value: unknown): value is Suit {
  return typeof value === 'string' && (SUITS as readonly string[]).includes(value)
}

function parseGameAction(value: unknown): GameAction | null {
  if (!isRecord(value) || !isSeatIndex(value.seat)) return null
  const seat = value.seat
  switch (value.type) {
    case 'giveCards':
      if (!Array.isArray(value.cardIds) || !value.cardIds.every((id) => typeof id === 'string')) return null
      return { type: 'giveCards', seat, cardIds: value.cardIds as string[] }
    case 'choosePapayou':
      return isSuit(value.suit) ? { type: 'choosePapayou', seat, suit: value.suit } : null
    case 'playCard':
      return typeof value.cardId === 'string' ? { type: 'playCard', seat, cardId: value.cardId } : null
    default:
      return null
  }
}

/** Message reçu par l'hôte, ou null s'il est mal formé (il est alors ignoré). */
export function parseGuestMessage(data: unknown): GuestMessage | null {
  if (!isRecord(data)) return null
  switch (data.type) {
    case 'hello':
      return typeof data.name === 'string' ? { type: 'hello', name: data.name } : null
    case 'claim':
      return isSeatIndex(data.seat) && typeof data.name === 'string'
        ? { type: 'claim', seat: data.seat, name: data.name }
        : null
    case 'action': {
      const action = parseGameAction(data.action)
      return action === null ? null : { type: 'action', action }
    }
    case 'nextRound':
      return { type: 'nextRound' }
    case 'ping':
      return { type: 'ping' }
    default:
      return null
  }
}

function isSeatInfo(value: unknown): value is SeatInfo {
  if (!isRecord(value)) return false
  if (value.kind === 'human') return typeof value.name === 'string' && typeof value.isHost === 'boolean'
  if (value.kind === 'bot') return true
  return value.kind === 'free' && typeof value.lastName === 'string'
}

function isSessionInfo(value: unknown): value is SessionInfo {
  if (!isRecord(value) || !Array.isArray(value.seats) || !value.seats.every(isSeatInfo)) return false
  if (typeof value.paused !== 'boolean') return false
  if (value.roundEnd === null) return true
  return (
    isRecord(value.roundEnd) &&
    typeof value.roundEnd.remainingMs === 'number' &&
    typeof value.roundEnd.waitingFor === 'number' &&
    typeof value.roundEnd.iRequested === 'boolean'
  )
}

function isViewShape(value: unknown): value is PlayerView {
  // Contrôle minimal : la vue vient de l'hôte (notre propre code), on vérifie ce que l'UI déréférence en premier.
  return (
    isRecord(value) &&
    isSeatIndex(value.seat) &&
    typeof value.playerCount === 'number' &&
    typeof value.phase === 'string' &&
    Array.isArray(value.hand) &&
    Array.isArray(value.handSizes)
  )
}

/** Message reçu par un invité, ou null s'il est mal formé. */
export function parseHostMessage(data: unknown): HostMessage | null {
  if (!isRecord(data)) return null
  switch (data.type) {
    case 'lobby':
      if (!Array.isArray(data.players) || !data.players.every((p) => typeof p === 'string')) return null
      if (data.you !== null && typeof data.you !== 'string') return null
      return { type: 'lobby', players: data.players as string[], you: data.you }
    case 'seats':
      return Array.isArray(data.seats) && data.seats.every(isSeatInfo) ? { type: 'seats', seats: data.seats } : null
    case 'state':
      if (typeof data.version !== 'number' || !isViewShape(data.view) || !isSessionInfo(data.session)) return null
      return { type: 'state', version: data.version, view: data.view, session: data.session }
    case 'error':
      return typeof data.code === 'string' ? { type: 'error', code: data.code as RoomErrorCode } : null
    case 'closed':
      return data.reason === 'kicked' || data.reason === 'roomClosed' || data.reason === 'timeout'
        ? { type: 'closed', reason: data.reason }
        : null
    case 'pong':
      return { type: 'pong' }
    default:
      return null
  }
}

/** Nom nettoyé (espaces de début et de fin retirés), ou null s'il est vide ou trop long. */
export function cleanPlayerName(raw: string): string | null {
  const name = raw.trim()
  if (name.length === 0 || name.length > MAX_NAME_LENGTH) return null
  return name
}
