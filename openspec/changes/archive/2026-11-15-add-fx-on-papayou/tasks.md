# Tasks

## 1. Reconnaître la carte papayou

- [x] 1.1 Créer `src/ui/cards/papayouContext.ts` : `PapayouContext` (`{ papayouSuit, playerCount }` ou `null`), `isPapayouCard` via `isPapayou` du moteur, et le hook `useIsPapayou`. Le tester dans `papayouContext.test.ts` : `null` (hors du jeu) et couleur pas encore choisie donnent faux ; à 4 joueurs le 10 de la couleur est reconnu, pas le 7 ni le 10 des autres couleurs ; à 3 joueurs le 7. `npx vitest run src/ui/cards` passe
- [x] 1.2 Dans `src/ui/screens/GameScreen.tsx`, fournir `PapayouContext` autour de l'écran avec la couleur du papayou et le nombre de joueurs de la vue. Dans `CardView.tsx`, ajouter la classe `papayou` à la carte reconnue

## 2. Liseré luisant

- [x] 2.1 Dans `src/ui/styles/app.css`, donner à `.card.papayou` le liseré (bordure, anneau et halo rouge orangé), et combiner le halo avec les ombres de l'éventail (carte en emphase, carte prête à jouer). Vérifier dans le navigateur, partie à 4 joueurs : le 10 de la couleur choisie porte le liseré dans la main étalée, en éventail, dans le pli en cours et dans le dernier pli, et aucune autre carte ne le porte ; à 3 joueurs, c'est le 7
- [x] 2.2 Vérifier dans le navigateur que le liseré ne gêne pas le jeu : la carte papayou se sélectionne et se joue en étalé, se met en emphase et se tire vers le haut en éventail ; sa hauteur et son symbole restent lisibles en petite taille sur la table

## 3. Abandon des escarbilles

- [x] 3.1 Retirer l'effet d'escarbilles jugé non crédible à la relecture : désinstaller `@tsparticles/engine` et `@tsparticles/slim`, supprimer `src/ui/effects/`, le préchargement dans `GameScreen` et le calque CSS. Vérifier qu'aucune référence ne reste (`grep` sur `tsparticles`, `PapayouFx`, `papayou-fx`) et que `package.json` est revenu à ses dépendances d'avant le change

## 4. Documentation et vérification d'ensemble

- [x] 4.1 Rayer l'idée 10 dans `docs/idees.md` avec le nom du change `add-fx-on-papayou`, en notant que le papayou porte un liseré luisant, que les escarbilles ont été essayées puis abandonnées, et en gardant pour plus tard un effet animé et `prefers-reduced-motion`
- [x] 4.2 Lancer `npm test` et `npm run build` (contrôle de types compris) : tout passe. Vérifier dans le navigateur, en vue téléphone (375×812), le liseré du papayou en éventail, et une console sans erreur

## Workflow follow-up

- Archiver le change avec `/opsx:archive` une fois livré, pour ajouter les exigences à la spec `table-ui`.
