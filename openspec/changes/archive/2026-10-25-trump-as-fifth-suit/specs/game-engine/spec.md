## ADDED Requirements

### Requirement: Obligations de suivi
Le système SHALL imposer aux joueurs suivants : si la carte d'entame est une carte de couleur, fournir de cette couleur s'ils en ont, sinon jouer n'importe quelle carte (atouts et excuse compris) ; si la carte d'entame est un atout, jouer un atout s'ils en ont, sinon n'importe quelle carte. L'excuse SHALL compter comme un atout pour l'obligation de fournir à l'atout. Le système SHALL NOT imposer de couper ni de surcouper.

#### Scenario: Obligation de fournir la couleur
- **WHEN** un joueur a de la couleur demandée
- **THEN** seules les cartes de cette couleur sont jouables, l'excuse et les atouts ne le sont pas

#### Scenario: Défausse libre avec des atouts en main
- **WHEN** un joueur n'a plus de la couleur demandée mais a des atouts ou l'excuse
- **THEN** toutes ses cartes sont jouables, il n'est pas obligé de jouer atout

#### Scenario: Défausse libre sans atout
- **WHEN** un joueur n'a ni la couleur demandée ni atout
- **THEN** toutes ses cartes sont jouables

#### Scenario: Atout demandé
- **WHEN** un atout est demandé et que le joueur a des atouts
- **THEN** seuls ses atouts, excuse comprise, sont jouables

#### Scenario: Atout demandé sans atout en main
- **WHEN** un atout est demandé et que le joueur n'a ni atout ni excuse
- **THEN** toutes ses cartes sont jouables

#### Scenario: Excuse seul atout en main
- **WHEN** un atout est demandé et que l'excuse est le seul atout du joueur
- **THEN** l'excuse est la seule carte jouable

#### Scenario: Pas d'obligation de surcouper
- **WHEN** un atout fort est déjà posé sur un pli d'atout et que le joueur a un atout plus faible
- **THEN** il peut jouer cet atout plus faible

## MODIFIED Requirements

### Requirement: Gagnant d'un pli
Le système SHALL désigner comme gagnant d'un pli complet, comportant une carte par joueur, le joueur qui a posé la plus forte carte de la famille demandée par l'entame : la plus haute carte de la couleur demandée si l'entame est une carte de couleur, le plus fort atout si l'entame est un atout, l'excuse comptant pour un atout de force 0. Les cartes d'une autre famille, atouts compris quand une couleur est demandée, ne gagnent jamais.

#### Scenario: Pli sans atout
- **WHEN** aucun atout n'est posé
- **THEN** la plus haute carte de la couleur demandée gagne

#### Scenario: Coupe
- **WHEN** un joueur sans la couleur demandée pose un atout sur un pli entamé à la couleur
- **THEN** l'atout ne gagne pas : la plus haute carte de la couleur demandée garde le pli, même contre l'atout 21

#### Scenario: Excuse seul atout du pli
- **WHEN** l'excuse est le seul atout du pli, posée sans entamer sur un pli de couleur
- **THEN** elle ne gagne pas, le gagnant du pli est celui qui a posé la plus haute carte de la couleur demandée, et il récupère les 100 points de l'excuse

#### Scenario: Excuse battue
- **WHEN** l'excuse et un autre atout sont posés sur un pli d'atout
- **THEN** l'autre atout gagne, même s'il est de valeur 1

#### Scenario: Excuse en entame au dernier pli
- **WHEN** l'excuse entame le dernier pli
- **THEN** son joueur gagne automatiquement, quelles que soient les cartes posées par les autres

#### Scenario: Excuse jouée sans entamer au dernier pli
- **WHEN** l'excuse est jouée au dernier pli sans entamer
- **THEN** la règle normale s'applique : elle ne gagne pas, quelle que soit la famille demandée

## REMOVED Requirements

### Requirement: Obligations pour suivre
**Reason**: Sans la couleur demandée, l'obligation de jouer atout (et donc de couper) disparaît : l'atout devient une cinquième couleur qui ne gagne un pli que s'il est entamé.
**Migration**: Remplacée par l'exigence « Obligations de suivi », qui conserve l'obligation de fournir la couleur et l'obligation de fournir à l'atout quand un atout est entamé.
