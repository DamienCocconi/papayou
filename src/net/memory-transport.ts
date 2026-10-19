// Transport en mémoire pour les tests : plusieurs « appareils » dans un même processus.
// Les messages passent par JSON.stringify/parse, comme sur un vrai canal : rien n'est partagé par référence.
import { transportError } from './transport'
import type { HostLink, HostRoom, Link, Transport } from './transport'

export interface SentRecord {
  /** `host` ou l'identifiant de la connexion invitée destinataire. */
  to: string
  json: string
}

export interface MemoryHub {
  transport: Transport
  /** Tous les messages envoyés par l'hôte, avec leur destinataire. */
  sentByHost: SentRecord[]
}

interface Endpoint {
  listener: ((data: unknown) => void) | null
  closeListener: (() => void) | null
  closed: boolean
}

export function createMemoryHub(): MemoryHub {
  const rooms = new Map<string, { onConnection: ((link: HostLink) => void) | null; links: Set<() => void> }>()
  const sentByHost: SentRecord[] = []
  let nextId = 1

  const transport: Transport = {
    openRoom(code) {
      if (rooms.has(code)) return Promise.reject(transportError('idTaken'))
      const room = { onConnection: null as ((link: HostLink) => void) | null, links: new Set<() => void>() }
      rooms.set(code, room)
      const hostRoom: HostRoom = {
        code,
        onConnection(listener) {
          room.onConnection = listener
        },
        close() {
          for (const closeLink of [...room.links]) closeLink()
          rooms.delete(code)
        },
      }
      return Promise.resolve(hostRoom)
    },

    joinRoom(code) {
      const room = rooms.get(code)
      if (!room || !room.onConnection) return Promise.reject(transportError('roomNotFound'))
      const id = `guest-${nextId++}`
      const hostSide: Endpoint = { listener: null, closeListener: null, closed: false }
      const guestSide: Endpoint = { listener: null, closeListener: null, closed: false }

      function closeBoth(initiator: Endpoint): void {
        if (hostSide.closed && guestSide.closed) return
        hostSide.closed = true
        guestSide.closed = true
        rooms.get(code)?.links.delete(closeFromRoom)
        const other = initiator === hostSide ? guestSide : hostSide
        other.closeListener?.()
      }
      const closeFromRoom = () => closeBoth(hostSide)
      room.links.add(closeFromRoom)

      const hostLink: HostLink = {
        id,
        send(message) {
          if (hostSide.closed) return
          const json = JSON.stringify(message)
          sentByHost.push({ to: id, json })
          guestSide.listener?.(JSON.parse(json))
        },
        close: () => closeBoth(hostSide),
        onMessage(listener) {
          hostSide.listener = listener
        },
        onClose(listener) {
          hostSide.closeListener = listener
        },
      }
      const guestLink: Link = {
        send(message) {
          if (guestSide.closed) return
          hostSide.listener?.(JSON.parse(JSON.stringify(message)))
        },
        close: () => closeBoth(guestSide),
        onMessage(listener) {
          guestSide.listener = listener
        },
        onClose(listener) {
          guestSide.closeListener = listener
        },
      }

      // La connexion est annoncée à l'hôte une fois que l'invité a pu brancher ses écouteurs.
      setTimeout(() => room.onConnection?.(hostLink), 0)
      return Promise.resolve(guestLink)
    },
  }

  return { transport, sentByHost }
}
