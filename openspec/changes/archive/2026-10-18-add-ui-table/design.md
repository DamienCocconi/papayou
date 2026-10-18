# Design

## Context

Le moteur (`src/engine`) et les bots (`src/bots`) sont livrés et testés. `src/ui/` ne contient que `App.tsx` (un titre). `src/net/` est vide, et le réseau viendra après l'UI (voir `docs/contexte.md`). Motivation : voir `proposal.md`.

Faits du moteur qui structurent l'UI :

- Quand la dernière carte d'un pli est posée, le moteur vide `trick` immédiatement, remplit `lastTrick` et donne l'entame au gagnant. L'UI ne voit donc jamais un pli complet dans `trick` : elle doit l'afficher depuis `lastTrick`.
- La phase `roundEnd` attend l'action `nextRound`. Les points de la manche sont dans `roundScores`, les totaux dans `totals`.
- `getPlayerView` ne contient que la main du joueur. `getBotView` ajoute les cartes déjà jouées et reste réservée aux bots.
- `botAction(bot, view, rng)` renvoie l'action attendue d'un bot, ou `null` si ce n'est pas à lui d'agir. Toute la logique « quelle phase, à qui le tour » s'y trouve déjà.
- Le sens horaire correspond à l'ordre croissant des places (`(trickLeader + trick.length) % playerCount`).

## Goals / Non-Goals

**Goals:**
- Séparer ce que l'UI consomme (une vue, des actions) de qui fait tourner la partie, pour que le réseau se branche plus tard sans toucher aux composants.
- Garder toute la logique de jeu hors des composants React.
- Rendre le contrôleur testable sous Vitest en environnement `node`, sans DOM.

**Non-Goals:**
- Réseau, sauvegarde `localStorage`, reconnexion.
- Tableau des scores détaillé, mobile, animations, glisser-déposer, assets graphiques des cartes (changements ultérieurs).
- Plusieurs humains sur un même écran.

## Decisions

### 1. Interface `GameController` en abonnement, hors React

Le contrôleur est un module TypeScript sans React, rangé dans `src/ui/controller/` (il importe `engine` et `bots`, ce que la règle de dépendance autorise pour `ui`). Son interface :

```
interface GameController {
  getSnapshot(): ControllerSnapshot        // vue + coups légaux + dernier résultat
  subscribe(listener: () => void): () => void   // renvoie la fonction de désabonnement
  dispatch(action: Action): ActionResult   // action de l'humain (le seat est imposé)
  dispose(): void                          // arrête les minuteries des bots
}
```

Un hook `useGame(controller)` fait le lien avec React via `useSyncExternalStore(subscribe, getSnapshot)`. C'est l'idiome React 18 pour lire un état externe, proche d'un `Observable` Java auquel on s'abonne. `getSnapshot` doit renvoyer **la même référence** tant que rien n'a changé, sinon React boucle ; le contrôleur reconstruit donc son snapshot uniquement après une action.

*Alternative écartée :* un `useReducer` dans un composant qui contiendrait l'état complet. Plus court, mais l'UI aurait accès aux mains des bots et le réseau demanderait de tout réécrire.

*Pourquoi `ControllerSnapshot` n'est pas un `GameState` :* il contient `PlayerView`, `legalPlays` (cartes jouables, calculées par `legalPlaysFromView`) et l'indicateur d'attente des bots. L'état complet reste privé dans la fermeture du contrôleur local.

### 2. Cadence des bots par minuterie injectable

Après chaque action (humaine ou de bot), le contrôleur local regarde s'il existe un bot dont `botAction` renvoie une action. Si oui, il programme son coup après `botDelayMs`, un seul coup à la fois, dans l'ordre des places. Un délai plus long (`trickPauseMs`) suit la fin d'un pli, pour laisser lire le résultat.

