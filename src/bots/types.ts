// Types communs des bots. Un bot ne voit que sa vue (BotView) et ne garde aucun état entre deux décisions.
import type { BotView, createRng, Suit } from '../engine'

/** Générateur à graine fourni par l'appelant (hôte ou test) : le bot n'utilise jamais Math.random. */
export type Rng = ReturnType<typeof createRng>

export interface Bot {
  /** Ids des 3 cartes distinctes de sa main à donner (phase d'échange). */
  chooseGift(view: BotView, rng: Rng): string[]
  /** Couleur du papayou (quand le bot est l'entameur de la manche). */
  choosePapayou(view: BotView, rng: Rng): Suit
  /** Id d'une carte légale de sa main (phase de jeu, à son tour). */
  choosePlay(view: BotView, rng: Rng): string
}
