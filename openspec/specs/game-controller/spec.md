# game-controller Specification

## Purpose

Fournit à l'interface une façade unique pour suivre et jouer une partie du point de vue d'un joueur : elle lit une vue et envoie des actions. La version locale fait jouer les bots à la place des autres joueurs, et le réseau pourra offrir la même façade plus tard.

## Requirements

### Requirement: Vue et actions uniquement
Le système SHALL donner à l'interface la vue du joueur humain (sans les mains des autres joueurs) et accepter ses actions, sans lui exposer l'état complet de la partie ni le générateur aléatoire.

#### Scenario: Pas de main adverse
- **WHEN** l'interface lit ce que le contrôleur lui fournit pendant une partie
- **THEN** elle n'y trouve que la main de l'humain, et le nombre de cartes des autres joueurs

#### Scenario: Coups légaux fournis
- **WHEN** c'est le tour de l'humain en phase de jeu
- **THEN** le contrôleur indique quelles cartes de sa main sont jouables, selon le moteur

### Requirement: Création d'une partie locale
Le système SHALL créer une partie de 3 à 6 joueurs où l'humain occupe une place et où chaque autre place est tenue par un bot du type choisi (aléatoire ou heuristique). Le nombre de joueurs hors de 3 à 6 SHALL être refusé.

#### Scenario: Partie à 4 joueurs
- **WHEN** on crée une partie à 4 joueurs avec 3 bots
- **THEN** la partie démarre en phase d'échange avec 19 cartes en main pour l'humain

#### Scenario: Nombre de joueurs invalide
- **WHEN** on demande une partie à 2 ou 7 joueurs
- **THEN** la création est refusée et aucune partie n'est démarrée

#### Scenario: Partie reproductible
- **WHEN** on crée deux parties avec la même graine et les mêmes bots, et que l'humain joue les mêmes actions
- **THEN** elles se déroulent de façon identique

### Requirement: Les bots jouent à leur tour
Le système SHALL faire jouer chaque bot dès que le moteur attend une action de lui, en phase d'échange, de choix du papayou et de jeu, jusqu'à ce que le moteur attende l'humain ou que la manche se termine. Les coups des bots SHALL être espacés d'un délai configurable pour que l'humain puisse les suivre.

#### Scenario: Échange avec des bots
- **WHEN** l'humain donne ses 3 cartes
- **THEN** les bots donnent les leurs et la partie passe à l'étape suivante sans autre action de l'humain

#### Scenario: Bot entameur
- **WHEN** un bot est l'entameur de la manche
- **THEN** il choisit le papayou, puis entame le premier pli, sans intervention de l'humain

#### Scenario: Attente de l'humain
- **WHEN** c'est au tour de l'humain de jouer une carte
- **THEN** aucun bot ne joue tant que l'humain n'a pas agi

#### Scenario: Cadence
- **WHEN** plusieurs bots jouent à la suite
- **THEN** leurs coups sont séparés par le délai configuré, et un délai nul les enchaîne immédiatement (utile en test)

### Requirement: Actions de l'humain contrôlées par le moteur
Le système SHALL transmettre chaque action de l'humain au moteur et SHALL laisser l'état inchangé quand le moteur la refuse, en rapportant la cause à l'interface.

#### Scenario: Carte illégale
- **WHEN** l'humain tente de jouer une carte que le moteur juge illégale
- **THEN** l'état de la partie ne change pas et l'interface reçoit l'erreur

#### Scenario: Action hors tour
- **WHEN** l'humain tente de jouer alors que ce n'est pas son tour
- **THEN** l'état ne change pas et l'interface reçoit l'erreur

### Requirement: Notification des changements
Le système SHALL prévenir l'interface à chaque changement de la vue, y compris ceux causés par les bots, et SHALL permettre de se désabonner sans fuite.

#### Scenario: Coup de bot
- **WHEN** un bot joue une carte
- **THEN** l'interface est notifiée et lit une vue contenant cette carte dans le pli

#### Scenario: Désabonnement
- **WHEN** l'interface se désabonne puis qu'un bot joue
- **THEN** elle n'est plus notifiée

### Requirement: Partie menée à son terme
Le système SHALL mener une partie contre des bots jusqu'à la phase de fin de partie avec un classement, le passage d'une manche à la suivante étant déclenché par l'humain.

#### Scenario: Partie complète
- **WHEN** l'humain joue des coups légaux et demande chaque manche suivante, pour 3, 4, 5 et 6 joueurs
- **THEN** la partie atteint la fin avec un classement, sans erreur

#### Scenario: Manche suivante
- **WHEN** une manche se termine
- **THEN** le contrôleur attend que l'humain demande la manche suivante avant de redistribuer

### Requirement: Même façade en réseau
Le système SHALL fournir à l'interface, pour une partie en réseau, la même façade que pour une partie locale : une vue, les coups légaux, l'envoi d'actions, la notification des changements et l'arrêt propre. Les composants de jeu SHALL fonctionner sans savoir si la partie est locale ou en réseau.

#### Scenario: Action d'un invité
- **WHEN** l'interface d'un invité envoie une action au contrôleur
- **THEN** l'action part vers l'hôte, et si l'hôte la refuse, la cause est rapportée à l'interface avec l'instantané suivant

#### Scenario: Notification d'une vue reçue
- **WHEN** l'invité reçoit une nouvelle vue de l'hôte
- **THEN** l'interface est notifiée et lit cette vue

#### Scenario: Arrêt
- **WHEN** l'interface arrête le contrôleur d'un invité
- **THEN** la connexion avec l'hôte est fermée et plus aucune notification n'est envoyée

### Requirement: Informations de session dans l'instantané
Le système SHALL ajouter à l'instantané lu par l'interface les informations propres à une partie en réseau : la liste des places avec le nom et l'état de chacune (humain connecté, bot, libre), l'indication que la partie est en pause, et, en fin de manche, le temps restant et le nombre de joueurs attendus. Pour une partie locale contre des bots, ces informations SHALL indiquer l'absence de session réseau.

#### Scenario: Pause visible
- **WHEN** un joueur est absent
- **THEN** l'instantané indique la pause et la place concernée

#### Scenario: Partie locale inchangée
- **WHEN** l'interface lit l'instantané d'une partie locale
- **THEN** il n'y a ni pause, ni place libre, ni compte à rebours, et le comportement est celui d'avant ce changement

### Requirement: Demande de manche suivante en réseau
Le système SHALL, en réseau, enregistrer la demande de manche suivante de chaque humain sans passer immédiatement à la manche suivante tant que d'autres humains connectés sont attendus et que le compte à rebours court. Une demande répétée du même joueur SHALL être sans effet.

#### Scenario: Demande isolée
- **WHEN** un seul des trois humains connectés demande la manche suivante
- **THEN** la manche ne change pas et le nombre de joueurs attendus passe de 3 à 2

#### Scenario: Demande répétée
- **WHEN** le même joueur demande deux fois la manche suivante
- **THEN** il n'est compté qu'une fois
