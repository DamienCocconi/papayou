import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { createPeerTransport } from '../../net/peer-transport'
import { joinRoomAsGuest } from '../../net/session-guest'
import type { GuestClosedReason, GuestSession } from '../../net/session-guest'
import { SeatPicker } from '../components/NetworkPanels'
import { createGuestController } from '../controller/guest'
import { roomErrorText } from '../labels'
import { GameScreen } from './GameScreen'

interface Props {
  code: string
  onQuit: () => void
}

/** Écran de l'invité : se connecte à la salle `code`, donne son nom, prend une place, puis joue. */
export function GuestRoomScreen({ code, onQuit }: Props) {
  const [session, setSession] = useState<GuestSession | null>(null)

  // La connexion naît et meurt avec l'écran (StrictMode rejoue l'effet : la première session est fermée proprement).
  useEffect(() => {
    const created = joinRoomAsGuest(createPeerTransport(), code)
    setSession(created)
    return () => created.dispose()
  }, [code])

  if (session === null) return <Message title={`Salle ${code}`} text="Connexion…" onQuit={onQuit} />
  return <GuestRoom code={code} session={session} onQuit={onQuit} />
}

const CLOSED_TEXT: Record<GuestClosedReason, string> = {
  hostLeft:
    "La connexion avec l'hôte est perdue. Si la partie continue, rouvrez le lien pour reprendre votre place.",
  roomClosed: "L'hôte a fermé la salle : la partie est interrompue.",
  timeout:
    'Vous avez été déconnecté après un long silence (réseau coupé ou écran verrouillé). Rouvrez le lien pour reprendre votre place.',
  kicked: "L'hôte vous a renvoyé de la partie. Rouvrez le lien pour reprendre une place.",
}

function GuestRoom({ code, session, onQuit }: { code: string; session: GuestSession; onQuit: () => void }) {
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot)
  const controller = useMemo(() => createGuestController(session), [session])

  switch (snapshot.stage) {
    case 'connecting':
      return <Message title={`Salle ${code}`} text="Connexion…" onQuit={onQuit} />
    case 'failed':
      return (
        <Message
          title="Salle injoignable"
          text={
            snapshot.error === 'roomNotFound'
              ? 'Aucune salle ne correspond à ce code. Vérifiez-le et réessayez.'
              : 'Impossible de joindre la salle (réseau ou serveur de mise en relation).'
          }
          onQuit={onQuit}
        />
      )
    case 'lobby':
      if (snapshot.you === null) {
        return (
          <NameForm
            code={code}
            error={snapshot.error === null ? null : roomErrorText(snapshot.error)}
            onSubmit={(name) => session.hello(name)}
            onQuit={onQuit}
          />
        )
      }
      return (
        <div className="home lobby">
          <h1>Salle {code}</h1>
          <h2>Joueurs présents</h2>
          <ul>
            {snapshot.players.map((name, index) => (
              <li key={index}>
                {name}
                {index === 0 ? ' (hôte)' : ''}
              </li>
            ))}
          </ul>
          <p role="status">En attente du démarrage par l'hôte…</p>
          <button type="button" className="btn secondary" onClick={onQuit}>
            Quitter
          </button>
        </div>
      )
    case 'seats':
      return (
        <div className="home">
          <h1>Salle {code}</h1>
          <p>La partie est en cours.</p>
          <SeatPicker
            seats={snapshot.seats}
            error={snapshot.error === null ? null : roomErrorText(snapshot.error)}
            onClaim={(seat, name) => session.claim(seat, name)}
          />
          <button type="button" className="btn secondary" onClick={onQuit}>
            Quitter
          </button>
        </div>
      )
    case 'playing':
      return <GameScreen controller={controller} onQuit={onQuit} />
    case 'closed':
      return <Message title="Partie interrompue" text={CLOSED_TEXT[snapshot.reason]} onQuit={onQuit} />
  }
}

function Message({ title, text, onQuit }: { title: string; text: string; onQuit: () => void }) {
  return (
    <div className="home">
      <h1>{title}</h1>
      <p role="status">{text}</p>
      <button type="button" className="btn" onClick={onQuit}>
        Retour à l'accueil
      </button>
    </div>
  )
}

function NameForm({
  code,
  error,
  onSubmit,
  onQuit,
}: {
  code: string
  error: string | null
  onSubmit: (name: string) => void
  onQuit: () => void
}) {
  const [name, setName] = useState('')
  return (
    <form
      className="home"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(name)
      }}
    >
      <h1>Salle {code}</h1>
      <label htmlFor="guest-name">Votre nom</label>
      <input id="guest-name" value={name} maxLength={20} autoFocus onChange={(e) => setName(e.target.value)} />
      {error !== null && <p role="alert">{error}</p>}
      <button type="submit" className="btn">
        Rejoindre
      </button>
      <button type="button" className="btn secondary" onClick={onQuit}>
        Annuler
      </button>
    </form>
  )
}
