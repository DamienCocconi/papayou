import { useEffect, useState } from 'react'
import { parseInviteHash } from '../net/room-code'
import { createLocalGame } from './controller/local'
import type { BotKind } from './controller/local'
import type { GameController } from './controller/types'
import { GameScreen } from './screens/GameScreen'
import { GuestRoomScreen } from './screens/GuestRoomScreen'
import { HomeScreen } from './screens/HomeScreen'
import { HostRoomScreen } from './screens/HostRoomScreen'

type Mode =
  | { kind: 'home' }
  | { kind: 'local'; controller: GameController }
  | { kind: 'host'; hostName: string }
  | { kind: 'guest'; code: string }

/** Retire le code du lien d'invitation de la barre d'adresse (pour ne pas rejoindre à nouveau en rechargeant). */
function clearInviteHash(): void {
  if (window.location.hash !== '') window.history.replaceState(null, '', window.location.pathname + window.location.search)
}

export function App() {
  // Un lien d'invitation ouvre directement la salle. Lecture pure : aucune connexion n'est créée ici,
  // elle naît dans l'effet de l'écran invité (StrictMode rend deux fois en développement).
  const [mode, setMode] = useState<Mode>(() => {
    const code = parseInviteHash(window.location.hash)
    return code === null ? { kind: 'home' } : { kind: 'guest', code }
  })

  // Le contrôleur local est créé dans un gestionnaire d'événement, jamais pendant le rendu.
  // On arrête les minuteries des bots quand on quitte la partie ou qu'on démonte l'application.
  useEffect(() => {
    if (mode.kind !== 'local') return
    const controller = mode.controller
    return () => controller.dispose()
  }, [mode])

  function quit() {
    clearInviteHash()
    setMode({ kind: 'home' })
  }

  switch (mode.kind) {
    case 'home':
      return (
        <HomeScreen
          onStart={(playerCount: number, botKind: BotKind) =>
            setMode({
              kind: 'local',
              controller: createLocalGame({ playerCount, botKind, seed: Math.floor(Math.random() * 2 ** 32) }),
            })
          }
          onCreateRoom={(hostName) => setMode({ kind: 'host', hostName })}
          onJoinRoom={(code) => setMode({ kind: 'guest', code })}
        />
      )
    case 'local':
      return <GameScreen controller={mode.controller} onQuit={quit} />
    case 'host':
      return <HostRoomScreen hostName={mode.hostName} onQuit={quit} />
    case 'guest':
      return <GuestRoomScreen code={mode.code} onQuit={quit} />
  }
}
