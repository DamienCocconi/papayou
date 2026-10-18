# Papayou, jeu de cartes web

Jeu de cartes inspiré du tarot, jouable dans un navigateur (PC et mobile), de 3 à 6 joueurs. Usage prévu : une table, chacun sur son téléphone.

Le contexte du projet (objectifs, profil du développeur, décisions d'architecture et leurs raisons, feuille de route) est dans `docs/contexte.md` : à lire au début de chaque session.

Les règles du jeu font foi dans `docs/regles-papayou.md`. En cas de doute sur une règle, on relit ce fichier et on pose la question au lieu de deviner.

## Stack

- **TypeScript** en mode `strict`, partout.
- **React** pour l'interface, **Vite** pour le build et le serveur de développement.
- **Vitest** pour les tests (équivalent de JUnit).
- **PeerJS** (WebRTC) pour le multijoueur : un téléphone « hôte » fait tourner le moteur, les autres s'y connectent.
- **Aucun backend** à écrire. Le site est statique (GitHub Pages, Netlify ou équivalent).
- Navigateurs cibles : versions récentes de Chrome, Firefox, Edge, Opera, Safari. **Internet Explorer n'est pas supporté.**

## Architecture

```
src/
  engine/   Moteur de règles PUR. Aucune dépendance à React, au DOM ni au réseau.
  bots/     Joueurs automatiques (n'utilisent que l'API publique du moteur).
  net/      Réseau PeerJS : salle, messages, reconnexion, sauvegarde.
  ui/       Composants React.
docs/       Règles du jeu et notes de conception.
openspec/   Specs et changements (voir workflow).
```

Règles de dépendance, à respecter strictement :

- `engine` n'importe rien d'autre que lui-même et la bibliothèque standard.
- `bots` et `net` dépendent de `engine`. `ui` dépend de tout le reste.
- Aucune règle du jeu ne doit être écrite dans `ui` ou `net` : elles vivent uniquement dans `engine`.

## Principes du moteur

- **Fonctions pures et état immuable.** Une action appliquée à un état produit un nouvel état, jamais de mutation.
- **Aléatoire injectable.** Le mélange et les tirages prennent un générateur à graine (seed), pour que les tests soient déterministes.
- **Le moteur est la seule source de vérité** sur les coups légaux. L'interface se contente d'afficher ce que le moteur autorise.
- **Vue par joueur.** Le moteur fournit une projection de l'état qui ne contient que la main du joueur concerné, jamais celles des autres. Seule cette projection circule sur le réseau vers les non-hôtes.
- **État sérialisable en JSON**, pour la sauvegarde dans `localStorage` et la reprise après une déconnexion.

## Conventions de code

- Identifiants en **anglais**, avec le glossaire ci-dessous. Commentaires et documentation en français.
- Pas de `any`. Pas de classes inutiles : types et fonctions suffisent dans le moteur.
- Un fichier de test `*.test.ts` à côté de chaque module du moteur.
- Les composants React sont des fonctions, avec des hooks. Pas de logique de jeu dans les composants.

### Glossaire

| Français | Code |
|---|---|
| manche | `round` |
| pli | `trick` |
| atout | `trump` |
| excuse | `excuse` |
| papayou | `papayou` |
| couleur (pique, cœur...) | `suit` |
| entame / entameur | `lead` / `leader` |
| main | `hand` |
| tas de plis gagnés | `won` |

## Tests

- `npm test` lance Vitest, `npm run test:watch` le mode continu.
- **Tout changement dans `engine/` s'accompagne de tests.**
- Invariants à toujours tester : la somme des points d'une manche vaut 390, chaque joueur reçoit le bon nombre de cartes, aucune carte n'est perdue ni dupliquée.
- Les cas limites de l'excuse (entame forcée au dernier pli, seul atout du pli, seul atout en main) ont chacun un test dédié.

## Workflow de développement (OpenSpec)

On travaille en spec-driven :

1. `/openspec:proposal` : on propose un changement (pourquoi, quoi, impact) dans `openspec/changes/<nom>/`.
2. On valide la proposition ensemble avant d'écrire du code.
3. `/openspec:apply` : on implémente en suivant `tasks.md`, en cochant les tâches au fur et à mesure.
4. `/openspec:archive` : une fois livré, on archive pour mettre à jour les specs de référence.

On ne code pas une fonctionnalité sans spec validée. Les petits correctifs évidents sont exemptés.

## Sous-agents

Définis dans `.claude/agents/` :

- `architect` : décisions de conception, découpage, relecture de specs. Lecture seule.
- `engine-dev` : implémente et teste le moteur de règles.
- `frontend-dev` : implémente l'interface React.
- `qa-reviewer` : relit le code et les tests par rapport aux règles et aux specs. Lecture seule, peut lancer les tests.

L'agent principal orchestre et délègue. Pour un travail touchant le moteur, `qa-reviewer` relit avant de considérer la tâche terminée.

## À ne pas faire

- Ne pas introduire de backend ni de base de données sans spec validée.
- Ne pas modifier `docs/regles-papayou.md` sans accord explicite : c'est le contrat.
- Ne pas supporter Internet Explorer ni ajouter de polyfills pour lui.
- Ne pas ajouter de moteur de jeu (Phaser, etc.) : du HTML, du CSS et React suffisent.
