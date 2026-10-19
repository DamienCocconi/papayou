// Serveur de signalisation PeerJS. Par défaut le serveur public gratuit de PeerJS ;
// un serveur auto-hébergé se règle par des variables d'environnement Vite, sans toucher au reste du code.

export interface SignalingConfig {
  host: string
  port: number
  path: string
  secure: boolean
}

type Env = Record<string, string | undefined>

/**
 * Configuration lue dans l'environnement (VITE_PEER_HOST, VITE_PEER_PORT, VITE_PEER_PATH, VITE_PEER_SECURE).
 * Renvoie null quand rien n'est configuré : PeerJS utilise alors son serveur public.
 */
export function readSignalingConfig(env: Env): SignalingConfig | null {
  const host = env.VITE_PEER_HOST?.trim()
  if (!host) return null
  const port = Number(env.VITE_PEER_PORT)
  return {
    host,
    port: Number.isInteger(port) && port > 0 ? port : 443,
    path: env.VITE_PEER_PATH?.trim() || '/',
    secure: env.VITE_PEER_SECURE !== 'false',
  }
}
