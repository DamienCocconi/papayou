# Design

## Context

Toutes les cartes sont dessinées par `CardView.tsx`, en CSS pur. Un atout montre son numéro dans le coin et le mot « Atout » au centre, sur un fond violet pâle (`.card.trump`). La même carte s'affiche à des tailles très différentes, toutes au format 2:3 :

| Contexte | Taille | Où c'est réglé |
|---|---|---|
| Main étalée | 64 x 96 px | `--card-w` / `--card-h` |
| Table, dernier pli (`small`) | 44 x 66 px | `.card.small` |
| Sièges en mode éventail | 30 x 45 px | `.game.fan .seat .card.small` |
| Éventail | variable, calculée par `fanLayout` | `--card-w` en ligne, `--fan-k` |

Plusieurs de ces règles fixent `padding` et `font-size` sur `.card` : le rendu en calques doit les neutraliser.

Pendant l'exploration, le cadre a été généré par une IA d'images (848 x 1264 px, soit 2:3 à 0,6 % près), avec une fenêtre remplie de vert `#00FF00`. Le vert a été détouré en transparence par un script ponctuel. La fenêtre mesurée va de (82, 82) à (765, 1033). Le cadre contient aussi un cercle vide en haut à gauche (centre ≈ (160, 153), diamètre ≈ 220 px) et un cartouche de titre vide en bas (≈ y 1058 à 1185, même largeur que la fenêtre). Une maquette navigateur a validé l'empilement et le rendu de 30 à 240 px.

Les tests Vitest tournent en environnement `node`, sans DOM : seule la logique pure se teste unitairement, le rendu se vérifie dans le navigateur.

## Goals / Non-Goals

**Goals:**
- Un seul composant de carte qui garde les mêmes proportions à toutes les tailles, sans règle CSS propre à chaque taille.
- Ajouter l'illustration d'un atout en déposant un fichier et en ajoutant une ligne dans une table, sans autre modification.
- Pouvoir remplacer le cadre par une autre image en ne changeant qu'un fichier et quelques pourcentages.

