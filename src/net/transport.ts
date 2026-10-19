// Transport : ce dont la logique de salle a besoin pour parler à l'autre bout, sans savoir si c'est PeerJS
// (production) ou un hub en mémoire (tests). Les messages sont du JSON.
import { generateRoomCode } from './room-code'

export type TransportErrorCode = 'idTaken' | 'roomNotFound' | 'unreachable'

/** Erreur de transport portant un code lisible par l'interface. */
export function transportError(code: TransportErrorCode, detail?: string): Error {
  return Object.assign(new Error(detail ?? code), { transportCode: code })
}

export function transportErrorCode(error: unknown): TransportErrorCode {
  if (error instanceof Error && 'transportCode' in error) {
    const code = (error as { transportCode: unknown }).transportCode
    if (code === 'idTaken' || code === 'roomNotFound' || code === 'unreachable') return code
  }
  return 'unreachable'
}

/** Une connexion ouverte entre deux appareils. Chaque côté peut envoyer quand il veut (push). */
export interface Link {
  send(message: unknown): void
  /** Ferme la connexion. L'autre côté est prévenu par `onClose`. */
  close(): void
  /** Un seul écouteur par connexion (le dernier remplace le précédent). */
  onMessage(listener: (data: unknown) => void): void
  onClose(listener: () => void): void
}

/** Côté hôte : une connexion par invité, identifiée de façon stable pendant sa durée de vie. */
export interface HostLink extends Link {
  readonly id: string
}

/** Salle ouverte par l'hôte. */
export interface HostRoom {
  readonly code: string
  onConnection(listener: (link: HostLink) => void): void
  /** Ferme la salle et toutes ses connexions. */
  close(): void
}

export interface Transport {
  /** Ouvre la salle `code`. Rejette avec le code `idTaken` si elle existe déjà. */
  openRoom(code: string): Promise<HostRoom>
  /** Rejoint la salle `code`. Rejette avec `roomNotFound` ou `unreachable`. */
  joinRoom(code: string): Promise<Link>
}

/** Ouvre une salle avec un code tiré au hasard, en retirant un autre code tant qu'il est déjà pris. */
export async function openRoomWithFreshCode(
  transport: Transport,
  random: () => number = Math.random,
  attempts = 5,
): Promise<HostRoom> {
  let lastError: unknown = null
  for (let i = 0; i < attempts; i++) {
    try {
      return await transport.openRoom(generateRoomCode(random))
    } catch (error) {
      if (transportErrorCode(error) !== 'idTaken') throw error
      lastError = error
    }
  }
  throw lastError ?? transportError('idTaken')
}
