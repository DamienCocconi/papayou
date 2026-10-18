# table-ui Specification

## Purpose

Décrit ce que le joueur voit et peut faire pendant une partie dans le navigateur : lancer une partie, échanger des cartes, choisir le papayou, jouer les plis et passer d'une manche à l'autre. L'interface n'applique aucune règle du jeu et affiche ce que le moteur autorise.

## Requirements

### Requirement: Écran d'accueil
Le système SHALL proposer, avant la partie, le choix du nombre de joueurs de 3 à 6 et du type de bot (aléatoire ou heuristique), puis lancer la partie avec l'humain et des bots.

#### Scenario: Lancement
- **WHEN** l'utilisateur choisit 5 joueurs et le bot heuristique puis valide
- **THEN** une partie à 5 joueurs démarre avec lui et 4 bots

#### Scenario: Valeur par défaut
- **WHEN** l'écran d'accueil s'affiche
- **THEN** un nombre de joueurs et un type de bot sont déjà sélectionnés, et la partie peut être lancée sans autre choix

### Requirement: Affichage des cartes
Le système SHALL afficher chaque carte lisible sans image : la couleur par son symbole (cœur, carreau, trèfle, pique) et sa teinte, le rang par un chiffre ou par V, C, D, R pour valet, cavalier, dame, roi, les atouts par leur numéro, l'excuse par un libellé propre.

#### Scenario: Figure
- **WHEN** la dame de pique est affichée
- **THEN** la carte montre D et le symbole pique

#### Scenario: Atout
- **WHEN** l'atout 14 est affiché
- **THEN** la carte montre le nombre 14 et se distingue visuellement d'une carte de couleur

#### Scenario: Carte compréhensible sans la couleur seule
- **WHEN** une carte de cœur ou de carreau est affichée
- **THEN** elle se reconnaît par son symbole et non par sa seule teinte

### Requirement: Main du joueur
Le système SHALL afficher la main de l'humain triée dans l'ordre du moteur, et en phase de jeu SHALL griser les cartes injouables et empêcher de les jouer.

#### Scenario: Couleur à fournir
- **WHEN** un pique est demandé et que l'humain possède des piques
- **THEN** seuls ses piques sont jouables, les autres cartes sont grisées

#### Scenario: Pas son tour
- **WHEN** ce n'est pas le tour de l'humain
- **THEN** aucune carte n'est jouable et l'interface indique quel joueur doit jouer

### Requirement: Jouer par sélection puis confirmation
Le système SHALL faire jouer une carte en deux clics : le premier la sélectionne, le second sur la même carte la joue. Cliquer sur une autre carte jouable déplace la sélection.

#### Scenario: Sélection
- **WHEN** l'humain clique sur une carte jouable
- **THEN** la carte est mise en avant et n'est pas encore posée

#### Scenario: Confirmation
- **WHEN** l'humain clique à nouveau sur la carte sélectionnée
- **THEN** la carte est posée dans le pli

#### Scenario: Changement de sélection
- **WHEN** une carte est sélectionnée et que l'humain clique sur une autre carte jouable
- **THEN** la sélection passe à cette autre carte et rien n'est posé

#### Scenario: Carte injouable
- **WHEN** l'humain clique sur une carte grisée
- **THEN** rien n'est sélectionné ni posé

### Requirement: Échange de trois cartes
Le système SHALL, en phase d'échange, laisser l'humain sélectionner exactement trois cartes de sa main puis les donner, et SHALL afficher ensuite l'attente des autres joueurs en indiquant qui a déjà donné.

#### Scenario: Trois cartes exactement
- **WHEN** l'humain a sélectionné deux cartes
- **THEN** le bouton de validation du don est inactif

#### Scenario: Pas plus de trois
- **WHEN** trois cartes sont déjà sélectionnées et que l'humain en sélectionne une quatrième
- **THEN** la sélection reste à trois cartes sans erreur

#### Scenario: N'importe quelle carte
- **WHEN** l'humain sélectionne l'excuse ou un atout à donner
- **THEN** la sélection est acceptée

#### Scenario: Attente
- **WHEN** l'humain a donné ses cartes et que d'autres joueurs n'ont pas fini
- **THEN** l'interface indique l'attente et qui a déjà donné, et ne permet plus de changer son don

### Requirement: Choix du papayou
Le système SHALL, quand l'humain est l'entameur, lui proposer les quatre couleurs et enregistrer son choix. Quand un autre joueur est l'entameur, l'interface SHALL indiquer qui choisit. Une fois le papayou choisi, sa couleur SHALL rester visible pendant la manche.

#### Scenario: L'humain choisit
- **WHEN** l'humain est l'entameur et clique sur la couleur trèfle
- **THEN** le papayou de la manche est le trèfle et le jeu commence

#### Scenario: Un bot choisit
- **WHEN** un bot est l'entameur
- **THEN** l'interface indique que ce joueur choisit, puis affiche la couleur choisie

### Requirement: Table et pli en cours
Le système SHALL afficher tous les joueurs autour de la table avec leur nom, leur nombre de cartes en main, leur place dans l'ordre de jeu, la carte qu'ils ont posée dans le pli en cours et le joueur dont c'est le tour. Le dernier pli terminé SHALL rester consultable avec son gagnant et ses points.

#### Scenario: Pli en cours
- **WHEN** deux joueurs sur quatre ont posé leur carte
- **THEN** ces deux cartes sont visibles à côté de leurs joueurs et le joueur suivant est signalé

#### Scenario: Dernier pli
- **WHEN** un pli vient de se terminer
- **THEN** l'interface affiche les cartes de ce pli, son gagnant et les points qu'il contient

#### Scenario: Cartes des autres
- **WHEN** la table est affichée
- **THEN** les autres joueurs n'y montrent que le nombre de leurs cartes, jamais leur contenu

### Requirement: Fin de manche et fin de partie minimales
Le système SHALL, à la fin d'une manche, afficher les points de la manche et les totaux et proposer de passer à la manche suivante. À la fin de la partie, il SHALL afficher le classement final et proposer de rejouer.

#### Scenario: Fin de manche
- **WHEN** la dernière carte d'une manche est jouée avant la dernière manche
- **THEN** l'interface affiche les points de la manche et les totaux, avec un bouton pour la manche suivante

#### Scenario: Manche suivante
- **WHEN** l'humain clique sur la manche suivante
- **THEN** une nouvelle manche démarre en phase d'échange avec de nouvelles mains

#### Scenario: Fin de partie
- **WHEN** la dernière manche se termine
- **THEN** l'interface affiche les places finales, égalités comprises, et propose de rejouer

#### Scenario: Rejouer
- **WHEN** l'humain choisit de rejouer
- **THEN** il revient à l'écran d'accueil

### Requirement: Aucune règle dans l'interface
Le système SHALL s'appuyer sur le moteur pour toute décision de règle (coups légaux, gagnant du pli, points, classement). L'interface SHALL NOT réimplémenter ces règles.

#### Scenario: Excuse au dernier pli
- **WHEN** l'humain n'a plus que l'excuse pour entamer le dernier pli
- **THEN** elle est jouable parce que le moteur l'indique, sans cas particulier dans l'interface
