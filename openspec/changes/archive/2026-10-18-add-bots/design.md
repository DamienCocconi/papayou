# Design

## Context

Voir `proposal.md` pour la motivation. État actuel du moteur :

- `rules.ts` contient `legalCards(hand, trick)` (la vraie logique, non exportée) et `legalPlays(state, seat)` (exportée, exige un `GameState` complet).
- `PlayerView` contient déjà tout ce qu'il faut pour décider (main, pli en cours, `lastTrick`, scores), mais pas la liste des cartes déjà jouées.
- Une carte jouée finit toujours dans un tas `won` ou dans le pli en cours `trick` : la liste des cartes jouées se calcule donc depuis l'état existant, sans nouveau champ dans `GameState`.
- `testing.ts` a déjà un joueur aléatoire (`simulateGame`) qui lit l'état complet. Il reste réservé aux tests et n'est pas touché.
- Règle de dépendance du projet : `bots` n'importe que l'API publique de `engine` (`src/engine/index.ts`).

## Goals / Non-Goals

**Goals:**
- Des bots qui ne voient que leur vue et ne produisent que des coups acceptés.
- Une interface unique `Bot`, pour que l'hôte réseau et les tests traitent tous les bots de la même façon.
- Des tests déterministes (graine injectée).

**Non-Goals:**
- Déduire les couleurs manquées par les adversaires (demande l'historique pli par pli).
- Bots par simulation, niveaux de difficulté, temps de réflexion simulé pour l'interface.
- Brancher les bots sur l'hôte réseau ou l'interface (changements ultérieurs).

## Decisions

### 1. Coups légaux depuis la vue : `legalPlaysFromView(view)` dans `engine`
On exporte une fonction qui appelle `legalCards(view.hand, view.trick)` après avoir vérifié la phase et le tour (le tour se déduit de `trickLeader` et de la taille de `trick`). La règle reste à un seul endroit.
*Alternative écartée* : exporter simplement `legalCards`. Elle laisserait chaque appelant refaire le test « est-ce mon tour ? ».

### 2. Cartes déjà jouées : vue séparée `BotView`, pas un champ de `PlayerView`
`getBotView(state, seat)` renvoie `PlayerView & { playedCards: Card[] }`. `playedCards` est l'union des tas `won` de tous les joueurs et du pli en cours, triée (l'ordre ne révèle pas le contenu de chaque tas). La `PlayerView` des humains ne change pas : ils doivent se fier à leur mémoire, et c'est cette vue qui circule sur le réseau.
Les bots tournent sur l'hôte, qui a l'état complet : le réseau n'a pas à transporter `BotView`.
*Alternative écartée* : ajouter `playedCards` à `PlayerView`. Cela donnerait à l'interface une aide qu'on ne veut pas offrir aux humains.
*Alternative écartée* : bot avec mémoire propre. Cela le rendrait avec état, donc plus fragile à la reprise après déconnexion.

### 3. Interface `Bot` et fonction `botAction`
```
type Rng = ReturnType<typeof createRng>

interface Bot {
  chooseGift(view: BotView, rng: Rng): string[]      // 3 ids
  choosePapayou(view: BotView, rng: Rng): Suit
  choosePlay(view: BotView, rng: Rng): string        // id d'une carte légale
}

botAction(bot, view, rng): Action | null
```
`botAction` regarde la phase et le tour, appelle la bonne méthode et emballe le résultat en `Action`. Elle est identique pour tous les bots, donc écrite et testée une seule fois. Elle renvoie `null` quand ce n'est pas à ce bot d'agir.
*Alternative écartée* : une seule méthode `decide(view): Action | null` par bot, ce qui répète la logique « phase et tour » dans chaque bot.

### 4. Aléatoire injectable
Les bots reçoivent le `rng` du moteur (`createRng`) en paramètre. Ils ne lisent jamais `Math.random`. L'appelant (hôte, test) possède le générateur et le fait avancer.

### 5. Bot heuristique : règles simples, sans recherche
Objectif : faire le moins de points possible.
- **Don** : trier la main par points décroissants (excuse 100, atout 21 : 30, atouts 20 à 1, le papayou n'étant pas encore connu), donner les 3 premières. Égalité : la carte la plus forte d'abord (`order`, l'excuse en dernier).
- **Papayou** : couleurs dont le bot n'a pas le 7 ; au hasard parmi elles, ou parmi les quatre s'il a tous les 7.
- **Suite de pli** : pour chaque carte légale, on teste si elle remporterait le pli tel qu'il est posé, avec `trickWinner(trick + carte)`. Cette fonction exportée gère déjà l'excuse (seul atout du pli, entame forcée). Si au moins une carte perd : jouer celle qui vaut le plus de points. Sinon : jouer la plus faible (l'excuse compte comme la plus coûteuse, donc elle n'est jouée que si elle est seule).
- **Entame** : pour chaque carte légale, compter les cartes plus fortes de la même famille (même couleur, ou atouts) qui ne sont ni dans sa main, ni dans `playedCards`. Jouer la carte qui en a le plus ; départage par le moins de points, puis la plus faible. C'est le seul endroit qui utilise `playedCards`.

Limite assumée : « gagner le pli tel qu'il est posé » ignore les joueurs qui jouent après le bot. C'est une estimation, pas une garantie, d'où le test de force en moyenne et non cas par cas.

### 6. Tests
- Cas précis par règle (un test par scénario de la spec, avec `playingState` et `c()` de `testing.ts`).
- Parties complètes pour 3, 4, 5 et 6 joueurs, plusieurs dizaines de graines chacune : toutes les actions acceptées, invariants du moteur respectés.
- Déterminisme : mêmes graines, mêmes actions.
- Comparaison de force : un heuristique contre des aléatoires, plusieurs centaines de parties, chaque place testée. Seuil : moyenne strictement inférieure.

## Risks / Trade-offs

- [Le test de force est statistique et peut être instable] → graines fixes, donc résultat reproductible ; marge large attendue entre les deux bots. Si le seuil n'est pas atteint, c'est l'heuristique qu'on corrige, pas le test.
- [L'estimation d'entame ignore les adversaires sans la couleur, qui peuvent couper à l'atout] → acceptée pour cette version, le bot reste simple. Piste future : historique des plis.
- [`BotView` pourrait fuiter vers l'interface par erreur] → elle est exportée sous un nom explicite, et l'interface ne reçoit que `PlayerView`. Un test vérifie que `getPlayerView` n'expose pas `playedCards`.
- [Le papayou n'est pas connu à l'échange, donc le bot ne peut pas protéger ou donner le 7] → tolérable : les 50 points du 7 ne pèsent que si la couleur est choisie, et l'entameur la choisit hors de sa main.
