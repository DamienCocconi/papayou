import { useEffect, useState } from 'react'
import { createLocalGame } from './controller/local'
import type { BotKind } from './controller/local'
import type { GameController } from './controller/types'
import { GameScreen } from './screens/GameScreen'
import { HomeScreen } from './screens/HomeScreen'

export function App() {
  // Le contrôleur est créé dans un gestionnaire d'événement, jamais pendant le rendu :
  // StrictMode rend deux fois en développement et créerait deux parties.
  const [controller, setController] = useState<GameController | null>(null)

  // Arrête les minuteries des bots quand on quitte la partie ou qu'on démonte l'application.
  useEffect(() => () => controller?.dispose(), [controller])

  if (controller === null) {
    return (
      <HomeScreen
        onStart={(playerCount: number, botKind: BotKind) =>
          setController(createLocalGame({ playerCount, botKind, seed: Math.floor(Math.random() * 2 ** 32) }))
        }
      />
    )
  }
  return <GameScreen controller={controller} onQuit={() => setController(null)} />
}
