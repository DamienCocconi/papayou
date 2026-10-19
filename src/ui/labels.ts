// Libellés d'affichage : noms des joueurs, symboles des couleurs, rangs. Aucune règle du jeu ici.
import type { Card, PlayerView, Suit } from '../engine'
import type { RoomErrorCode, SessionInfo } from '../net/protocol'

export const SUIT_SYMBOL: Record<Suit, string> = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }
export const SUIT_NAME: Record<Suit, string> = { hearts: 'Cœur', diamonds: 'Carreau', clubs: 'Trèfle', spades: 'Pique' }

const FIGURES: Record<number, string> = { 11: 'V', 12: 'C', 13: 'D', 14: 'R' }

export function rankLabel(rank: number): string {
  return FIGURES[rank] ?? String(rank)
}

/** Texte lisible d'une carte, pour les info-bulles et l'accessibilité. */
export function cardName(card: Card): string {
  switch (card.kind) {
    case 'suit':
      return `${rankLabel(card.rank)} de ${SUIT_NAME[card.suit].toLowerCase()}`
    case 'trump':
      return `Atout ${card.value}`
    case 'excuse':
      return 'Excuse'
  }
}

/** Nom affiché d'une place ; `names` (partie en réseau) remplace les noms par défaut « Joueur N ». */
/** Message lisible pour un refus de l'hôte ou du moteur. */
export function roomErrorText(code: RoomErrorCode): string {
  switch (code) {
    case 'paused':
      return 'La partie est en pause : une place est libre.'
    case 'invalidName':
      return 'Nom invalide : 1 à 20 caractères.'
    case 'nameTaken':
      return 'Ce nom est déjà pris.'
    case 'roomFull':
      return 'La salle est pleine.'
    case 'seatTaken':
      return 'Cette place est déjà prise.'
    case 'alreadySeated':
      return 'Vous avez déjà une place.'
    case 'notSeated':
      return "Vous n'avez pas de place."
    case 'notStarted':
      return "La partie n'a pas démarré."
    default:
      return `Action refusée (${code}).`
  }
}

export function playerName(seat: number, humanSeat: number, names?: readonly string[] | null): string {
  if (seat === humanSeat) return 'Vous'
  return names?.[seat] ?? `Joueur ${seat + 1}`
}

/** Noms de toutes les places d'une partie en réseau : joueurs, bots, absents. */
export function seatNames(session: SessionInfo, humanSeat: number): string[] {
  return session.seats.map((seat, index) => {
    if (seat.kind === 'human') return index === humanSeat ? 'Vous' : seat.name
    if (seat.kind === 'bot') return `Bot ${index + 1}`
    return `${seat.lastName} (absent)`
  })
}

/**
 * Place dont c'est le tour de poser une carte. Simple lecture d'affichage de la vue
 * (le moteur reste seul juge des coups légaux : voir `legalPlays` du contrôleur).
 */
export function turnSeat(view: PlayerView): number | null {
  if (view.phase !== 'playing') return null
  return (view.trickLeader + view.trick.length) % view.playerCount
}
