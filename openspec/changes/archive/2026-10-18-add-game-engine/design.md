## Context

Moteur utilisé à terme par l'interface React, des bots et la couche réseau PeerJS (hôte). Il doit tourner dans un navigateur, être testable sans DOM et sérialisable pour la reprise après déconnexion.

## Goals / Non-Goals

- Goals : règles exactes, déterminisme sous graine, état JSON, API simple, aucune dépendance.
- Non-Goals : affichage, réseau, intelligence des bots, comptes et persistance serveur.

## Decisions

### Moteur en fonctions pures
`applyAction(state, action) → state` (nouvel état, jamais de mutation). Une action invalide lève une erreur typée ou renvoie un résultat d'échec explicite, sans modifier l'état. Alternative écartée : classes avec état interne, plus difficiles à sérialiser et à tester.

### Machine à états explicite
Phases d'une manche : `exchange` → `choosePapayou` → `playing` → `roundEnd`, puis `gameEnd` après la dernière manche. Chaque action n'est valide que dans sa phase.

### Aléatoire injectable
Les tirages (cartes « 1 » retirées, mélange) utilisent un générateur à graine fourni à la création de la partie. L'état stocke ce qu'il faut pour reprendre de façon déterministe. Aucun appel direct à `Math.random` dans le moteur.

### Cartes
Union discriminée : carte de couleur `{ kind: 'suit', suit, rank }`, atout `{ kind: 'trump', value: 1..21 }`, excuse `{ kind: 'excuse' }`. Le rang de couleur va de 1 à 14 (valet 11, cavalier 12, dame 13, roi 14). Identifiant stable par carte pour l'affichage et la sérialisation.

### Places et sens horaire
Les joueurs sont numérotés de 0 à n-1 et le sens horaire correspond à l'indice croissant modulo n. « Le suivant » signifie `(i + 1) mod n`, pour l'ordre dans un pli, le don des 3 cartes et le passage du rôle d'entameur.

### Coups légaux
`legalPlays(state, seat)` renvoie la liste des cartes jouables. C'est la seule source de vérité sur la légalité, utilisée par l'interface (grisage des cartes) et les bots. Quand l'excuse entame (dernier pli, entame forcée), il n'y a pas de couleur demandée : chaque joueur n'a alors qu'une carte, donc tout coup est légal.

### Vue par joueur
`getPlayerView(state, seat)` retire toutes les mains autres que la sienne. Pendant l'échange, elle n'expose pas les cartes données par les autres.

## Risks / Trade-offs

- Les cas limites de l'excuse sont la principale source d'erreur : un test dédié par cas.
- Un état entièrement sérialisable impose d'éviter les `Map`, `Set` et fonctions dans l'état.
- Le moteur côté hôte voit toutes les mains : acceptable pour un usage entre amis.

## Open Questions

Aucune sur les règles. Le format exact des actions sera affiné pendant l'implémentation.
