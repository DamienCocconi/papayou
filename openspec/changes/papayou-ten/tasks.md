# Tasks

## 1. Moteur : hauteur du papayou selon le nombre de joueurs

- [ ] 1.1 Dans `src/engine/cards.ts`, ajouter `papayouRank(playerCount)` (7 à 3 joueurs, 10 au-delà) et `isPapayou(card, papayouSuit, playerCount)`, puis faire prendre `playerCount` à `cardPoints` et `pilePoints` (voir design, décision 2) ; exporter les deux nouvelles fonctions dans `src/engine/index.ts`. Dans `cards.test.ts`, tester : à 3 joueurs le 7 de la couleur choisie vaut 50 et le 10 vaut 0 ; à 4, 5 et 6 joueurs le 10 vaut 50 et le 7 vaut 0 ; le 7 et le 10 des autres couleurs valent 0 ; `isPapayou` est faux sans couleur choisie ; la somme des points du paquet en jeu vaut 390 pour chaque nombre de joueurs et chaque couleur. `npx vitest run src/engine/cards.test.ts` passe
- [ ] 1.2 Dans `src/engine/scoring.ts` et `src/engine/game.ts`, passer `state.playerCount` à `computeRoundScores`, `pilePoints` (points du dernier pli) et `cardPoints` (`pointsOf`) ; mettre à jour `scoring.test.ts`. Dans `game.test.ts`, étendre le test « le 7 de chaque couleur est toujours en jeu » au 10, pour 3, 4, 5 et 6 joueurs, renommer le test du choix libre pour parler du papayou, et ajouter un test de manche complète à 4 joueurs où les 50 points du papayou reviennent au joueur qui a ramassé le 10. `npx vitest run src/engine` passe, invariant des 390 points compris

## 2. Bot heuristique

- [ ] 2.1 Dans `src/bots/heuristic.ts`, remplacer le test `rank === 7` de `choosePapayou` par `isPapayou(card, suit, view.playerCount)` et passer `view.playerCount` aux appels à `cardPoints`. Dans `heuristic.test.ts`, faire porter les tests existants sur une partie à 3 joueurs (papayou au 7) et ajouter les cas à 4 joueurs : avec le 10 de cœur et le 10 de pique (et le 7 de carreau et de trèfle), il choisit carreau ou trèfle ; avec les quatre 10, il choisit une couleur quelconque. `npx vitest run src/bots` passe, y compris la comparaison avec le bot aléatoire

## 3. Interface : libellé du papayou

- [ ] 3.1 Dans `src/ui/labels.ts`, ajouter une fonction (par exemple `papayouLabel`) qui met en forme la carte papayou à partir de la couleur et de `papayouRank(playerCount)` ; la tester dans `labels.test.ts` (3 joueurs, trèfle : 7 ; 4 joueurs, trèfle : 10). Dans `src/ui/screens/GameScreen.tsx`, afficher dans le badge la hauteur, le symbole et le nom de la couleur (classe `suit-name` conservée). `npx vitest run src/ui` passe

## 4. Règles de référence

- [ ] 4.1 Mettre à jour `docs/regles-papayou.md` avec le texte validé (design, décision 5) : sections 2, 3, 4 (étape 3) et 6 (en-tête des exemples et exemple 2). Relire le fichier entier pour vérifier qu'aucune mention du papayou au 7 ne reste à 4 joueurs ou plus
- [ ] 4.2 Rayer l'idée 9 dans `docs/idees.md` avec le nom du change `papayou-ten`, noter que la question ouverte est tranchée (choix libre), et mettre à jour l'idée 10 (papayou reconnaissable) pour indiquer qu'elle peut s'appuyer sur `isPapayou`

## 5. Vérification d'ensemble

- [ ] 5.1 Lancer `npm test` et `npm run build` (contrôle de types `tsc -b` compris) : tout passe, aucun appel à `cardPoints` ou `pilePoints` n'est resté sans nombre de joueurs
- [ ] 5.2 Lancer une partie locale à 4 joueurs dans le navigateur : le badge affiche « Papayou : 10 » avec la couleur choisie, et le décompte de fin de manche attribue les 50 points au joueur qui a ramassé le 10. Vérifier aussi une partie à 3 joueurs : le badge affiche le 7
- [ ] 5.3 Relecture par `qa-reviewer` du code et des tests par rapport aux specs delta et à `regles-papayou.md`

## Workflow follow-up

- Archiver le change avec `/opsx:archive` une fois livré, pour mettre à jour les specs `game-engine`, `bots` et `table-ui`.
- Proposer ensuite le change de l'effet visuel sur la carte papayou (tsParticles, escarbilles), qui s'appuiera sur `isPapayou`.
