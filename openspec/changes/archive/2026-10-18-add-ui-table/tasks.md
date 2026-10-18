# Tasks

## 1. Contrôleur de jeu local

- [x] 1.1 Définir les types `GameController` et `ControllerSnapshot` dans `src/ui/controller/types.ts` (vue, coups légaux, abonnement, `dispatch`, `dispose`) ; vérifier que `npm run build` compile sans `any`.
- [x] 1.2 Implémenter `createLocalGame` : création de partie (3 à 6 joueurs, type de bot, graine, refus hors bornes), snapshot mis en cache, abonnement et désabonnement ; vérifier par `src/ui/controller/local.test.ts` (création à 3/4/5/6, refus de 2 et 7, deux lectures successives = même référence, plus de notification après désabonnement).
- [x] 1.3 Faire jouer les bots avec `botAction`, un coup à la fois, via un ordonnanceur injectable, avec `botDelayMs` et `trickPauseMs` ; générateur des bots distinct de celui du moteur ; vérifier que l'humain n'est jamais joué à sa place et que le délai nul enchaîne les coups (tests dans `local.test.ts`).
- [x] 1.4 Transmettre les actions de l'humain avec la place imposée ; erreur rapportée sans changer l'état (carte illégale, hors tour) ; `dispose()` annule les minuteries en attente ; vérifier par tests dédiés.
- [x] 1.5 Test de partie complète : un humain simulé qui joue le premier coup légal (`legalPlays`), donne 3 cartes, choisit un papayou et demande chaque manche suivante, pour 3, 4, 5 et 6 joueurs, et atteint `gameEnd` avec un classement ; vérifier que la vue ne contient jamais d'autre main que celle de l'humain et que le résultat est reproductible avec la même graine. Lancer `npm test`.

## 2. Socle de l'interface

- [x] 2.1 Écrire le hook `useGame(controller)` avec `useSyncExternalStore` dans `src/ui/useGame.ts` ; vérifier à la compilation et par la lecture du composant d'accueil (task 2.3).
- [x] 2.2 Créer les styles de base (variables CSS : couleurs des couleurs et des atouts, taille de carte, tapis) dans `src/ui/styles/` et les importer depuis `main.tsx` ; vérifier que `npm run build` passe.
- [x] 2.3 Écrire `HomeScreen` (nombre de joueurs de 3 à 6, type de bot, valeurs par défaut) et l'aiguillage dans `App.tsx` (accueil ↔ partie, `dispose` au retour) ; vérifier dans le navigateur (`npm run dev`) que chaque combinaison lance une partie.

## 3. Cartes et main

- [x] 3.1 Créer `CardView` : symbole et teinte des couleurs, rang chiffré ou V/C/D/R, atouts numérotés, excuse, dos de carte, états sélectionné et grisé ; vérifier dans le navigateur avec une page d'essai affichant tout le paquet (78 cartes) puis la retirer.
- [x] 3.2 Créer `Hand` : main triée, cartes injouables grisées, sélection en deux clics pour jouer, sélection jusqu'à trois cartes pour l'échange, sélection vidée au changement de phase ou de tour ; vérifier dans le navigateur les scénarios de sélection, de changement de sélection et de carte grisée.

## 4. Table et phases de jeu

- [x] 4.1 Créer `GameScreen` qui choisit le contenu selon `view.phase`, et `Table` avec les joueurs (nom, nombre de cartes, tour, carte posée dans le pli), l'indicateur du joueur dont c'est le tour et le papayou de la manche ; vérifier dans le navigateur à 3 et à 6 joueurs.
- [x] 4.2 Brancher la phase d'échange : bouton de don actif seulement à trois cartes, message d'attente et liste de ceux qui ont déjà donné ; vérifier dans le navigateur.
- [x] 4.3 Créer `PapayouPicker` (quatre couleurs pour l'humain entameur, message pour les autres) ; vérifier dans le navigateur avec un humain entameur puis un bot entameur.
- [x] 4.4 Brancher la phase de jeu : pose d'une carte, pli en cours, zone du dernier pli (cartes, gagnant, points) ; vérifier dans le navigateur qu'un pli complet reste lisible grâce à la pause.
- [x] 4.5 Créer `RoundEnd` et `GameEnd` minimaux (points de la manche, totaux, bouton manche suivante ; places finales avec égalités, bouton rejouer) ; vérifier en jouant une partie à 3 joueurs jusqu'au bout dans le navigateur.

## 5. Vérification d'ensemble

- [x] 5.1 Jouer une partie complète dans le navigateur pour chaque nombre de joueurs (3, 4, 5, 6) avec les deux types de bot, sans erreur dans la console ; vérifier le dernier pli avec excuse en entame si le cas se présente.
- [x] 5.2 Vérifier `npm test` et `npm run build` sans erreur, qu'aucune règle du jeu n'a été écrite dans `src/ui/` (les règles viennent du moteur), et mettre à jour `docs/contexte.md` si l'état des lieux a changé.
- [x] 5.3 Faire relire par l'agent `qa-reviewer` le contrôleur et ses tests par rapport aux specs `game-controller` et `table-ui`, puis traiter ses remarques.

## Workflow follow-up

- Archiver le changement une fois la relecture passée (`/opsx:archive`).
- Enchaîner sur `add-ui-scores-mobile` (tableau des scores, fin de partie détaillée, mobile).
