# Spec Delta

## ADDED Requirements

### Requirement: Coups légaux depuis une vue
Le système SHALL calculer les cartes jouables d'un joueur à partir de sa seule vue, avec exactement les mêmes règles que le calcul fait depuis l'état complet.

#### Scenario: Même résultat que depuis l'état complet
- **WHEN** on calcule les coups légaux d'un joueur depuis son état complet puis depuis sa vue, à tous les moments d'une partie
- **THEN** les deux listes de cartes sont identiques

#### Scenario: Pas son tour
- **WHEN** on demande les coups légaux depuis la vue d'un joueur dont ce n'est pas le tour, ou hors phase de jeu
- **THEN** la liste est vide

### Requirement: Vue pour les bots
Le système SHALL fournir pour un bot une vue qui contient la vue du joueur et la liste des cartes déjà jouées dans la manche en cours (plis terminés et pli en cours). Cette liste SHALL NOT figurer dans la vue des joueurs humains.

#### Scenario: Cartes déjà jouées
- **WHEN** on demande la vue d'un bot en cours de manche
- **THEN** la liste contient chaque carte déjà posée une seule fois, plis terminés compris, et aucune carte restée dans une main

#### Scenario: Début de manche
- **WHEN** on demande la vue d'un bot avant la première carte jouée
- **THEN** la liste est vide

#### Scenario: Mains masquées
- **WHEN** on demande la vue d'un bot
- **THEN** elle ne contient pas les mains des autres joueurs ni les cartes qu'ils ont données à l'échange

#### Scenario: Vue des humains inchangée
- **WHEN** on demande la vue d'un joueur humain
- **THEN** elle ne contient pas la liste des cartes déjà jouées