La minuterie est injectée (`scheduler: (fn, ms) => cancel`) avec `setTimeout` par défaut. Les tests passent un ordonnanceur synchrone ou `delay = 0` et jouent une partie entière sans attendre. Sans cette injection, les tests dépendraient du temps réel.

*Alternative écartée :* `async/await` avec `await sleep(ms)` dans une boucle. Plus lisible, mais l'annulation propre (`dispose`, rejouer) et les tests déterministes sont plus délicats.

### 3. Générateurs aléatoires séparés

La partie utilise sa graine (`createGame(playerCount, seed)`). Les bots reçoivent un `Rng` distinct, créé à partir d'une graine dérivée de celle de la partie, pour qu'une même graine reproduise la même partie sans que les bots consomment le générateur du moteur. La graine est tirée au hasard à l'accueil (avec `Math.random` côté UI uniquement) et peut être fournie en test.

### 4. Sélection de cartes : état local au composant

La sélection (une carte à jouer, ou jusqu'à trois à donner) n'est **pas** de l'état de jeu : c'est de l'état d'interface, gardé avec `useState` dans le composant de la main. Le moteur n'en sait rien et reste la seule source de vérité des coups légaux. Une sélection est vidée quand la phase ou le tour change, pour ne jamais garder une carte devenue injouable.

### 5. Découpage des composants

```
src/ui/
  App.tsx                 aiguillage : accueil ou partie
  controller/             contrôleur local + types (testé)
  useGame.ts              hook useSyncExternalStore
  screens/                HomeScreen, GameScreen
  components/             CardView, Hand, Table, PlayerSeat, PapayouPicker, RoundEnd, GameEnd
  styles/                 CSS (variables pour les couleurs et la taille des cartes)
```

`GameScreen` choisit le contenu central selon `view.phase`. Les composants ne font aucun calcul de règle : ils affichent `view` et `legalPlays`.

### 6. Rendu des cartes en CSS pur

Un composant `CardView` pour une carte, avec un second affichage « dos » pour les mains cachées. Les cœurs et carreaux sont rouges, les trèfles et piques noirs, avec le symbole Unicode en plus de la teinte (daltonisme). Les atouts ont une teinte distincte, l'excuse un libellé propre. Taille et couleurs en variables CSS, pour permettre de remplacer le rendu par des assets plus tard sans réécrire l'API du composant.

### 7. Fin de manche et de partie : écrans minimaux

`RoundEnd` et `GameEnd` n'affichent que les chiffres utiles (points de la manche, totaux, places) et le bouton d'action. Le tableau détaillé arrive avec `add-ui-scores-mobile`.

## Risks / Trade-offs

- **Boucle de rendu avec `useSyncExternalStore`** (snapshot recréé à chaque lecture) → le contrôleur met son snapshot en cache et ne le remplace qu'après une action ; un test vérifie que deux lectures successives renvoient la même référence.
- **Minuterie qui survit au composant** (partie quittée, StrictMode qui monte deux fois en développement) → `dispose()` annule toute minuterie en attente, et le contrôleur est créé à l'accueil, pas au rendu d'un composant.
- **Pli qui disparaît trop vite** (le moteur le vide à la dernière carte) → pause `trickPauseMs` et zone « dernier pli » toujours visible ; sans pause, un humain qui joue en dernier ne verrait pas ce que les autres ont posé.
- **Humain et bots dans le même contrôleur** : ce couplage disparaît avec le réseau, où chaque client n'aura que sa vue. C'est le but de l'interface du point 1, et la raison de ne pas exposer `GameState`.
- **Sans test de composants**, une régression visuelle ne sera pas détectée automatiquement → vérification manuelle dans le navigateur à la fin de l'implémentation ; des tests de composants pourront venir plus tard.

## Open Questions

- Type de bot par défaut (heuristique proposé) et délais exacts (≈ 600 ms par coup, ≈ 1500 ms après un pli) : réglables pendant l'implémentation sans changer les specs.
