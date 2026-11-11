# Illustrations des atouts

Comment changer le titre, l'illustration ou le cadre d'un atout. Ces habillages sont purement visuels : ils ne touchent ni aux règles ni au réseau, et le moteur (`src/engine/`) n'est jamais concerné.

## Comment une carte d'atout est construite

Chaque atout illustré est un empilement de quatre calques, du dessous vers le dessus :

```
+---------------------+
|(16)                 |   4. numéro, en texte (React/CSS)
| +-----------------+ |
| |                 | |   1. illustration propre à l'atout (image)
| |  illustration   | |
| |                 | |
| +-----------------+ |   2. cadre commun à tous les atouts (image à fenêtre transparente)
| [     LA TOUR     ] |   3. titre, en texte (React/CSS), en majuscules
+---------------------+
```

| Calque | Où | Fichier |
|---|---|---|
| Titre et illustration de chaque atout | table `TRUMP_ART` | [`src/ui/cards/trumpArt.ts`](../src/ui/cards/trumpArt.ts) |
| Images (illustrations et cadre) | dossier | `src/ui/assets/trumps/` |
| Position des calques, police, tailles | bloc `.card.illustrated` | [`src/ui/styles/app.css`](../src/ui/styles/app.css) |
| Police | `@font-face` « Papayou Fell » | [`src/ui/styles/fonts.css`](../src/ui/styles/fonts.css) |

Un atout n'est illustré que s'il a **à la fois** un titre et une image dans la table. Sinon, il garde l'affichage simple (numéro et mot « Atout »). L'excuse n'est pas concernée pour l'instant.

Pour vérifier un changement : `npm run dev`, puis lancer une partie. Le serveur recharge tout seul à chaque modification.

## Changer le titre d'un atout

Dans [`src/ui/cards/trumpArt.ts`](../src/ui/cards/trumpArt.ts), chaque atout a sa ligne :

```ts
16: { title: 'La tour', image: placeholderTower },
```

Modifie le texte du titre.

- **Casse normale** : écris `'La tour'`, pas `'LA TOUR'`. L'affichage passe en majuscules tout seul, et l'info-bulle de la carte (« Atout 16, La tour ») garde la casse normale.
- **Apostrophe** : entoure le titre de guillemets doubles, par exemple `"L'atelier"`.
- **Longueur** : un titre long rétrécit automatiquement pour tenir dans le cartouche. Au-delà d'une vingtaine de caractères, il devient petit, donc mieux vaut rester court.

## Changer l'illustration d'un atout

### 1. Préparer l'image

- **Format portrait 3:4**, environ **600 px de large** (600 x 800). La fenêtre du cadre est un peu plus étroite que du 3:4 : environ 4 % sont rognés de chaque côté.
- **Sujet centré**, avec de la marge sur les bords.
- **Rien d'important en haut à gauche** : le cercle du numéro recouvre ce coin.
- **Ni texte, ni bordure, ni cadre** dans l'image : le cadre et le titre sont ajoutés par le jeu.
- **En `.webp`** de préférence, qualité 80 environ. Le `.png` et le `.jpg` fonctionnent aussi, mais pèsent plus lourd.
- Les cartes s'affichent souvent en très petit (30 à 70 px de large). Une silhouette forte, peu d'éléments et des couleurs contrastées restent lisibles bien plus longtemps qu'une scène détaillée.

Exemple de fin de prompt pour une IA d'images, à réutiliser mot pour mot d'une illustration à l'autre pour garder un style cohérent :

```text
Vertical portrait, aspect ratio 3:4. One strong central subject, few elements, high contrast,
centered with margins on all sides, nothing important in the top-left corner.
No text, no letters, no numbers, no border, no frame, full bleed.
```

### 2. Brancher l'image

Exemple pour l'atout 16 :

1. Dépose le fichier dans `src/ui/assets/trumps/`, par exemple `trump-16.webp`.
2. En haut de [`trumpArt.ts`](../src/ui/cards/trumpArt.ts), à côté des autres imports, ajoute :
   ```ts
   import trump16 from '../assets/trumps/trump-16.webp'
   ```
3. Remplace l'image de la ligne de l'atout :
   ```ts
   16: { title: 'La tour', image: trump16 },
   ```

Si le nom du fichier est mal écrit, `npm run build` (et le serveur de dev) échoue avec un message qui nomme le fichier : on ne peut pas livrer une carte à trou.

### Illustrations provisoires

Tant que les vraies images ne sont pas faites, chaque atout pointe sur l'une des deux images provisoires, `placeholder-tower.webp` ou `placeholder-feast.webp`. Une fois les 21 vraies images branchées, tu peux supprimer ces deux fichiers et leurs deux lignes d'import.

### Revenir à l'affichage simple

Supprime la ligne de l'atout dans la table.

## Changer le cadre

Le cadre est une seule image, `src/ui/assets/trumps/frame.webp`, commune à tous les atouts. Sa fenêtre est transparente : l'illustration est placée dessous. Le cadre contient aussi un cercle vide (pour le numéro) et un cartouche vide (pour le titre). Le numéro et le titre sont écrits par le jeu, aux positions de ces deux zones.

Remplacer le cadre demande donc deux choses : la nouvelle image, et les positions de ses trois zones dans le CSS.

