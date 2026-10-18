## 1. Initialisation du projet
- [x] 1.1 Créer le projet Vite + React + TypeScript (mode strict) à la racine
- [x] 1.2 Ajouter Vitest et les scripts `test` et `test:watch`
- [x] 1.3 Créer l'arborescence `src/engine`, `src/bots`, `src/net`, `src/ui`

## 2. Cartes et paquet
- [x] 2.1 Types de cartes (couleur, atout, excuse) et identifiants stables
- [x] 2.2 Création du paquet de 78 cartes et ordre des couleurs
- [x] 2.3 Points d'une carte (excuse 100, atout 21 à 30, atouts 1-20 faciaux, papayou 50)
- [x] 2.4 Tests : 78 cartes uniques, total de 390 points avec un papayou choisi

## 3. Mise en place de la partie
- [x] 3.1 Générateur aléatoire à graine
- [x] 3.2 Création de partie pour 3 à 6 joueurs, tirage unique des « 1 » retirés (2 pour 4 joueurs, 3 pour 5)
- [x] 3.3 Distribution équitable à chaque manche
- [x] 3.4 Tests : cartes par joueur (26, 19, 15, 13), aucune carte perdue ni dupliquée

## 4. Échange et papayou
- [x] 4.1 Action de don de 3 cartes, résolution simultanée vers le joueur suivant
- [x] 4.2 Choix de la couleur du papayou par l'entameur
- [x] 4.3 Tests : échange simultané, excuse et atouts échangeables, tailles de main conservées

## 5. Plis
- [x] 5.1 `legalPlays` (entame, obligation de couleur, obligation d'atout, excuse)
- [x] 5.2 Résolution du gagnant d'un pli (atout le plus fort, sinon couleur demandée, excuse à 0)
- [x] 5.3 Entame forcée de l'excuse au dernier pli (victoire automatique)
- [x] 5.4 Tests : un par cas limite de l'excuse, absence d'obligation de surcouper

## 6. Manches et partie
- [x] 6.1 Décompte de fin de manche et tableau des scores
- [x] 6.2 Rotation de l'entameur, enchaînement des manches, fin de partie
- [x] 6.3 Classement de compétition (1, 2, 2, 4, 5)
- [x] 6.4 Tests : invariant 390 points, rotation, égalités

## 7. Vue par joueur et sérialisation
- [x] 7.1 `getPlayerView` sans les mains des autres
- [x] 7.2 Sérialisation et reprise de l'état en JSON
- [x] 7.3 Tests : aucune fuite d'information, aller-retour JSON identique

## 8. Validation
- [x] 8.1 Partie complète simulée avec des coups aléatoires légaux, pour chaque nombre de joueurs de 3 à 6
- [x] 8.2 Relecture par `qa-reviewer`
