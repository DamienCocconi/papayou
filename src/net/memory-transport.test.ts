import { describe, expect, it } from 'vitest'
import { createMemoryHub } from './memory-transport'
import { openRoomWithFreshCode, transportErrorCode } from './transport'
import type { HostLink } from './transport'

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

describe('memory-transport', () => {
  it("fait passer les messages dans les deux sens, copiés par JSON", async () => {
    const hub = createMemoryHub()
    const room = await hub.transport.openRoom('AAAAA')
    let hostLink: HostLink | null = null
    const received: unknown[] = []
    room.onConnection((link) => {
      hostLink = link
      link.onMessage((data) => received.push(data))
    })
    const guest = await hub.transport.joinRoom('AAAAA')
    const fromHost: unknown[] = []
    guest.onMessage((data) => fromHost.push(data))
    await flush()

    const payload = { type: 'hello', name: 'Alice' }
    guest.send(payload)
    expect(received).toEqual([payload])
    expect(received[0]).not.toBe(payload)

    hostLink!.send({ type: 'lobby' })
    expect(fromHost).toEqual([{ type: 'lobby' }])
    expect(hub.sentByHost).toHaveLength(1)
  })

  it("signale la fermeture à l'autre côté seulement", async () => {
    const hub = createMemoryHub()
    const room = await hub.transport.openRoom('AAAAA')
    let hostClosed = 0
    room.onConnection((link) => link.onClose(() => hostClosed++))
    const guest = await hub.transport.joinRoom('AAAAA')
    let guestClosed = 0
    guest.onClose(() => guestClosed++)
    await flush()

    guest.close()
    expect(hostClosed).toBe(1)
    expect(guestClosed).toBe(0)
  })

  it("ferme les invités quand l'hôte ferme la salle", async () => {
    const hub = createMemoryHub()
    const room = await hub.transport.openRoom('AAAAA')
    room.onConnection(() => undefined)
    const guest = await hub.transport.joinRoom('AAAAA')
    let guestClosed = 0
    guest.onClose(() => guestClosed++)
    await flush()
    room.close()
    expect(guestClosed).toBe(1)
    await expect(hub.transport.joinRoom('AAAAA')).rejects.toThrow()
  })

  it('refuse une salle inconnue ou un code déjà pris', async () => {
    const hub = createMemoryHub()
    await expect(hub.transport.joinRoom('ZZZZZ')).rejects.toSatisfy((e) => transportErrorCode(e) === 'roomNotFound')
    await hub.transport.openRoom('AAAAA')
    await expect(hub.transport.openRoom('AAAAA')).rejects.toSatisfy((e) => transportErrorCode(e) === 'idTaken')
  })

  it('tire un autre code quand le premier est déjà pris', async () => {
    const hub = createMemoryHub()
    await hub.transport.openRoom('AAAAA')
    const values = [0, 0, 0, 0, 0, 0.5, 0.5, 0.5, 0.5, 0.5]
    let i = 0
    const room = await openRoomWithFreshCode(hub.transport, () => values[i++] ?? 0.9)
    expect(room.code).not.toBe('AAAAA')
  })
})
