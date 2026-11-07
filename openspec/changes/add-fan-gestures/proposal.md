# Proposal

## Why

Avec `add-fan-layout`, l'éventail s'affiche mais se joue encore en deux touchers sur des bandes de 16 px : peu confortable au doigt, et il cache les cartes qu'on veut lire. Le geste inspiré des jeux de cartes roguelike (balayer la main pour lire, tirer une carte vers le haut pour la jouer) règle ces deux problèmes et donne à la partie sa sensation de main de cartes.

## What Changes

- **Emphase :** en éventail, balayer la main du doigt ou la survoler à la souris met une carte en avant. Elle grossit, se redresse, passe devant les autres et reste visible au-dessus du doigt.
- **Voisines :** les cartes autour de l'emphase glissent sur les côtés, et l'éventail se referme quand l'emphase s'arrête.
- **Jouer :** tirer une carte vers le haut la prend en main, et la relâcher au-dessus d'une ligne indiquée la joue. La relâcher en dessous la remet dans la main.
- **Coups refusés :** une carte injouable ne part pas, et un message générique explique que le coup est impossible. La légalité vient toujours du moteur.
- **Réseau :** une carte relâchée attend la réponse de l'hôte sans revenir dans la main, et y retourne en cas de refus.
- **BREAKING (interface) :** en éventail, deux touchers ne jouent plus une carte. Cette façon de jouer reste disponible en étalé.
- Lecture possible hors de son tour et sur les cartes injouables.

**Hors périmètre :**
- les 3 emplacements d'échange : l'échange reste en étalé jusqu'à `add-gift-slots` ;
- l'animation de la carte jusqu'à la table et le ramassage du pli (idées 12 et 13 de `docs/idees.md`) ;
- le jeu au clavier dans l'éventail : l'affichage étalé reste la voie d'accès au clavier ;
- le réordonnancement de la main et les vibrations.

## Capabilities

### New Capabilities

Aucune.

### Modified Capabilities

- `table-ui` : nouvelles exigences sur l'emphase, le geste de jeu et ses interruptions en éventail ; l'exigence « Jouer par sélection puis confirmation » ne vaut plus que pour l'étalé.

## Impact

- **Dépendance :** s'applique après `add-fan-layout`, une fois celui-ci archivé. Ce change s'appuie sur sa géométrie (`fanLayout`) et sur son composant `Hand`.
- **Code :** `src/ui/components/Hand.tsx`, `src/ui/screens/GameScreen.tsx`, `src/ui/styles/app.css`. Nouveau composant `src/ui/components/FanHand.tsx`, nouveau hook et nouveaux modules purs dans `src/ui/hand` pour l'emphase et les états du geste, avec leurs tests.
- **Sans impact :** moteur, bots, protocole réseau et contrôleurs. Aucune nouvelle dépendance.
- **Recette :** le ressenti se juge sur un vrai téléphone ; les tests automatiques ne couvrent que la logique.