### 1. Générer le cadre

Une IA d'images ne sait pas produire un trou transparent. On lui demande plutôt une fenêtre remplie d'un vert uni, qu'on supprime ensuite. Exemple de prompt :

```text
A blank playing card FRAME, front view, perfectly flat, no perspective, no shadow, no background:
the image IS the card, edge to edge, with square corners.
Image size: 1024 x 1536 pixels (portrait, ratio 2:3). This ratio is mandatory.
Style: minimal, warm cream card (#F3EAD7), thin black lines, no ornaments.
- A large picture window, filled with flat uniform pure green #00FF00, outlined by one thin black line.
- Under the window, an empty title box with the same width, outlined by one thin black line.
- Top-left: a small empty circle, cream filled, thin black outline, overlapping the window corner.
Absolutely no text, no letters, no numbers, no watermark.
```

Points à vérifier sur le résultat :

- **Le ratio doit être du 2:3** (par exemple 848 x 1264 ou 1024 x 1536), comme les cartes du jeu.
- **Le cercle et le cartouche doivent être vides.**
- **Les traits ne doivent pas être trop fins** : un trait de 4 px sur 848 devient très pâle sur une carte de 64 px. En cas de doute, demande des traits plus épais.

Si le cadre lui-même sort verdâtre, remplace `#00FF00` par du magenta `#FF00FF`.

### 2. Rendre la fenêtre transparente

Dans [Photopea](https://www.photopea.com) (gratuit, en ligne) ou dans GIMP :

1. Ouvre l'image et sélectionne le vert avec la baguette magique (tolérance d'environ 30).
2. Supprime la sélection (touche Suppr).
3. Vérifie qu'il ne reste pas de liseré vert au bord de la fenêtre. Sinon, agrandis la sélection d'un pixel avant de supprimer.
4. Exporte en **WebP** (ou en PNG), en gardant la transparence. Une largeur d'environ 600 px suffit.

Enregistre le fichier sous `src/ui/assets/trumps/frame.webp`, à la place de l'ancien.

### 3. Mesurer les trois zones

Sur l'image **en taille d'origine**, relève les coordonnées en pixels (Photopea affiche la position du curseur dans le panneau Info) :

| Zone | Ce qu'on mesure |
|---|---|
| Fenêtre | Les bords, pris au **milieu** du trait noir, pour que l'illustration passe sous le trait |
| Cercle | L'intérieur du trait : bord gauche, bord haut, diamètre |
| Cartouche du titre | L'intérieur du trait : bords gauche, haut, droit, bas |

Puis convertis chaque valeur en pourcentage de l'image : une valeur horizontale se divise par la **largeur**, une valeur verticale par la **hauteur**.

Exemple avec le cadre actuel (848 x 1264), fenêtre mesurée de (79, 79) à (768, 1036) :

```
left   = 79 / 848          = 9.32 %
top    = 79 / 1264         = 6.25 %
width  = (768 - 79) / 848  = 81.25 %
height = (1036 - 79) / 1264 = 75.71 %
```

**Le cercle est un cas particulier :** sa largeur et sa hauteur sont en `cqw`, une unité qui vaut 1 % de la largeur de la carte. On divise donc le diamètre par la **largeur** de l'image, pour les deux : 216 / 848 donne `25.47cqw`.

### 4. Reporter les mesures dans le CSS

Dans [`src/ui/styles/app.css`](../src/ui/styles/app.css), bloc `.card.illustrated` :

| Règle | Propriétés à mettre à jour |
|---|---|
| `.card.illustrated .art` | `left`, `top`, `width`, `height` de la fenêtre |
| `.card.illustrated .art-number` | `left`, `top` du cercle, et `width` / `height` en `cqw` (diamètre) |
| `.card.illustrated .art-title` | `left`, `top`, `width`, `height` du cartouche |

Mets aussi à jour le commentaire au-dessus du bloc, qui garde les mesures en pixels de l'image source : ce sont elles qu'on relira au prochain changement.

Si le cercle change beaucoup de taille, ajuste aussi la taille du numéro (`font-size` de `.art-number`, aujourd'hui `21cqw` pour un cercle de `25.47cqw`). Fais de même pour le titre si le cartouche change de hauteur (le `8.5cqw` de `.art-title`).

### 5. Vérifier

Lance une partie et regarde un atout en grand (sélectionné dans l'éventail) :

- L'illustration remplit toute la fenêtre, sans bande vide ni débordement hors du trait.
- Le numéro est centré dans le cercle, et le titre dans son cartouche.
- Contrôle aussi en petit (cartes posées devant les joueurs) et sur un vrai téléphone.

## Ne pas changer la police à la légère

Le centrage du numéro et du titre est calé sur la police IM Fell English SC :

- [`fonts.css`](../src/ui/styles/fonts.css) impose ses métriques verticales, pour un rendu identique sous Windows et Android.
- [`src/ui/cards/numberInk.ts`](../src/ui/cards/numberInk.ts) contient la hauteur d'encre de chacun de ses chiffres, qui n'ont pas tous la même hauteur.

Changer de police demande de remesurer ces valeurs. Les commentaires de ces deux fichiers expliquent comment.
