# Design

## Context

Voir `proposal.md` pour la motivation et `specs/table-ui/spec.md` pour les comportements attendus. Ce design suppose `add-fan-layout` et `add-fan-gestures` livrés. **À relire après leur archivage**, car il s'appuie sur leur hook de geste et sur leur écran fixe.

Faits établis dans le code actuel :

- Le moteur attend exactement `GIFT_SIZE` cartes dans `giveCards` et ne dépend pas de leur ordre pour la règle.
- Après le don, les cartes restent dans `view.hand` jusqu'à ce que tous aient donné : `giveCards` ne remplace les mains qu'à ce moment-là. `view.myGift` contient le don entre-temps. L'interface doit donc les retirer elle-même de l'éventail.
- `myGift` reste rempli après l'échange : la phase `exchange` décide seule de l'affichage des emplacements.
- `resetKey` ne change pas pendant l'échange (phase, manche, plis et taille de la main sont stables). Une mise en pause fait seulement passer `handMode` à `view`.
- Chez l'invité, `dispatch` veut dire « envoyé » : un refus arrive plus tard dans `session.error`.

## Goals / Non-Goals

**Goals:**
- Une seule donnée pour le choix du don, quels que soient l'affichage et l'ordre des actions.
- Réutiliser le geste d'`add-fan-gestures`, sans second moteur de glisser-déposer.
- Garder la logique du choix dans du code pur et testé.

**Non-Goals:**
- Déplacement animé de la carte vers son emplacement : la carte y apparaît directement et l'éventail se referme.
- Affichage de l'ordre sur les cartes en étalé : l'ordre reste mémorisé, mais ne se voit qu'en éventail.
- Choisir l'emplacement en visant : la carte va toujours dans le premier emplacement vide.

## Decisions

**1. Un tableau de 3 places, éventuellement vides.** `src/ui/hand/giftDraft.ts` représente le choix par un tableau de longueur `GIFT_SIZE` : `(cardId | null)[]`. Fonctions pures : `add` (première place vide, sans doublon, sans effet si plein), `remove` (laisse un trou), `ids`, `isComplete`. Les trous sont ce qui permet aux cartes de ne pas bouger au retrait, et de combler le trou avec la prochaine carte.
*Alternative écartée :* une liste ordonnée compacte. Plus simple, mais un retrait au milieu ferait sauter les cartes suivantes sous les yeux du joueur.

**2. Le choix remonte dans `GameScreen`.** Il est désormais lu par `Hand` (cartes à masquer ou à lever) et par `GiftSlots`, affiché ailleurs dans l'écran. On remonte donc l'état au parent commun (*lifting state up*), dans un hook `useGiftDraft`, avec la même technique `{ key, draft }` que la sélection : si `resetKey` change, le choix est considéré comme vide. La logique actuelle du mode `give` quitte `Hand`, qui reçoit `giftIds` (cartes choisies, puis données), `onToggleGift`, et `canRelease` et `onRelease` selon la phase.

**3. L'étalé utilise le même tableau.** Sélectionner appelle `add`, désélectionner appelle `remove`. L'ordre et les trous sont donc conservés à chaque changement d'affichage, sans aucune conversion. C'est ce qui rend les scénarios d'aller-retour automatiques. Le bouton de l'étalé envoie `ids(draft)`, comme le bouton de l'éventail.

**4. L'emphase reste séparée du choix pendant l'échange.** La décision 9 d'`add-fan-gestures` fait de l'emphase et de la sélection une seule donnée en phase de jeu. En échange, les confondre remplirait un emplacement dès qu'on lit une carte. `Hand`, qui porte l'emphase conservée de l'éventail, la garde donc pour lui en mode `give`, à part du choix partagé, et la spec modifiée le précise.

**5. Le geste reçoit sa destination.** Le hook du geste reste générique : `canPlay` et l'action au relâchement sont fournis par `GameScreen`.

