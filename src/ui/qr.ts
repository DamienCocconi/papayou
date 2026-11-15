// QR code du lien d'invitation : encodage en matrice de modules et dessin en chemin SVG.
import { encode } from 'uqr'

/** Marge blanche autour du QR code, en modules : 4 est le minimum prévu par la norme pour une lecture fiable. */
export const QR_QUIET_ZONE = 4

/** Matrice carrée des modules du QR code de `text` (true = module noir), sans marge. Correction d'erreur M. */
export function encodeQr(text: string): boolean[][] {
  return encode(text, { ecc: 'M', border: 0 }).data
}

/**
 * Chemin SVG des modules noirs de `matrix`, un carré de 1 x 1 par module, l'origine en haut à gauche.
 * Un seul chemin pour tout le QR code : le navigateur n'a qu'un élément à dessiner.
 */
export function qrPath(matrix: readonly (readonly boolean[])[]): string {
  const parts: string[] = []
  matrix.forEach((row, y) => {
    row.forEach((dark, x) => {
      if (dark) parts.push(`M${x} ${y}h1v1h-1z`)
    })
  })
  return parts.join('')
}
