import type { PlayerView } from '../../engine'
import { playerName } from '../labels'

interface Props {
  view: PlayerView
  onNextRound: () => void
}

/** Fin de manche minimale : points de la manche et totaux. Le tableau détaillé viendra avec add-ui-scores-mobile. */
export function RoundEnd({ view, onNextRound }: Props) {
  const scores = view.roundScores[view.roundScores.length - 1] ?? []
  return (
    <div className="panel">
      <h3>
        Fin de la manche {view.roundIndex + 1} / {view.playerCount}
      </h3>
      <ul>
        {scores.map((points, seat) => (
          <li key={seat}>
            {playerName(seat, view.seat)} : {points} pts (total {view.totals[seat]})
          </li>
        ))}
      </ul>
      <button type="button" className="btn" onClick={onNextRound}>
        Manche suivante
      </button>
    </div>
  )
}
