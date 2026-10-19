// Session de l'hôte : le moteur, les bots et la salle vivent ici. L'hôte est la seule autorité sur les règles.
// Il valide chaque action avec le moteur, puis renvoie à chaque invité sa vue entière et versionnée.
import { MAX_PLAYERS, MIN_PLAYERS, applyAction, createGame, createRng, getBotView, getPlayerView } from '../engine'
import type { Action, GameState, PlayerView } from '../engine'
import { botAction, createHeuristicBot, createRandomBot } from '../bots'
import type { Bot } from '../bots'
import { cleanPlayerName, parseGuestMessage } from './protocol'
import type { GameAction, HostMessage, RoomErrorCode, SeatInfo, SessionInfo } from './protocol'
import { defaultScheduler } from './scheduler'
import type { BotKind, Scheduler } from './scheduler'
import type { HostLink, HostRoom } from './transport'

/** Identifiant du propriétaire de la place de l'hôte (il n'a pas de connexion réseau). */
export const HOST_ID = 'host'
export const ROUND_END_MS = 30_000
/** Silence au-delà duquel une connexion est considérée perdue (les invités envoient un ping toutes les 5 s). */
export const HEARTBEAT_TIMEOUT_MS = 15_000

export interface HostSessionOptions {
  room: HostRoom
  hostName: string
  /** Graine de la partie ; celle des bots en est dérivée. */
  seed: number
  botDelayMs?: number
  /** Délai avant le coup suivant d'un bot quand un pli vient de se terminer. */
  trickPauseMs?: number
  /** Durée du compte à rebours de fin de manche. */
  roundEndMs?: number
  /** Délai de silence avant de déclarer une connexion perdue ; 0 désactive la surveillance. */
  heartbeatTimeoutMs?: number
  scheduler?: Scheduler
  now?: () => number
}

export type HostResult = { ok: true } | { ok: false; error: RoomErrorCode }
export type StartResult =
  | { ok: true }
  | { ok: false; error: 'tooFewPlayers' | 'tooManyPlayers' | 'alreadyStarted' }

export interface LobbySnapshot {
  stage: 'lobby'
  code: string
  /** Noms des humains présents, l'hôte en premier. */
  players: string[]
  botCount: number
  botKind: BotKind
  canStart: boolean
}

export interface PlayingSnapshot {
  stage: 'playing'
  code: string
  view: PlayerView
  session: SessionInfo
  version: number
  /** Vrai tant qu'un bot doit encore agir. */
  botsPending: boolean
}

export type HostSnapshot = LobbySnapshot | PlayingSnapshot

export interface HostSession {
  readonly code: string
  /** Même référence tant que rien n'a changé. */
  getSnapshot(): HostSnapshot
  subscribe(listener: () => void): () => void
  /** Lobby : nombre et type de bots. Sans effet une fois la partie démarrée. */
  setBots(count: number, kind: BotKind): void
  start(): StartResult
  /** Action de l'hôte sur sa propre place. */
  dispatch(action: GameAction): HostResult
  /** L'hôte demande la manche suivante. */
  requestNextRound(): HostResult
  /** Renvoie un joueur présent : sa place passe à un bot. */
  kick(seat: number): boolean
  /** Confie la place d'un joueur absent à un bot. */
  replaceWithBot(seat: number): boolean
  /** Ferme la salle, prévient les invités et arrête les minuteries. */
  dispose(): void
}

type Seat =
  | { kind: 'human'; name: string; owner: string }
  | { kind: 'bot' }
  | { kind: 'free'; lastName: string }

interface Member {
  link: HostLink
  /** Nom accepté (lobby) ou nom de la place prise (partie). */
  name: string | null
  seat: number | null
  /** Dernier message reçu de cette connexion (ms), pour détecter une connexion silencieuse. */
  lastSeen: number
}

interface RoundEndVote {
  requested: Set<number>
  deadline: number
  cancelTimer: () => void
}

