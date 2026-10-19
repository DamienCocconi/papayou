import { describe, expect, it } from 'vitest'
import {
  PEER_ID_PREFIX,
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
  buildInviteLink,
  generateRoomCode,
  normalizeRoomCode,
  parseInviteHash,
  peerIdFromCode,
} from './room-code'

describe('room-code', () => {
  it("n'utilise que des caractères sans ambiguïté", () => {
    expect(ROOM_CODE_ALPHABET).not.toMatch(/[IO01]/)
  })

  it('génère un code de la bonne longueur dans l alphabet', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateRoomCode()
      expect(code).toHaveLength(ROOM_CODE_LENGTH)
      for (const char of code) expect(ROOM_CODE_ALPHABET).toContain(char)
    }
  })

  it('utilise le générateur fourni', () => {
    expect(generateRoomCode(() => 0)).toBe('AAAAA')
    expect(generateRoomCode(() => 0.999999)).toBe('99999')
  })

  it('normalise la saisie sans tenir compte de la casse ni des espaces', () => {
    expect(normalizeRoomCode(' k7qm2 ')).toBe('K7QM2')
  })

  it('refuse un code de mauvaise longueur ou avec un caractère interdit', () => {
    expect(normalizeRoomCode('K7QM')).toBeNull()
    expect(normalizeRoomCode('K7QM22')).toBeNull()
    expect(normalizeRoomCode('K7QM0')).toBeNull()
    expect(normalizeRoomCode('K7QMO')).toBeNull()
    expect(normalizeRoomCode('')).toBeNull()
  })

  it("préfixe l'identifiant PeerJS", () => {
    expect(peerIdFromCode('K7QM2')).toBe(`${PEER_ID_PREFIX}K7QM2`)
  })

  it('construit puis relit le lien (aller-retour)', () => {
    const link = buildInviteLink('https://exemple.fr/papayou/', 'K7QM2')
    expect(link).toBe('https://exemple.fr/papayou/#/rejoindre/K7QM2')
    expect(parseInviteHash(new URL(link).hash)).toBe('K7QM2')
  })

  it("remplace un fragment déjà présent dans l'adresse de base", () => {
    expect(buildInviteLink('https://exemple.fr/#/rejoindre/AAAAA', 'BBBBB')).toBe('https://exemple.fr/#/rejoindre/BBBBB')
  })

  it("ignore un fragment qui n'est pas un lien d'invitation", () => {
    expect(parseInviteHash('')).toBeNull()
    expect(parseInviteHash('#/autre/K7QM2')).toBeNull()
    expect(parseInviteHash('#/rejoindre/zzz')).toBeNull()
  })
})
