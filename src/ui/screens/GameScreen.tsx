import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
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
import { browserStorage, readLayout, writeLayout } from '../hand/layoutPreference'
import type { HandLayout } from '../hand/layoutPreference'
import { playerName, roomErrorText, seatNames, SUIT_NAME, SUIT_SYMBOL, turnSeat } from '../labels'
import { useGame } from '../useGame'

interface Props {
  controller: GameController
  onQuit: () => void
  /** Actions d'administration, fournies seulement à l'hôte d'une salle en réseau. */
  admin?: AdminActions
}

/** Durée d'affichage du message de refus d'une carte. */
const REFUSAL_DURATION_MS = 3000

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

  // Choix d'affichage de la main, propre à cet appareil (jamais envoyé sur le réseau).
  const [layoutChoice, setLayoutChoice] = useState<HandLayout>(() => readLayout(browserStorage()))
  function toggleLayout() {
    const next: HandLayout = layoutChoice === 'fan' ? 'spread' : 'fan'
    setLayoutChoice(next)
    writeLayout(browserStorage(), next)
  }
  // Tant que le joueur doit choisir ses cartes à donner, la main s'affiche étalée sans toucher à son choix.
  const giving = view.phase === 'exchange' && view.myGift === null
  const layout: HandLayout = giving ? 'spread' : layoutChoice
  const fan = layout === 'fan'

  // La sélection de l'étalé repart de zéro quand la phase, le tour ou le nombre de cartes change.
  const resetKey = `${view.phase}-${view.roundIndex}-${view.tricksPlayed}-${view.trick.length}-${view.hand.length}`

  // Le moteur peut refuser une action (l'interface grise déjà les cartes illégales, mais on ne présume de rien).
  const [error, setError] = useState<string | null>(null)
  function dispatch(action: Action): boolean {
    const result = controller.dispatch(action)
    setError(result.ok ? null : roomErrorText(result.error))
    return result.ok
  }

  // Message court quand une carte tirée de l'éventail ne part pas. Il dit seulement ce que la vue et
  // le moteur disent déjà (pause, tour, carte grisée) : aucune règle n'est énoncée ici.
  // Un objet plutôt qu'un texte : le même message répété relance sa durée d'affichage.
  const [refusal, setRefusal] = useState<{ text: string } | null>(null)
  function refuse() {
    if (paused) setRefusal({ text: roomErrorText('paused') })
    else if (turn === null) setRefusal({ text: "Ce n'est pas le moment de jouer une carte." })
    else setRefusal({ text: turn === me ? 'Cette carte ne peut pas être jouée.' : "Ce n'est pas à vous de jouer." })
  }
  useEffect(() => {
    if (refusal === null) return
    const timer = window.setTimeout(() => setRefusal(null), REFUSAL_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [refusal])
  // La situation a changé : le message ne dit plus la vérité (le tour est peut-être arrivé).
  useEffect(() => setRefusal(null), [resetKey])

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

  const adminPanel =
    admin !== undefined && session !== null && adminOpen ? (
      <AdminMenu session={session} mySeat={me} actions={admin} onClose={() => setAdminOpen(false)} />
    ) : null
  const endPanels: ReactNode = (
    <>
      {view.phase === 'roundEnd' && (
        <RoundEnd
          view={view}
          names={names}
          network={session?.roundEnd ? { info: session.roundEnd, receivedAt: session.receivedAt } : null}
          onNextRound={() => dispatch({ type: 'nextRound' })}
        />
      )}
      {view.phase === 'gameEnd' && <GameEnd view={view} names={names} onQuit={onQuit} />}
    </>
  )
  const hasEndPanel = view.phase === 'roundEnd' || view.phase === 'gameEnd'

  return (
    <div className={`game${fan ? ' fan' : ''}`}>
      <div className="head">
        <div className="topbar">
          <span className="badge">
            Manche {Math.min(view.roundIndex + 1, view.playerCount)} / {view.playerCount}
          </span>
          {view.papayouSuit !== null && (
            <span className="badge">
              Papayou : <strong>{SUIT_SYMBOL[view.papayouSuit]}</strong>
              <span className="suit-name"> {SUIT_NAME[view.papayouSuit]}</span>
            </span>
          )}
          <span className="topbar-actions">
            {!giving && (
              <button
                type="button"
                className="btn secondary icon-btn"
                aria-label={fan ? 'Afficher la main étalée' : 'Afficher la main en éventail'}
                title={fan ? 'Main étalée' : 'Main en éventail'}
                onClick={toggleLayout}
              >
                {fan ? <GridIcon /> : <FanIcon />}
              </button>
            )}
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
        <div className="status" role="status">
          {refusal?.text ?? error ?? (session?.error ? roomErrorText(session.error) : status())}
        </div>
      </div>

      {session !== null && paused && <PauseBanner session={session} mySeat={me} />}
      {!fan && adminPanel}

      <div className="stage">
        <Table view={view} names={names} />

        <div className="center">
          {view.phase === 'choosePapayou' && view.roundLeader === me && (
            <PapayouPicker onPick={(suit: Suit) => dispatch({ type: 'choosePapayou', seat: me, suit })} />
          )}
          {!fan && endPanels}
          <LastTrick view={view} names={names} compact={fan} />
        </div>

        {fan && hasEndPanel && <div className="overlay">{endPanels}</div>}
        {fan && adminPanel !== null && <div className="overlay">{adminPanel}</div>}
      </div>

      <div className="hand-zone">
        <Hand
          cards={view.hand}
          mode={handMode}
          layout={layout}
          resetKey={resetKey}
          playableIds={playableIds}
          markedIds={marked}
          onPlay={(cardId) => dispatch({ type: 'playCard', seat: me, cardId })}
          onGive={(cardIds) => dispatch({ type: 'giveCards', seat: me, cardIds })}
          onRefuse={refuse}
          playRefusal={session?.error ? session.receivedAt : null}
        />
      </div>
    </div>
  )
}

/** Icône du bouton « main étalée » : une grille de cartes. */
function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
      <rect x="3" y="4" width="8" height="7" rx="1.5" />
      <rect x="13" y="4" width="8" height="7" rx="1.5" />
      <rect x="3" y="13" width="8" height="7" rx="1.5" />
      <rect x="13" y="13" width="8" height="7" rx="1.5" />
    </svg>
  )
}

/** Icône du bouton « main en éventail » : trois cartes en arc. */
function FanIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
      <rect x="9.5" y="5" width="5" height="14" rx="1" />
      <rect x="9.5" y="5" width="5" height="14" rx="1" transform="rotate(-28 12 20)" />
      <rect x="9.5" y="5" width="5" height="14" rx="1" transform="rotate(28 12 20)" />
    </svg>
  )
}
