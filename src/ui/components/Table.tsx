import type { PlayerView } from '../../engine'
import { playerName, turnSeat } from '../labels'
import { CardView } from './CardView'

/** Les joueurs avec leur carte du pli en cours, leur nombre de cartes et le tour. */
export function Table({ view }: { view: PlayerView }) {
  const turn = turnSeat(view)
  const seats = Array.from({ length: view.playerCount }, (_, seat) => seat)
  return (
    <div className="seats">
      {seats.map((seat) => {
        const play = view.trick.find((p) => p.seat === seat)
        return (
          <div key={seat} className={`seat${turn === seat ? ' turn' : ''}`}>
            <div className="name">{playerName(seat, view.seat)}</div>
            <div className="meta">
              {view.handSizes[seat]} cartes
              {view.roundLeader === seat ? ' · entameur' : ''}
            </div>
            <div className="slot">{play !== undefined && <CardView card={play.card} small />}</div>
          </div>
        )
      })}
    </div>
  )
}
