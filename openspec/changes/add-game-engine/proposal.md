## Why

Le jeu n'existe pas encore. Toutes les autres briques (bots, réseau, interface) dépendent d'un moteur de règles fiable qui décide seul de ce qui est légal. Les règles étant nombreuses et pleines de cas limites (excuse, atouts, cartes retirées), on les fige d'abord dans un moteur pur et testé.

## What Changes

- Ajout du module `src/engine/` : modèle de cartes, paquet, distribution, échange de cartes, choix du papayou, coups légaux, résolution des plis, décompte, progression des manches, classement final.
- Ajout d'une projection « vue d'un joueur » qui ne contient que sa propre main.
- Ajout de tests Vitest couvrant les invariants et les cas limites de l'excuse.
- Initialisation du projet : Vite, React, TypeScript strict, Vitest (squelette seulement, sans interface).

Hors périmètre : interface React, bots, réseau PeerJS. Ils feront l'objet de changements séparés.

## Impact

- Nouvelle capacité : `game-engine` (voir `specs/game-engine/spec.md`).
- Source des règles : `docs/regles-papayou.md`.
- Aucune dépendance externe pour le moteur lui-même.
