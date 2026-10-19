// Outils de test pour les sessions de salle : horloge simulée, invités « bruts » et pilote de partie.
// Tout reste en mémoire : aucun vrai réseau ni minuterie réelle.
import { legalPlaysFromView } from '../engine'
import type { GameAction, HostMessage, RoomErrorCode, SessionInfo } from './protocol'
import { parseHostMessage } from './protocol'
import { createMemoryHub } from './memory-transport'
import type { MemoryHub } from './memory-transport'
import { createHostSession } from './session-host'
import type { HostSession, HostSessionOptions } from './session-host'
import type { Scheduler } from './scheduler'
import type { Link } from './transport'
import type { PlayerView } from '../engine'

/** Options d'invité sans surveillance du silence : évite des minuteries réelles dans les tests. */
export const NO_HEARTBEAT = { timeoutMs: 0 }

export const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

export interface FakeClock {
  scheduler: Scheduler
  now: () => number
  /** Avance l'horloge de `ms` en exécutant, dans l'ordre, les minuteries échues (y compris celles créées en route). */
  advance(ms: number): void
  pending(): number
}

export function createFakeClock(): FakeClock {
  let time = 0
  let seq = 0
  const tasks = new Map<number, { at: number; fn: () => void }>()
  const scheduler: Scheduler = (fn, ms) => {
    const id = seq++
    tasks.set(id, { at: time + ms, fn })
    return () => {
      tasks.delete(id)
    }
  }
  return {
    scheduler,
    now: () => time,
    advance(ms) {
      const target = time + ms
      for (let guard = 0; guard < 100_000; guard++) {
        let nextId: number | null = null
        let nextAt = Infinity
        for (const [id, task] of tasks) {
          if (task.at <= target && task.at < nextAt) {
            nextId = id
            nextAt = task.at
          }
        }
        if (nextId === null) break
        const task = tasks.get(nextId)
        tasks.delete(nextId)
        time = Math.max(time, nextAt)
        task?.fn()
      }
      time = target
    },
    pending: () => tasks.size,
  }
}

export interface RawGuest {
  link: Link
  messages: HostMessage[]
  closed: boolean
  send(message: unknown): void
  /** Dernier message d'un type donné. */
  last<T extends HostMessage['type']>(type: T): Extract<HostMessage, { type: T }> | undefined
  state(): { version: number; view: PlayerView; session: SessionInfo } | undefined
  errors(): RoomErrorCode[]
  /** Vide l'historique (pour tester ce qui arrive après). */
  clear(): void
}

export async function connectRawGuest(hub: MemoryHub, code = 'AAAAA'): Promise<RawGuest> {
  const link = await hub.transport.joinRoom(code)
  const guest: RawGuest = {
    link,
    messages: [],
    closed: false,
    send: (message) => link.send(message),
    last(type) {
      for (let i = guest.messages.length - 1; i >= 0; i--) {
        const message = guest.messages[i]
        if (message !== undefined && message.type === type) return message as never
      }
      return undefined
    },
    state() {
      const message = guest.last('state')
      return message === undefined ? undefined : { version: message.version, view: message.view, session: message.session }
    },
    errors: () => guest.messages.flatMap((m) => (m.type === 'error' ? [m.code] : [])),
    clear: () => {
      guest.messages.length = 0
    },
  }
  link.onMessage((data) => {
    const message = parseHostMessage(data)
    if (message !== null) guest.messages.push(message)
  })
  link.onClose(() => {
    guest.closed = true
  })
  await flush()
  return guest
}

export interface TestRoom {
  hub: MemoryHub
  clock: FakeClock
  host: HostSession
}

export async function createTestRoom(overrides: Partial<HostSessionOptions> = {}): Promise<TestRoom> {
  const hub = createMemoryHub()
  const clock = createFakeClock()
  const room = await hub.transport.openRoom('AAAAA')
  const host = createHostSession({
    room,
    hostName: 'Hôte',
    seed: 7,
    botDelayMs: 0,
    trickPauseMs: 0,
    scheduler: clock.scheduler,
    now: clock.now,
    // Surveillance du silence désactivée par défaut : ses minuteries fausseraient les tests qui comptent les minuteries en attente.
    heartbeatTimeoutMs: 0,
    ...overrides,
  })
  return { hub, clock, host }
}

/** Un guest connecté qui a donné son nom dans le lobby. */
export async function joinLobby(room: TestRoom, name: string): Promise<RawGuest> {
  const guest = await connectRawGuest(room.hub)
  guest.send({ type: 'hello', name })
  return guest
}

// --- Pilote de partie ---

export interface Participant {
  view(): PlayerView | null
  requested(): boolean
  act(action: GameAction): void
  nextRound(): void
}

export function hostParticipant(host: HostSession): Participant {
  return {
    view: () => {
      const snapshot = host.getSnapshot()
      return snapshot.stage === 'playing' ? snapshot.view : null
    },
    requested: () => {
      const snapshot = host.getSnapshot()
      return snapshot.stage === 'playing' && (snapshot.session.roundEnd?.iRequested ?? false)
    },
    act: (action) => void host.dispatch(action),
    nextRound: () => void host.requestNextRound(),
  }
}

export function guestParticipant(guest: RawGuest): Participant {
  return {
    view: () => guest.state()?.view ?? null,
    requested: () => guest.state()?.session.roundEnd?.iRequested ?? false,
    act: (action) => guest.send({ type: 'action', action }),
    nextRound: () => guest.send({ type: 'nextRound' }),
  }
}

/** Un coup « raisonnable » pour ce participant : vrai s'il a fait quelque chose. */
export function stepParticipant(p: Participant): boolean {
  const view = p.view()
  if (view === null) return false
  switch (view.phase) {
    case 'exchange':
      if (view.myGift !== null) return false
      p.act({ type: 'giveCards', seat: view.seat, cardIds: view.hand.slice(0, 3).map((c) => c.id) })
      return true
    case 'choosePapayou':
      if (view.roundLeader !== view.seat) return false
      p.act({ type: 'choosePapayou', seat: view.seat, suit: 'hearts' })
      return true
    case 'playing': {
      const legal = legalPlaysFromView(view)
      const card = legal[0]
      if (card === undefined) return false
      p.act({ type: 'playCard', seat: view.seat, cardId: card.id })
      return true
    }
    case 'roundEnd':
      if (p.requested()) return false
      p.nextRound()
      return true
    default:
      return false
  }
}

/**
 * Fait jouer les participants jusqu'à ce que la phase de l'hôte soit `untilPhase`.
 * Lève une erreur si la partie est bloquée ou dépasse `maxSteps` tours de boucle.
 */
export function playUntil(
  room: TestRoom,
  participants: Participant[],
  untilPhase: PlayerView['phase'],
  maxSteps = 5000,
): void {
  const reached = () => {
    const snapshot = room.host.getSnapshot()
    return snapshot.stage === 'playing' && snapshot.view.phase === untilPhase
  }
  for (let step = 0; step < maxSteps; step++) {
    if (reached()) return
    room.clock.advance(1)
    let acted = false
    for (const participant of participants) {
      // Vérifié avant chaque coup : sinon un participant pourrait quitter la phase visée dans le même tour.
      if (reached()) return
      acted = stepParticipant(participant) || acted
    }
    if (reached()) return
    if (!acted) room.clock.advance(1000)
  }
  throw new Error(`La partie n'a pas atteint la phase ${untilPhase} en ${maxSteps} tours`)
}
