# Tasks

## 1. Dépendance et rendu du QR code

- [x] 1.1 Ajouter `uqr` aux dépendances (`npm install uqr`) et vérifier que `npm run build` passe et que `package-lock.json` n'ajoute aucune dépendance transitive
- [x] 1.2 Écrire la fonction pure `qrPath(matrix: boolean[][])` dans `src/ui/qr.ts`, qui produit le chemin SVG des modules noirs, et `src/ui/qr.test.ts` : matrice vide, un seul module, module en (x, y) bien placé, aucun segment pour un module blanc. Vérifier avec `npm test`
- [x] 1.3 Écrire dans `src/ui/qr.ts` l'encodage du lien (`uqr`, correction M) en matrice, et tester qu'un lien d'invitation typique (`https://damiencocconi.github.io/papayou/#/rejoindre/K7XQ3`) donne une matrice carrée de taille 21 + 4k. Vérifier avec `npm test`
- [x] 1.4 Créer `src/ui/components/InviteQr.tsx` (SVG carré, fond blanc, marge de 4 modules par le `viewBox`, `role="img"`, nom accessible, `crispEdges`) et ses styles de taille `min(92vw, 92dvh)` avec repli `vh`. Vérifier avec `npm run build`

## 2. Calque générique `Lightbox`

- [x] 2.1 Créer `src/ui/components/Lightbox.tsx` : portail dans `document.body`, plein écran fixe, fond assombri, `role="dialog"`, `aria-modal`, `aria-label`, focus sur le calque à l'ouverture, avec un commentaire qui le présente comme réutilisable (contenu quelconque). Vérifier avec `npm run build`
- [x] 2.2 Fermer au `click` sur la racine (sans `stopPropagation` sur le contenu) et à Échap. Pendant le montage, poser `inert` sur `#root` et `overflow: hidden` sur `body`, puis tout retirer et rendre le focus au démontage. Vérifier en relisant que rien ne ferme sur `pointerdown`/`touchstart` et que le nettoyage est dans le retour de l'effet
- [x] 2.3 Ajouter les styles `.lightbox*` dans `app.css`, avec un `z-index` supérieur à toutes les valeurs existantes et le contenu centré. Vérifier que `.overlay` n'est pas modifié (`git diff src/ui/styles/app.css`)

## 3. Boutons dans les lobbies

- [x] 3.1 Lobby de l'hôte (`HostRoomScreen.tsx`) : calculer le lien depuis `session.code` et ajouter « Afficher le QR code » sous « Copier le lien », qui ouvre `Lightbox` + `InviteQr`. Vérifier dans le navigateur que le QR s'ouvre, se ferme au clic sur le QR, sur le fond et par Échap, et que le focus revient au bouton
- [x] 3.2 Lobby de l'invité (`GuestRoomScreen.tsx`, après le nom) : même bouton avec le lien de son `code`. Vérifier dans le navigateur qu'il est présent une fois le nom donné et absent sur l'écran de saisie du nom
- [x] 3.3 Vérifier dans le navigateur, sur le lobby de l'hôte avec le QR ouvert : un clic à l'emplacement de « Lancer la partie » ferme seulement le calque, Tab n'atteint aucun bouton du lobby, la page ne défile pas, et un invité qui rejoint pendant ce temps apparaît dans la liste à la fermeture

## 4. Bouton QR en jeu

- [x] 4.1 Ajouter la prop `inviteLink?: string` à `GameScreen`, l'icône `QrIcon` et le bouton icône en tête de `.topbar-actions` (`aria-label`, `title`), rendu seulement si la prop est fournie. Le passer depuis `HostRoomScreen` et `GuestRoomScreen`. Vérifier dans le navigateur que le bouton est présent chez l'hôte et chez l'invité, et absent en partie locale
- [x] 4.2 Vérifier en éventail, menu d'administration ouvert, que le calque passe devant la main et le panneau, et que le panneau est toujours ouvert à la fermeture
- [x] 4.3 Vérifier à 360 x 640 et à 640 x 360, en éventail, chez l'hôte d'une partie à 6 joueurs, que tous les boutons de la barre du haut sont visibles sans défiler. Si ce n'est pas le cas, resserrer `.topbar-actions` dans la media query `max-width: 480px`, puis vérifier de nouveau

## 5. Vérification d'ensemble et documentation

- [x] 5.1 Lancer `npm test` et `npm run build` : tout passe
- [x] 5.2 Vérifier que les dépendances sont respectées : aucun fichier de `src/engine/`, `src/bots/` ni `src/net/` modifié (`git diff --stat`)
- [x] 5.3 Vérifier dans le navigateur, onglet réseau ouvert, qu'afficher le QR code n'émet aucune requête
- [x] 5.4 Noter dans `docs/contexte.md` que le QR code encode l'adresse courante, donc qu'il faut le site publié (ou `vite --host` ouvert par l'IP du PC) pour le tester sur téléphone. Vérifier que la note est présente
- [x] 5.5 Scanner le QR code avec un vrai téléphone sur le site publié (ou en `vite --host`) et vérifier qu'on arrive sur l'écran de saisie du nom de la bonne salle

## Workflow follow-up

- Relecture par `qa-reviewer` avant de considérer le change terminé.
- Archiver le change (`/opsx:archive`) une fois livré.
