# Spec Delta

## ADDED Requirements

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
