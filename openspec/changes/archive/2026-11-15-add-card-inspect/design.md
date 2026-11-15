# Design

## Context

Voir `proposal.md` pour la motivation et `specs/table-ui/spec.md` pour le comportement attendu.

État actuel utile :

- `Lightbox` (calque générique, livré avec `add-invite-qr`) ferme au `click` sur la racine, pose `inert` sur `#root` et rend le focus à l'ouvreur. Il se monte par un effet de mise en page, donc `#root` est inerte avant le prochain événement du pointeur.
- `CardView` rend un atout illustré quand `trumpArt(card) !== null` (atouts 1 à 21). Sa typographie est en `cqw` : changer `--card-w` / `--card-h` suffit pour l'agrandir. Rapport des cartes : 2:3.
- Les cartes sont rendues par `CardView` dans `Table` (sièges), `LastTrick` (panneau ou surcouche `.overlay`), `GiftSlots`, `Hand` (étalé, `<button>` cliquable ou `<div>` en lecture) et `FanHand`.
- En éventail, le conteneur `.hand.fan` reçoit le pointeur et le capture ; seule la carte en emphase a `pointer-events: auto` et porte `data-card-id`. Le réducteur pur `handGesture.ts` sait déjà si l'appui a commencé sur la carte en emphase (`pressed`).
- En étalé, une carte grisée est un `<button disabled>` : les navigateurs ne délivrent pas de façon fiable les événements de souris (dont `contextmenu`) à un contrôle désactivé.
- `FanHand` retire l'emphase conservée à tout `pointerdown` hors de la main et hors d'un bouton : toucher le calque pour le fermer la retirerait.

## Goals / Non-Goals

**Goals:**

- Un seul point d'entrée pour agrandir une carte (`inspect(card)`), quel que soit l'endroit où elle est affichée.
- La logique de l'appui long (délai, tolérance) dans du code pur testé, comme le geste de l'éventail.
- Aucune interférence avec le geste de jeu de l'éventail, ni avec la sélection de l'étalé.

**Non-Goals:**

