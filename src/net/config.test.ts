import { describe, expect, it } from 'vitest'
import { readSignalingConfig } from './config'

describe('readSignalingConfig', () => {
  it('renvoie null sans configuration (serveur public de PeerJS)', () => {
    expect(readSignalingConfig({})).toBeNull()
    expect(readSignalingConfig({ VITE_PEER_HOST: '  ' })).toBeNull()
  })

  it('lit une configuration complète', () => {
    expect(
      readSignalingConfig({
        VITE_PEER_HOST: 'peer.exemple.fr',
        VITE_PEER_PORT: '9000',
        VITE_PEER_PATH: '/papayou',
        VITE_PEER_SECURE: 'false',
      }),
    ).toEqual({ host: 'peer.exemple.fr', port: 9000, path: '/papayou', secure: false })
  })

  it('complète avec des valeurs par défaut sûres', () => {
    expect(readSignalingConfig({ VITE_PEER_HOST: 'peer.exemple.fr' })).toEqual({
      host: 'peer.exemple.fr',
      port: 443,
      path: '/',
      secure: true,
    })
  })
})
