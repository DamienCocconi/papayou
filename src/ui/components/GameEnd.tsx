import type { PlayerView } from '../../engine'
import { playerName } from '../labels'

interface Props {
  view: PlayerView
  names?: readonly string[] | null
  onQuit: () => void
}

export function GameEnd({ view, names, onQuit }: Props) {
  const ranking = view.ranking ?? []
  const order = ranking.map((place, seat) => ({ place, seat })).sort((a, b) => a.place - b.place)
  return (
    <div className="panel">
      <h3>Fin de la partie</h3>
      <ol style={{ listStyle: 'none', padding: 0 }}>
        {order.map(({ place, seat }) => (
          <li key={seat}>
            {place}. {playerName(seat, view.seat, names)} : {view.totals[seat]} pts
          </li>
        ))}
      </ol>
      <button type="button" className="btn" onClick={onQuit}>
        Rejouer
      </button>
    </div>
  )
}
