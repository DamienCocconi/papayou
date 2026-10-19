import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { MAX_PLAYERS, MIN_PLAYERS } from '../../engine'
import { createPeerTransport } from '../../net/peer-transport'
import { buildInviteLink } from '../../net/room-code'
import type { BotKind } from '../../net/scheduler'
import { createHostSession } from '../../net/session-host'
import type { HostSession, LobbySnapshot } from '../../net/session-host'
import { openRoomWithFreshCode } from '../../net/transport'
import { createHostController } from '../controller/host'
import { GameScreen } from './GameScreen'

interface Props {
  hostName: string
  onQuit: () => void
}

/** Écran de l'hôte : crée la salle, affiche le lobby puis la partie. La salle est fermée en quittant l'écran. */
export function HostRoomScreen({ hostName, onQuit }: Props) {
  const [session, setSession] = useState<HostSession | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    let created: HostSession | null = null
    openRoomWithFreshCode(createPeerTransport()).then(
      (room) => {
        if (cancelled) {
          room.close()
          return
        }
        created = createHostSession({ room, hostName, seed: Math.floor(Math.random() * 2 ** 32) })
        setSession(created)
      },
      () => {
        if (!cancelled) setFailed(true)
      },
    )
    return () => {
      cancelled = true
      created?.dispose()
    }
  }, [hostName])

  if (failed) {
    return (
      <div className="home">
        <h1>Salle impossible à créer</h1>
        <p>Le serveur de mise en relation est injoignable. Vérifiez votre connexion et réessayez.</p>
        <button type="button" className="btn" onClick={onQuit}>
          Retour à l'accueil
        </button>
      </div>
    )
  }
  if (session === null) {
    return (
      <div className="home">
        <p role="status">Création de la salle…</p>
      </div>
    )
  }
  return <HostRoom session={session} onQuit={onQuit} />
}

function HostRoom({ session, onQuit }: { session: HostSession; onQuit: () => void }) {
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot)
  const controller = useMemo(() => createHostController(session), [session])
  const admin = useMemo(
    () => ({
      kick: (seat: number) => void session.kick(seat),
      replaceWithBot: (seat: number) => void session.replaceWithBot(seat),
    }),
    [session],
  )
  if (snapshot.stage === 'lobby') return <HostLobby session={session} lobby={snapshot} onQuit={onQuit} />
  return <GameScreen controller={controller} onQuit={onQuit} admin={admin} />
}

function HostLobby({ session, lobby, onQuit }: { session: HostSession; lobby: LobbySnapshot; onQuit: () => void }) {
  const [copied, setCopied] = useState(false)
  const link = buildInviteLink(window.location.href, lobby.code)
  const total = lobby.players.length + lobby.botCount

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
    } catch {
      // Presse-papiers indisponible : le lien reste sélectionnable dans le champ.
      setCopied(false)
    }
  }

  let reason: string | null = null
  if (total < MIN_PLAYERS) reason = `Il faut au moins ${MIN_PLAYERS} joueurs (humains et bots), il y en a ${total}.`
  else if (total > MAX_PLAYERS) reason = `Il y a au plus ${MAX_PLAYERS} joueurs (humains et bots), il y en a ${total}.`

  return (
    <div className="home lobby">
      <h1>Salle {lobby.code}</h1>
      <p>Partagez ce lien ou ce code avec vos invités :</p>
      <div className="code" aria-label="Code de la salle">
        {lobby.code}
      </div>
      <input readOnly value={link} aria-label="Lien d'invitation" onFocus={(e) => e.currentTarget.select()} />
      <button type="button" className="btn secondary" onClick={copyLink}>
        {copied ? 'Lien copié' : 'Copier le lien'}
      </button>

      <h2>Joueurs présents</h2>
      <ul>
        {lobby.players.map((name, index) => (
          <li key={index}>
            {name}
            {index === 0 ? ' (hôte)' : ''}
          </li>
        ))}
      </ul>

      <label htmlFor="bot-count">Nombre de bots</label>
      <select
        id="bot-count"
        value={lobby.botCount}
        onChange={(e) => session.setBots(Number(e.target.value), lobby.botKind)}
      >
        {Array.from({ length: MAX_PLAYERS + 1 }, (_, n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <label htmlFor="bot-kind">Type de bots</label>
      <select
        id="bot-kind"
        value={lobby.botKind}
        onChange={(e) => session.setBots(lobby.botCount, e.target.value as BotKind)}
      >
        <option value="heuristic">Heuristique (joue pour de vrai)</option>
        <option value="random">Aléatoire (facile)</option>
      </select>

      <p>
        Total : {total} joueur{total > 1 ? 's' : ''}.
      </p>
      {reason !== null && <p role="status">{reason}</p>}
      <button type="button" className="btn" disabled={!lobby.canStart} onClick={() => session.start()}>
        Démarrer la partie
      </button>
      <button type="button" className="btn secondary" onClick={onQuit}>
        Fermer la salle
      </button>
    </div>
  )
}
