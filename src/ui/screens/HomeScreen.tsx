import { useState } from 'react'
import { MAX_PLAYERS, MIN_PLAYERS } from '../../engine'
import type { BotKind } from '../controller/local'

interface Props {
  onStart: (playerCount: number, botKind: BotKind) => void
}

const COUNTS = Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => MIN_PLAYERS + i)

export function HomeScreen({ onStart }: Props) {
  const [playerCount, setPlayerCount] = useState(4)
  const [botKind, setBotKind] = useState<BotKind>('heuristic')
  return (
    <form
      className="home"
      onSubmit={(e) => {
        e.preventDefault()
        onStart(playerCount, botKind)
      }}
    >
      <h1>Papayou</h1>
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
  )
}
