import { useMemo, useState } from 'react'
import type { Action, Suit } from '../../engine'
import type { GameController } from '../controller/types'
import { GameEnd } from '../components/GameEnd'
import { Hand } from '../components/Hand'
import { LastTrick } from '../components/LastTrick'
import { AdminMenu, PauseBanner } from '../components/NetworkPanels'
import type { AdminActions } from '../components/NetworkPanels'
import { PapayouPicker } from '../components/PapayouPicker'
import { RoundEnd } from '../components/RoundEnd'
import { Table } from '../components/Table'
import { playerName, roomErrorText, seatNames, SUIT_NAME, SUIT_SYMBOL, turnSeat } from '../labels'
import { useGame } from '../useGame'

interface Props {
  controller: GameController
  onQuit: () => void
  /** Actions d'administration, fournies seulement à l'hôte d'une salle en réseau. */
  admin?: AdminActions
}

export function GameScreen({ controller, onQuit, admin }: Props) {
  const { view, legalPlays, session } = useGame(controller)
  const me = view.seat
  // En pause (une place libre), personne ne joue : l'hôte refuserait de toute façon.
  const paused = session?.paused ?? false
  const playableIds = useMemo(
    () => new Set(paused ? [] : legalPlays.map((c) => c.id)),
    [legalPlays, paused],
  )
  const names = useMemo(() => (session ? seatNames(session, me) : null), [session, me])
  const [adminOpen, setAdminOpen] = useState(false)
  const turn = turnSeat(view)

  // La sélection de la main repart de zéro quand la phase, le tour ou le nombre de cartes change.
  const resetKey = `${view.phase}-${view.roundIndex}-${view.tricksPlayed}-${view.trick.length}-${view.hand.length}`

  // Le moteur peut refuser une action (l'interface grise déjà les cartes illégales, mais on ne présume de rien).
  const [error, setError] = useState<string | null>(null)
  function dispatch(action: Action) {
    const result = controller.dispatch(action)
    setError(result.ok ? null : roomErrorText(result.error))
  }

  function status(): string {
    switch (view.phase) {
      case 'exchange': {
        if (view.myGift === null) return 'Choisissez 3 cartes à donner au joueur suivant.'
        const waiting = view.hasGiven.flatMap((given, seat) => (given ? [] : [playerName(seat, me, names)]))
        return `Don fait. En attente de : ${waiting.join(', ')}.`
      }
      case 'choosePapayou':
        return view.roundLeader === me
          ? 'Vous êtes entameur : choisissez la couleur du papayou.'
          : `${playerName(view.roundLeader, me, names)} choisit le papayou…`
      case 'playing':
        if (turn === null) return ''
        return turn === me ? 'À vous de jouer.' : `${playerName(turn, me, names)} joue…`
      case 'roundEnd':
        return 'Manche terminée.'
      case 'gameEnd':
        return 'Partie terminée.'
    }
  }

  const handMode =
    paused ? 'view' : view.phase === 'exchange' && view.myGift === null ? 'give' : view.phase === 'playing' ? 'play' : 'view'
  const marked = useMemo(() => new Set((view.myGift ?? []).map((c) => c.id)), [view.myGift])

  return (
    <div className="game">
      <div className="topbar">
        <span className="badge">
          Manche {Math.min(view.roundIndex + 1, view.playerCount)} / {view.playerCount}
        </span>
        {view.papayouSuit !== null && (
          <span className="badge">
            Papayou : <strong>{SUIT_SYMBOL[view.papayouSuit]}</strong> {SUIT_NAME[view.papayouSuit]}
          </span>
        )}
        <span className="topbar-actions">
          {admin !== undefined && session !== null && (
            <button type="button" className="btn secondary" onClick={() => setAdminOpen((open) => !open)}>
              Administration
            </button>
          )}
          <button type="button" className="btn secondary" onClick={onQuit}>
            Quitter
          </button>
        </span>
      </div>

      {session !== null && paused && <PauseBanner session={session} mySeat={me} />}
      {admin !== undefined && session !== null && adminOpen && (
        <AdminMenu session={session} mySeat={me} actions={admin} onClose={() => setAdminOpen(false)} />
      )}

      <div className="status" role="status">
        {error ?? (session?.error ? roomErrorText(session.error) : status())}
      </div>

      <Table view={view} names={names} />

      <div className="center">
        {view.phase === 'choosePapayou' && view.roundLeader === me && (
          <PapayouPicker onPick={(suit: Suit) => dispatch({ type: 'choosePapayou', seat: me, suit })} />
        )}
        {view.phase === 'roundEnd' && (
          <RoundEnd
            view={view}
            names={names}
            network={session?.roundEnd ? { info: session.roundEnd, receivedAt: session.receivedAt } : null}
            onNextRound={() => dispatch({ type: 'nextRound' })}
          />
        )}
        {view.phase === 'gameEnd' && <GameEnd view={view} names={names} onQuit={onQuit} />}
        <LastTrick view={view} names={names} />
      </div>

      <Hand
        key={resetKey}
        cards={view.hand}
        mode={handMode}
        playableIds={playableIds}
        markedIds={marked}
        onPlay={(cardId) => dispatch({ type: 'playCard', seat: me, cardId })}
        onGive={(cardIds) => dispatch({ type: 'giveCards', seat: me, cardIds })}
      />
    </div>
  )
}
