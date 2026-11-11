// Habillage des atouts : titre et illustration de chaque atout illustré. Purement cosmétique, aucune règle du jeu ici.
import type { Card } from '../../engine'
import placeholderFeast from '../assets/trumps/placeholder-feast.webp'
import placeholderTower from '../assets/trumps/placeholder-tower.webp'

export interface TrumpArt {
  /** Titre en casse normale (« La tour ») ; l'affichage le passe en majuscules. */
  title: string
  /** URL de l'illustration, importée depuis `../assets/trumps/` pour que Vite l'empreinte. */
  image: string
}

/** Valeur de l'atout (1 à 21) -> habillage. Un atout absent garde l'affichage non illustré. */
export type TrumpArtTable = Readonly<Partial<Record<number, TrumpArt>>>

// Illustrations provisoires, en attendant les vraies : chaque atout pointe sur l'une des deux.
// Pour illustrer un atout pour de bon : déposer `../assets/trumps/trump-NN.webp` (portrait 3:4, ~600 px de large),
// l'importer ci-dessous (`import trump16 from '../assets/trumps/trump-16.webp'`)
// puis remplacer l'image de sa ligne (`16: { title: 'La tour', image: trump16 }`).
// Retirer une ligne rend à l'atout l'affichage non illustré. Mode d'emploi complet : docs/illustrations-atouts.md.
export const TRUMP_ART: TrumpArtTable = {
  1: { title: 'Le voyage', image: placeholderFeast },
  2: { title: 'Le pont', image: placeholderTower },
  3: { title: 'Le partage', image: placeholderFeast },
  4: { title: 'La forge', image: placeholderTower },
  5: { title: "L'atelier", image: placeholderFeast },
  6: { title: 'Le marché', image: placeholderTower },
  7: { title: 'Le phare', image: placeholderFeast },
  8: { title: 'La moisson', image: placeholderTower },
  9: { title: 'La foire', image: placeholderFeast },
  10: { title: 'La roue de la fortune', image: placeholderTower },
  11: { title: 'Le banquet', image: placeholderFeast },
  12: { title: 'Le pendu', image: placeholderTower },
  13: { title: 'Le jardin', image: placeholderFeast },
  14: { title: 'Le puits', image: placeholderTower },
  15: { title: 'La fête', image: placeholderFeast },
  16: { title: 'La tour', image: placeholderTower },
  17: { title: 'Le moulin', image: placeholderFeast },
  18: { title: 'La lune', image: placeholderTower },
  19: { title: 'Le soleil', image: placeholderFeast },
  20: { title: 'Le bal', image: placeholderTower },
  21: { title: 'Le monde', image: placeholderFeast },
}

/** Habillage d'une carte, ou null pour l'excuse, une carte de couleur ou un atout sans titre ni illustration. */
export function trumpArt(card: Card, table: TrumpArtTable = TRUMP_ART): TrumpArt | null {
  if (card.kind !== 'trump') return null
  const art = table[card.value]
  return isComplete(art) ? art : null
}

/** URL des illustrations réellement affichées (titre et image présents), pour les précharger. */
export function trumpArtImages(table: TrumpArtTable = TRUMP_ART): string[] {
  return Object.values(table).filter(isComplete).map((art) => art.image)
}

/** Un atout n'est illustré qu'avec à la fois un titre et une image. */
function isComplete(art: TrumpArt | undefined): art is TrumpArt {
  return art !== undefined && art.title !== '' && art.image !== ''
}
