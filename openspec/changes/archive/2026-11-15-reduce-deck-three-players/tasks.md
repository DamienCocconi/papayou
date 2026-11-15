# Tasks

## 1. Moteur : paquet réduit à 3 joueurs

- [x] 1.1 Dans `src/engine/testing.ts`, faire partir `playingState` d'une liste `removedCards` vide (voir design), et vérifier que `npm test` passe toujours avant tout autre changement
- [x] 1.2 Dans `src/engine/game.ts`, retirer à 3 joueurs les 16 figures puis les 2 premiers « 1 » du mélange existant, sans changer la consommation du générateur ; mettre à jour les commentaires de `removedCount` et `handSize` (20, 19, 15, 13)
- [x] 1.3 Dans `src/engine/game.test.ts`, passer la taille attendue à 3 joueurs à 20, vérifier 18 cartes retirées à 3 joueurs (16 figures et 2 « 1 »), aucune figure dans les mains à 3 joueurs, le 7 de chaque couleur en jeu pour 3, 4, 5 et 6 joueurs, et les mêmes cartes retirées d'une manche à l'autre à 3 joueurs ; `npx vitest run src/engine` passe
- [x] 1.4 Vérifier par un test qu'une graine donnée produit toujours la même première distribution qu'avant le changement à 4 joueurs (comparaison avec une valeur figée), et que les simulations complètes (`testing.test.ts`, invariant des 390 points, aucune carte perdue ni dupliquée) passent à 3 joueurs

## 2. Règles de référence

- [x] 2.1 Mettre à jour `docs/regles-papayou.md` : tableau de la section 2 (3 joueurs : 16 figures et 2 « 1 » retirés, 60 cartes en jeu, 20 par joueur), phrase sur les cartes retirées (les figures à 3 joueurs, le 7 toujours en jeu), décision validée n° 1 de la section 8 (3, 4 et 5 joueurs) ; relire le fichier pour vérifier qu'aucune autre mention de 26 cartes ne subsiste
- [x] 2.2 Rayer l'idée 8 dans `docs/idees.md` avec le nom du change `reduce-deck-three-players`, et vérifier que le tableau de la vue d'ensemble est cohérent

## 3. Vérification d'ensemble

- [x] 3.1 Lancer `npm test` et `npm run build` (contrôle de types `tsc -b` compris) : tout passe, y compris les tests des bots, du réseau et de l'interface sans modification
- [x] 3.2 Lancer une partie locale à 3 joueurs dans le navigateur : chaque main affiche 20 cartes sans figure, la manche se termine après 20 plis
- [x] 3.3 Relecture par `qa-reviewer` du code et des tests par rapport à la spec delta et à `regles-papayou.md`

## Workflow follow-up

- Archiver le change avec `/opsx:archive` une fois livré, pour mettre à jour la spec `game-engine`.