function createBot(kind: BotKind): Bot {
  return kind === 'heuristic' ? createHeuristicBot() : createRandomBot()
}

export function createHostSession(options: HostSessionOptions): HostSession {
  const { room, seed } = options
  const botDelayMs = options.botDelayMs ?? 600
  const trickPauseMs = options.trickPauseMs ?? 1500
  const roundEndMs = options.roundEndMs ?? ROUND_END_MS
  const heartbeatTimeoutMs = options.heartbeatTimeoutMs ?? HEARTBEAT_TIMEOUT_MS
  const scheduler = options.scheduler ?? defaultScheduler
  const now = options.now ?? Date.now
  const hostName = cleanPlayerName(options.hostName) ?? 'Hôte'

  const members = new Map<string, Member>()
  const listeners = new Set<() => void>()
  let disposed = false

  // Lobby
  let botCount = 0
  let botKind: BotKind = 'heuristic'

  // Partie
  let started = false
  let state: GameState | null = null
  let seats: Seat[] = []
  let bot: Bot = createBot(botKind)
  let botRng = createRng((seed ^ 0x9e3779b9) >>> 0)
  let version = 0
  let cancelBots: (() => void) | null = null
  let vote: RoundEndVote | null = null
  let cancelWatch: (() => void) | null = null

  // --- Utilitaires ---

  function send(link: HostLink, message: HostMessage): void {
    try {
      link.send(message)
    } catch {
      // Connexion déjà fermée : sa fermeture est traitée par onClose.
    }
  }

  function lobbyHumans(): { name: string }[] {
    const humans = [{ name: hostName }]
    for (const member of members.values()) if (member.name !== null) humans.push({ name: member.name })
    return humans
  }

  function sameName(a: string, b: string): boolean {
    return a.toLocaleLowerCase() === b.toLocaleLowerCase()
  }

  /** Noms des humains connectés (lobby ou places occupées), pour refuser les doublons. */
  function connectedNames(): string[] {
    if (!started) return lobbyHumans().map((h) => h.name)
    const names: string[] = []
    for (const seat of seats) if (seat.kind === 'human') names.push(seat.name)
    return names
  }

  function hostSeat(): number {
    return seats.findIndex((s) => s.kind === 'human' && s.owner === HOST_ID)
  }

  function isPaused(): boolean {
    return started && seats.some((s) => s.kind === 'free')
  }

  function seatInfos(): SeatInfo[] {
    return seats.map((seat): SeatInfo => {
      if (seat.kind === 'human') return { kind: 'human', name: seat.name, isHost: seat.owner === HOST_ID }
      if (seat.kind === 'bot') return { kind: 'bot' }
      return { kind: 'free', lastName: seat.lastName }
    })
  }

  /** Places humaines (présentes ou parties) : sans elles, pas de vote de fin de manche. */
  function humanLikeSeatCount(): number {
    return seats.filter((s) => s.kind === 'human' || s.kind === 'free').length
  }

  function waitingSeats(): number[] {
    const waiting: number[] = []
    seats.forEach((seat, index) => {
      if (seat.kind === 'human' && !(vote?.requested.has(index) ?? false)) waiting.push(index)
    })
    return waiting
  }

  function sessionFor(seat: number): SessionInfo {
    const roundEnd =
      vote !== null && state?.phase === 'roundEnd'
        ? {
            remainingMs: Math.max(0, vote.deadline - now()),
            waitingFor: waitingSeats().length,
            iRequested: vote.requested.has(seat),
          }
        : null
    return { seats: seatInfos(), paused: isPaused(), roundEnd }
  }

  // --- Bots ---

  function botSeats(): number[] {
    const result: number[] = []
    seats.forEach((seat, index) => {
      if (seat.kind === 'bot') result.push(index)
    })
    return result
  }

  function nextBotMove(): Action | null {
    if (state === null) return null
    for (const seat of botSeats()) {
      const action = botAction(bot, getBotView(state, seat), botRng)
      if (action !== null) return action
    }
    return null
  }

  /** Vrai si un bot a une action à jouer. Générateur jetable : seul null / non-null compte ici. */
  function botsPending(): boolean {
    if (state === null || isPaused()) return false
    if (state.phase === 'roundEnd' || state.phase === 'gameEnd') return false
    const probe = createRng(0)
    return botSeats().some((seat) => state !== null && botAction(bot, getBotView(state, seat), probe) !== null)
  }

  function scheduleBots(delay: number): void {
    cancelBots?.()
    cancelBots = null
    if (disposed || !botsPending()) return
    cancelBots = scheduler(() => {
      cancelBots = null
      if (state === null || isPaused()) return
      const action = nextBotMove()
      if (action === null) return
      const result = applyAction(state, action)
      if (!result.ok) throw new Error(`Action de bot refusée (${result.error}) : ${JSON.stringify(action)}`)
      const trickEnded = result.state.tricksPlayed !== state.tricksPlayed
      state = result.state
      changed(trickEnded ? trickPauseMs : botDelayMs)
    }, delay)
  }

  // --- Fin de manche ---

  function clearVote(): void {
    vote?.cancelTimer()
    vote = null
  }

  function advanceRound(): void {
    clearVote()
    if (state === null || state.phase !== 'roundEnd') return
    const result = applyAction(state, { type: 'nextRound' })
    if (result.ok) state = result.state
  }

  function syncRoundEndVote(): void {
    if (state === null) return
    if (state.phase !== 'roundEnd') {
      clearVote()
      return
    }
    if (humanLikeSeatCount() < 2) {
      // Plus qu'une place humaine (renvoi, remplacement) : plus de vote, le bouton simple suffit.
      clearVote()
      return
    }
    if (vote === null) {
      const created: RoundEndVote = {
        requested: new Set(),
        deadline: now() + roundEndMs,
        cancelTimer: () => undefined,
      }
      created.cancelTimer = scheduler(() => {
        if (disposed || vote !== created) return
        created.cancelTimer = () => undefined
        advanceRound()
        changed(botDelayMs)
      }, roundEndMs)
      vote = created
    }
    if (waitingSeats().length === 0) advanceRound()
  }

  // --- Diffusion ---

  let snapshot: HostSnapshot = buildSnapshot()

  function buildSnapshot(): HostSnapshot {
    if (!started || state === null) {
      const players = lobbyHumans().map((h) => h.name)
      const total = players.length + botCount
      return {
        stage: 'lobby',
        code: room.code,
        players,
        botCount,
        botKind,
        canStart: total >= MIN_PLAYERS && total <= MAX_PLAYERS,
      }
    }
    const seat = hostSeat()
    return {
      stage: 'playing',
      code: room.code,
      view: getPlayerView(state, seat),
      session: sessionFor(seat),
      version,
      botsPending: botsPending(),
    }
  }

  function notify(): void {
    for (const listener of [...listeners]) listener()
  }

  function publishLobby(): void {
    snapshot = buildSnapshot()
    const players = lobbyHumans().map((h) => h.name)
    for (const member of members.values()) send(member.link, { type: 'lobby', players, you: member.name })
    notify()
  }

  function publishGame(): void {
    if (state === null) return
    version++
    snapshot = buildSnapshot()
    for (const member of members.values()) {
      if (member.seat !== null) {
        send(member.link, {
          type: 'state',
          version,
          view: getPlayerView(state, member.seat),
          session: sessionFor(member.seat),
        })
      } else {
        send(member.link, { type: 'seats', seats: seatInfos() })
      }
    }
    notify()
  }

  /** Après tout changement de la partie ou des places : vote, diffusion, bots. */
  function changed(botDelay: number): void {
    syncRoundEndVote()
    publishGame()
    scheduleBots(botDelay)
  }

  // --- Messages des invités ---

  function refuse(member: Member, code: RoomErrorCode): void {
    send(member.link, { type: 'error', code })
  }

  function onHello(member: Member, rawName: string): void {
    if (started) {
      send(member.link, { type: 'seats', seats: seatInfos() })
      return
    }
    if (member.name !== null) return
    const name = cleanPlayerName(rawName)
    if (name === null) return refuse(member, 'invalidName')
    if (connectedNames().some((n) => sameName(n, name))) return refuse(member, 'nameTaken')
    if (lobbyHumans().length >= MAX_PLAYERS) return refuse(member, 'roomFull')
    member.name = name
    publishLobby()
  }

  function onClaim(member: Member, seatIndex: number, rawName: string): void {
    if (!started || state === null) return refuse(member, 'notStarted')
    if (member.seat !== null) return refuse(member, 'alreadySeated')
    const name = cleanPlayerName(rawName)
    if (name === null) return refuse(member, 'invalidName')
    const target = seats[seatIndex]
    if (target === undefined) return refuse(member, 'invalidSeat')
    if (target.kind === 'human') {
      refuse(member, 'seatTaken')
      send(member.link, { type: 'seats', seats: seatInfos() })
      return
    }
    if (connectedNames().some((n) => sameName(n, name))) return refuse(member, 'nameTaken')
    seats[seatIndex] = { kind: 'human', name, owner: member.link.id }
    member.seat = seatIndex
    member.name = name
    vote?.requested.delete(seatIndex)
    changed(botDelayMs)
  }

  function playAction(seat: number, action: GameAction): HostResult {
    if (!started || state === null) return { ok: false, error: 'notStarted' }
    if (isPaused()) return { ok: false, error: 'paused' }
    const result = applyAction(state, { ...action, seat })
    if (!result.ok) return { ok: false, error: result.error }
    const trickEnded = result.state.tricksPlayed !== state.tricksPlayed
    state = result.state
    changed(trickEnded ? trickPauseMs : botDelayMs)
    return { ok: true }
  }

  function requestNextRound(seat: number): HostResult {
    if (!started || state === null) return { ok: false, error: 'notStarted' }
    if (state.phase !== 'roundEnd') return { ok: false, error: 'wrongPhase' }
    if (humanLikeSeatCount() < 2) {
      advanceRound()
    } else {
      // Le vote existe déjà : `changed` l'a créé à l'arrivée en fin de manche.
      syncRoundEndVote()
      vote?.requested.add(seat)
    }
    changed(botDelayMs)
    return { ok: true }
  }

  function onGuestData(member: Member, data: unknown): void {
    if (disposed) return
    member.lastSeen = now()
    const message = parseGuestMessage(data)
    if (message === null) return
    switch (message.type) {
      case 'ping':
        send(member.link, { type: 'pong' })
        return
      case 'hello':
        return onHello(member, message.name)
      case 'claim':
        return onClaim(member, message.seat, message.name)
      case 'action': {
        if (member.seat === null) return refuse(member, 'notSeated')
        const result = playAction(member.seat, message.action)
        if (!result.ok) refuse(member, result.error)
        return
      }
      case 'nextRound': {
        if (member.seat === null) return refuse(member, 'notSeated')
        const result = requestNextRound(member.seat)
        if (!result.ok) refuse(member, result.error)
        return
      }
    }
  }

  function onGuestClosed(member: Member): void {
    if (disposed || members.get(member.link.id) !== member) return
    members.delete(member.link.id)
    if (!started) {
      if (member.name !== null) publishLobby()
      return
    }
    if (member.seat !== null) {
      const seat = seats[member.seat]
      if (seat !== undefined && seat.kind === 'human' && seat.owner === member.link.id) {
        seats[member.seat] = { kind: 'free', lastName: seat.name }
      }
      changed(botDelayMs)
    }
  }

  /** Connexion muette trop longtemps (réseau coupé, téléphone verrouillé) : traitée comme une déconnexion. */
  function dropSilent(member: Member): void {
    send(member.link, { type: 'closed', reason: 'timeout' })
    onGuestClosed(member)
    member.link.close()
  }

  /** Surveille le silence des invités tant qu'il y en a. WebRTC ne signale pas toujours une connexion morte. */
  function watchHeartbeat(): void {
    if (heartbeatTimeoutMs <= 0 || cancelWatch !== null || disposed) return
    cancelWatch = scheduler(() => {
      cancelWatch = null
      if (disposed) return
      const limit = now() - heartbeatTimeoutMs
      for (const member of [...members.values()]) if (member.lastSeen < limit) dropSilent(member)
      if (members.size > 0) watchHeartbeat()
    }, Math.max(1, Math.floor(heartbeatTimeoutMs / 3)))
  }

  room.onConnection((link) => {
    if (disposed) {
      link.close()
      return
    }
    const member: Member = { link, name: null, seat: null, lastSeen: now() }
    members.set(link.id, member)
    watchHeartbeat()
    link.onMessage((data) => onGuestData(member, data))
    link.onClose(() => onGuestClosed(member))
    if (started) send(link, { type: 'seats', seats: seatInfos() })
    else send(link, { type: 'lobby', players: lobbyHumans().map((h) => h.name), you: null })
  })

  // --- API de l'hôte ---

  return {
    code: room.code,
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    setBots(count, kind) {
      if (started || disposed) return
      botCount = Math.max(0, Math.min(MAX_PLAYERS, Math.floor(count)))
      botKind = kind
      publishLobby()
    },
    start() {
      if (started) return { ok: false, error: 'alreadyStarted' }
      const humans = lobbyHumans()
      const total = humans.length + botCount
      if (total < MIN_PLAYERS) return { ok: false, error: 'tooFewPlayers' }
      if (total > MAX_PLAYERS) return { ok: false, error: 'tooManyPlayers' }
      state = createGame(total, seed)
      bot = createBot(botKind)
      botRng = createRng((seed ^ 0x9e3779b9) >>> 0)
      seats = [{ kind: 'human', name: hostName, owner: HOST_ID }]
      for (const member of members.values()) {
        if (member.name === null) continue
        member.seat = seats.length
        seats.push({ kind: 'human', name: member.name, owner: member.link.id })
      }
      while (seats.length < total) seats.push({ kind: 'bot' })
      started = true
      changed(botDelayMs)
      return { ok: true }
    },
    dispatch(action) {
      return playAction(hostSeat(), action)
    },
    requestNextRound() {
      return requestNextRound(hostSeat())
    },
    kick(seatIndex) {
      const seat = seats[seatIndex]
      if (!started || seat === undefined || seat.kind !== 'human' || seat.owner === HOST_ID) return false
      const member = members.get(seat.owner)
      seats[seatIndex] = { kind: 'bot' }
      vote?.requested.delete(seatIndex)
      if (member !== undefined) {
        members.delete(member.link.id)
        send(member.link, { type: 'closed', reason: 'kicked' })
        member.link.close()
      }
      changed(botDelayMs)
      return true
    },
    replaceWithBot(seatIndex) {
      const seat = seats[seatIndex]
      if (!started || seat === undefined || seat.kind !== 'free') return false
      seats[seatIndex] = { kind: 'bot' }
      vote?.requested.delete(seatIndex)
      changed(botDelayMs)
      return true
    },
    dispose() {
      if (disposed) return
      disposed = true
      cancelBots?.()
      cancelBots = null
      cancelWatch?.()
      cancelWatch = null
      clearVote()
      for (const member of [...members.values()]) {
        send(member.link, { type: 'closed', reason: 'roomClosed' })
        member.link.close()
      }
      members.clear()
      room.close()
    },
  }
}
