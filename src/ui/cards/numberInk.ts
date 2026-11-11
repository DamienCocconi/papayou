// Centrage optique du numéro d'un atout illustré. Purement visuel, aucune règle du jeu ici.

/**
 * Encre de chaque chiffre de la police des atouts, en em : [hauteur au-dessus de la ligne de base, profondeur
 * en dessous]. Mesuré au canvas (measureText) sur 'Papayou Fell', avec les métriques imposées dans fonts.css.
 * Les chiffres « à l'ancienne » ont des hauteurs inégales : 0, 1, 2 sont bas, 6 et 8 montent, 3, 4, 5, 7, 9 descendent.
 */
const DIGIT_INK: Readonly<Record<string, readonly [number, number]>> = {
  '0': [0.4, 0.01],
  '1': [0.42, 0.01],
  '2': [0.39, 0.01],
  '3': [0.41, 0.23],
  '4': [0.43, 0.24],
  '5': [0.45, 0.22],
  '6': [0.57, 0],
  '7': [0.4, 0.24],
  '8': [0.6, 0.01],
  '9': [0.44, 0.12],
}

/**
 * Position de la ligne de base, en em depuis le haut de la boîte centrée. La boîte du texte est rognée à la
 * hauteur des majuscules (0,73 em, text-box dans app.css) : la ligne de base est à 0,5 + 0,73 / 2 du haut.
 * Sans text-box, les métriques de fonts.css la placent à 0,85, soit un écart de 0,015 em, invisible.
 */
const BASELINE = 0.865

/**
 * Décalage vertical, en em, qui centre l'encre du numéro dans sa ligne (négatif : vers le haut).
 * Un texte sans chiffre connu n'est pas décalé.
 */
export function numberInkShift(text: string): number {
  const inks = [...text].map((char) => DIGIT_INK[char]).filter((ink) => ink !== undefined)
  if (inks.length === 0) return 0
  const above = Math.max(...inks.map(([a]) => a))
  const below = Math.max(...inks.map(([, b]) => b))
  const inkCenter = BASELINE - (above - below) / 2
  return Math.round((0.5 - inkCenter) * 1000) / 1000
}
