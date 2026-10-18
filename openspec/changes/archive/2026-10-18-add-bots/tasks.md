# Tasks

## 1. Moteur : coups légaux depuis une vue

- [x] 1.1 Ajouter `legalPlaysFromView(view)` dans `src/engine/rules.ts` (phase et tour vérifiés, puis `legalCards`) et l'exporter depuis `src/engine/index.ts` ; vérifier avec des tests dans `rules.test.ts` : liste identique à `legalPlays` à chaque coup de parties simulées (3 à 6 joueurs), liste vide hors tour et hors phase de jeu.

## 2. Moteur : vue pour les bots

- [x] 2.1 Ajouter le type `BotView` et `getBotView(state, seat)` dans `src/engine/view.ts` (union des tas `won` et du pli en cours), l'exporter depuis `src/engine/index.ts` ; vérifier avec des tests dans `view.test.ts` : liste vide en début de manche, aucune carte en double ni restée en main, aucune main adverse, et `getPlayerView` ne contient pas `playedCards`.
- [x] 2.2 Lancer `npm test` et vérifier que tous les tests du moteur passent, anciens comme nouveaux.

## 3. Bots : interface, pilote et bot aléatoire

- [x] 3.1 Créer `src/bots/types.ts` (interface `Bot`, type `Rng`) et `src/bots/driver.ts` avec `botAction(bot, view, rng)` ; vérifier avec `driver.test.ts` : une action par phase correcte, `null` quand ce n'est pas son tour ou qu'il a déjà donné.
- [x] 3.2 Créer `src/bots/random.ts` (don, papayou, coup légal au hasard) et `src/bots/index.ts` ; vérifier avec `random.test.ts` : 3 cartes distinctes de la main, carte jouée toujours légale.
- [x] 3.3 Écrire un utilitaire de test `src/bots/testing.ts` qui joue une partie complète avec des bots (un bot par place, graines de partie et de bots), puis vérifier avec un test que le bot aléatoire va au bout de parties à 3, 4, 5 et 6 joueurs sur plusieurs dizaines de graines, sans action refusée, avec les invariants du moteur (390 points par manche, aucune carte perdue ni dupliquée), et que deux parties de mêmes graines sont identiques.

## 4. Bots : bot heuristique

- [x] 4.1 Créer `src/bots/heuristic.ts` avec le don (les 3 cartes les plus chères) et le choix du papayou (couleur dont il n'a pas le 7) ; vérifier avec `heuristic.test.ts` : excuse et 21 donnés, papayou hors de sa main, cas des quatre 7.
- [x] 4.2 Ajouter le jeu en suite de pli (carte qui perd la plus chère, sinon la plus faible, via `trickWinner`) ; vérifier avec des tests précis : se débarrasser d'une carte chère sans gagner, excuse qui perd, excuse seul atout du pli évitée, obligé de gagner avec la plus faible, excuse seule carte légale.
- [x] 4.3 Ajouter l'entame (cartes plus fortes encore en jeu, via `playedCards`) ; vérifier avec des tests précis, dont un cas où `playedCards` change le choix.
- [x] 4.4 Vérifier avec un test que le bot heuristique va au bout de parties à 3, 4, 5 et 6 joueurs sans action refusée (même utilitaire qu'en 3.3).
- [x] 4.5 Ajouter le test de force : un heuristique contre des aléatoires sur plusieurs centaines de parties à graines fixes, chaque place tour à tour ; vérifier que sa moyenne de points est strictement inférieure à celle des aléatoires et noter les chiffres obtenus dans le compte rendu.

## 5. Relecture et vérification d'ensemble

- [x] 5.1 Faire relire par `qa-reviewer` (règles, specs, tests) et corriger ses remarques.
- [x] 5.2 Vérifier que `bots` n'importe rien d'autre que `src/engine/index.ts` (recherche des imports) et que `npm test` et `npm run build` réussissent.

## Workflow follow-up

- Archiver le changement une fois la relecture passée (`/opsx:archive`), ce qui met à jour les specs de référence `bots` et `game-engine`.
