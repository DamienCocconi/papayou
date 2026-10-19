import type { PlayerView } from '../../engine'
import type { RoundEndInfo } from '../../net/protocol'
import { playerName } from '../labels'
import { useCountdown } from '../useCountdown'

interface Props {
  view: PlayerView
  names?: readonly string[] | null
  /** Partie en réseau à plusieurs humains : compte à rebours et joueurs attendus. */
  network?: { info: RoundEndInfo; receivedAt: number } | null
  onNextRound: () => void
}

/** Fin de manche minimale : points de la manche et totaux. Le tableau détaillé viendra avec add-ui-scores-mobile. */
export function RoundEnd({ view, names, network, onNextRound }: Props) {
  const scores = view.roundScores[view.roundScores.length - 1] ?? []
  return (
    <div className="panel">
      <h3>
        Fin de la manche {view.roundIndex + 1} / {view.playerCount}
      </h3>
      <ul>
        {scores.map((points, seat) => (
          <li key={seat}>
            {playerName(seat, view.seat, names)} : {points} pts (total {view.totals[seat]})
          </li>
        ))}
      </ul>
      {network ? (
        <NetworkRoundEnd info={network.info} receivedAt={network.receivedAt} onNextRound={onNextRound} />
      ) : (
        <button type="button" className="btn" onClick={onNextRound}>
          Manche suivante
        </button>
      )}
    </div>
  )
}

function NetworkRoundEnd({
  info,
  receivedAt,
  onNextRound,
}: {
  info: RoundEndInfo
  receivedAt: number
  onNextRound: () => void
}) {
  const seconds = useCountdown(info.remainingMs, receivedAt)
  return (
    <div>
      <p role="timer">Manche suivante dans {seconds} s</p>
      <p>
        {info.waitingFor === 0
          ? 'Tout le monde est prêt.'
          : `En attente de ${info.waitingFor} joueur${info.waitingFor > 1 ? 's' : ''}.`}
      </p>
      <button type="button" className="btn" disabled={info.iRequested} onClick={onNextRound}>
        Manche suivante
      </button>
      {info.iRequested && <p>Votre demande est prise en compte, en attente des autres.</p>}
    </div>
  )
}
