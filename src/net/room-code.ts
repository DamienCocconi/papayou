// Code de salle, identifiant PeerJS et lien d'invitation.

/** Lettres sans I ni O, chiffres de 2 à 9 : rien qui se confonde quand on dicte le code à voix haute. */
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const ROOM_CODE_LENGTH = 5

/** Préfixe des identifiants PeerJS : le serveur public est partagé avec d'autres applications. */
export const PEER_ID_PREFIX = 'papayou-'

const LINK_ROUTE = '#/rejoindre/'

/** Tire un code de salle. `random` renvoie un nombre dans [0, 1[ (injectable pour les tests). */
export function generateRoomCode(random: () => number = Math.random): string {
  let code = ''
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_ALPHABET.charAt(Math.floor(random() * ROOM_CODE_ALPHABET.length))
  }
  return code
}

/** Code saisi par l'utilisateur, remis en forme ; null s'il n'est pas valide. */
export function normalizeRoomCode(input: string): string | null {
  const code = input.trim().toUpperCase()
  if (code.length !== ROOM_CODE_LENGTH) return null
  for (const char of code) {
    if (!ROOM_CODE_ALPHABET.includes(char)) return null
  }
  return code
}

/** Identifiant PeerJS de la salle `code`. */
export function peerIdFromCode(code: string): string {
  return PEER_ID_PREFIX + code
}

/** Lien d'invitation : le code est dans le fragment (#), jamais envoyé au serveur d'hébergement. */
export function buildInviteLink(base: string, code: string): string {
  const withoutHash = base.split('#')[0] ?? base
  return withoutHash + LINK_ROUTE + code
}

/** Code contenu dans le fragment d'une adresse (`location.hash`), ou null. */
export function parseInviteHash(hash: string): string | null {
  if (!hash.startsWith(LINK_ROUTE)) return null
  return normalizeRoomCode(hash.slice(LINK_ROUTE.length))
}
