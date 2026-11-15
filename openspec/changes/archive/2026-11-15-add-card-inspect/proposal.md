# Proposal

## Why

Les 21 atouts sont désormais illustrés, mais les cartes restent petites à l'écran pour les besoins du jeu (main en éventail, cartes devant les sièges, détail du dernier pli) : on ne peut pas vraiment regarder les illustrations. Les joueurs doivent pouvoir afficher un atout illustré en grand, à tout moment de la partie, sans gêner le geste de jeu.

## What Changes

- Nouveau : agrandir un atout illustré dans le calque plein écran déjà utilisé pour le QR code (fond assombri, écran de derrière inactif, fermeture au premier clic ou toucher n'importe où).
- Déclenchement sur PC : **clic droit** sur un atout illustré, où qu'il soit affiché (pli en cours devant les sièges, dernier pli, emplacements d'échange, main étalée, carte en emphase de l'éventail).
- Déclenchement sur téléphone : **appui long immobile** (700 ms) sur un atout illustré : carte en emphase de l'éventail, cartes du pli en cours, du dernier pli, des emplacements d'échange, et de la main étalée, jouables ou grisées.
- En éventail, seule la **carte en emphase** s'agrandit : un appui long commencé sur une carte au repos ne fait rien, pour ne pas gêner la prise d'une carte.
- Un appui long ou un clic droit ne joue, ne sélectionne et ne déplace jamais de carte.
- Le menu contextuel du navigateur ne s'ouvre plus nulle part dans l'application (accueil, lobbies, jeu, calques, champs de saisie compris) : le copier-coller par ce menu est abandonné.
- Le calque ne se ferme plus que sur un toucher ou un clic **commencé sur lui** : le doigt de l'appui long, encore posé quand le calque apparaît, ne le referme pas en se levant.
- Fermer le calque rend l'écran tel qu'il était, carte en emphase comprise.
- Ni l'excuse ni les cartes de couleur ne s'agrandissent ; aucun signe visuel pendant l'appui.

Hors périmètre : agrandissement des cartes non illustrées, galerie des illustrations hors partie, zoom ou défilement dans le calque.

## Capabilities

### New Capabilities

Aucune.

### Modified Capabilities

- `table-ui` : nouvelles exigences sur l'agrandissement d'un atout illustré (déclencheurs, cartes concernées, absence d'effet sur le jeu, menu contextuel) ; l'exigence « Fermeture du calque » est précisée pour qu'un appui commencé avant l'ouverture ne ferme pas le calque.

## Impact

- `src/ui/App.tsx` : menu contextuel neutralisé sur tout le document.
- `src/ui/components/Lightbox.tsx` : fermeture seulement sur un appui commencé sur le calque.
- `src/ui/components/CardView.tsx` : un atout illustré devient « observable » (clic droit, appui long), grand format pour le calque ; cartes grisées en `aria-disabled` au lieu de `disabled` pour recevoir les événements.
- `src/ui/hand/handGesture.ts`, `useHandGesture.ts`, `src/ui/components/FanHand.tsx` : appui long sur la carte en emphase dans le réducteur du geste ; l'emphase conservée survit à la fermeture du calque.
- `src/ui/screens/GameScreen.tsx` : état de la carte agrandie, calque, suivi des doigts posés.
- `src/ui/cards/` (nouveaux) : contexte d'agrandissement, appui long (module pur et hook), suivi des doigts posés pour ignorer le menu natif d'Android.
- `src/ui/styles/app.css` : taille de la carte agrandie, style des cartes grisées en `aria-disabled`.
- Aucun changement dans `src/engine/`, `src/bots/`, `src/net/`. Aucune dépendance ajoutée.
