# Proposal

## Why

Autour d'une table, faire rejoindre ses collègues est pénible : il faut leur envoyer le lien d'invitation par une messagerie, ou leur dicter le code de la salle pour qu'ils le saisissent. Le lien contient déjà le code et ouvre directement la salle. Il suffit donc de le montrer sous forme de QR code : chacun le scanne avec l'appareil photo de son téléphone et arrive sur l'écran où il donne son nom.

## What Changes

- Dans le lobby de l'hôte, un bouton « Afficher le QR code » est ajouté sous « Copier le lien ».
- Le même bouton apparaît dans le lobby de l'invité, une fois son nom donné. Il n'apparaît pas sur l'écran de saisie du nom.
- En partie en réseau, la barre du haut gagne un bouton icône en forme de QR code, chez l'hôte comme chez les invités. Il n'existe pas en partie locale.
- Ces boutons ouvrent un calque plein écran :
  - le fond est assombri et laisse voir l'écran de derrière, qui devient inactif ;
  - le QR code du lien d'invitation y est affiché en noir sur blanc, aussi grand que la fenêtre le permet, sans légende ;
  - un clic n'importe où, sur le QR comme sur le fond, ferme le calque et ramène à l'écran d'avant. Échap le ferme aussi.
- Le calque est un composant générique, indépendant de son contenu, pour être réutilisé plus tard (illustrations des atouts en grand).
- Le QR code est généré dans le navigateur, sans service externe.
- Hors périmètre :
  - le partage natif (`navigator.share`) ;
  - le maintien de l'écran allumé ;
  - un lecteur de QR code dans l'application (on se sert de l'appareil photo du téléphone) ;
  - l'agrandissement des illustrations d'atouts, qui fera l'objet d'un change à part.

## Capabilities

### New Capabilities

Aucune.

### Modified Capabilities

- `table-ui` :
  - l'exigence « Lobby de l'hôte » évolue, avec le bouton « Afficher le QR code » chez l'hôte et chez l'invité ;
  - de nouvelles exigences décrivent le calque du QR code (affichage, fermeture, écran de derrière inactif) et le bouton QR de la barre du haut en jeu.

`multiplayer-room` ne change pas : le QR code contient le lien d'invitation existant, dont l'ouverture est déjà spécifiée (« Rejoindre par lien ou par code »).

## Impact

- `src/ui/components/` : un nouveau composant de calque générique et un composant de QR code.
- `src/ui/screens/` :
  - `HostRoomScreen.tsx` et `GuestRoomScreen.tsx` : bouton dans les lobbies, lien d'invitation transmis à l'écran de jeu ;
  - `GameScreen.tsx` : bouton icône dans la barre du haut.
- `src/ui/styles/app.css` : styles du calque et du QR code.
- Dépendances : une petite bibliothèque d'encodage QR, sans dépendances transitives.
- Aucun changement dans `src/engine/`, `src/bots/`, `src/net/` ni dans le protocole réseau.
