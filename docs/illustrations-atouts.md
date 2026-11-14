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
1: { title: 'La tour', image: trump01 },
```

Modifie le texte du titre.

- **Casse normale** : écris `'La tour'`, pas `'LA TOUR'`. L'affichage passe en majuscules tout seul, et l'info-bulle de la carte (« Atout 1, La tour ») garde la casse normale.
- **Apostrophe** : entoure le titre de guillemets doubles, par exemple `"L'atelier"`.
- **Longueur** : un titre long rétrécit automatiquement pour tenir dans le cartouche. Au-delà d'une vingtaine de caractères, il devient petit, donc mieux vaut rester court.

## Changer l'illustration d'un atout

### 1. Préparer l'image

- **Format portrait 3:4**, environ **600 px de large** (600 x 800). La fenêtre du cadre est un peu plus étroite que du 3:4 : environ 4 % sont rognés de chaque côté.
- **Sujet centré**, avec de la marge sur les bords.
- **Rien d'important en haut à gauche** : le cercle du numéro recouvre ce coin.
- **Ni texte, ni bordure, ni cadre** dans l'image : le cadre et le titre sont ajoutés par le jeu.
- **En `.webp`**, qualité 70 environ. Le style « papier grenu » pèse lourd en compression : à 70, l'atout 1 fait 68 Ko et garde son grain, contre 94 Ko à 80. Le `.png` et le `.jpg` fonctionnent aussi, mais pèsent plus lourd.
- Les cartes s'affichent souvent en très petit (30 à 70 px de large). Une silhouette forte, peu d'éléments et des couleurs contrastées restent lisibles bien plus longtemps qu'une scène détaillée.

### Style des illustrations : prompt de référence

Le style visé est celui des premières éditions du tarot Rider-Waite (Pamela Colman Smith, 1909) : trait noir épais tracé à la main, aplats de quelques couleurs passées, impression litho imparfaite. Laissées à elles-mêmes, les IA d'images produisent des dégradés, des reflets et un détail uniforme qui trahissent la génération. Le prompt doit donc interdire tout ce qui fait « IA propre » et imposer les défauts d'impression.

Le prompt **ne nomme ni le jeu ni l'artiste** : il décrit leurs caractéristiques. Une première version demandait « le style exact du tarot Rider-Waite de 1909 dessiné par Pamela Colman Smith ». ChatGPT l'a acceptée pour les premières cartes, puis l'a refusée : son filtre de génération d'images bloque les demandes qui imitent une œuvre identifiée, même du domaine public. La version descriptive ci-dessous donne le même style sans ce risque. Garde ce principe pour les prochaines cartes : décrire le style, ne jamais nommer une œuvre ou un artiste.

Le prompt ci-dessous, en version neutre, reprend le sujet de l'atout 1 (« La tour », [`trump-01.webp`](../src/ui/assets/trumps/trump-01.webp)). Les atouts 1, 10 et 11 ont été générés avec ChatGPT et la première version, qui nommait le jeu. Les atouts 4 (« La Calédonie », une assiette de cannellonis) et 9 (« La Saint-Valentin ») ont été générés avec la version neutre, sans perte de style. Pour l'atout 1, le prompt a été joint à une photo du burger comme référence de sujet : `docs/references/atout-01-burger-reference.png`. Ce dossier est **local**, exclu du dépôt par `.gitignore` : les photos de référence appartiennent à des tiers et ne doivent pas être publiées dans ce dépôt public.

```text
Use the attached photo ONLY as a reference for the subject (a giant stacked burger). Do not copy the photo's style, lighting or realism.

Create an original illustration in the style of early 20th-century hand-drawn tarot cards and vintage lithographic prints:
- Thick, uneven, hand-drawn black ink outlines, slightly wobbly, like a pen drawing by hand. Line weight varies.
- Flat areas of color, NO gradients, NO shading, NO highlights, NO reflections, NO 3D rendering. Only a few simple black hatching lines for shadows.
- Very limited palette of muted, slightly faded printing-ink colors: mustard yellow, brick red, dull blue, sage green, flesh pink, warm grey, cream. Nothing saturated, nothing glossy.
- Old lithographic printing look: colors slightly misregistered (color fills shift a little outside the black outlines), visible paper grain, small ink imperfections, slightly worn.
- Naive, simplified, almost childlike drawing: forms are simplified, proportions slightly clumsy, few details. Draw it as an illustrator from around 1910 would, by hand, not as a modern digital artist.
- Simple theatrical staging typical of old tarot cards: one central subject presented frontally and solemnly, flat plain sky, a simple strip of ground.

Subject: a comically tall burger, a stack of six thick beef patties with melted cheese slices, bacon and lettuce between them, between two buns, standing upright like a tower on a round plate, a few fries around it. A small simple flag on a toothpick on top. The burger stands alone in the center of the scene, solemn and monumental, like the central figure of a tarot card. Simple background: a flat pale yellow sky and a strip of grey floor.

Composition: vertical portrait, aspect ratio 3:4. The burger is centered with generous empty margins on all sides. Keep the top-left corner empty (plain background only).

