## ADDED Requirements

### Requirement: Bot heuristique, suite de pli
Le système SHALL faire éviter au bot heuristique de gagner les plis. En suite de pli, s'il existe une carte légale qui ne remporte pas le pli tel qu'il est posé, il SHALL jouer parmi elles celle qui vaut le plus de points. Si toutes ses cartes légales remportent le pli, il SHALL jouer la plus faible. Comme un atout ou l'excuse défaussé sur un pli de couleur ne gagne jamais, un bot sans la couleur demandée SHALL pouvoir s'en débarrasser sur le pli d'un autre joueur.

#### Scenario: Se débarrasser d'une carte chère sans gagner
- **WHEN** un autre joueur est en train de gagner le pli et que le bot a, parmi ses cartes légales, une carte qui perd et vaut des points
- **THEN** il joue celle qui vaut le plus de points parmi les cartes qui perdent

#### Scenario: Excuse défaussée sans la couleur demandée
- **WHEN** le pli est entamé à une couleur dont le bot n'a plus, et que le bot a l'excuse et d'autres cartes qui valent moins de points
- **THEN** il joue l'excuse, qui ne gagne pas et donne ses 100 points au gagnant du pli

#### Scenario: Gros atout défaussé sans la couleur demandée
- **WHEN** le pli est entamé à une couleur dont le bot n'a plus, et que l'atout 21 est sa carte la plus chère (sans l'excuse)
- **THEN** il joue l'atout 21, qui ne gagne pas

#### Scenario: Obligé de gagner
- **WHEN** toutes les cartes légales du bot remporteraient le pli, par exemple parce qu'il n'a que des cartes de la couleur demandée plus hautes que celles déjà posées
- **THEN** il joue la plus faible

#### Scenario: Excuse seule carte légale
- **WHEN** l'excuse est la seule carte légale du bot (seul atout quand un atout est demandé, ou entame forcée au dernier pli)
- **THEN** il la joue

## REMOVED Requirements

### Requirement: Bot heuristique, jeu d'un pli
**Reason**: Le scénario « Excuse évitée quand elle gagnerait » n'a plus d'objet : l'excuse ne gagne plus un pli de couleur, et ne gagne un pli que par l'entame forcée du dernier pli.
**Migration**: Remplacée par l'exigence « Bot heuristique, suite de pli », qui garde le principe (éviter de gagner, se débarrasser de la carte la plus chère) avec des scénarios adaptés à la défausse libre.
