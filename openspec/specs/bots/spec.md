# bots Specification

## Purpose

Joueurs automatiques du Papayou, utilisables pour jouer seul ou compléter une table. Un bot décide uniquement à partir de sa vue et ne produit que des actions que le moteur accepte.

## Requirements

### Requirement: Décision à partir de la seule vue
Le système SHALL faire décider un bot uniquement à partir de sa vue de bot (sa vue de joueur et les cartes déjà jouées). Un bot SHALL NOT connaître les mains des autres joueurs, ni les cartes données par les autres pendant l'échange, et SHALL NOT conserver d'état entre deux décisions.

#### Scenario: Mains adverses inconnues
- **WHEN** deux états de partie ne diffèrent que par les mains des autres joueurs, avec la même vue de bot pour le joueur concerné et la même graine
- **THEN** le bot prend la même décision dans les deux cas

#### Scenario: Pas de mémoire propre
- **WHEN** on rejoue la même décision avec la même vue et la même graine
- **THEN** le bot prend la même décision, quelles que soient les décisions précédentes

### Requirement: Action selon la phase
Le système SHALL produire, pour un bot et sa vue, l'action que le moteur attend de lui : le don de 3 cartes en phase d'échange tant qu'il n'a pas donné, le choix du papayou en phase de choix s'il est l'entameur, la pose d'une carte en phase de jeu quand c'est son tour. Dans tout autre cas, aucune action SHALL être produite.

#### Scenario: Échange
- **WHEN** c'est la phase d'échange et que le bot n'a pas encore donné ses cartes
- **THEN** l'action est le don de 3 cartes de sa main

#### Scenario: Échange déjà fait
- **WHEN** c'est la phase d'échange et que le bot a déjà donné ses cartes
- **THEN** aucune action n'est produite

#### Scenario: Choix du papayou par l'entameur
- **WHEN** c'est la phase de choix du papayou et que le bot est l'entameur de la manche
- **THEN** l'action est le choix d'une couleur

#### Scenario: Choix du papayou par un autre joueur
- **WHEN** c'est la phase de choix du papayou et que le bot n'est pas l'entameur
- **THEN** aucune action n'est produite

#### Scenario: Tour de jeu
- **WHEN** c'est la phase de jeu et le tour du bot
- **THEN** l'action est la pose d'une carte légale de sa main

#### Scenario: Pas son tour
- **WHEN** c'est la phase de jeu et le tour d'un autre joueur
- **THEN** aucune action n'est produite

### Requirement: Actions toujours acceptées
Le système SHALL garantir qu'un bot ne produit jamais une action refusée par le moteur, quel que soit le nombre de joueurs (3 à 6) et la partie.

#### Scenario: Parties complètes
- **WHEN** des bots jouent toutes les places d'une partie complète, pour 3, 4, 5 et 6 joueurs et de nombreuses graines
- **THEN** le moteur accepte chaque action et la partie atteint la fin, avec les invariants du moteur respectés (390 points par manche, aucune carte perdue ni dupliquée)

### Requirement: Déterminisme
Le système SHALL faire dépendre les choix aléatoires d'un bot uniquement d'un générateur à graine fourni de l'extérieur.

#### Scenario: Même graine
- **WHEN** deux parties entièrement jouées par des bots sont lancées avec les mêmes graines (partie et bots)
- **THEN** elles produisent exactement les mêmes actions et le même résultat

### Requirement: Bot aléatoire
Le système SHALL fournir un bot aléatoire qui donne 3 cartes de sa main au hasard, choisit une couleur de papayou au hasard et joue une carte légale au hasard.

#### Scenario: Coup légal
- **WHEN** le bot aléatoire joue
- **THEN** la carte choisie fait partie des coups légaux de sa vue

#### Scenario: Cartes données
- **WHEN** le bot aléatoire donne des cartes
- **THEN** il donne 3 cartes distinctes de sa main

### Requirement: Bot heuristique, échange et papayou
Le système SHALL fournir un bot heuristique dont le but est de faire le moins de points possible. À l'échange, il SHALL donner les 3 cartes qui valent le plus de points (excuse comprise). Comme entameur, il SHALL choisir une couleur dont il ne possède pas le 7, et une couleur quelconque s'il possède les quatre 7.

#### Scenario: Don des cartes dangereuses
- **WHEN** le bot heuristique possède l'excuse et l'atout 21
- **THEN** il les donne, avec la troisième carte la plus chère de sa main

#### Scenario: Papayou hors de sa main
- **WHEN** le bot heuristique est entameur et possède le 7 de cœur et le 7 de pique mais pas ceux de carreau et de trèfle
- **THEN** il choisit carreau ou trèfle

### Requirement: Bot heuristique, jeu d'un pli
Le système SHALL faire éviter au bot heuristique de gagner les plis. En suite de pli, s'il existe une carte légale qui ne remporte pas le pli tel qu'il est posé, il SHALL jouer parmi elles celle qui vaut le plus de points. Si toutes ses cartes légales remportent le pli, il SHALL jouer la plus faible.

#### Scenario: Se débarrasser d'une carte chère sans gagner
- **WHEN** un autre joueur est en train de gagner le pli et que le bot a, parmi ses cartes légales, une carte qui perd et vaut des points
- **THEN** il joue celle qui vaut le plus de points parmi les cartes qui perdent

#### Scenario: Excuse qui perdrait
- **WHEN** l'excuse est légale, qu'un autre atout est déjà dans le pli (donc l'excuse ne gagnera pas) et que le bot n'a pas d'autre carte légale qui perde et vaille plus de points
- **THEN** il joue l'excuse, qui donne ses 100 points au gagnant du pli

#### Scenario: Obligé de gagner
- **WHEN** toutes les cartes légales du bot remporteraient le pli
- **THEN** il joue la plus faible

#### Scenario: Excuse évitée quand elle gagnerait
- **WHEN** la couleur demandée est une couleur dont le bot n'a plus, que le bot a l'excuse et un atout numéroté, et qu'aucun atout n'est encore dans le pli (toutes ses cartes légales remportent le pli)
- **THEN** il joue l'atout numéroté et garde l'excuse, car la jouer lui ferait ramasser ses 100 points

#### Scenario: Excuse seule carte légale
- **WHEN** l'excuse est la seule carte légale du bot (seul atout demandé, ou entame forcée au dernier pli)
- **THEN** il la joue

### Requirement: Bot heuristique, entame
Le système SHALL faire entamer au bot heuristique la carte légale qui a le plus de chances de perdre le pli, estimée par le nombre de cartes plus fortes de même famille (même couleur, ou atouts) encore en jeu chez les autres joueurs. À égalité, il SHALL préférer la carte qui vaut le moins de points.

#### Scenario: Usage des cartes déjà jouées
- **WHEN** le bot entame, que le roi d'une couleur est déjà joué et que le bot détient la dame de cette couleur (aucune carte plus forte ne reste chez les autres), alors qu'une autre couleur a encore des cartes plus fortes que sa carte en jeu chez les autres
- **THEN** il n'entame pas la dame, qui gagnerait presque sûrement, et entame la carte de l'autre couleur

### Requirement: Le bot heuristique bat le bot aléatoire
Le système SHALL faire marquer en moyenne moins de points au bot heuristique qu'au bot aléatoire, à même table, sur un grand nombre de parties.

#### Scenario: Comparaison sur de nombreuses parties
- **WHEN** un bot heuristique joue contre des bots aléatoires sur plusieurs centaines de parties à graines fixées, à chaque place tour à tour
- **THEN** sa moyenne de points par partie est inférieure à celle des bots aléatoires
