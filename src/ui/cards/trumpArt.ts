// Habillage des atouts : titre et illustration de chaque atout illustré. Purement cosmétique, aucune règle du jeu ici.
import type { Card } from '../../engine'
import trump01 from '../assets/trumps/trump-01.webp'
import trump02 from '../assets/trumps/trump-02.webp'
import trump03 from '../assets/trumps/trump-03.webp'
import trump04 from '../assets/trumps/trump-04.webp'
import trump05 from '../assets/trumps/trump-05.webp'
import trump06 from '../assets/trumps/trump-06.webp'
import trump07 from '../assets/trumps/trump-07.webp'
import trump08 from '../assets/trumps/trump-08.webp'
import trump09 from '../assets/trumps/trump-09.webp'
import trump10 from '../assets/trumps/trump-10.webp'
import trump11 from '../assets/trumps/trump-11.webp'
import trump12 from '../assets/trumps/trump-12.webp'
import trump13 from '../assets/trumps/trump-13.webp'
import trump14 from '../assets/trumps/trump-14.webp'
import trump15 from '../assets/trumps/trump-15.webp'
import trump16 from '../assets/trumps/trump-16.webp'
import trump17 from '../assets/trumps/trump-17.webp'
import trump18 from '../assets/trumps/trump-18.webp'
import trump19 from '../assets/trumps/trump-19.webp'
import trump20 from '../assets/trumps/trump-20.webp'
import trump21 from '../assets/trumps/trump-21.webp'

export interface TrumpArt {
  /** Titre en casse normale (« La tour ») ; l'affichage le passe en majuscules. */
  title: string
  /** URL de l'illustration, importée depuis `../assets/trumps/` pour que Vite l'empreinte. */
  image: string
}

/** Valeur de l'atout (1 à 21) -> habillage. Un atout absent garde l'affichage non illustré. */
export type TrumpArtTable = Readonly<Partial<Record<number, TrumpArt>>>

// Les 21 atouts sont illustrés. Pour changer une illustration : remplacer `../assets/trumps/trump-NN.webp`
// (portrait 3:4, ~600 px de large) ; pour changer un titre : modifier sa ligne ci-dessous.
// Retirer une ligne rend à l'atout l'affichage non illustré. Mode d'emploi complet : docs/illustrations-atouts.md.
export const TRUMP_ART: TrumpArtTable = {
  1: { title: 'La tour', image: trump01 },
  2: { title: 'La Vérité', image: trump02 },
  3: { title: 'Le pikamole', image: trump03 },
  4: { title: 'La Calédonie', image: trump04 },
  5: { title: "L'abus", image: trump05 },
  6: { title: 'Le Campus', image: trump06 },
  7: { title: 'Le Président', image: trump07 },
  8: { title: 'Le Comptoir', image: trump08 },
  9: { title: 'La Saint-Valentin', image: trump09 },
  10: { title: 'Le camion', image: trump10 },
  11: { title: 'Le partage', image: trump11 },
  12: { title: 'La roue', image: trump12 },
  13: { title: 'Le Courage', image: trump13 },
  14: { title: 'Le Référentiel', image: trump14 },
  15: { title: 'Le Régime', image: trump15 },
  16: { title: 'Le happy hour', image: trump16 },
  17: { title: 'Le Végétarien', image: trump17 },
  18: { title: 'La Planque', image: trump18 },
  19: { title: 'La Différence', image: trump19 },
  20: { title: 'La Mascarade', image: trump20 },
  21: { title: 'Le yaourt', image: trump21 },
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
