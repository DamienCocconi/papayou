# Proposal

## Why

Depuis `add-fan-layout`, l'échange force l'affichage étalé, ce qui rompt le jeu en éventail à chaque début de manche. Faire glisser les cartes une à une dans 3 emplacements visibles prolonge le geste de jeu, rend l'objectif évident sans explication et complète l'expérience en éventail.

## What Changes

- **3 emplacements vides** s'affichent dans la zone de jeu pendant l'échange, en éventail.
- **Glisser une carte** de la main vers le haut, au-dessus de la ligne de jeu, la place dans le premier emplacement vide. Elle quitte alors l'éventail.
- **Retirer une carte :** un petit bouton sous chaque carte placée la renvoie dans l'éventail.
- **Valider :** un bouton « Donner ces 3 cartes » apparaît une fois les 3 emplacements remplis. Il n'y a pas d'envoi automatique, pour laisser la possibilité de retirer une carte.
- **Changer d'affichage :** les cartes placées deviennent les cartes sélectionnées de l'étalé, et inversement. La place de chaque carte dans les emplacements est conservée.
- **Après le don :** les cartes restent visibles dans les emplacements, sans bouton de retrait, jusqu'à la fin de l'échange.
- **Retrait :** l'échange n'est plus forcé en étalé, et le bouton d'affichage reste disponible pendant l'échange.

**Hors périmètre :**
- l'animation de la carte jusqu'à son emplacement, et de l'emplacement vers la main ;
- l'arrivée visible des cartes reçues ;
- l'affichage de l'ordre (1, 2, 3) sur les cartes en étalé ;
- l'idée 14 de `docs/idees.md` (reprise d'une place de bot qui a déjà donné), qui reste un bug à traiter à part.

## Capabilities

### New Capabilities

Aucune.

### Modified Capabilities

- `table-ui` : nouvelles exigences sur les emplacements d'échange ; l'exigence « Échange de trois cartes » distingue les deux affichages ; suppression de « Échange affiché en étalé » ; « Emphase et sélection entre les deux affichages » ne vaut plus que pour la phase de jeu.

## Impact

- **Dépendance :** s'applique après `add-fan-layout` et `add-fan-gestures`, une fois ceux-ci archivés. Les exigences modifiées ou supprimées provenant de ces changes doivent déjà figurer dans la spec de référence.
- **Code :** `src/ui/screens/GameScreen.tsx`, `src/ui/components/Hand.tsx`, nouveau composant `GiftSlots`, `src/ui/styles/app.css`. Nouveau module pur `src/ui/hand/giftDraft.ts`, avec ses tests. Le hook du geste reçoit la destination de la carte relâchée.
- **Sans impact :** moteur, bots, protocole réseau et contrôleurs. Le moteur reçoit toujours 3 cartes via l'action `giveCards`. Aucune nouvelle dépendance.
