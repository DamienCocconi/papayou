## MODIFIED Requirements

### Requirement: Bot heuristique, échange et papayou
Le système SHALL fournir un bot heuristique dont le but est de faire le moins de points possible. À l'échange, il SHALL donner les 3 cartes qui valent le plus de points (excuse comprise). Comme entameur, il SHALL choisir une couleur dont il ne possède pas la carte papayou de la table (le 7 à 3 joueurs, le 10 à partir de 4 joueurs), et une couleur quelconque s'il possède les quatre.

#### Scenario: Don des cartes dangereuses
- **WHEN** le bot heuristique possède l'excuse et l'atout 21
- **THEN** il les donne, avec la troisième carte la plus chère de sa main

#### Scenario: Papayou hors de sa main
- **WHEN** le bot heuristique est entameur à 3 joueurs et possède le 7 de cœur et le 7 de pique mais pas ceux de carreau et de trèfle
- **THEN** il choisit carreau ou trèfle

#### Scenario: Papayou hors de sa main à partir de quatre joueurs
- **WHEN** le bot heuristique est entameur à 4 joueurs, possède le 10 de cœur et le 10 de pique mais pas ceux de carreau et de trèfle, et possède le 7 de carreau et le 7 de trèfle
- **THEN** il choisit carreau ou trèfle
