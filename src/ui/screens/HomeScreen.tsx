import { useState } from 'react'
import { MAX_PLAYERS, MIN_PLAYERS } from '../../engine'
import { normalizeRoomCode } from '../../net/room-code'
import type { BotKind } from '../controller/local'

interface Props {
  onStart: (playerCount: number, botKind: BotKind) => void
  onCreateRoom: (hostName: string) => void
  onJoinRoom: (code: string) => void
}

const COUNTS = Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => MIN_PLAYERS + i)

export function HomeScreen({ onStart, onCreateRoom, onJoinRoom }: Props) {
  const [playerCount, setPlayerCount] = useState(4)
  const [botKind, setBotKind] = useState<BotKind>('heuristic')
  const [hostName, setHostName] = useState('')
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)
  const trimmedName = hostName.trim()

  return (
    <div className="home">
      <h1>Papayou</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          onStart(playerCount, botKind)
        }}
      >
        <h2>Partie locale</h2>
        <label htmlFor="count">Nombre de joueurs (vous + bots)</label>
        <select id="count" value={playerCount} onChange={(e) => setPlayerCount(Number(e.target.value))}>
          {COUNTS.map((n) => (
            <option key={n} value={n}>
              {n} joueurs
            </option>
          ))}
        </select>
        <label htmlFor="bots">Type de bots</label>
        <select id="bots" value={botKind} onChange={(e) => setBotKind(e.target.value as BotKind)}>
          <option value="heuristic">Heuristique (joue pour de vrai)</option>
          <option value="random">Aléatoire (facile)</option>
        </select>
        <button type="submit" className="btn">
          Jouer
        </button>
      </form>

      <section className="network">
        <h2>Partie en réseau</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (trimmedName !== '') onCreateRoom(trimmedName)
          }}
        >
          <label htmlFor="host-name">Votre nom</label>
          <input id="host-name" value={hostName} maxLength={20} onChange={(e) => setHostName(e.target.value)} />
          <button type="submit" className="btn" disabled={trimmedName === ''}>
            Créer une salle
          </button>
        </form>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            const normalized = normalizeRoomCode(code)
            if (normalized === null) {
              setCodeError('Code invalide : 5 caractères (lettres sans I ni O, chiffres de 2 à 9).')
              return
            }
            setCodeError(null)
            onJoinRoom(normalized)
          }}
        >
          <label htmlFor="room-code">Code de la salle</label>
          <input
            id="room-code"
            value={code}
            maxLength={8}
            autoCapitalize="characters"
            onChange={(e) => setCode(e.target.value)}
          />
          {codeError !== null && <p role="alert">{codeError}</p>}
          <button type="submit" className="btn">
            Rejoindre
          </button>
        </form>
      </section>
    </div>
  )
}
