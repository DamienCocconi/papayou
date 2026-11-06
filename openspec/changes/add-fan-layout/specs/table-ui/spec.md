# Spec Delta

## ADDED Requirements

### Requirement: Deux affichages de la main
Le système SHALL proposer deux affichages de la main, en éventail et étalé, l'éventail étant celui par défaut. Un bouton de l'écran de jeu SHALL permettre de passer de l'un à l'autre, sans modifier la partie ni la carte sélectionnée.

#### Scenario: Premier lancement
- **WHEN** un joueur arrive pour la première fois sur l'écran de jeu
- **THEN** sa main s'affiche en éventail

#### Scenario: Changement d'affichage
- **WHEN** le joueur utilise le bouton pendant une partie
- **THEN** sa main passe à l'autre affichage et reste composée des mêmes cartes

#### Scenario: Sélection conservée
- **WHEN** une carte est sélectionnée et que le joueur change d'affichage
- **THEN** la même carte reste sélectionnée

### Requirement: Choix d'affichage mémorisé sur l'appareil
Le système SHALL mémoriser le choix d'affichage sur l'appareil du joueur. Ce choix SHALL ne s'appliquer qu'à cet appareil, et l'éventail SHALL être utilisé si la mémorisation est impossible.

#### Scenario: Après un rechargement
- **WHEN** le joueur a choisi l'affichage étalé puis recharge la page
- **THEN** sa main s'affiche en étalé

#### Scenario: Autres joueurs non concernés
- **WHEN** un joueur change d'affichage dans une partie en réseau
- **THEN** l'affichage des autres joueurs ne change pas

#### Scenario: Stockage indisponible
- **WHEN** le stockage du navigateur est indisponible
- **THEN** la main s'affiche en éventail, le bouton fonctionne pendant la session et aucune erreur n'apparaît

### Requirement: Main en éventail
En éventail, le système SHALL afficher la main en arc en bas de l'écran, avec des cartes superposées dans l'ordre du moteur et le coin supérieur gauche de chacune visible. La main SHALL tenir dans la largeur de l'écran, et une carte sélectionnée SHALL passer devant les autres.

#### Scenario: Grande main sur téléphone
- **WHEN** une main de 19 cartes s'affiche sur un écran de 375 px de large
- **THEN** toutes les cartes sont dans l'écran, sans défilement horizontal, et le rang et la couleur de chacune se lisent

#### Scenario: Petite main
- **WHEN** il reste 3 cartes en main
- **THEN** elles restent groupées au centre, sans s'étirer sur toute la largeur

#### Scenario: Carte posée
- **WHEN** une carte quitte la main
- **THEN** les cartes restantes glissent vers leur nouvelle place au lieu d'y apparaître d'un coup

#### Scenario: Carte sélectionnée
- **WHEN** le joueur sélectionne une carte de l'éventail
- **THEN** elle se lève et s'affiche devant ses voisines

### Requirement: Écran fixe en éventail
En éventail, le système SHALL faire tenir l'écran de jeu dans la fenêtre, sans défilement de la page, en portrait comme en paysage, à partir de 360 x 640 px. Tourner l'appareil SHALL replacer les éléments sans changer la partie ni la sélection.

#### Scenario: Portrait
- **WHEN** une partie à 6 joueurs s'affiche en éventail sur un écran de 360 x 640 px
- **THEN** la barre du haut, le statut, tous les joueurs et la main sont visibles sans défiler

#### Scenario: Paysage
- **WHEN** une partie à 6 joueurs s'affiche en éventail sur un écran de 640 x 360 px
- **THEN** la barre du haut, le statut, tous les joueurs et la main sont visibles sans défiler

#### Scenario: Rotation en pleine partie
- **WHEN** le joueur tourne son téléphone alors qu'une carte est sélectionnée
- **THEN** l'écran se réorganise et la carte reste sélectionnée

#### Scenario: Geste de rafraîchissement
- **WHEN** le joueur glisse vers le bas sur l'écran de jeu en éventail
- **THEN** la page ne se recharge pas

