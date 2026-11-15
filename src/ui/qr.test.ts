import { describe, expect, it } from 'vitest'
import { encodeQr, qrPath } from './qr'

describe('qrPath', () => {
  it('ne dessine rien pour une matrice vide', () => {
    expect(qrPath([])).toBe('')
  })

  it('dessine un carré de 1 x 1 pour un seul module noir', () => {
    expect(qrPath([[true]])).toBe('M0 0h1v1h-1z')
  })

  it('place chaque module noir à sa colonne (x) et à sa ligne (y)', () => {
    const matrix = [
      [false, false, false],
      [false, false, true],
    ]
    expect(qrPath(matrix)).toBe('M2 1h1v1h-1z')
  })

  it('ne dessine aucun segment pour les modules blancs', () => {
    expect(qrPath([[false, false], [false, false]])).toBe('')
    expect(qrPath([[true, false], [false, true]])).toBe('M0 0h1v1h-1zM1 1h1v1h-1z')
  })
})

describe('encodeQr', () => {
  const link = 'https://damiencocconi.github.io/papayou/#/rejoindre/K7XQ3'

  it("donne une matrice carrée d'une taille de QR code valide (21 + 4k), sans marge", () => {
    const matrix = encodeQr(link)
    const size = matrix.length
    expect(size).toBeGreaterThanOrEqual(21)
    expect((size - 21) % 4).toBe(0)
    for (const row of matrix) expect(row).toHaveLength(size)
  })

  it('commence par un motif de repérage (coin supérieur gauche noir), donc sans bordure blanche', () => {
    const matrix = encodeQr(link)
    expect(matrix[0]?.[0]).toBe(true)
    expect(matrix[0]?.slice(0, 7).every((dark) => dark)).toBe(true)
  })

  it('est déterministe pour un même lien', () => {
    expect(encodeQr(link)).toEqual(encodeQr(link))
  })
})
