# game-engine Specification

## Purpose

Moteur de règles du Papayou : cartes, mise en place, échange, plis, décompte, classement, vue par joueur et sérialisation. Il est la seule source de vérité sur les coups légaux et reste pur, sans dépendance à l'interface ni au réseau.

## Requirements

### Requirement: Composition du jeu
Le système SHALL utiliser un jeu de 78 cartes : 4 couleurs de 14 cartes (rangs 1 à 10, valet, cavalier, dame, roi, du plus faible au plus fort), 21 atouts numérotés de 1 à 21, et l'excuse.

#### Scenario: Paquet complet
- **WHEN** un paquet est créé
- **THEN** il contient 78 cartes distinctes

#### Scenario: Ordre des cartes de couleur
- **WHEN** on compare deux cartes de même couleur
- **THEN** le 1 est la plus faible, puis 2 à 10, valet, cavalier, dame, et le roi est la plus forte

### Requirement: Mise en place selon le nombre de joueurs
Le système SHALL accepter de 3 à 6 joueurs, retirer au hasard, une seule fois au début de la partie, 2 cartes « 1 » de couleur pour 4 joueurs et 3 pour 5 joueurs, et ne retirer aucune carte pour 3 et 6 joueurs. Les cartes retirées SHALL rester retirées pendant toute la partie.

#### Scenario: Quatre joueurs
- **WHEN** une partie à 4 joueurs est créée
- **THEN** 2 cartes « 1 » de couleur sont retirées et 76 cartes sont en jeu

#### Scenario: Cinq joueurs
- **WHEN** une partie à 5 joueurs est créée
- **THEN** 3 cartes « 1 » de couleur sont retirées et 75 cartes sont en jeu

#### Scenario: Retrait conservé entre les manches
- **WHEN** une nouvelle manche commence dans une partie à 4 ou 5 joueurs
- **THEN** les mêmes cartes restent retirées

#### Scenario: Nombre de joueurs invalide
- **WHEN** on crée une partie avec moins de 3 ou plus de 6 joueurs
- **THEN** la création est refusée

### Requirement: Distribution
Le système SHALL, au début de chaque manche, mélanger les cartes en jeu et les distribuer toutes, équitablement, entre les joueurs, soit 26 cartes à 3 joueurs, 19 à 4, 15 à 5 et 13 à 6.

#### Scenario: Distribution complète
- **WHEN** une manche est distribuée
- **THEN** chaque joueur a le même nombre de cartes, aucune carte n'est perdue et aucune n'est dupliquée

#### Scenario: Déterminisme
- **WHEN** deux parties sont créées avec la même graine et le même nombre de joueurs
- **THEN** elles produisent les mêmes distributions

### Requirement: Valeur en points des cartes
Le système SHALL attribuer les points suivants : excuse 100, atout 21 à 30, atouts 1 à 20 à leur valeur faciale, papayou (le 7 de la couleur choisie pour la manche) 50, toutes les autres cartes de couleur 0.

#### Scenario: Total d'une manche
- **WHEN** on additionne la valeur de toutes les cartes d'une manche
- **THEN** le total vaut 390, quel que soit le nombre de joueurs et la couleur du papayou

### Requirement: Échange de cartes
Le système SHALL, après la distribution, faire donner à chaque joueur 3 cartes de son choix (excuse et atouts compris) au joueur suivant dans le sens horaire. L'échange SHALL être simultané : un joueur ne reçoit ses nouvelles cartes qu'une fois que tous les joueurs ont choisi les leurs.

#### Scenario: Échange simultané
- **WHEN** tous les joueurs ont choisi 3 cartes
- **THEN** chaque joueur reçoit les 3 cartes de son prédécesseur et les cartes données sortent de sa main

#### Scenario: Attente des autres joueurs
- **WHEN** un seul joueur a choisi ses cartes
- **THEN** aucun échange n'est effectué et il ne voit pas ce qu'il va recevoir

#### Scenario: Excuse donnée
- **WHEN** un joueur donne l'excuse
- **THEN** l'échange est accepté

#### Scenario: Nombre de cartes invalide
- **WHEN** un joueur propose un nombre de cartes différent de 3, ou une carte qu'il n'a pas
- **THEN** l'action est refusée

### Requirement: Choix du papayou
Le système SHALL faire choisir au joueur entameur de la manche, après l'échange, la couleur du papayou. Le 7 de cette couleur SHALL valoir 50 points pour cette manche. L'entameur peut choisir une couleur dont il possède le 7.

