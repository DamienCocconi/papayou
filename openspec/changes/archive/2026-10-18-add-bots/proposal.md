# Proposal

## Why

Le moteur de règles est terminé mais personne ne peut encore jouer contre lui : il n'y a ni joueur automatique, ni interface. Les bots sont l'étape 2 de la feuille de route. Ils servent à jouer seul, à compléter une table de 3 à 6 joueurs quand tout le monde n'est pas là, et à tester l'interface et le réseau à venir avec de vraies parties.

Aujourd'hui, les coups légaux ne se calculent que depuis l'état complet (`legalPlays(state, seat)`). Or un bot, comme un humain, ne doit voir que sa propre vue. Ce besoin concerne aussi la future interface (griser les cartes injouables), donc on le règle maintenant, dans le moteur.

## What Changes

- Le moteur expose les coups légaux calculés **depuis une vue de joueur** (sans l'état complet), en réutilisant la logique existante de `legalCards`. Aucune règle n'est dupliquée.
- Le moteur expose une **vue réservée aux bots** : la vue du joueur plus la liste des cartes déjà jouées dans la manche. Cette liste n'est **pas** ajoutée à la vue des humains, qui doivent se fier à leur mémoire.
- Nouveau module `bots` avec une interface `Bot` (choix des 3 cartes à donner, choix du papayou, choix de la carte à jouer), un **bot aléatoire** et un **bot heuristique simple**, tous deux sans mémoire propre.
- Une fonction `botAction` qui, selon la phase et le tour, fabrique l'`Action` à envoyer au moteur (ou rien si ce n'est pas à ce bot d'agir).
- Tests : aucune action refusée par le moteur sur de nombreuses parties de 3 à 6 joueurs, déterminisme à graine égale, et l'heuristique fait en moyenne moins de points que l'aléatoire.

Hors périmètre : mémoire des couleurs manquées par les adversaires (demande l'historique pli par pli), bots par simulation (Monte-Carlo), niveaux de difficulté, intégration à l'hôte réseau et à l'interface.

## Capabilities

### New Capabilities
- `bots`: joueurs automatiques qui n'utilisent que l'API publique du moteur, à partir de leur seule vue ; stratégie aléatoire et stratégie heuristique ; production de l'action à jouer selon la phase.

### Modified Capabilities
- `game-engine`: ajout des coups légaux calculables depuis une vue de joueur, et d'une vue enrichie réservée aux bots (cartes déjà jouées). La vue des humains reste inchangée.

## Impact

- `src/engine/` : `rules.ts`, `view.ts`, `index.ts` (export), tests associés. Ajout uniquement, aucun comportement existant ne change.
- `src/bots/` : nouveaux fichiers (interface, bot aléatoire, bot heuristique, `botAction`) et leurs tests.
- Aucune dépendance npm ajoutée. `bots` n'importe que `engine`, conformément aux règles de dépendance du projet.
