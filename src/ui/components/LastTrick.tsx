import { useState } from 'react'
import type { PlayerView } from '../../engine'
import { playerName } from '../labels'
import { CardView } from './CardView'

interface Props {
  view: PlayerView
  names?: readonly string[] | null
  /**
   * Éventail : seul le résumé reste affiché, un bouton ouvre le détail des cartes en surcouche.
   * Étalé : le panneau complet, comme avant.
   */
  compact?: boolean
}

/** Dernier pli terminé : cartes, gagnant et points (donnés par le moteur). */
export function LastTrick({ view, names, compact = false }: Props) {
  const [open, setOpen] = useState(false)
  const last = view.lastTrick
  if (last === null) return null
  const summary = `Dernier pli : ${playerName(last.winner, view.seat, names)} gagne (${last.points} pt${last.points > 1 ? 's' : ''})`
  const cards = (
    <div className="last-trick">
      {last.plays.map((p) => (
        <div key={p.seat} className="played">
          <CardView card={p.card} small />
          {playerName(p.seat, view.seat, names)}
        </div>
      ))}
    </div>
  )

  if (!compact) {
    return (
      <div className="panel">
        <h3>{summary}</h3>
        {cards}
      </div>
    )
  }
  return (
    <>
      <button type="button" className="btn secondary last-trick-summary" aria-expanded={open} onClick={() => setOpen(true)}>
        {summary}
      </button>
      {open && (
        <div className="overlay">
          <div className="panel">
            <h3>{summary}</h3>
            {cards}
            <button type="button" className="btn" onClick={() => setOpen(false)}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  )
}
