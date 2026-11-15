## MODIFIED Requirements

### Requirement: Mise en place selon le nombre de joueurs
Le système SHALL accepter de 3 à 6 joueurs et retirer, une seule fois au début de la partie : pour 3 joueurs, les 16 figures (valet, cavalier, dame, roi des quatre couleurs) et 2 cartes « 1 » de couleur tirées au hasard ; pour 4 joueurs, 2 cartes « 1 » de couleur tirées au hasard ; pour 5 joueurs, 3 cartes « 1 » de couleur tirées au hasard ; pour 6 joueurs, aucune carte. Les cartes retirées SHALL rester retirées pendant toute la partie.

#### Scenario: Trois joueurs
- **WHEN** une partie à 3 joueurs est créée
- **THEN** les 16 figures et 2 cartes « 1 » de couleur sont retirées, et 60 cartes sont en jeu

#### Scenario: Aucune figure en jeu à trois joueurs
- **WHEN** une manche d'une partie à 3 joueurs est distribuée
- **THEN** aucune main ne contient de valet, de cavalier, de dame ni de roi

#### Scenario: Quatre joueurs
- **WHEN** une partie à 4 joueurs est créée
- **THEN** 2 cartes « 1 » de couleur sont retirées et 76 cartes sont en jeu

#### Scenario: Cinq joueurs
- **WHEN** une partie à 5 joueurs est créée
- **THEN** 3 cartes « 1 » de couleur sont retirées et 75 cartes sont en jeu

#### Scenario: Six joueurs
- **WHEN** une partie à 6 joueurs est créée
- **THEN** aucune carte n'est retirée et 78 cartes sont en jeu

#### Scenario: Le papayou toujours en jeu
- **WHEN** une partie est créée, quel que soit le nombre de joueurs
- **THEN** le 7 de chaque couleur est en jeu

#### Scenario: Retrait conservé entre les manches
- **WHEN** une nouvelle manche commence dans une partie à 3, 4 ou 5 joueurs
- **THEN** les mêmes cartes restent retirées

#### Scenario: Nombre de joueurs invalide
- **WHEN** on crée une partie avec moins de 3 ou plus de 6 joueurs
- **THEN** la création est refusée

### Requirement: Distribution
Le système SHALL, au début de chaque manche, mélanger les cartes en jeu et les distribuer toutes, équitablement, entre les joueurs, soit 20 cartes à 3 joueurs, 19 à 4, 15 à 5 et 13 à 6.

#### Scenario: Distribution complète
- **WHEN** une manche est distribuée
- **THEN** chaque joueur a le même nombre de cartes, aucune carte n'est perdue et aucune n'est dupliquée

#### Scenario: Vingt cartes à trois joueurs
- **WHEN** une manche d'une partie à 3 joueurs est distribuée
- **THEN** chaque joueur reçoit 20 cartes et la manche compte 20 plis

#### Scenario: Déterminisme
- **WHEN** deux parties sont créées avec la même graine et le même nombre de joueurs
- **THEN** elles produisent les mêmes distributions
