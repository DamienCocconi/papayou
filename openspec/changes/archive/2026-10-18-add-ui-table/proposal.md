# Proposal

## Why

Le moteur et les bots sont livrés, mais le jeu n'a toujours aucune interface : `src/ui/App.tsx` ne contient qu'un titre. On ne peut ni jouer ni vérifier à l'œil que les règles se comportent comme prévu. L'interface passe avant le réseau (décision prise en explorant), car elle peut tourner seule contre des bots, sans PeerJS.

## What Changes

- Un **contrôleur de jeu** (`GameController`) : l'interface ne lui demande qu'une `PlayerView` et ne lui envoie que des `Action`. Une première implémentation **locale** garde l'état complet en mémoire, fait jouer les bots à la place des autres joueurs, avec un petit délai pour que l'on voie les coups. Le réseau implémentera plus tard la même interface sans toucher aux composants.
- Un **écran d'accueil** : choix du nombre de joueurs (3 à 6), l'humain occupe une place, les autres sont des bots (au choix aléatoire ou heuristique).
- La **table de jeu** pour un humain contre des bots :
  - échange : choisir exactement 3 cartes, puis attente des autres ;
  - choix du papayou par l'entameur (humain ou bot) ;
  - jeu : pli en cours, ma main avec les cartes illégales grisées, dernier pli visible, indication de qui doit jouer ;
  - passage d'une manche à l'autre (bouton « Manche suivante ») et fin de partie avec un classement minimal.
- Des **cartes dessinées en CSS pur** (symboles Unicode pour les couleurs, V/C/D/R pour les figures, numéro pour les atouts). Interaction au **clic** : un premier clic sélectionne, un second joue.
- Mise en page pensée pour **PC** d'abord ; l'adaptation mobile est le sujet du changement suivant.

Hors périmètre : tableau des scores détaillé par manche, adaptation mobile, réseau PeerJS, sauvegarde `localStorage`, glisser-déposer, assets graphiques des cartes (figures dessinées sur mesure), animations élaborées.

## Capabilities

### New Capabilities
- `game-controller`: l'interface de contrôle d'une partie vue par un joueur (vue + actions), et son implémentation locale contre des bots (création d'une partie, enchaînement des tours de bots, cadence).
- `table-ui`: ce que l'utilisateur voit et peut faire pendant une partie : accueil, échange, choix du papayou, jeu d'un pli, fin de manche et de partie minimales.

### Modified Capabilities
<!-- Aucune : le moteur et les bots ne changent pas. -->

## Impact

- Code : nouveaux fichiers dans `src/ui/` (composants, styles CSS) et un module du contrôleur ; `App.tsx` remplacé. Le contrôleur est de la logique sans React, rangé de façon à pouvoir l'importer depuis `net` plus tard.
- Dépendances : aucune nouvelle (React est déjà installé).
- Tests : Vitest sur le contrôleur local seulement (config actuelle `environment: 'node'`, `*.test.ts`). Pas de tests de composants à ce stade.
- Documentation : `docs/contexte.md` déjà mis à jour pour l'ordre de la feuille de route.
- Moteur, bots : inchangés, utilisés par leur API publique (`src/engine/index.ts`, `src/bots/index.ts`).
