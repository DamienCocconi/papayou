# Proposal

## Why

Depuis `reduce-deck-three-players`, les figures ne sont jouées qu'à partir de 4 joueurs. Dans ce cas, on veut que le papayou soit le **10** de la couleur choisie, et non plus le 7 : c'est l'idée 9 de `docs/idees.md`, validée pendant l'exploration. À 3 joueurs, où les couleurs ne vont que de 1 à 10, le papayou reste le 7.

## What Changes

- Le papayou (50 points) devient le **10** de la couleur choisie à 4, 5 et 6 joueurs. À 3 joueurs, il reste le **7**.
- Le moteur expose une source unique pour savoir quelle carte est le papayou, à partir du nombre de joueurs et de la couleur choisie. Le calcul des points, les bots et l'interface s'y fient, sans coder « 7 » ni « 10 » eux-mêmes.
- L'invariant des 390 points par manche est inchangé : on ne retire jamais que des « 1 » et, à 3 joueurs, les figures, donc le 7 et le 10 de chaque couleur sont toujours en jeu.
- Le choix de la couleur du papayou reste libre : l'entameur peut choisir n'importe quelle couleur, y compris une dont il possède le papayou. C'est déjà le comportement du moteur ; la règle est reformulée pour lever l'ambiguïté notée dans l'idée 9.
- Le bot heuristique, comme entameur, choisit une couleur dont il ne possède pas **le papayou** (7 ou 10 selon la table), au lieu du 7 en dur.
- L'interface affiche la carte du papayou, hauteur comprise (par exemple « Papayou : 10 de ♥ »), et plus seulement sa couleur : la carte qui vaut 50 dépend désormais de la table.
- `docs/regles-papayou.md` est mis à jour avec l'accord explicite donné pendant l'exploration : sections 2, 3, 4 (étape 3) et 6 (exemples à 4 joueurs, dont l'exemple 2 qui utilise le papayou).

Hors périmètre :
- l'effet visuel sur la carte papayou (idée 10), traité dans un change séparé qui s'appuiera sur ce change ;
- toute option de variante dans l'interface : la hauteur du papayou est la règle selon le nombre de joueurs, pas un réglage.

## Capabilities

### New Capabilities

Aucune.

### Modified Capabilities

- `game-engine` : les exigences « Valeur en points des cartes » et « Choix du papayou » désignent le papayou comme le 7 à 3 joueurs et le 10 à partir de 4 joueurs, et le choix de couleur est explicitement libre.
- `bots` : l'exigence « Bot heuristique, échange et papayou » fait éviter au bot une couleur dont il possède le papayou de la table, et non plus le 7.
- `table-ui` : l'exigence « Choix du papayou » affiche la carte du papayou (hauteur et couleur) pendant la manche, et plus seulement sa couleur.

## Impact

- `src/engine/cards.ts` : hauteur du papayou selon le nombre de joueurs, test « est-ce le papayou », points d'une carte et d'une pile.
- `src/engine/game.ts`, `src/engine/scoring.ts` : passent le nombre de joueurs au calcul des points.
- `src/engine/index.ts` : export des nouvelles fonctions pour `bots` et `ui`.
- `src/bots/heuristic.ts` : choix du papayou et appels au calcul des points.
- `src/ui/screens/GameScreen.tsx`, `src/ui/labels.ts` : libellé du papayou.
- Tests : `cards.test.ts`, `scoring.test.ts`, `game.test.ts`, `heuristic.test.ts`, et le test d'interface qui vérifie le libellé.
- `docs/regles-papayou.md` (le contrat) et `docs/idees.md` (idée 9 rayée avec le nom du change).
- `net` : aucun changement. La vue de joueur porte déjà `playerCount` et `papayouSuit`, rien de neuf ne circule.
- Sauvegardes : la hauteur se déduit du nombre de joueurs, rien n'est ajouté à l'état. Une partie à 4 joueurs ou plus sauvegardée avant le changement compte le 10 comme papayou dès la reprise. Pas de migration.
