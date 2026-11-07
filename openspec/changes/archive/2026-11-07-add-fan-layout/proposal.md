# Proposal

## Why

La main s'affiche aujourd'hui en grille : à 19 cartes sur un téléphone, elle prend 4 rangées (environ 400 px) et oblige à faire défiler la page entre la table et ses cartes. Une main en éventail, ancrée en bas d'un écran fixe, garde tout visible d'un coup d'œil et prépare le jeu au geste (`add-fan-gestures`) et aux emplacements d'échange (`add-gift-slots`).

## What Changes

- Nouvel affichage de la main **en éventail** : un arc en bas de l'écran, cartes superposées, dans l'ordre du moteur. C'est l'affichage par défaut.
- L'affichage actuel devient le mode **étalé**. Un bouton permet de passer de l'un à l'autre, et le choix est mémorisé sur l'appareil.
- En éventail, **l'écran de jeu ne défile pas**, en portrait comme en paysage. Les panneaux (fin de manche, fin de partie, administration, dernier pli) restent accessibles dans cet écran.
- En étalé, la page défile comme aujourd'hui, mais la barre du haut et le message de statut restent visibles.
- Le coin des cartes affiche le rang **et** la couleur, pour rester lisible quand les cartes se chevauchent.
- Le résumé du dernier pli reste visible en éventail, et ses cartes s'affichent à la demande.
- Après une carte posée, les cartes restantes glissent vers leur nouvelle place.
- Sur un écran plus grand qu'un téléphone, les cartes de l'éventail s'agrandissent avec la place disponible, dans la limite d'un plafond.

La façon de jouer ne change pas dans ce change : on joue toujours en deux clics, dans les deux modes. L'échange s'affiche en étalé jusqu'à `add-gift-slots`, pour que le jeu reste complet à chaque livraison.

**Hors périmètre :**
- le balayage, l'emphase et le glissement vers le haut (`add-fan-gestures`) ;
- les 3 emplacements d'échange (`add-gift-slots`) ;
- la réduction du nombre de cartes à 3 joueurs, déjà prévue à part ;
- la disposition des joueurs en cercle, et les idées 6, 12 et 13 de `docs/idees.md`.

## Capabilities

### New Capabilities

Aucune.

### Modified Capabilities

- `table-ui` : nouvelles exigences sur les deux affichages de la main, la mémorisation du choix et les écrans fixe et défilant ; modification de l'affichage des cartes (coin) et de la consultation du dernier pli.

## Impact

- **Code :** `src/ui/components/Hand.tsx`, `CardView.tsx`, `LastTrick.tsx`, `src/ui/screens/GameScreen.tsx`, `src/ui/styles/app.css`, `index.html` (encoche). Nouveaux modules purs dans `src/ui` pour la géométrie de l'éventail et la préférence d'affichage, avec leurs tests.
- **Sans impact :** moteur, bots, réseau et protocole. Aucune nouvelle dépendance.
- **Stockage :** première préférence enregistrée dans `localStorage`, sur chaque appareil.
- **Livraison :** une fusion sur `main` est mise en ligne automatiquement ; le jeu doit donc rester complet à la fin de ce change.
