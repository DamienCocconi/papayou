# Design

## Context

Le moteur gère déjà les cartes retirées pour toute la partie : `createGame` tire les « 1 » retirés une fois, les range dans `state.removedCards`, et chaque manche distribue « paquet complet moins `removedCards` ». `handSize(n)` calcule la taille d'une main à partir de 78 et d'un nombre de cartes retirées propre à chaque nombre de joueurs.

Les autres modules lisent cette liste sans connaître les règles qui la produisent :
- la vue par joueur publie `removedCards` ;
- le bot heuristique déduit les cartes encore invisibles du paquet complet moins `removedCards`, sa main et les cartes jouées ;
- l'interface et le réseau se fient à la taille réelle des mains (`handSizes`) et à `handSize`.

L'outil de test `playingState` part de `createGame(n, 1)` puis remplace les mains par des mains écrites à la main, en gardant `removedCards`. Plusieurs tests à 3 joueurs (règles, bot heuristique) y placent des figures (`H12`, `H13`, `H14`).

## Goals / Non-Goals

**Goals:**
- Exprimer le paquet réduit à 3 joueurs uniquement par la liste des cartes retirées, sans nouveau champ dans l'état.
- Ne rien changer aux distributions des parties à 4, 5 et 6 joueurs pour une graine donnée.

**Non-Goals:**
- Une table générale de « variantes par nombre de joueurs » (elle viendra si l'idée 9 en a besoin).
- Toute adaptation de la stratégie des bots au paquet réduit.

## Decisions

### Les figures rejoignent `removedCards`

À 3 joueurs, `removedCards` contient les 16 figures suivies des 2 « 1 » tirés au hasard (18 cartes). La distribution, la vue, la sérialisation et le bot heuristique en tiennent compte sans modification.

Alternative écartée : un paquet de base paramétré (`createDeck(maxRank)`) avec seulement les « 1 » dans `removedCards`. Il faudrait alors transmettre la composition du paquet aux bots et à la vue, et les invariants « paquet complet = mains + tas + pli + retirées » des tests ne tiendraient plus. Garder un seul mécanisme de retrait est plus simple.

### Le nombre de cartes retirées reste la source de `handSize`

La règle « combien de cartes retirées selon le nombre de joueurs » reste une fonction unique du module `game.ts`, qui renvoie maintenant 18 pour 3 joueurs. `handSize(n) = (78 − retirées) / n` donne alors 20, 19, 15, 13 sans autre changement.

### Tirage aléatoire inchangé

Le mélange des quatre « 1 » est fait pour tous les nombres de joueurs, comme aujourd'hui, et seuls les 2 premiers sont gardés à 3 joueurs (comme à 4). L'état du générateur consommé reste identique : une graine donne exactement la même partie qu'avant à 4, 5 et 6 joueurs.

### `playingState` part d'une liste de cartes retirées vide

Les états construits à la main décrivent leurs mains explicitement. Hériter des figures retirées à 3 joueurs rendrait ces états incohérents (une même carte en main et retirée) et fausserait le comptage du bot heuristique. `playingState` remet donc `removedCards` à `[]`. Les tests existants à 3 joueurs gardent leurs mains telles quelles.

Alternative écartée : passer ces tests à 4 joueurs. Elle modifierait l'ordre de jeu et les plis décrits dans chaque test, pour un gain nul.

## Risks / Trade-offs

- [Une partie à 3 joueurs sauvegardée avant le changement] → Son état sérialisé garde `removedCards` vide : elle se termine à 26 cartes, ce qui est cohérent. Aucune migration.
- [Le bot heuristique a été réglé sur un paquet complet] → Il reste correct (il ne joue que des coups légaux et compte les cartes à partir de `removedCards`), il peut simplement être moins fin à 3 joueurs. Accepté, hors périmètre.
- [Des tests d'interface simulent des mains de 26 cartes (éventail)] → Ils testent la mise en page pour une taille de main donnée, pas la règle : ils restent valides et ne sont pas modifiés.
