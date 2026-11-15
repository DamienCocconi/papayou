# Design

## Context

- Le lien d'invitation existe déjà : `buildInviteLink(base, code)` dans `src/net/room-code.ts` produit `<adresse du site>#/rejoindre/<CODE>`, et `App.tsx` ouvre directement la salle quand l'adresse contient ce fragment. Le QR code n'est qu'une nouvelle façon de montrer ce lien.
- `GameScreen` ne reçoit qu'un `controller` et, chez l'hôte, des actions `admin?`. Rien de ce qu'il lit (`ControllerSnapshot`, `SessionInfo`) ne contient le code de la salle. Les écrans qui l'enveloppent, `HostRoomScreen` et `GuestRoomScreen`, le connaissent.
- La classe `.overlay` existante (`app.css`) sert aux panneaux de `GameScreen` (fin de manche, administration). Elle est en `position: absolute` dans `.stage`, et ses panneaux contiennent des boutons, donc un clic dessus ne doit pas fermer. En éventail, la main (`.hand-zone`) est en `z-index: 25`, au-dessus de ces panneaux.
- Vitest ne lance que `src/**/*.test.ts`, sans DOM. L'interface est vérifiée dans le navigateur.

## Goals / Non-Goals

**Goals:**
- Un calque générique (`Lightbox`) qui ne sait rien de son contenu, réutilisable tel quel pour agrandir une illustration d'atout.
- Un composant QR (`InviteQr`) qui ne sait rien du calque.
- Aucun changement hors de `src/ui/` et de `package.json`.

**Non-Goals:**
- Remplacer ou fusionner la `.overlay` des panneaux existants.
- Animer l'ouverture du calque.
- Gérer plusieurs calques empilés.

## Decisions

### 1. Deux composants indépendants, composés par les écrans

```
src/ui/components/
  Lightbox.tsx   props : onClose, label (nom accessible), children
  InviteQr.tsx   props : link

Ecran (lobby ou GameScreen)
  const [qrOpen, setQrOpen] = useState(false)
  <button onClick={() => setQrOpen(true)}>...</button>
  {qrOpen && <Lightbox label="QR code d'invitation" onClose={() => setQrOpen(false)}>
              <InviteQr link={inviteLink} />
            </Lightbox>}
```

Ouvert veut dire monté : c'est l'écran qui décide. Le calque n'a pas d'état interne d'ouverture. Pour les atouts, il suffira de mettre une autre carte en `children`.

*Alternative écartée :* un composant `QrLightbox` tout-en-un. C'est plus court aujourd'hui, mais il faudrait le défaire au change des atouts.

### 2. Un nom distinct de `.overlay`, et un portail vers `document.body`

Le calque est rendu avec `createPortal(..., document.body)` en `position: fixed; inset: 0`, avec un `z-index` au-dessus de tout le reste. Le portail le sort des contextes d'empilement de `.game.fan` et de `.hand-zone`, sans toucher aux `z-index` existants. Les classes CSS sont préfixées `lightbox` pour ne pas se confondre avec `.overlay`.

*Alternative écartée :* le monter dans `.stage` et régler les `z-index`. C'est fragile, et ça dépend de l'écran où il est monté.

### 3. Fermeture au `click`, jamais au `pointerdown`

L'élément racine du calque porte `onClick={onClose}`. Le contenu n'arrête pas la propagation, donc un clic sur le QR ferme aussi. Fermer au `pointerdown` ou au `touchstart` ferait disparaître le calque avant le `click`, qui retomberait alors sur l'élément de derrière (par exemple « Lancer la partie »). Au `click`, l'événement est consommé par le calque, toujours présent à ce moment-là.

Échap est écouté par un `keydown` sur `document`, posé pendant le montage.

### 4. L'écran de derrière rendu inerte

Pendant le montage, dans un `useLayoutEffect` (synchrone, pour que `inert` soit retiré avant l'affichage de l'écran suivant quand le calque disparaît avec son écran) :
- `#root` reçoit l'attribut `inert`. Le calque, rendu par portail dans `body` hors de `#root`, reste interactif. Le clavier et les lecteurs d'écran n'atteignent plus l'écran de derrière, et `inert` est supporté par tous les navigateurs cibles.
- `body` reçoit `overflow: hidden` pour bloquer le défilement.
- Le calque reçoit le focus (`tabIndex={-1}`, `role="dialog"`, `aria-modal="true"`, `aria-label`).

