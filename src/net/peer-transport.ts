// Transport réel : WebRTC via PeerJS. Le serveur de signalisation ne sert qu'à mettre en relation les deux
// appareils ; une fois le canal ouvert, les messages passent en direct. Non testé automatiquement (il faut de
// vrais navigateurs) : la logique de salle est testée avec le transport en mémoire.
import { Peer } from 'peerjs'
import type { DataConnection, PeerOptions } from 'peerjs'
import { readSignalingConfig } from './config'
import type { SignalingConfig } from './config'
import { peerIdFromCode } from './room-code'
import { transportError } from './transport'
import type { HostLink, HostRoom, Link, Transport } from './transport'

/** Délai au bout duquel une connexion qui ne s'ouvre pas est déclarée injoignable. */
const CONNECT_TIMEOUT_MS = 12_000

/** Délai laissé aux derniers messages avant de fermer un canal. */
const CLOSE_DELAY_MS = 150

function peerOptions(config: SignalingConfig | null): PeerOptions {
  return config === null ? { debug: 0 } : { debug: 0, ...config }
}

/** Enveloppe une connexion PeerJS ouverte dans l'interface `Link`. Un seul écouteur par type d'événement. */
function wrapConnection(conn: DataConnection, onFinished: () => void): Link & { id: string } {
  let messageListener: ((data: unknown) => void) | null = null
  let closeListener: (() => void) | null = null
  let finished = false

  function finish(): void {
    if (finished) return
    finished = true
    onFinished()
    closeListener?.()
  }

  conn.on('data', (data) => messageListener?.(data))
  conn.on('close', finish)
  conn.on('error', finish)
  // Si le chemin réseau s'effondre (et ne se rétablit pas), PeerJS n'émet pas toujours « close » : on le force.
  conn.peerConnection?.addEventListener('iceconnectionstatechange', () => {
    if (conn.peerConnection?.iceConnectionState === 'failed') conn.close()
  })

  return {
    id: conn.connectionId,
    send: (message) => {
      if (conn.open) conn.send(message)
    },
    // Fermeture légèrement différée : un message envoyé juste avant (renvoi, fin de salle) doit partir avant le canal.
    close: () => void setTimeout(() => conn.close(), CLOSE_DELAY_MS),
    onMessage: (listener) => {
      messageListener = listener
    },
    onClose: (listener) => {
      closeListener = listener
    },
  }
}

export function createPeerTransport(config: SignalingConfig | null = readSignalingConfig(import.meta.env)): Transport {
  const options = peerOptions(config)

  return {
    openRoom(code) {
      return new Promise<HostRoom>((resolve, reject) => {
        const peer = new Peer(peerIdFromCode(code), options)
        let settled = false
        let connectionListener: ((link: HostLink) => void) | null = null

        peer.on('open', () => {
          settled = true
          resolve({
            code,
            onConnection: (listener) => {
              connectionListener = listener
            },
            close: () => void setTimeout(() => peer.destroy(), CLOSE_DELAY_MS * 2),
          })
        })
        peer.on('error', (error) => {
          if (settled) return
          settled = true
          peer.destroy()
          reject(transportError(error.type === 'unavailable-id' ? 'idTaken' : 'unreachable', error.message))
        })
        peer.on('disconnected', () => {
          // Perte du serveur de signalisation : les parties en cours continuent, mais on tente de rejoindre
          // le serveur pour que de nouveaux joueurs puissent arriver.
          if (settled && !peer.destroyed) peer.reconnect()
        })
        peer.on('connection', (conn) => {
          conn.on('open', () => connectionListener?.(wrapConnection(conn, () => undefined)))
        })
      })
    },

    joinRoom(code) {
      return new Promise<Link>((resolve, reject) => {
        const peer = new Peer(options)
        let settled = false
        const timer = setTimeout(() => fail('unreachable', 'Délai de connexion dépassé'), CONNECT_TIMEOUT_MS)

        function fail(kind: 'roomNotFound' | 'unreachable', message: string): void {
          if (settled) return
          settled = true
          clearTimeout(timer)
          peer.destroy()
          reject(transportError(kind, message))
        }

        peer.on('error', (error) => {
          if (error.type === 'peer-unavailable') fail('roomNotFound', error.message)
          else fail('unreachable', error.message)
        })
        peer.on('open', () => {
          const conn = peer.connect(peerIdFromCode(code), { serialization: 'json', reliable: true })
          conn.on('open', () => {
            if (settled) return
            settled = true
            clearTimeout(timer)
            const link = wrapConnection(conn, () => peer.destroy())
            resolve({
              ...link,
              close: () => {
                conn.close()
                peer.destroy()
              },
            })
          })
        })
      })
    },
  }
}
