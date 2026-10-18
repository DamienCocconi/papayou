// Types du moteur de règles. Tout ce qui est ici est du JSON pur (pas de Map, Set, fonction ou classe).

/** Les quatre couleurs. L'ordre du tableau SUITS fixe l'ordre de création du paquet. */
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'

/** Carte de couleur : rang 1 à 14 (valet 11, cavalier 12, dame 13, roi 14). */
export interface SuitCard {
  kind: 'suit'
  /** Identifiant stable, ex. "hearts-7". */
  id: string
  suit: Suit
  rank: number
}

/** Atout numéroté de 1 à 21. */
export interface TrumpCard {
  kind: 'trump'
  /** Identifiant stable, ex. "trump-12". */
  id: string
  value: number
}

/** L'excuse : atout de force 0 pour désigner le gagnant, 100 points au décompte. */
export interface ExcuseCard {
  kind: 'excuse'
  id: 'excuse'
}

export type Card = SuitCard | TrumpCard | ExcuseCard

/** Phases d'une partie : exchange -> choosePapayou -> playing -> roundEnd (-> exchange...) -> gameEnd. */
export type Phase = 'exchange' | 'choosePapayou' | 'playing' | 'roundEnd' | 'gameEnd'

/** Une carte posée dans un pli par un joueur (place 0 à n-1). */
export interface Play {
  seat: number
  card: Card
}

/** Pli terminé, conservé pour l'affichage jusqu'à la fin du pli suivant. */
export interface CompletedTrick {
  leader: number
  plays: Play[]
  winner: number
  /** Points contenus dans le pli (papayou compris). */
  points: number
}

/**
 * État complet d'une partie (vue de l'hôte : contient toutes les mains).
 * Immuable par convention : on ne le modifie jamais, applyAction en produit un nouveau.
 */
export interface GameState {
  /** Version du format, pour la sauvegarde. */
  version: 1
  playerCount: number
  /** État du générateur à graine (entier 32 bits). Ne jamais l'envoyer aux joueurs. */
  rngState: number
  /** Cartes « 1 » retirées pour toute la partie (4 et 5 joueurs). */
  removedCards: Card[]
  phase: Phase
  /** Numéro de la manche en cours, à partir de 0. */
  roundIndex: number
  /** Joueur entameur de la manche (choisit le papayou, entame le premier pli). */
  roundLeader: number
  hands: Card[][]
  /** Cartes données pendant l'échange, par joueur (null = pas encore choisi). */
  gifts: (Card[] | null)[]
  papayouSuit: Suit | null
  /** Entameur du pli en cours. */
  trickLeader: number
  /** Cartes déjà posées dans le pli en cours, dans l'ordre de jeu. */
  trick: Play[]
  lastTrick: CompletedTrick | null
  /** Tas de plis gagnés, par joueur. */
  won: Card[][]
  tricksPlayed: number
  /** Points de chaque manche terminée : roundScores[manche][joueur]. */
  roundScores: number[][]
  /** Total cumulé par joueur. */
  totals: number[]
  /** Places finales par joueur (classement de compétition), renseigné en phase gameEnd. */
  ranking: number[] | null
}

/** Actions possibles. Chaque action n'est valide que dans sa phase. */
export type Action =
  | { type: 'giveCards'; seat: number; cardIds: string[] }
  | { type: 'choosePapayou'; seat: number; suit: Suit }
  | { type: 'playCard'; seat: number; cardId: string }
  | { type: 'nextRound' }

export type ActionErrorCode =
  | 'wrongPhase'
  | 'invalidSeat'
  | 'notYourTurn'
  | 'alreadyGave'
  | 'wrongCardCount'
  | 'duplicateCard'
  | 'cardNotInHand'
  | 'illegalPlay'
  | 'invalidSuit'

/** Résultat explicite : en cas d'échec l'état n'est pas modifié. */
export type ActionResult =
  | { ok: true; state: GameState }
  | { ok: false; error: ActionErrorCode }

/** Ce que voit un joueur : sa main, jamais celles des autres. */
export interface PlayerView {
  seat: number
  playerCount: number
  removedCards: Card[]
  phase: Phase
  roundIndex: number
  roundLeader: number
  /** Ma main (pendant l'échange : avant échange, donc cartes à donner comprises). */
  hand: Card[]
  /** Taille de la main de chaque joueur (publique). */
  handSizes: number[]
  /** Qui a déjà choisi ses cartes à donner (public), sans révéler lesquelles. */
  hasGiven: boolean[]
  /** Mes propres cartes données, si j'ai déjà choisi. */
  myGift: Card[] | null
  papayouSuit: Suit | null
  trickLeader: number
  trick: Play[]
  lastTrick: CompletedTrick | null
  /** Mon tas de plis (les autres tas sont cachés). */
  myWon: Card[]
  /** Nombre de cartes gagnées par chaque joueur. */
  wonCounts: number[]
  tricksPlayed: number
  roundScores: number[][]
  totals: number[]
  ranking: number[] | null
}