#### Scenario: Choix valide
- **WHEN** l'entameur choisit une couleur
- **THEN** le 7 de cette couleur est le papayou et la phase de jeu commence

#### Scenario: Choix par un autre joueur
- **WHEN** un joueur autre que l'entameur tente de choisir la couleur
- **THEN** l'action est refusée

### Requirement: Entame d'un pli
Le système SHALL permettre d'entamer un pli avec n'importe quelle carte, atout compris, sauf l'excuse. Seul le joueur entameur du premier pli, puis le gagnant du pli précédent, entame.

#### Scenario: Entame à l'atout
- **WHEN** le joueur qui entame pose un atout
- **THEN** l'entame est acceptée et l'atout est la couleur demandée

#### Scenario: Excuse interdite en entame
- **WHEN** un joueur qui entame, et qui a d'autres cartes, tente de poser l'excuse
- **THEN** l'action est refusée

#### Scenario: Excuse forcée au dernier pli
- **WHEN** le joueur qui entame le dernier pli n'a plus que l'excuse
- **THEN** il doit l'entamer et l'action est acceptée

### Requirement: Obligations pour suivre
Le système SHALL imposer aux joueurs suivants : si la carte d'entame est une carte de couleur, fournir de cette couleur s'ils en ont ; sinon jouer un atout s'ils en ont ; sinon jouer n'importe quelle carte. Si la carte d'entame est un atout, jouer un atout s'ils en ont, sinon n'importe quelle carte. L'excuse SHALL compter comme un atout pour ces obligations. Le système SHALL NOT imposer de surcouper.

#### Scenario: Obligation de fournir la couleur
- **WHEN** un joueur a de la couleur demandée
- **THEN** seules les cartes de cette couleur sont jouables, l'excuse et les atouts ne le sont pas

#### Scenario: Obligation de couper
- **WHEN** un joueur n'a plus de la couleur demandée mais a un atout
- **THEN** seuls ses atouts, excuse comprise, sont jouables

#### Scenario: Défausse libre
- **WHEN** un joueur n'a ni la couleur demandée ni atout
- **THEN** toutes ses cartes sont jouables

#### Scenario: Atout demandé
- **WHEN** un atout est demandé et que le joueur a des atouts
- **THEN** seuls ses atouts, excuse comprise, sont jouables

#### Scenario: Excuse seul atout en main
- **WHEN** un atout est demandé et que l'excuse est le seul atout du joueur
- **THEN** l'excuse est la seule carte jouable

#### Scenario: Pas d'obligation de surcouper
- **WHEN** un atout fort est déjà posé et que le joueur a un atout plus faible
- **THEN** il peut jouer cet atout plus faible

### Requirement: Gagnant d'un pli
Le système SHALL désigner comme gagnant d'un pli complet, comportant une carte par joueur, le joueur qui a posé le plus fort atout si au moins un atout a été posé, l'excuse comptant pour un atout de force 0, sinon le joueur qui a posé la plus haute carte de la couleur demandée. Les cartes d'une autre couleur ne gagnent jamais.

#### Scenario: Pli sans atout
- **WHEN** aucun atout n'est posé
- **THEN** la plus haute carte de la couleur demandée gagne

#### Scenario: Coupe
- **WHEN** un atout est posé sur une couleur
- **THEN** le plus fort atout gagne, même contre un roi de la couleur demandée

#### Scenario: Excuse seul atout du pli
- **WHEN** l'excuse est le seul atout du pli et qu'elle n'a pas entamé
- **THEN** son joueur gagne le pli et récupère ses 100 points

#### Scenario: Excuse battue
- **WHEN** l'excuse et un autre atout sont posés
- **THEN** l'autre atout gagne, même s'il est de valeur 1

#### Scenario: Excuse en entame au dernier pli
- **WHEN** l'excuse entame le dernier pli
- **THEN** son joueur gagne automatiquement, quelles que soient les cartes posées par les autres

#### Scenario: Excuse jouée sans entamer au dernier pli
- **WHEN** l'excuse est jouée au dernier pli sans entamer
- **THEN** la règle normale s'applique : elle ne gagne que si elle est le seul atout du pli

### Requirement: Déroulement des plis
Le système SHALL faire jouer les joueurs dans le sens horaire à partir de l'entameur, ajouter les cartes du pli au tas de son gagnant, faire entamer le pli suivant par ce gagnant, et continuer jusqu'à épuisement des mains, soit autant de plis que de cartes par joueur.

