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
- **THEN** le 7 et le 10 de chaque couleur sont en jeu

#### Scenario: Retrait conservé entre les manches
- **WHEN** une nouvelle manche commence dans une partie à 3, 4 ou 5 joueurs
- **THEN** les mêmes cartes restent retirées

#### Scenario: Nombre de joueurs invalide
- **WHEN** on crée une partie avec moins de 3 ou plus de 6 joueurs
- **THEN** la création est refusée

### Requirement: Valeur en points des cartes
Le système SHALL attribuer les points suivants : excuse 100, atout 21 à 30, atouts 1 à 20 à leur valeur faciale, papayou 50, toutes les autres cartes de couleur 0. Le papayou SHALL être, dans la couleur choisie pour la manche, le 7 à 3 joueurs et le 10 à partir de 4 joueurs.

#### Scenario: Total d'une manche
- **WHEN** on additionne la valeur de toutes les cartes d'une manche
- **THEN** le total vaut 390, quel que soit le nombre de joueurs et la couleur du papayou

#### Scenario: Papayou à trois joueurs
- **WHEN** une manche à 3 joueurs a le cœur pour couleur du papayou
- **THEN** le 7 de cœur vaut 50 points et le 10 de cœur vaut 0

#### Scenario: Papayou à partir de quatre joueurs
- **WHEN** une manche à 4, 5 ou 6 joueurs a le cœur pour couleur du papayou
- **THEN** le 10 de cœur vaut 50 points et le 7 de cœur vaut 0

#### Scenario: Hors de la couleur du papayou
- **WHEN** une manche a le cœur pour couleur du papayou
- **THEN** le 7 et le 10 des autres couleurs valent 0

### Requirement: Choix du papayou
Le système SHALL faire choisir au joueur entameur de la manche, après l'échange, la couleur du papayou. La carte papayou de cette couleur (le 7 à 3 joueurs, le 10 à partir de 4 joueurs) SHALL valoir 50 points pour cette manche. L'entameur SHALL pouvoir choisir n'importe quelle couleur, y compris une dont il possède le papayou.

#### Scenario: Choix valide
- **WHEN** l'entameur choisit une couleur
- **THEN** la carte papayou de cette couleur est le papayou et la phase de jeu commence

#### Scenario: Papayou dans la main de l'entameur
- **WHEN** l'entameur choisit une couleur dont il possède la carte papayou
- **THEN** le choix est accepté

#### Scenario: Choix par un autre joueur
- **WHEN** un joueur autre que l'entameur tente de choisir la couleur
- **THEN** l'action est refusée
