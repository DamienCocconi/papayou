# Tasks

Le code a été écrit et validé avant ce change, sur la branche `fix/crash-diagnostic` (PR #15). Les tâches décrivent ce qui a été livré et comment chaque point a été vérifié.

## 1. Écran de plantage

- [x] 1.1 Ajouter le filet de sécurité autour de toute l'application (`CrashBoundary` dans `src/main.tsx`), et vérifier qu'une erreur simulée pendant une partie affiche l'écran de plantage au lieu d'un écran vide
- [x] 1.2 Afficher le rapport (date, navigateur, taille et visibilité de l'écran, message, composants, erreurs précédentes) et le bouton « Recharger », et vérifier sur un écran de 375 x 812 px que le rapport défile dans son cadre sous le bouton
- [x] 1.3 Noter les erreurs globales (erreurs non attrapées, promesses rejetées) pour les joindre au rapport, et vérifier sur le téléphone qu'elles apparaissent dans « Erreurs précédentes »

## 2. Éventail au rallumage de l'écran

- [x] 2.1 Arrondir la position mesurée de l'éventail au pixel et ignorer une valeur non numérique (`nextOrigin`), et vérifier que les tests de `src/ui/hand/fanOrigin.test.ts` passent
- [x] 2.2 N'appeler `setOrigin` que si la position retenue change vraiment, et vérifier sur le téléphone Android concerné qu'ouvrir et fermer le volet magnétique en éventail, pendant l'échange et pendant le choix du papayou, ne fait plus planter la partie

## 3. Vérification d'ensemble

- [x] 3.1 Vérifier que `npm test` et `npm run build` passent, et que la partie en éventail s'affiche normalement dans un navigateur de bureau

## Workflow follow-up

- Fusionner la PR #15 dans `main`.
- Archiver le change avec `/opsx:archive` pour reporter les exigences dans `openspec/specs/table-ui/spec.md`.
