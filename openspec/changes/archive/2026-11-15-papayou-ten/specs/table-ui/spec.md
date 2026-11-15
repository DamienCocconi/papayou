## MODIFIED Requirements

### Requirement: Choix du papayou
Le système SHALL, quand l'humain est l'entameur, lui proposer les quatre couleurs et enregistrer son choix. Quand un autre joueur est l'entameur, l'interface SHALL indiquer qui choisit. Une fois le papayou choisi, la carte papayou de la manche, hauteur et couleur (par exemple « 10 de cœur »), SHALL rester visible pendant la manche, telle que le moteur la désigne.

#### Scenario: L'humain choisit
- **WHEN** l'humain est l'entameur et clique sur la couleur trèfle
- **THEN** le papayou de la manche est le trèfle et le jeu commence

#### Scenario: Un bot choisit
- **WHEN** un bot est l'entameur
- **THEN** l'interface indique que ce joueur choisit, puis affiche la carte papayou choisie

#### Scenario: Papayou affiché à trois joueurs
- **WHEN** le papayou d'une manche à 3 joueurs est le trèfle
- **THEN** l'interface affiche le 7 de trèfle comme papayou

#### Scenario: Papayou affiché à partir de quatre joueurs
- **WHEN** le papayou d'une manche à 4 joueurs est le trèfle
- **THEN** l'interface affiche le 10 de trèfle comme papayou