### Requirement: Panneaux dans l'écran fixe
En éventail, le système SHALL garder accessibles dans l'écran fixe le choix du papayou, la fin de manche, la fin de partie, le menu d'administration et le bandeau de pause. Un panneau plus haut que l'espace disponible SHALL défiler à l'intérieur de lui-même.

#### Scenario: Fin de manche en paysage
- **WHEN** une manche à 6 joueurs se termine sur un écran de 640 x 360 px
- **THEN** tous les scores et le bouton de manche suivante sont accessibles

#### Scenario: Administration ouverte
- **WHEN** l'hôte ouvre le menu d'administration en éventail
- **THEN** toutes les lignes du menu sont accessibles et il peut le refermer

### Requirement: Écran défilant en étalé
En étalé, le système SHALL laisser la page défiler et afficher les cartes à leur taille actuelle. La barre du haut et le message de statut SHALL rester visibles pendant le défilement.

#### Scenario: Défilement
- **WHEN** le joueur fait défiler la page jusqu'au bas de sa main en étalé
- **THEN** la barre du haut et le message indiquant à qui c'est le tour restent visibles

### Requirement: Échange affiché en étalé
Le système SHALL afficher la main en étalé tant que le joueur doit encore choisir ses cartes à donner, quel que soit son choix d'affichage, sans modifier ce choix. Le bouton d'affichage SHALL ne pas être proposé pendant ce temps.

#### Scenario: Début de l'échange
- **WHEN** l'échange commence pour un joueur qui a choisi l'éventail
- **THEN** sa main s'affiche en étalé et le bouton d'affichage n'est pas proposé

#### Scenario: Après le don
- **WHEN** ce joueur a donné ses 3 cartes
- **THEN** sa main revient en éventail et le bouton d'affichage est de nouveau proposé

## MODIFIED Requirements

### Requirement: Affichage des cartes
Le système SHALL afficher chaque carte lisible sans image : la couleur par son symbole (cœur, carreau, trèfle, pique) et sa teinte, le rang par un chiffre ou par V, C, D, R pour valet, cavalier, dame, roi, les atouts par leur numéro, l'excuse par un libellé propre. Le rang et, pour une carte de couleur, le symbole SHALL figurer ensemble dans le coin supérieur gauche.

#### Scenario: Figure
- **WHEN** la dame de pique est affichée
- **THEN** la carte montre D et le symbole pique

#### Scenario: Atout
- **WHEN** l'atout 14 est affiché
- **THEN** la carte montre le nombre 14 et se distingue visuellement d'une carte de couleur

#### Scenario: Carte compréhensible sans la couleur seule
- **WHEN** une carte de cœur ou de carreau est affichée
- **THEN** elle se reconnaît par son symbole et non par sa seule teinte

#### Scenario: Carte recouverte par sa voisine
- **WHEN** seul le bord gauche du 10 de trèfle est visible dans la main
- **THEN** on y lit 10 et le symbole trèfle

### Requirement: Table et pli en cours
Le système SHALL afficher tous les joueurs autour de la table avec leur nom, leur nombre de cartes en main, leur place dans l'ordre de jeu, la carte qu'ils ont posée dans le pli en cours et le joueur dont c'est le tour. Le gagnant et les points du dernier pli terminé SHALL rester visibles. Ses cartes SHALL être visibles en étalé et s'afficher à la demande en éventail.

#### Scenario: Pli en cours
- **WHEN** deux joueurs sur quatre ont posé leur carte
- **THEN** ces deux cartes sont visibles à côté de leurs joueurs et le joueur suivant est signalé

#### Scenario: Dernier pli
- **WHEN** un pli vient de se terminer en étalé
- **THEN** l'interface affiche les cartes de ce pli, son gagnant et les points qu'il contient

#### Scenario: Dernier pli en éventail
- **WHEN** un pli vient de se terminer en éventail
- **THEN** l'interface affiche le gagnant et les points, et le joueur peut ouvrir puis refermer le détail des cartes de ce pli

#### Scenario: Cartes des autres
- **WHEN** la table est affichée
- **THEN** les autres joueurs n'y montrent que le nombre de leurs cartes, jamais leur contenu
