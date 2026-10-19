import type { PlayerView } from '../../engine'
import { playerName } from '../labels'
import { CardView } from './CardView'

/** Dernier pli terminé : cartes, gagnant et points (donnés par le moteur). */
export function LastTrick({ view, names }: { view: PlayerView; names?: readonly string[] | null }) {
  const last = view.lastTrick
  if (last === null) return null
  return (
    <div className="panel">
      <h3>
        Dernier pli : {playerName(last.winner, view.seat, names)} gagne ({last.points} pt{last.points > 1 ? 's' : ''})
      </h3>
      <div className="last-trick">
        {last.plays.map((p) => (
          <div key={p.seat} className="played">
            <CardView card={p.card} small />
            {playerName(p.seat, view.seat, names)}
          </div>
        ))}
      </div>
    </div>
  )
}
