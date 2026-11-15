## ADDED Requirements

### Requirement: Liseré du papayou
Le système SHALL, une fois la couleur du papayou choisie, distinguer la carte papayou de la manche, telle que le moteur la désigne, par un liseré luisant rouge orangé (bord et halo), partout où cette carte est affichée : main étalée, main en éventail (y compris en emphase), pli en cours et dernier pli. Aucune autre carte SHALL porter ce liseré.

#### Scenario: Papayou dans la main
- **WHEN** l'humain détient la carte papayou et que la couleur du papayou vient d'être choisie
- **THEN** cette carte porte le liseré dans sa main, en étalé comme en éventail

#### Scenario: Papayou posé sur la table
- **WHEN** un joueur pose la carte papayou dans le pli en cours
- **THEN** la carte porte le liseré sur la table, puis dans le dernier pli une fois le pli terminé

#### Scenario: Autres cartes
- **WHEN** le papayou d'une manche à 4 joueurs est le cœur
- **THEN** le 10 de cœur porte le liseré, et ni le 7 de cœur ni le 10 des autres couleurs ne le portent

#### Scenario: Papayou à trois joueurs
- **WHEN** le papayou d'une manche à 3 joueurs est le cœur
- **THEN** le 7 de cœur porte le liseré

#### Scenario: Avant le choix du papayou
- **WHEN** la manche est en phase d'échange ou de choix du papayou
- **THEN** aucune carte ne porte le liseré

### Requirement: Liseré du papayou sans gêne pour le jeu
Le système SHALL afficher le liseré du papayou sans masquer la hauteur ni la couleur de la carte, et sans changer la façon de la jouer : la carte papayou se sélectionne, se joue et se tire en éventail exactement comme une autre carte.

#### Scenario: Jouer le papayou
- **WHEN** le joueur sélectionne puis joue la carte papayou, ou la tire vers le haut en éventail
- **THEN** l'action se déroule comme pour une carte sans liseré

#### Scenario: Carte lisible
- **WHEN** la carte papayou porte le liseré, y compris en petite taille sur la table
- **THEN** sa hauteur et le symbole de sa couleur restent lisibles