#### Scenario: Pli suivant
- **WHEN** un pli est terminé et qu'il reste des cartes
- **THEN** son gagnant entame le pli suivant

#### Scenario: Ordre de jeu
- **WHEN** un joueur à la place i entame
- **THEN** les joueurs jouent dans l'ordre i+1, i+2, ... modulo le nombre de joueurs

### Requirement: Décompte d'une manche
Le système SHALL, à la fin d'une manche, calculer pour chaque joueur la somme des points des cartes de son tas, l'ajouter à son total, et conserver les points de chaque manche dans un tableau des scores.

#### Scenario: Somme constante
- **WHEN** une manche se termine
- **THEN** la somme des points de tous les joueurs pour cette manche vaut 390

#### Scenario: Tableau des scores
- **WHEN** une manche se termine
- **THEN** les points de la manche et le total de chaque joueur sont consultables

### Requirement: Progression de la partie
Le système SHALL jouer autant de manches que de joueurs, faire tourner le rôle d'entameur d'un joueur dans le sens horaire à chaque manche, de sorte que chaque joueur choisisse une fois la couleur du papayou, remélanger et redistribuer entre les manches, puis terminer la partie après la dernière.

#### Scenario: Rotation de l'entameur
- **WHEN** une manche se termine et qu'il en reste
- **THEN** l'entameur de la manche suivante est le joueur suivant dans le sens horaire

#### Scenario: Nombre de manches
- **WHEN** une partie à n joueurs est jouée
- **THEN** elle comporte exactement n manches et chaque joueur a été entameur une fois

### Requirement: Classement final
Le système SHALL classer les joueurs par total de points croissant à la fin de la partie, le moins de points étant le meilleur. Les égalités SHALL partager la même place et la place suivante SHALL être sautée.

#### Scenario: Classement simple
- **WHEN** les totaux sont tous différents
- **THEN** les places vont de 1 à n dans l'ordre croissant des totaux

#### Scenario: Égalité
- **WHEN** deux joueurs sont à égalité pour la deuxième place sur 5 joueurs
- **THEN** le classement est 1, 2, 2, 4, 5

### Requirement: Vue par joueur
Le système SHALL fournir pour chaque joueur une vue de l'état qui contient sa propre main mais jamais les mains des autres joueurs.

#### Scenario: Mains masquées
- **WHEN** on demande la vue d'un joueur
- **THEN** elle contient uniquement ses cartes, les cartes déjà posées sur la table, les scores et les informations publiques

### Requirement: Sérialisation de l'état
Le système SHALL représenter l'état d'une partie sous une forme sérialisable en JSON, permettant de reprendre la partie à l'identique.

#### Scenario: Aller-retour
- **WHEN** on sérialise puis désérialise un état en cours de partie
- **THEN** l'état obtenu est identique et la partie peut continuer

### Requirement: Coups légaux depuis une vue
Le système SHALL calculer les cartes jouables d'un joueur à partir de sa seule vue, avec exactement les mêmes règles que le calcul fait depuis l'état complet.

#### Scenario: Même résultat que depuis l'état complet
- **WHEN** on calcule les coups légaux d'un joueur depuis son état complet puis depuis sa vue, à tous les moments d'une partie
- **THEN** les deux listes de cartes sont identiques

#### Scenario: Pas son tour
- **WHEN** on demande les coups légaux depuis la vue d'un joueur dont ce n'est pas le tour, ou hors phase de jeu
- **THEN** la liste est vide

### Requirement: Vue pour les bots
Le système SHALL fournir pour un bot une vue qui contient la vue du joueur et la liste des cartes déjà jouées dans la manche en cours (plis terminés et pli en cours). Cette liste SHALL NOT figurer dans la vue des joueurs humains.

#### Scenario: Cartes déjà jouées
- **WHEN** on demande la vue d'un bot en cours de manche
- **THEN** la liste contient chaque carte déjà posée une seule fois, plis terminés compris, et aucune carte restée dans une main

#### Scenario: Début de manche
- **WHEN** on demande la vue d'un bot avant la première carte jouée
- **THEN** la liste est vide

#### Scenario: Mains masquées
- **WHEN** on demande la vue d'un bot
- **THEN** elle ne contient pas les mains des autres joueurs ni les cartes qu'ils ont données à l'échange

#### Scenario: Vue des humains inchangée
- **WHEN** on demande la vue d'un joueur humain
- **THEN** elle ne contient pas la liste des cartes déjà jouées
