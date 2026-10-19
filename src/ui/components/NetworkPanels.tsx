// Éléments d'interface propres au jeu en réseau : pause, administration de l'hôte, liste des places.
import { useState } from 'react'
import type { SessionInfo, SeatInfo } from '../../net/protocol'
import { seatNames } from '../labels'

/** Bandeau affiché tant qu'une place est libre : personne ne peut jouer. */
export function PauseBanner({ session, mySeat }: { session: SessionInfo; mySeat: number }) {
  const names = seatNames(session, mySeat)
  const absent = session.seats.flatMap((seat, index) => (seat.kind === 'free' ? [seat.lastName || names[index]] : []))
  return (
    <div className="banner" role="alert">
      Partie en pause : {absent.join(', ')} {absent.length > 1 ? 'sont partis' : 'est parti'}.
    </div>
  )
}

export interface AdminActions {
  kick(seat: number): void
  replaceWithBot(seat: number): void
}

/** Menu de l'hôte : renvoyer un joueur présent, remplacer un joueur absent par un bot. */
export function AdminMenu({
  session,
  mySeat,
  actions,
  onClose,
}: {
  session: SessionInfo
  mySeat: number
  actions: AdminActions
  onClose: () => void
}) {
  return (
    <div className="panel admin" role="dialog" aria-label="Administration de la partie">
      <h3>Administration</h3>
      <ul className="seat-list">
        {session.seats.map((seat, index) => {
          if (index === mySeat) return null
          return (
            <li key={index}>
              <span>
                {index + 1}. {seatLabel(seat)}
              </span>
              {seat.kind === 'human' && (
                <button type="button" className="btn secondary" onClick={() => actions.kick(index)}>
                  Renvoyer le joueur
                </button>
              )}
              {seat.kind === 'free' && (
                <button type="button" className="btn secondary" onClick={() => actions.replaceWithBot(index)}>
                  Remplacer le joueur par un bot
                </button>
              )}
            </li>
          )
        })}
      </ul>
      <button type="button" className="btn secondary" onClick={onClose}>
        Fermer
      </button>
    </div>
  )
}

export function seatLabel(seat: SeatInfo): string {
  if (seat.kind === 'human') return seat.name
  if (seat.kind === 'bot') return 'Bot'
  return `Place libre (avant : ${seat.lastName})`
}

/** Écran des places : on peut prendre une place libre ou une place de bot, sous le nom de son choix. */
export function SeatPicker({
  seats,
  error,
  onClaim,
}: {
  seats: SeatInfo[]
  error: string | null
  onClaim: (seat: number, name: string) => void
}) {
  return (
    <div className="panel">
      <h3>Choisissez votre place</h3>
      {error !== null && <p role="alert">{error}</p>}
      {!seats.some((seat) => seat.kind !== 'human') && (
        <p role="status">
          Aucune place disponible : toutes sont tenues par des joueurs connectés. Si l'un d'eux est parti sans que la
          partie le sache encore, demandez à l'hôte de le renvoyer (menu Administration) ; la liste se met à jour toute seule.
        </p>
      )}
      <ul className="seat-list">
        {seats.map((seat, index) => (
          <SeatRow key={index} index={index} seat={seat} onClaim={onClaim} />
        ))}
      </ul>
    </div>
  )
}

function SeatRow({ index, seat, onClaim }: { index: number; seat: SeatInfo; onClaim: (seat: number, name: string) => void }) {
  const [name, setName] = useState(seat.kind === 'free' ? seat.lastName : '')
  const claimable = seat.kind !== 'human'
  return (
    <li>
      <span>
        {index + 1}. {seat.kind === 'human' ? `${seat.name}${seat.isHost ? ' (hôte)' : ''}` : seat.kind === 'bot' ? 'Bot' : `Libre (avant : ${seat.lastName})`}
      </span>
      {claimable && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onClaim(index, name)
          }}
        >
          <input
            aria-label={`Votre nom pour la place ${index + 1}`}
            value={name}
            maxLength={20}
            placeholder="Votre nom"
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" className="btn">
            Prendre cette place
          </button>
        </form>
      )}
    </li>
  )
}
