// Session de l'invité : se connecte à la salle d'un hôte, mémorise la dernière vue reçue et envoie ses actions.
// L'invité ne connaît aucune règle : il affiche ce que l'hôte lui envoie et ignore les vues en retard.
import { parseHostMessage } from './protocol'
import type { GameAction, RoomErrorCode, SeatInfo, SessionInfo } from './protocol'
import type { PlayerView } from '../engine'
import { transportErrorCode } from './transport'
import { defaultScheduler } from './scheduler'
import type { Scheduler } from './scheduler'
import type { Link, Transport } from './transport'
import type { HostResult } from './session-host'

export type GuestClosedReason = 'hostLeft' | 'kicked' | 'roomClosed' | 'timeout'

export interface GuestOptions {
  /** Intervalle entre deux pings vers l'hôte. */
  pingMs?: number
  /** Silence de l'hôte au-delà duquel la connexion est déclarée perdue ; 0 désactive la surveillance. */
  timeoutMs?: number
  scheduler?: Scheduler
  now?: () => number
}

export type GuestSnapshot =
  | { stage: 'connecting' }
  | { stage: 'failed'; error: 'roomNotFound' | 'unreachable' }
  /** `you` est null tant que le nom n'a pas été accepté. */
  | { stage: 'lobby'; players: string[]; you: string | null; error: RoomErrorCode | null }
  /** Partie en cours : l'écran des places pour en prendre une. */
  | { stage: 'seats'; seats: SeatInfo[]; error: RoomErrorCode | null }
  | { stage: 'playing'; view: PlayerView; session: SessionInfo; version: number; error: RoomErrorCode | null }
  | { stage: 'closed'; reason: GuestClosedReason }

export interface GuestSession {
  /** Même référence tant que rien n'a changé. */
  getSnapshot(): GuestSnapshot
  subscribe(listener: () => void): () => void
  /** Lobby : propose un nom à l'hôte. */
  hello(name: string): void
  /** Partie en cours : demande une place libre ou une place de bot. */
  claim(seat: number, name: string): void
  dispatch(action: GameAction): HostResult
  requestNextRound(): HostResult
  /** Ferme la connexion et cesse toute notification. */
  dispose(): void
}

export function joinRoomAsGuest(transport: Transport, code: string, options: GuestOptions = {}): GuestSession {
  const pingMs = options.pingMs ?? 5000
  const timeoutMs = options.timeoutMs ?? 15_000
  const scheduler = options.scheduler ?? defaultScheduler
  const now = options.now ?? Date.now
  const listeners = new Set<() => void>()
  let snapshot: GuestSnapshot = { stage: 'connecting' }
  let link: Link | null = null
  let lastVersion = 0
  let disposed = false
  let lastHeard = now()
  let cancelBeat: (() => void) | null = null

  function stopBeat(): void {
    cancelBeat?.()
    cancelBeat = null
  }

  function set(next: GuestSnapshot): void {
    if (next.stage === 'closed') stopBeat()
    snapshot = next
    for (const listener of [...listeners]) listener()
  }

  function setError(error: RoomErrorCode | null): void {
    if (snapshot.stage === 'lobby' || snapshot.stage === 'seats' || snapshot.stage === 'playing') {
      set({ ...snapshot, error })
    }
  }

  function onMessage(data: unknown): void {
    if (disposed || snapshot.stage === 'closed') return
    lastHeard = now()
    const message = parseHostMessage(data)
    if (message === null) return
    switch (message.type) {
      case 'lobby':
        set({ stage: 'lobby', players: message.players, you: message.you, error: null })
        return
      case 'seats':
        // Un refus (error) précède souvent cette liste : on garde son message.
        set({ stage: 'seats', seats: message.seats, error: snapshot.stage === 'seats' ? snapshot.error : null })
        return
      case 'state':
        if (message.version <= lastVersion) return
        lastVersion = message.version
        set({ stage: 'playing', view: message.view, session: message.session, version: message.version, error: null })
        return
      case 'error':
        setError(message.code)
        return
      case 'closed':
        set({ stage: 'closed', reason: message.reason })
        return
      case 'pong':
        return
    }
  }

  function onClose(): void {
    if (disposed || snapshot.stage === 'closed') return
    set({ stage: 'closed', reason: 'hostLeft' })
  }

  /** Ping régulier vers l'hôte ; sans aucune nouvelle de lui trop longtemps, la connexion est déclarée perdue. */
  function beat(): void {
    if (timeoutMs <= 0 || disposed || link === null) return
    link.send({ type: 'ping' })
    cancelBeat = scheduler(() => {
      cancelBeat = null
      if (disposed || snapshot.stage === 'closed' || link === null) return
      if (now() - lastHeard > timeoutMs) {
        link.close()
        onClose()
        return
      }
      beat()
    }, pingMs)
  }

  transport.joinRoom(code).then(
    (opened) => {
      if (disposed) {
        opened.close()
        return
      }
      link = opened
      opened.onMessage(onMessage)
      opened.onClose(onClose)
      lastHeard = now()
      beat()
    },
    (error: unknown) => {
      if (disposed) return
      const reason = transportErrorCode(error)
      set({ stage: 'failed', error: reason === 'roomNotFound' ? 'roomNotFound' : 'unreachable' })
    },
  )

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    hello(name) {
      setError(null)
      link?.send({ type: 'hello', name })
    },
    claim(seat, name) {
      setError(null)
      link?.send({ type: 'claim', seat, name })
    },
    dispatch(action) {
      if (snapshot.stage !== 'playing' || link === null) return { ok: false, error: 'notStarted' }
      link.send({ type: 'action', action })
      return { ok: true }
    },
    requestNextRound() {
      if (snapshot.stage !== 'playing' || link === null) return { ok: false, error: 'notStarted' }
      link.send({ type: 'nextRound' })
      return { ok: true }
    },
    dispose() {
      if (disposed) return
      disposed = true
      stopBeat()
      link?.close()
      link = null
      listeners.clear()
    },
  }
}