| | Phase de jeu | Échange |
|---|---|---|
| **`canPlay(id)`** | carte dans `legalPlays` | une place est libre |
| **Au relâchement** | `dispatch(playCard)`, puis état `pending` | `add(draft, id)`, sans attente |
| **Message si refus** | pas votre tour, ou carte non jouable | emplacements pleins |

La carte résiste donc quand les emplacements sont pleins, par le même chemin qu'une carte non jouable, et `GiftSlots` déclenche une courte réaction visuelle. Le réducteur du geste renomme son effet `play` en `release` : ce n'est plus toujours un coup joué.
*Alternative écartée :* laisser prendre la carte puis la renvoyer au relâchement. Le geste semblerait réussir, pour échouer à la fin.

**6. Cartes affichées dans l'éventail.** `Hand` filtre `view.hand` pour retirer `ids(draft)` et, après le don, `view.myGift`. L'identité de chaque carte étant conservée (`card.id` comme `key` React), une carte retirée reprend sa place dans l'ordre de la main, et ses voisines glissent grâce aux transitions existantes. Ce filtre ne concerne que l'éventail : en étalé, les cartes restent dans la grille.

**7. Composant `GiftSlots`.** Il reçoit le contenu des 3 places, le don déjà envoyé éventuel et les actions. Une place vide est un cadre pointillé décoratif, avec un texte accessible. Une carte placée utilise `CardView`, sans action. Le bouton de retrait est une icône avec un `aria-label` nommant la carte (`cardName`) et une zone tactile d'environ 40 px. Après le don, il affiche `view.myGift` et aucun bouton.

**8. Place dans l'écran fixe.** `GiftSlots` occupe le centre de la zone de table, en éventail et en phase `exchange` uniquement. Pendant l'échange, les joueurs n'ont pas de carte posée : leur emplacement de carte est masqué, ce qui libère environ 70 px par rangée. En paysage, le bouton de don passe à droite des emplacements pour économiser la hauteur. La carte en emphase peut recouvrir provisoirement les emplacements. Le message de statut existant est conservé, car il indique aussi l'attente des autres.

**9. Don en cours d'envoi.** Après un `dispatch(giveCards)` accepté et tant que `view.myGift` est vide, un état local masque le bouton de don et les retraits, pour éviter de modifier un don parti ou de l'envoyer deux fois. Il se termine si `session.error` apparaît ou après 5 secondes, et le choix redevient modifiable. En cas de refus immédiat, il ne démarre pas.

**10. Pause.** Quand `paused` est vrai, `handMode` vaut `view` : `canPlay` renvoie faux, et `GiftSlots` masque les retraits et le don. Le choix est conservé, car `resetKey` ne change pas.

## Risks / Trade-offs

- [Hauteur insuffisante en paysage à 6 joueurs : 84 px de carte, 40 px de bouton et le don] → Emplacements des joueurs masqués et bouton de don sur le côté (décision 8). Taille des cartes placées réductible si la recette le demande.
- [Un joueur ne comprend pas qu'il faut glisser les cartes] → Le message de statut existant reste affiché en plus des emplacements vides. Il pourra être retiré si les emplacements suffisent, comme attendu.
- [Le cadre vide est peu visible sur le tapis] → Contraste vérifié pendant la recette.
- [Choix perdu lors d'un rechargement ou d'une reconnexion] → Choix assumé : ce n'est qu'un état d'interface tant que le don n'est pas envoyé, comme aujourd'hui.
- [Le renommage de l'effet du geste touche le code d'`add-fan-gestures`] → Tests existants du réducteur mis à jour dans la même tâche.
- [L'idée 14 : don déjà fait par un bot lors d'une reprise de place] → Comportement inchangé. Les emplacements montreront ce don sans retrait, ce qui reste à corriger à part.

## Migration Plan

Aucune migration de données. Pour revenir en arrière, il suffit d'annuler la fusion : l'échange repasse en étalé.
