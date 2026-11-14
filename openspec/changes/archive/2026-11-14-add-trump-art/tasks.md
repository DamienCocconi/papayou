# Tasks

## 1. Ressources

- [x] 1.1 Versionner le cadre : convertir en WebP avec transparence le PNG détouré produit pendant l'exploration (dossier scratchpad de la session, ou nouveau détourage depuis l'image source fournie par l'utilisateur), le réduire à environ 600 px de large et l'enregistrer en `src/ui/assets/trumps/frame.webp`. Vérification : le fichier s'ouvre avec une fenêtre transparente et garde le rapport 848/1264.
- [x] 1.2 Mesurer au pixel, sur l'image détourée, la fenêtre, le cercle du numéro et le cartouche du titre, puis les convertir en pourcentages de la carte. Vérification : les valeurs sont notées en commentaire du bloc CSS de la tâche 3.1, avec leur origine en pixels.
- [x] 1.3 Ajouter la dépendance `@fontsource/im-fell-english-sc` et l'importer une fois dans `src/main.tsx`. Vérification : `npm run build` passe, et le build contient les fichiers de police sans aucune URL `fonts.googleapis.com`.

## 2. Table d'habillage

- [x] 2.1 Créer `src/ui/cards/trumpArt.ts`, avec la table `valeur → { title, image }` (images importées statiquement depuis `src/ui/assets/trumps/`) et la fonction pure `trumpArt(card)`, qui renvoie `null` pour l'excuse, une carte de couleur ou un atout absent de la table. Remplir la table avec les atouts déjà disponibles. Vérification : `src/ui/cards/trumpArt.test.ts` couvre un atout illustré, un atout absent, l'excuse et une carte de couleur, et `npm test` passe.
- [x] 2.2 Faire renvoyer « Atout N, Titre » par `cardName` pour un atout illustré, et « Atout N » sinon. Vérification : un test dans `src/ui/labels.test.ts` couvre les deux cas, et `npm test` passe.

## 3. Rendu en calques

- [x] 3.1 Ajouter dans `app.css` le bloc `.card.illustrated` : conteneur (`container-type: inline-size`), `padding: 0`, positions en `%` de l'illustration (avec un léger débord sous le trait) et du cadre, numéro et titre en `cqw` dans la police embarquée, titre en majuscules. Neutraliser les règles `padding` et `font-size` de l'éventail, des sièges et de `small` pour les cartes illustrées. Vérification : visuelle, à la tâche 4.1.
- [x] 3.2 Faire rendre par `CardView` les quatre calques (illustration, cadre, numéro, titre) quand `trumpArt(card)` n'est pas `null`, et le rendu actuel sinon. Les images ont `alt=""`, et un `onError` masque l'illustration sans masquer le reste. Les états `selected`, `disabled` et le bouton cliquable restent inchangés. Vérification : `npx tsc -b` passe, et un atout absent de la table s'affiche comme avant dans le navigateur.
- [x] 3.3 Précharger les images de la table au montage de `GameScreen` (un `new Image()` par URL, sans bloquer l'affichage). Vérification : dans l'onglet réseau du navigateur, le cadre et les illustrations sont demandés dès l'ouverture de l'écran de partie.

## 4. Vérification

- [x] 4.1 Dans le navigateur, avec au moins un atout illustré (une illustration de test non versionnée si aucune n'est encore fournie) : contrôler la carte en éventail, en main étalée, sur la table, devant un siège et dans le détail du dernier pli. Contrôler aussi le même cadre sur deux atouts différents, un atout non illustré inchangé, une image cassée qui laisse le numéro lisible, et l'éventail sur un écran de 375 px de large. Vérification : captures d'écran de chaque cas.
- [x] 4.2 Lancer `npm test` et `npm run build`. Vérification : les deux passent, et aucun fichier de `src/engine/`, `src/bots/` ni `src/net/` n'est modifié (`git diff --stat`).
- [x] 4.3 Faire relire par `qa-reviewer` par rapport à la spec delta `table-ui`. Vérification : aucun écart bloquant n'est signalé, ou les écarts sont corrigés.

## Workflow follow-up

- Archiver le change avec `/opsx:archive` une fois livré, pour reporter la spec delta dans `openspec/specs/table-ui/spec.md`.
- Ajouter les autres atouts au fil des illustrations : un fichier `trump-NN.webp` et une ligne dans la table, sans nouveau change.
