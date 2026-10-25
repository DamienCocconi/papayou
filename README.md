# Papayou

Jeu de cartes inspiré du tarot, jouable dans un navigateur (PC et mobile), de 3 à 6 joueurs. Usage prévu : une table, chacun sur son téléphone.

## Jouer en ligne

Le jeu est publié sur **https://damiencocconi.github.io/papayou/** : rien à installer ni à lancer. L'hôte ouvre l'adresse, crée une salle et partage le lien ou le code ; les invités ouvrent le lien (ou saisissent le code) sur leur téléphone ou leur PC.

**Si la connexion entre appareils échoue.** Les appareils se connectent directement entre eux (WebRTC) ; certains réseaux l'empêchent, surtout les wifi invités ou d'entreprise. Le plus sûr est de prendre comme **hôte** un appareil en **4G/5G**. Un invité dont le wifi bloque peut aussi passer en 4G/5G.

### Déploiement

Le site se republie tout seul à chaque fusion sur `main` ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) : installation, tests, build, puis publication sur GitHub Pages. Un test en échec empêche la publication et la version précédente reste en ligne. On peut aussi relancer la publication à la main (onglet Actions > « Déploiement GitHub Pages » > Run workflow).

Réglage à faire une seule fois dans le dépôt GitHub : **Settings > Pages > Source = « GitHub Actions »**.

Les règles du jeu font foi dans [`docs/regles-papayou.md`](docs/regles-papayou.md). Les conventions et l'architecture sont dans [`CLAUDE.md`](CLAUDE.md).

## Prérequis

- **Node.js 20.19 ou plus** (nécessaire pour OpenSpec ; le projet lui-même tourne dès Node 18).
- npm.

## Installation

```bash
npm install
```

## Commandes

| Commande | Rôle |
|---|---|
| `npm test` | Lance tous les tests une fois (Vitest) |
| `npm run test:watch` | Relance les tests à chaque sauvegarde |
| `npm run build` | Vérifie le typage (TypeScript strict) puis construit le site dans `dist/` |
| `npm run dev` | Serveur de développement Vite (http://localhost:5173) |
| `npm run preview` | Sert le site construit |

Lancer un seul fichier ou un seul test :

```bash
npx vitest run src/engine/rules.test.ts
npx vitest run -t "excuse"
```

## Où sont les tests

Un fichier `*.test.ts` à côté de chaque module du moteur.

| Fichier | Ce qu'il vérifie |
|---|---|
| `rules.test.ts` | Coups légaux, gagnant d'un pli, un test par cas limite de l'excuse |
| `game.test.ts` | Création de partie, échange de cartes, choix du papayou, enchaînement des plis |
| `scoring.test.ts` | Points, classement de compétition (1, 2, 2, 4, 5) |
| `view.test.ts` | Aucune fuite d'information dans la vue d'un joueur |
| `serialization.test.ts` | Aller-retour JSON de l'état |
| `testing.test.ts` | Parties complètes simulées (3 à 6 joueurs, coups légaux aléatoires) : 390 points par manche, aucune carte perdue |

## Utiliser le moteur

Le moteur est pur : il n'a aucune dépendance à React, au DOM ni au réseau, et l'aléatoire passe par une graine (seed) pour que tout soit rejouable. Tout ce qui est public est exporté par [`src/engine/index.ts`](src/engine/index.ts).

Une action appliquée à un état renvoie un **nouvel** état (l'ancien n'est jamais modifié), ou une erreur typée :

```ts
import { applyAction, createGame, getPlayerView, legalPlays } from './engine'

let state = createGame(4, 42) // 4 joueurs, graine 42

// 1. Échange : chaque joueur donne 3 cartes au suivant (ici, les 3 premières de sa main)
for (let seat = 0; seat < 4; seat++) {
  const cardIds = state.hands[seat]!.slice(0, 3).map((card) => card.id)
  const result = applyAction(state, { type: 'giveCards', seat, cardIds })
  if (!result.ok) throw new Error(result.error) // ex. 'wrongCardCount'
  state = result.state
}

// 2. L'entameur choisit la couleur du papayou
const choice = applyAction(state, { type: 'choosePapayou', seat: state.roundLeader, suit: 'hearts' })
if (choice.ok) state = choice.state

// 3. Jeu : legalPlays est la seule source de vérité sur les cartes jouables
const seat = state.roundLeader
const playable = legalPlays(state, seat)
const play = applyAction(state, { type: 'playCard', seat, cardId: playable[0]!.id })

// Ce que voit un joueur : sa main, jamais celles des autres
const view = getPlayerView(state, seat)
```

Les quatre actions : `giveCards`, `choosePapayou`, `playCard` et `nextRound` (lance la manche suivante, ou termine la partie après la dernière).

Phases d'une partie : `exchange` → `choosePapayou` → `playing` → `roundEnd` (puis `gameEnd` après la dernière manche).

Sauvegarde et reprise (état entièrement JSON) :

```ts
import { deserializeState, serializeState } from './engine'

const text = serializeState(state)       // à mettre dans localStorage
const restored = deserializeState(text)  // la partie reprend à l'identique
```

## Architecture

```
src/
  engine/   Moteur de règles pur (aucune dépendance externe)
  bots/     Joueurs automatiques
  net/      Réseau PeerJS : salle, messages, reconnexion
  ui/       Composants React
docs/       Règles du jeu et notes de conception
openspec/   Specs de référence (specs/) et changements (changes/)
```

Règle de dépendance : `engine` n'importe rien d'autre que lui-même ; `bots` et `net` dépendent de `engine` ; `ui` dépend de tout. Aucune règle du jeu ne vit hors de `engine`.

## Stack

TypeScript (mode strict), React 18, Vite 6, Vitest 3. Multijoueur avec PeerJS (WebRTC), sans backend. Navigateurs récents uniquement (Chrome, Firefox, Edge, Opera, Safari).

## Workflow (OpenSpec)

On travaille en spec-driven : proposition validée, puis implémentation, puis archivage.

| Étape | Commande Claude Code |
|---|---|
| Proposer un changement | `/opsx:propose` |
| Implémenter en suivant `tasks.md` | `/opsx:apply` |
| Archiver (met à jour `openspec/specs/`) | `/opsx:archive` |

La spec de référence du moteur est [`openspec/specs/game-engine/spec.md`](openspec/specs/game-engine/spec.md). Le changement qui l'a introduit est archivé dans `openspec/changes/archive/`.
