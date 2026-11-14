# Proposal

## Why

Les atouts ne montrent aujourd'hui qu'un numéro et le mot « Atout » sur fond uni. On veut leur donner l'allure d'un jeu de tarot illustré, pour le plaisir des yeux, sans toucher aux règles. Les illustrations seront générées par IA, une par atout. Si on laisse l'IA dessiner la carte entière, le cadre change d'une carte à l'autre. Il faut donc composer chaque atout à partir de calques séparés : un cadre commun, une illustration propre à l'atout, et des textes rendus par l'interface.

## What Changes

- Un atout illustré est composé de trois calques superposés :
  - l'illustration de l'atout, dessous, cadrée dans la fenêtre du cadre ;
  - le cadre commun à tous les atouts : une image dont la fenêtre est transparente ;
  - par-dessus, le numéro de l'atout (chiffres arabes, dans le cercle en haut à gauche) et son titre (en majuscules, dans le cartouche du bas), rendus en texte par React/CSS.
- Les trois calques s'affichent à toutes les tailles de carte (main, éventail, table, sièges, dernier pli). Leurs dimensions sont proportionnelles à la largeur de la carte.
- Une table d'habillage côté interface associe à chaque valeur d'atout un titre et un fichier d'illustration. Elle se remplit au fil des illustrations produites.
- Un atout sans illustration dans la table garde l'affichage actuel. On peut donc livrer les illustrations une par une.
- Une police de style gravure (IM Fell English SC) est embarquée dans le site, sans appel à un service externe, pour le numéro et le titre.
- Le nom accessible de la carte (info-bulle, lecteur d'écran) inclut le titre de l'atout quand il en a un.
- Hors périmètre : l'excuse (variante de cadre plus ornée, plus tard), les figures et cartes de couleur, une vue agrandie de carte, l'écriture des titres et la génération des illustrations elles-mêmes.

## Capabilities

### New Capabilities

Aucune.

### Modified Capabilities

- `table-ui` : l'exigence « Affichage des cartes » évolue. Le numéro d'un atout illustré se lit dans le cercle du coin supérieur gauche. Deux nouvelles exigences décrivent l'atout illustré : la première ses calques, son titre et son affichage à toutes les tailles ; la seconde le repli sans illustration, le nom accessible et l'absence d'effet sur le jeu.

## Impact

- `src/ui/components/CardView.tsx` : rendu en calques pour les atouts illustrés.
- Nouveau module d'habillage des atouts dans `src/ui/` (table valeur → titre → illustration).
- `src/ui/labels.ts` : `cardName` inclut le titre d'un atout illustré.
- `src/ui/styles/app.css` : styles du cadre, de la fenêtre, du numéro et du titre, en unités relatives à la carte.
- Nouveaux fichiers d'images dans le dépôt : le cadre (fenêtre détourée) et les illustrations au fil de l'eau.
- Nouvelle dépendance npm pour la police embarquée (`@fontsource/im-fell-english-sc`, licence OFL), servie par le site lui-même.
- Poids du site : environ 22 images à charger. Elles sont compressées et préchargées au lancement d'une partie.
- Moteur, bots et réseau : aucun changement. L'habillage est purement cosmétique et ne circule pas sur le réseau.
