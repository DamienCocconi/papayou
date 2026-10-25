# Papayou

Jeu de cartes inspiré du tarot, jouable dans un navigateur (PC et mobile), de 3 à 6 joueurs. Usage prévu : une table, chacun sur son téléphone.

## Jouer en ligne

Le jeu est publié sur **https://damiencocconi.github.io/papayou/** : rien à installer ni à lancer. L'hôte ouvre l'adresse, crée une salle et partage le lien ou le code ; les invités ouvrent le lien (ou saisissent le code) sur leur téléphone ou leur PC.

**Si la connexion entre appareils échoue.** Les appareils se connectent directement entre eux (WebRTC) ; certains réseaux l'empêchent, surtout les wifi invités ou d'entreprise. Le plus sûr est de prendre comme **hôte** un appareil en **4G/5G**. Un invité dont le wifi bloque peut aussi passer en 4G/5G.

### Comment un joueur en rejoint un autre, avec la même adresse pour tous

L'adresse du site est la même pour tout le monde, et pourtant chacun arrive dans **la bonne partie**. C'est que GitHub Pages ne fait que servir les fichiers du site : il ne connaît ni les salles ni les joueurs. Tout le reste se passe dans les navigateurs.

```
   GitHub Pages                       Serveur de signalisation PeerJS
   (fichiers du site,                 (annuaire public : « qui est
    identiques pour tous)              papayou-U5CXJ ? »)
        ^   ^                               ^              ^
        |   | on charge la page            | 1. s'inscrit | 3. demande à joindre
        |   | (hôte et invités)             |              |    papayou-U5CXJ
        |   |                               |              |
   +----+---+------------+                  |              |
   |  Téléphone de       |------------------+              |
   |  l'hôte             |                                 |
   |  (moteur du jeu)    |<=== 4. canal direct WebRTC ====>+---- Téléphone d'un invité
   +---------------------+      (cartes, plis, scores)          (affichage de sa main)
```

1. **L'hôte crée une salle.** Son navigateur tire un code de 5 caractères (`U5CXJ`, sans `0/O` ni `1/I` pour se dicter sans erreur) et s'inscrit sur le serveur de signalisation PeerJS sous l'identifiant `papayou-U5CXJ`. Si cet identifiant est déjà pris, un autre code est tiré. Le code identifie donc le navigateur de l'hôte, pas une machine du site.
2. **Le lien d'invitation est l'adresse du site suivie du code**, après un `#` : `https://damiencocconi.github.io/papayou/#/rejoindre/U5CXJ`. Le début est le même pour tous ; seul le code distingue les salles. Ce qui suit le `#` n'est **jamais envoyé** à un serveur : la page le lit elle-même. On peut aussi ne partager que l'adresse du site et le code, que l'invité saisit à la main.
3. **L'invité charge la même page**, lit le code, et demande au serveur de signalisation de le mettre en relation avec `papayou-U5CXJ`. Si personne n'est inscrit sous cet identifiant, il voit « salle introuvable ».
4. **Le serveur de signalisation fait passer la poignée de main** : les deux navigateurs s'échangent leurs adresses réseau (via un serveur STUN, qui permet de découvrir son adresse publique) et ouvrent un **canal WebRTC direct**. Quand la connexion directe est impossible (NAT strict, par exemple), PeerJS passe par un relais TURN public.
5. **Ensuite, les messages circulent directement entre les téléphones.** Le serveur de signalisation ne sert plus qu'à faire entrer de nouveaux joueurs ; s'il tombe, la partie en cours continue.

Conséquences utiles à connaître :

- **Le moteur de règles tourne chez l'hôte**, et chez lui seulement. Les invités envoient leurs actions, l'hôte les valide, puis renvoie à chacun **sa propre vue** (sa main, le nombre de cartes des autres), jamais l'état complet.
- **Si l'hôte ferme son onglet ou verrouille son téléphone**, la partie s'arrête : il n'y a pas de serveur de jeu pour la reprendre.
- **Plusieurs parties peuvent coexister** sur le même site sans se gêner, puisque chaque salle a son propre code. Les identifiants sont préfixés par `papayou-` parce que le serveur de signalisation public est partagé avec d'autres applications.
- **Rien n'est stocké sur GitHub Pages** : pas de compte, pas de base de données, pas de journal des parties.
- Pour utiliser son propre serveur de signalisation, on renseigne `VITE_PEER_HOST`, `VITE_PEER_PORT`, `VITE_PEER_PATH` et `VITE_PEER_SECURE` à la compilation (voir [`src/net/config.ts`](src/net/config.ts)). Le code du transport est dans [`src/net/peer-transport.ts`](src/net/peer-transport.ts).

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
