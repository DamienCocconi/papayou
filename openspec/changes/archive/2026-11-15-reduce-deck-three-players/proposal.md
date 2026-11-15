# Proposal

## Why

À 3 joueurs, chacun reçoit 26 cartes et une manche dure 26 plis. C'est nettement plus long qu'à 4 joueurs (19 plis), et la partie de 3 manches s'étire. On veut ramener une manche à 3 joueurs à une durée proche de celle à 4 joueurs.

## What Changes

- À 3 joueurs, les **16 figures** (valet, cavalier, dame, roi des quatre couleurs) sont retirées pour toute la partie : les couleurs ne vont plus que de 1 à 10.
- À 3 joueurs, **2 cartes « 1 » de couleur** sont en plus retirées au hasard, une seule fois au début de la partie, comme à 4 et 5 joueurs.
- Il reste 60 cartes en jeu (40 − 2 cartes de couleur, 21 atouts, l'excuse) : **20 cartes par joueur et 20 plis par manche**, au lieu de 26.
- Le papayou reste le 7 de la couleur choisie. Il est toujours en jeu, puisqu'on ne retire que des « 1 » et des figures.
- Les points ne changent pas : les figures valent 0, l'invariant de 390 points par manche tient.
- Rien ne change à 4, 5 et 6 joueurs.
- `docs/regles-papayou.md` est mis à jour (tableau de la section 2, phrase sur les cartes retirées, décision validée n° 1), avec l'accord explicite donné pendant l'exploration.

Hors périmètre :
- le passage du papayou au 10 à partir de 4 joueurs (idée 9), traité dans un change séparé ;
- tout réglage de variante dans l'interface : le paquet réduit est la règle à 3 joueurs, pas une option.

## Capabilities

### New Capabilities

Aucune.

### Modified Capabilities

- `game-engine` : l'exigence « Mise en place selon le nombre de joueurs » retire à 3 joueurs les 16 figures et 2 « 1 » de couleur ; l'exigence « Distribution » passe de 26 à 20 cartes par joueur à 3 joueurs.

## Impact

- `src/engine/game.ts` : calcul des cartes retirées et de `handSize` selon le nombre de joueurs.
- `src/engine/testing.ts` : l'outil `playingState`, qui construit des mains choisies à la main, ne doit pas hériter des figures retirées à 3 joueurs.
- Tests du moteur (`game.test.ts`, `view.test.ts`, `testing.test.ts`) : tailles de main, cartes retirées, figures absentes à 3 joueurs.
- `docs/regles-papayou.md` : section 2 et section 8.
- `docs/idees.md` : l'idée 8 est rayée avec le nom du change.
- Aucun changement attendu dans `bots`, `net` ni `ui` : ils s'appuient déjà sur `removedCards`, `handSize` et la taille réelle des mains. Le bot heuristique déduit les cartes encore en jeu du paquet complet moins les cartes retirées, il tient donc compte des figures sans modification.
- Sauvegardes : une partie à 3 joueurs commencée avant le changement garde ses cartes retirées (vides) dans son état sérialisé et se termine à 26 cartes. Pas de migration.