- Rendre `Lightbox` empilable (un seul calque à la fois reste la règle : `#root` inerte empêche d'atteindre une carte quand le QR est ouvert).
- Agrandir autre chose que les atouts illustrés.

## Decisions

### 1. Un contexte React fournit `inspect(card)`

`GameScreen` garde `inspected: Card | null`, rend `<Lightbox><CardView card={inspected} /></Lightbox>` quand il est non nul, et fournit `inspect` par un contexte `CardInspectContext`. `CardView` lit ce contexte : un atout illustré n'est observable que si le contexte est présent. Hors de l'écran de jeu (lobbies), il n'y a pas de fournisseur, donc rien ne change.

Alternatives écartées :
- Écoute déléguée sur `.game` avec un attribut `data-card-id` : il faudrait retrouver la `Card` à partir de son identifiant dans la main, le pli, le dernier pli et les emplacements d'échange, ou décoder `trump-N`, ce qui couple l'interface au format des identifiants du moteur.
- Une prop `onInspect` descendue dans chaque composant : six composants à modifier pour la seule transmettre.

### 2. Appui long : module pur + hook

Un module pur `src/ui/cards/longPress.ts` porte les constantes `INSPECT_DELAY_MS = 700` et `INSPECT_TOLERANCE_PX = 10`, et la décision « ce déplacement annule-t-il l'appui ? ». Il est testé avec Vitest. Un hook `useLongPress(onLongPress)` branche les événements : `pointerdown` d'un pointeur non souris et principal démarre le minuteur, `pointermove` au-delà de la tolérance, `pointerup`, `pointercancel` et le démontage l'annulent. `CardView` utilise ce hook pour un atout illustré.

Le délai est une constante unique, utilisée aussi par l'éventail : un seul geste à apprendre.

### 3. Clic droit : `contextmenu`, sauf s'il vient du toucher

`CardView` (atout illustré) gère `onContextMenu` : `preventDefault`, puis `inspect(card)`, **sauf** si l'événement vient du doigt. Sur Android, l'appui long natif déclenche aussi `contextmenu` vers 500 ms. L'ignorer garde le même délai de 700 ms sur Android et sur iOS, qui n'envoie pas `contextmenu`. Un `contextmenu` venu du clavier (touche Menu, Maj+F10 sur la carte focalisée) agrandit aussi la carte, ce qui est un bonus d'accessibilité.

« Vient du doigt » se décide dans `src/ui/cards/touchPress.ts` : type de pointeur `touch` ou `pen` quand l'événement en porte un, ou au moins un doigt posé sur la page. Les doigts posés sont suivis **globalement** (écoutes en phase de capture sur `window`, installées par `GameScreen`), et non par carte : dans l'éventail, le doigt a pu être posé sur une autre carte que celle qui reçoit le `contextmenu`, ou sur le conteneur de la main.

Alternatives écartées :
- Lire seulement `pointerType` sur l'événement : ce n'est pas un `PointerEvent` dans tous les navigateurs cibles.
- Suivre l'appui dans le hook de chaque carte : version initiale. La relecture a montré qu'elle laissait passer le menu d'Android dans l'éventail, où l'appui long de la carte est désactivé, ce qui ouvrait le calque à 500 ms avec la capture du pointeur encore active.

### 4. Éventail : l'appui long est un événement du réducteur

Dans `handGesture.ts` :
- `scrubbing` gagne un champ `still: boolean`, vrai à l'appui et faux dès que le pointeur s'éloigne de plus de `INSPECT_TOLERANCE_PX` de l'ancre.
- Un nouvel événement `{ type: 'longPress'; pointerId }` n'est accepté que si l'état est `scrubbing`, avec le même pointeur, `pressed`, `still` et `!mouse`, et si la carte peut s'agrandir (`canInspect` dans `GestureContext`, faux pour une carte non illustrée). Il ramène l'état à `idle` et produit les effets `select(cardId)` (l'emphase est conservée) et le nouvel effet `inspect(cardId)`. Refusé, il laisse le geste intact : une carte non illustrée reste jouable après une hésitation.
- Dans tout autre état (`holding`, autre carte, balayage), l'événement est ignoré.

`useHandGesture` démarre le minuteur au `pointerdown` quand l'état devient `scrubbing` avec `pressed && !mouse`, l'annule au relâchement, à l'annulation et à la sortie de `scrubbing`. Il relâche la capture du pointeur quand l'effet `inspect` arrive. `FanHand` lit lui-même le contexte d'agrandissement (plutôt qu'une prop transmise par `Hand`), fournit `canInspect` et, sur l'effet `inspect`, retrouve la `Card` dans `cards` et appelle `inspect`.

Pour éviter un double déclenchement, le `CardView` rendu dans l'éventail n'active pas son propre appui long (prop `longPress={false}`). Il garde son `onContextMenu` : au clic droit, seule la carte en emphase reçoit le pointeur, ce qui donne bien « clic droit sur l'emphase ».

Pourquoi dans le réducteur : la décision dépend de l'état du geste (`pressed`, prise en cours). La mettre à côté, dans un hook séparé, laisserait la capture du pointeur active et le doigt pourrait faire passer la carte en `holding` derrière le calque.

### 5. `Lightbox` : fermeture sur un appui commencé sur le calque

Le calque note un `pointerdown` reçu sur lui (une `ref` booléenne) et ne ferme au `click` que si ce drapeau est levé, puis le baisse. Le doigt de l'appui long, posé avant l'ouverture, ne peut donc pas le fermer, même si le navigateur synthétise un `click` au relâchement. Échap ferme toujours. Pour le QR code, le comportement observable est inchangé.

### 6. Pas de `click` traversant en étalé

Quand l'appui long ouvre le calque, `#root` devient inerte avant le relâchement du doigt, et le calque couvre la carte : le `click` éventuel tombe sur le calque (et il est ignoré par la décision 5), jamais sur le bouton de la carte. Aucun mécanisme supplémentaire n'est prévu. Une vérification sur téléphone est inscrite aux tâches, et un garde-fou sera ajouté seulement si elle échoue.

### 7. Cartes grisées : `aria-disabled` au lieu de `disabled`

`CardView` rend un bouton grisé avec `aria-disabled="true"` et sans `disabled`, et n'appelle pas `onClick` dans ce cas. Les styles `button:disabled` et `button.card:not(:disabled):hover` sont reproduits pour `.card[aria-disabled="true"]`, pour garder le même aspect. Le bouton reste focalisable, ce qui est acceptable : il est annoncé comme désactivé.

### 8. Pas de menu contextuel, nulle part

`App` neutralise `contextmenu` sur tout le document : accueil, lobbies, jeu, et calques (rendus par portail dans `body`, donc hors de `#root`). Un seul point de blocage remplace ceux de `.game` et de `Lightbox`. Le copier-coller par le menu contextuel est abandonné, y compris dans les champs de saisie : la perte est mineure (lien d'invitation et QR code évitent de saisir un code) et le menu ne peut plus perturber un geste.

Alternative écartée : garder le menu dans les champs de saisie. Exception à maintenir pour un usage rare.

### 9. Emphase conservée à la fermeture

L'écoute de `FanHand` qui retire l'emphase au `pointerdown` ignore les cibles situées dans `.lightbox`.

### 10. Taille de la carte agrandie

Un conteneur `.card-inspect` fixe `--card-w: min(88vw, 88dvh / 1.5)` (repli en `vh`) et `--card-h: calc(var(--card-w) * 1.5)`, et un rayon de bordure proportionnel à la largeur. `CardView` est réutilisé tel quel. Le nom accessible du calque est le nom de la carte (`cardName`).

## Risks / Trade-offs

- [Android émet `pointercancel` après son `contextmenu` natif, ce qui annulerait le minuteur à 500 ms] → vérification sur un vrai téléphone Android inscrite aux tâches. Si c'est le cas, on démarre l'agrandissement depuis ce `contextmenu` tactile, au prix d'un délai d'environ 500 ms sur Android.
- [En étalé, la page défile : un doigt posé sur une carte pour faire défiler peut rester immobile 700 ms] → la tolérance de 10 px annule l'appui dès que le défilement commence. Un doigt réellement immobile 700 ms agrandit la carte, ce qui est le comportement voulu.
- [Le passage de `disabled` à `aria-disabled` touche tous les boutons de carte] → `CardView` ignore le clic d'une carte grisée, `Hand.click` vérifie déjà la jouabilité, et les tests existants du parcours de jeu restent verts.
- [Le geste est invisible et sans signe visuel] → choix assumé. Le `title` d'une carte au survol reste le seul indice sur PC.
- [Un seul calque à la fois] → impossible d'agrandir une carte par-dessus le QR, puisque `#root` est inerte. La limite documentée dans `Lightbox` reste valable.
