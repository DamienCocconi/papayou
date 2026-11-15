# Design

## Context

Aujourd'hui, le papayou est le 7 codé en dur à deux endroits :

- `src/engine/cards.ts`, `cardPoints(card, papayouSuit)` : `card.rank === 7 && card.suit === papayouSuit`. Tous les calculs de points passent par là (`pilePoints`, `computeRoundScores`, `pointsOf`, les points du dernier pli dans `finishTrick`).
- `src/bots/heuristic.ts`, `choosePapayou` : filtre les couleurs dont le bot possède le 7.

`GameState` et `PlayerView` (donc `BotView`) portent déjà `playerCount` et `papayouSuit`. L'interface affiche seulement la couleur du papayou (`GameScreen.tsx`, badge « Papayou : ♥ Cœur »).

Contrainte du projet : aucune règle dans `ui` ni dans `net`. C'est au moteur de dire quelle carte est le papayou.

## Goals / Non-Goals

**Goals :**
- Une seule source dans le moteur pour la hauteur du papayou, utilisée par les points, le bot et l'interface.
- Fournir à un futur change (l'effet visuel sur la carte papayou) un moyen direct de reconnaître la carte, sans dupliquer la règle.

**Non-Goals :**
- Regrouper toutes les variantes par nombre de joueurs (cartes retirées, taille des mains, papayou) dans une table unique, comme le suggérait l'idée 9. Les fonctions de `game.ts` restent telles quelles ; un tel regroupement serait un refactoring séparé.
- Changer le format de l'état ou de la vue.

## Decisions

### 1. La hauteur se déduit du nombre de joueurs, elle n'est pas stockée

`papayouRank(playerCount)` renvoie 7 pour 3 joueurs et 10 au-delà. Rien n'est ajouté à `GameState` ni à `PlayerView`.

- Pourquoi : `playerCount` est déjà partout où l'on calcule des points, et la hauteur ne varie pas pendant une partie. Pas de champ en double qui pourrait diverger, pas de migration des sauvegardes ni du protocole réseau.
- Alternative écartée : stocker `papayouRank` (ou la carte papayou) dans l'état. C'est plus explicite dans le JSON, mais il faut le sérialiser, le valider à la reprise et le faire circuler, pour une information que le moteur sait recalculer.

### 2. API du moteur

Dans `src/engine/cards.ts`, exportées par `src/engine/index.ts` :

- `papayouRank(playerCount: number): number` ;
- `isPapayou(card: Card, papayouSuit: Suit | null, playerCount: number): boolean` : faux tant que la couleur n'est pas choisie ;
- `cardPoints(card, papayouSuit, playerCount)` et `pilePoints(cards, papayouSuit, playerCount)` prennent le nombre de joueurs en plus et s'appuient sur `isPapayou`.

`computeRoundScores` reçoit aussi `playerCount`. Dans `game.ts`, les appels utilisent `state.playerCount`.

- Pourquoi un paramètre en plus plutôt qu'un objet « papayou » `{ suit, rank }` : chaque appelant possède déjà la couleur et le nombre de joueurs (dans l'état ou la vue). Un objet obligerait à le construire à chaque appel, sans gain de lisibilité.
- `isPapayou` est la fonction que l'interface, et plus tard l'effet visuel, utiliseront pour reconnaître la carte. L'interface ne compare jamais une hauteur elle-même.

### 3. Bot heuristique

`choosePapayou` filtre les couleurs pour lesquelles le bot possède une carte telle que `isPapayou(card, suit, view.playerCount)`. Les appels à `cardPoints` passent `view.playerCount`. Au don, le papayou n'est pas encore connu : l'appel avec une couleur nulle reste inchangé, et ne compte donc ni le 7 ni le 10.

### 4. Libellé de l'interface

Le badge devient « Papayou : 10 ♥ Cœur » (hauteur et symbole toujours visibles, le nom de la couleur garde sa classe `suit-name`, masquable sur écran étroit). La hauteur vient du moteur (`papayouRank(view.playerCount)`) et est mise en forme dans `src/ui/labels.ts` par une petite fonction testée (par exemple `papayouLabel`), qui réutilise `rankLabel`, `SUIT_SYMBOL` et `SUIT_NAME`.

### 5. Règles de référence

`docs/regles-papayou.md` reçoit le texte validé pendant l'exploration :
- section 2 : « le 7 et le 10 de chaque couleur sont toujours en jeu » ;
- section 3 : « Papayou (dans la couleur choisie pour la manche : le 7 à 3 joueurs, le 10 à partir de 4 joueurs) » ;
- section 4, étape 3 : « Il peut choisir n'importe quelle couleur, y compris une dont il possède le papayou » ;
- section 6 : « Papayou : 10 de cœur. 4 joueurs », et le 10 de cœur dans l'exemple 2 (le résultat, 50 + 8 = 58 pour D, ne change pas).

## Risks / Trade-offs

- [Une partie à 4 joueurs ou plus sauvegardée en cours de manche avant le déploiement] → À la reprise, le 10 devient le papayou pour la fin de la manche, alors que les joueurs ont joué en pensant au 7. Les points du dernier pli déjà stockés dans `lastTrick` ont été calculés avec l'ancienne règle. Acceptable pour un jeu entre amis : la manche suivante est entièrement cohérente, et aucune migration n'est prévue.
- [Le 10 est plus fort que le 7 dans sa couleur] → Le papayou gagne plus souvent le pli et il est plus difficile de s'en débarrasser. C'est un effet voulu de la règle. L'heuristique du bot en suite de pli reste valable ; la comparaison avec le bot aléatoire (spec `bots`) le vérifie.
- [Oublier un appel à `cardPoints` resté à deux arguments] → Le paramètre est obligatoire : `tsc -b` signale chaque appel oublié, dans le code comme dans les tests.