Au démontage, le système retire `inert` et `overflow`, puis rend le focus à l'élément qui l'avait (`document.activeElement` mémorisé à l'ouverture), s'il est encore dans le document. Un seul calque à la fois : deux calques superposés se partageraient `inert`, limite documentée dans le composant. L'écran de derrière reste monté : React continue de le mettre à jour, ce qui satisfait l'exigence « Arrivée d'un joueur pendant l'affichage ».

### 5. QR encodé avec `uqr`, dessiné en SVG par nous

`uqr` (MIT, sans dépendance, ESM, types inclus) fournit `encode(text)`, qui renvoie la matrice de modules. `InviteQr` en tire un unique `<path>` SVG : chaque module noir devient un carré `M x y h1 v1 h-1 z`. Le fond est un `<rect>` blanc. La marge blanche (« quiet zone ») est de 4 modules autour de la matrice, ajoutée par le `viewBox`. La correction d'erreur est au niveau M : le lien fait environ 60 caractères, ce qui donne un QR de version 4 ou 5, très lisible.

La conversion matrice vers chemin est une fonction pure (`qrPath(matrix)`) dans `src/ui/qr.ts`, testée par Vitest. Elle ne dépend que de `boolean[][]`, pas de `uqr`.

Le SVG porte `role="img"` et `aria-label="QR code du lien d'invitation"`, avec `shape-rendering="crispEdges"`.

*Alternatives écartées :*
- `qrcode-generator`, fiable mais en CommonJS ancien, sans types fournis ;
- `qrcode`, plus lourd (dépendances, canvas) ;
- un service web d'images QR : il enverrait le code de salle à un tiers et ne fonctionnerait pas hors ligne. La spec l'interdit.

### 6. Taille : le plus grand carré qui tient

Le contenu du calque est centré (flex), et le SVG a `width: min(92vw, 92dvh)` et `height` égale, avec un repli `vh` pour les navigateurs sans `dvh`. Comme `viewBox` est carré, le QR reste carré. Le fond blanc et la marge font partie du SVG, pas du calque, qui reste neutre pour d'autres contenus.

### 7. Le lien d'invitation transmis à `GameScreen` par une prop

`GameScreen` gagne `inviteLink?: string`, sur le modèle de `admin?`. Le bouton QR de la barre du haut n'est rendu que si la prop est fournie :
- `HostRoomScreen` passe `buildInviteLink(window.location.href, code)` ;
- `GuestRoomScreen` fait de même avec son `code`. `buildInviteLink` retire le fragment, donc le résultat est le même que l'invité soit arrivé par lien ou par code saisi ;
- la partie locale (`App.tsx`) ne passe rien, donc pas de bouton.

Côté hôte, `HostSession` expose déjà `readonly code` : `HostRoom` calcule le lien une fois (`useMemo`) depuis `session.code`, et le passe au lobby comme à `GameScreen`. `net/` ne change pas.

*Alternative écartée :* ajouter le code dans `SessionInfo`. Ça ferait circuler sur le réseau, à chaque vue, une donnée que chaque écran a déjà localement, et ça toucherait `net/` et le protocole.

### 8. L'icône

`QrIcon` est un SVG en ligne de 20 x 20 dans `GameScreen.tsx`, à côté de `GridIcon` et `FanIcon` (`fill="currentColor"`, `aria-hidden`). Il représente trois carrés de repérage et quelques modules. Le bouton reprend `btn secondary icon-btn`, avec `aria-label="Afficher le QR code d'invitation"` et un `title`. Il est placé en tête des actions, avant le bouton d'affichage de la main.

## Risks / Trade-offs

- [La barre du haut de l'hôte déborde sur un petit écran (deux badges, puis QR, main, Administration, Quitter)] → Le bouton QR est un bouton icône étroit. On vérifie à 360 x 640 et à 640 x 360 en éventail. Si ça ne tient pas, on resserre `.topbar-actions` dans la media query `max-width: 480px` existante.
- [Le QR est inutilisable en développement local : `location.href` vaut `localhost`] → On le signale dans `docs/contexte.md` ou dans le README de dev. On teste sur téléphone avec le site publié, ou avec `vite --host` en ouvrant l'IP du PC.
- [`inert` posé sur `#root` à la main pourrait rester en place si le démontage échoue] → Le nettoyage est fait dans la fonction de retour de l'effet, appelée par React à chaque démontage, y compris le double rendu de StrictMode.
- [Un panneau de `GameScreen` à `z-index` élevé passerait devant le calque] → Le portail dans `body`, avec un `z-index` supérieur à toute valeur de `app.css`, l'empêche. On le vérifie en éventail avec le menu d'administration ouvert.
- [La luminosité d'écran faible de l'hôte gêne le scan] → Noir sur blanc pur, grande taille et marge de 4 modules. On ne règle pas la luminosité (non accessible depuis le web).

## Migration Plan

Pas de migration : ajout purement visuel, sans donnée stockée ni changement de protocole. Pour revenir en arrière, on retire les composants et la dépendance.