**Non-Goals:**
- Pas de vue agrandie de carte, pas de galerie.
- Pas de thème ni de variante de cadre (l'excuse viendra plus tard).
- Pas d'outillage de génération ou de détourage dans le dépôt : le cadre détouré est livré comme un fichier image.

## Decisions

### 1. Empilement en DOM, pas en canvas ni en image composée
Une carte d'atout illustré contient, dans l'ordre : `<img>` de l'illustration, `<img>` du cadre, `<span>` du numéro, `<span>` du titre, tous positionnés en absolu dans `.card`. L'illustration est placée à la position de la fenêtre, en pourcentages de la carte, avec un léger débord (environ 0,5 %) pour passer sous le trait noir du cadre. Elle est cadrée avec `object-fit: cover`. Le cadre couvre toute la carte (`inset: 0`).
- *Alternative écartée :* composer une image unique au build ou dans un canvas. Le texte ne serait plus net, la page plus lourde, et chaque changement de titre demanderait de régénérer l'image.
- *Alternative écartée :* le titre généré en image. Les IA écrivent mal, et le titre ne serait ni modifiable ni accessible.

### 2. Dimensions en pourcentages et en unités de conteneur
`.card` illustrée devient un conteneur (`container-type: inline-size`). Les positions des calques sont en `%` de la carte. Les tailles de police du numéro et du titre sont en `cqw`, une unité proportionnelle à la largeur de la carte. Toutes les mesures du cadre sont regroupées dans un seul bloc CSS commenté, avec leur origine en pixels sur l'image source, pour pouvoir changer de cadre sans chercher les valeurs partout.
- Piège relevé en maquette : sur la carte elle-même, `cqw` se rapporte au conteneur *parent*. Les propriétés de `.card` (par exemple `border-radius`) restent donc en `%` ou en variables existantes. `cqw` ne sert qu'aux enfants.
- Compatibilité : les unités de conteneur sont prises en charge par Chrome 105+, Safari 16+ et Firefox 110+, ce qui couvre les navigateurs cibles. Aucun polyfill n'est nécessaire.
- Les règles existantes qui fixent `padding` et `font-size` sur `.card` (éventail, sièges, `small`) sont neutralisées pour `.card.illustrated` (`padding: 0`). Le texte ne dépend que de `cqw`.

### 3. Table d'habillage dans `ui`, imports statiques
Un module `src/ui/cards/trumpArt.ts` expose une table `valeur → { title, image }` et une fonction pure `trumpArt(card)`. Cette fonction renvoie l'habillage d'un atout, ou `null` pour l'excuse, une carte de couleur ou un atout absent de la table. Les illustrations sont importées statiquement (`import tour from '../assets/trumps/trump-16.webp'`) : Vite les empreinte et les sert en chemin relatif, ce qui reste compatible avec `base: './'`. Un fichier manquant devient une erreur de build, pas un trou à l'écran.
- *Alternative écartée :* `import.meta.glob`, qui détecte automatiquement les fichiers présents. C'est pratique, mais un titre peut alors manquer sans erreur, et la table devient moins lisible.
- *Alternative écartée :* le dossier `public/` avec des URL en dur. Pas d'empreinte, donc risque de cache périmé, et aucune vérification au build.
- Un atout n'est illustré que s'il a **à la fois** un titre et une image dans la table. Le moteur n'est pas concerné : `Card` reste inchangé et rien ne circule sur le réseau.

### 4. Repli
- **Atout absent de la table :** `CardView` garde exactement le rendu actuel.
- **Image qui ne charge pas :** un `onError` masque l'illustration. Le cadre, le numéro et le titre restent affichés, la carte reste lisible et rien ne lève d'erreur.

### 5. Fichiers d'images
- **Cadre :** `src/ui/assets/trumps/frame.webp`. C'est le PNG détouré converti en WebP avec transparence et réduit à environ 600 px de large. C'est assez pour une carte de l'éventail sur écran à forte densité, et bien plus léger que l'original (107 Ko en PNG).
- **Illustrations :** `src/ui/assets/trumps/trump-NN.webp`, au format 3:4 portrait (la fenêtre fait environ 0,72 de rapport largeur/hauteur, donc le recadrage rogne quelques pourcents sur les côtés), environ 600 px de large, qualité ~80.
- **Préchargement :** au montage de l'écran de partie, un `new Image()` par URL de la table, pour éviter des cartes à trou lors de la première donne.

### 6. Police embarquée
On ajoute la dépendance `@fontsource/im-fell-english-sc` (licence OFL). Vite copie les fichiers de police dans le build, sans aucun appel à Google Fonts à l'exécution. Le titre passe en majuscules par `text-transform: uppercase`, avec un léger `letter-spacing`. La table garde le titre en casse normale, ce qui sert aussi pour le nom accessible.

Ajusté pendant la recette sur téléphone. Windows et Android ne lisent pas les mêmes métriques verticales dans le fichier de police : le texte ne tombait pas au même endroit selon l'appareil. On déclare donc notre propre `@font-face` (`'Papayou Fell'`, dans `src/ui/styles/fonts.css`) sur les fichiers de @fontsource, avec `ascent-override`, `descent-override` et `line-gap-override` imposés. Ces valeurs centrent les majuscules du titre et rendent le placement identique partout. Les chiffres « à l'ancienne » ont des hauteurs inégales. Le décalage vertical de chaque numéro est donc calculé par une fonction pure (`src/ui/cards/numberInk.ts`), à partir de l'encre de chaque chiffre mesurée une fois, et passé au CSS par une variable.

### 7. Nom accessible
`cardName` renvoie « Atout 16, La tour » pour un atout illustré, et « Atout 16 » sinon. Les images ont un `alt=""` (décoratives) : la description passe par le `title` / `aria-label` existant de la carte.

## Risks / Trade-offs

- **Traits du cadre trop fins en petit.** Un trait de 4 px sur 848 tombe sous le pixel à 64 px de large et paraît gris. → C'est accepté pour cette version (vu en maquette). Si ça gêne, on remplace le cadre par une version aux traits plus épais : un seul fichier à changer, sans toucher au code.
- **Titre illisible à 30 et 44 px.** C'est un choix assumé (cadre, texte et illustration à toutes les tailles). → Le numéro reste dans le cercle, qui est l'élément le plus lisible. L'info-bulle donne le titre.
- **Poids du site.** 22 images d'environ 30 à 50 Ko, soit environ 1 Mo au total une fois tout illustré. → WebP compressé et préchargement. C'est acceptable pour un site statique chargé une fois par partie.
- **Mesures du cadre approximatives.** Les positions du cercle et du cartouche ont été relevées à l'œil. → La tâche dédiée les mesure au pixel sur l'image détourée avant d'écrire le CSS.
- **Fichier source du cadre dans un dossier temporaire.** → Le cadre détouré est versionné dans le dépôt dès la première tâche.
- **Style des illustrations hétérogène** (génération IA). → C'est hors code : un prompt de style fixe, réutilisé pour chaque atout.

## Migration Plan

Aucune donnée à migrer. Le changement est purement visuel : tant que la table est vide, l'affichage est identique à aujourd'hui. Pour revenir en arrière, il suffit de vider la table.

## Open Questions

- Les titres des 21 atouts et leurs illustrations sont fournis par l'utilisateur au fil de l'eau. La table démarre avec les atouts déjà disponibles, et les autres gardent l'affichage actuel.