Absolutely NO text, NO letters, NO numbers, NO logo, NO brand name, NO border, NO frame, NO card edges. Full bleed illustration only.
```

Pour un autre atout, garde tout le prompt **mot pour mot** et ne change que le paragraphe `Subject:`, et la première ligne si tu joins une autre photo. Le reste fait la cohérence du jeu de cartes.

#### Exemple : l'atout 10, « Le camion »

L'illustration de l'atout 10 ([`trump-10.webp`](../src/ui/assets/trumps/trump-10.webp)) a été générée avec ChatGPT et le même prompt, joint à une photo du food truck comme référence (gardée en local : `docs/references/`). Seules la première ligne, le paragraphe `Subject:` et la phrase de composition changent :

```text
Use the attached photo ONLY as a reference for the subject (a Mexican food truck). Do not copy the photo's style, lighting or realism.

[... bloc de style identique à l'atout 1 ...]

Subject: a small Mexican food truck, seen from a three-quarter front view, standing alone in the center of the scene, proud and monumental, like the central figure of a tarot card. The truck body is painted in a faded turquoise (a dull teal green), with a mustard yellow band along the top and a brick red stripe along the side. Its serving hatch is open, with a small awning above it and a plain wooden counter. A small blank chalkboard easel stands next to it. Above the truck, a large red chili pepper floats in the sky like a sun, with a few simple straight rays around it. Simple background: a flat pale blue sky and a strip of grey pavement. All signs, banners and the chalkboard are completely blank: plain colored shapes with no writing at all.

Composition: vertical portrait, aspect ratio 3:4. The truck is centered in the lower half with generous empty margins on all sides; the chili sun is in the upper half, slightly to the right. Keep the top-left corner empty (plain sky only).

[... dernière ligne identique : NO text, NO letters ...]
```

Ce que cet exemple apprend :

- **Une couleur hors palette se décrit dans le sujet.** Le turquoise du camion n'est pas dans la palette commune. Plutôt que de modifier la ligne de palette, on le décrit comme « faded » / « dull » dans le sujet, et il reste dans l'esprit des encres passées.
- **Un sujet couvert d'inscriptions doit être déclaré vierge.** Enseignes, bandeaux et ardoise sont précisés « completely blank », sinon l'IA recopie les textes de la photo avec des lettres déformées.
- **Un sujet horizontal se place dans la moitié basse,** avec un élément symbolique dans le ciel au-dessus (ici le piment-soleil, clin d'œil aux soleils du Rider-Waite). La carte est remplie sans écraser le sujet, et le coin haut gauche reste vide.
- **Le cadrage est à surveiller.** L'IA a collé l'avant du camion au bord droit de l'image, et la fenêtre du cadre rogne environ 4 % de chaque côté. Demander « generous empty margins on all sides » n'est pas toujours respecté : vérifie les bords avant de valider.

- **Garder la photo en simple référence de sujet** (« ONLY as a reference for the subject ») : sinon l'IA recopie le rendu photo.
- **Fond jaune pâle et sol gris** : ce sont des codes typiques du Rider-Waite (le Bateleur, la Force, le Chariot). Ils se réutilisent bien, mais on peut varier la couleur du ciel d'un atout à l'autre.
- **Pas de logo ni de texte** : le jeu affiche déjà le titre, et un texte généré par IA est rarement propre.

Si le résultat est encore trop net, relance dans la même conversation :

```text
Still too clean and too detailed. Make it look more hand-drawn and more crudely printed: thicker and more irregular black outlines, fewer details, flatter colors with no shading at all, and make the colors spill slightly outside the lines as in a cheap early 1900s color print.
```

Une piste non encore essayée : joindre en plus l'image d'une vraie carte des premières éditions comme référence de style. Les IA imitent mieux un style qu'elles voient qu'un style qu'on leur décrit. Le prompt commence alors par :

```text
Image 1 is the STYLE reference (an old hand-drawn tarot card from the early 1900s): use its drawing style, line quality, colors and printing texture, but not its content or its frame.
Image 2 is the SUBJECT reference: draw this subject.
```

Retouche possible si l'image sort encore « trop IA » (Photopea) : la réduire à environ 400 px de large puis la réagrandir à 600, ajouter un bruit monochrome d'environ 3 %, et éventuellement la postériser à 6 à 8 niveaux.

### 2. Brancher l'image

Les 21 atouts ont chacun leur fichier `src/ui/assets/trumps/trump-NN.webp`, où `NN` est le numéro de l'atout sur deux chiffres. Pour changer l'illustration d'un atout, **remplace simplement son fichier** par la nouvelle image, sous le même nom : rien d'autre à toucher.

Pour **déplacer une illustration vers un autre numéro**, renomme le fichier (par exemple `trump-06.webp` en `trump-18.webp`), puis mets à jour dans [`trumpArt.ts`](../src/ui/cards/trumpArt.ts) la ligne d'import et la ligne de l'atout :

```ts
import trump18 from '../assets/trumps/trump-18.webp'
// ...
18: { title: 'La Planque', image: trump18 },
```

Si le nom du fichier est mal écrit, `npm run build` (et le serveur de dev) échoue avec un message qui nomme le fichier : on ne peut pas livrer une carte à trou. À l'inverse, un import qui ne sert plus fait échouer la vérification des types (`npx tsc -b`) : supprime-le.

### Conversion d'une image générée

Les IA d'images livrent en général du 1086 x 1448 px. On la réduit à 600 x 800 px et on l'enregistre en WebP qualité 70, par exemple avec Python et Pillow :

```bash
python -c "from PIL import Image; im=Image.open('source.webp').convert('RGB'); im.resize((600, 800), Image.LANCZOS).save('src/ui/assets/trumps/trump-08.webp', 'WEBP', quality=70, method=6)"
```

Photopea (Fichier > Exporter sous > WEBP) fait aussi l'affaire.

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
