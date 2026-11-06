# Design

## Context

Voir `proposal.md` pour la motivation et `specs/table-ui/spec.md` pour les comportements attendus.

État actuel de l'interface :

- `Hand` affiche les cartes dans une grille `flex-wrap` et garde la sélection dans son état local. `GameScreen` lui donne une `key` qui change à chaque carte posée : React recrée alors toute la main.
- `.game` est une colonne en `min-height: 100vh` qui défile. `LastTrick`, `RoundEnd`, `GameEnd` et le choix du papayou s'empilent dans `.center`.
- Le coin de `CardView` ne contient que le rang : la couleur est au centre, donc cachée quand les cartes se chevauchent.
- Les trois contrôleurs (local, hôte, invité) passent par le même `GameScreen`. Chez l'invité, une carte reste dans `view.hand` jusqu'à la réponse de l'hôte : aucune disparition anticipée à gérer.
- Vitest tourne en environnement `node`, sans DOM, et seuls les fichiers `*.test.ts` sont lancés. Le projet ne teste donc pas ses composants, seulement du code pur.

## Goals / Non-Goals

**Goals:**
- Isoler dans du code pur et testé ce qui peut l'être : géométrie de l'éventail et lecture de la préférence.
- Préparer `add-fan-gestures` : positions des cartes calculées et cartes conservées d'un rendu à l'autre.
- Laisser l'affichage étalé aussi proche que possible de l'actuel.

**Non-Goals:**
- Écart visuel entre les couleurs dans l'éventail : idée à juger une fois le rendu réel visible.
- Animation lors du changement d'affichage : les cartes hors écran en étalé ne permettent pas un déplacement propre. Le changement est immédiat.
- Tests de composants ou de bout en bout : ils demanderaient de nouvelles dépendances. Le rendu est vérifié par la recette manuelle.

## Decisions

**1. Géométrie de l'éventail dans une fonction pure.** Un nouveau module `src/ui/hand/fanLayout.ts` expose une fonction qui reçoit le nombre de cartes, la largeur disponible et la taille des cartes, et renvoie pour chaque carte `{ x, y, rotation }`. L'espacement vaut `(largeur - marges - carte) / (n - 1)`, plafonné pour qu'une petite main reste groupée. La rotation et la descente suivent la position de la carte par rapport au centre, avec une rotation totale plafonnée.
*Alternative écartée :* tout en CSS avec des variables et `calc()`. Moins de TypeScript, mais rien à tester, et `add-fan-gestures` a besoin de ces positions en JavaScript pour trouver la carte sous le doigt.

**2. Largeur mesurée, pas de points de rupture pour l'arc.** Un petit hook basé sur `ResizeObserver` fournit la largeur réelle de la zone de la main à `fanLayout`. La rotation de l'appareil est ainsi un simple nouveau calcul. Les media queries ne servent qu'à compacter la barre et les joueurs quand la hauteur manque.

**3. Une seule composante `Hand`, deux rendus.** `Hand` reçoit un `layout` (`fan` ou `spread`) et garde la même logique de sélection. En éventail, chaque carte est dans un conteneur positionné en `absolute` avec un `transform`, la superposition venant de l'ordre du DOM. Le conteneur porte la position et la transition ; la `CardView` à l'intérieur garde son décalage de sélection, ce qui évite de mélanger les deux transformations. La carte sélectionnée reçoit un `z-index` supérieur.

**4. Suppression du remontage par `key`.** Recréer la main à chaque coup empêcherait toute transition, car chaque carte serait un nouvel élément. `GameScreen` passe désormais `resetKey` en prop, et `Hand` stocke sa sélection avec la clé pour laquelle elle est valable : `{ key, ids }`. Si la clé ne correspond plus, la sélection est considérée comme vide, sans rendu intermédiaire périmé ni `useEffect`. Les cartes gardent `card.id` comme `key` React, donc le même élément du DOM d'un rendu à l'autre, et la transition CSS fait le reste.
*Alternative écartée :* un `useEffect` qui vide la sélection quand la clé change. Il produit un rendu avec une sélection périmée, ce que le remontage actuel évitait déjà.

**5. Taille des cartes et lisibilité du coin en éventail.** C'est le point le plus contraint : à 19 cartes sur 360 px, il reste environ 16 px visibles par carte, alors que « 10 » dans la police actuelle en demande environ 18. L'éventail utilise donc des cartes de 56 x 84 px, des marges de 8 px, un coin en 13 px avec un interlettrage légèrement resserré et 2 px de marge intérieure. Le rang et le symbole sont empilés dans le coin. La taille des cartes est une constante partagée entre `fanLayout` et le CSS via une variable posée par `Hand`. Ces valeurs sont à ajuster pendant la recette, sur un vrai téléphone. L'étalé garde 64 x 96 px.

**6. Écran fixe par classe sur `.game`.** `.game.fan` utilise `height: 100dvh`, `overflow: hidden` et une grille : barre, statut, table (`minmax(0, 1fr)`), main. Le bas des cartes peut dépasser de l'écran pour gagner de la hauteur, comme dans les jeux de référence, le coin restant visible. `overscroll-behavior: none` est posé sur `html` et `body` via `body:has(.game.fan)`, disponible dans les navigateurs ciblés. `viewport-fit=cover` et les `env(safe-area-inset-*)` gèrent l'encoche en paysage. Les joueurs se compactent : largeur minimale réduite pour tenir 3 par rangée en portrait, et 6 sur une rangée en paysage.

**7. Panneaux en surcouche dans l'écran fixe.** En éventail, `RoundEnd`, `GameEnd`, le menu d'administration et le détail du dernier pli s'affichent au-dessus de la table dans un conteneur à `max-height` et défilement interne. Ces composants ne changent pas, seul leur conteneur change. Le choix du papayou reste dans la zone de la table. Le bandeau de pause reste dans le flux et réduit l'espace de la table.

**8. Dernier pli : résumé toujours visible.** En éventail, un bouton affiche le gagnant et les points, par exemple « Dernier pli : Alice (5 pts) », et ouvre le détail des cartes. Sans ce résumé, on ne saurait plus qui a remporté le pli, puisque la table se vide aussitôt (idée 12). En étalé, `LastTrick` reste affiché comme aujourd'hui. Le texte du résumé vient des données de la vue, comme le panneau actuel.

**9. Préférence dans un module pur.** `src/ui/hand/layoutPreference.ts` lit et écrit la clé `papayou.handLayout` à travers un paramètre de type `Storage` partiel, et attrape toute exception. Une valeur inconnue ou un stockage indisponible donne `fan`. Le test passe un faux stockage, sans DOM. Un hook mince dans `GameScreen` branche le module sur `window.localStorage`.

**10. Affichage effectif calculé.** `GameScreen` calcule : `handMode === 'give' ? 'spread' : préférence`. La préférence n'est donc jamais modifiée par l'échange, et le bouton est masqué dans ce cas. `add-gift-slots` retirera cette condition.

**11. Coups inchangés, deux clics partout.** Le comportement de `Hand` en mode `play` et `give` ne change pas. En éventail, on touche donc une bande étroite : c'est une limite assumée, levée par `add-fan-gestures`. Les cartes restent de vrais boutons, ce qui préserve l'accès au clavier.

**12. Mouvement réduit.** Les transitions de l'éventail sont désactivées sous `prefers-reduced-motion: reduce`.

## Risks / Trade-offs

- [Cible tactile étroite en éventail à 19 cartes avant `add-fan-gestures`] → L'étalé reste disponible, et les deux changes sont prévus à la suite. Le risque est un inconfort temporaire, sans coup joué par erreur, grâce à la confirmation en deux clics.
- [« 10 » illisible à 16 px visibles sur les plus petits écrans] → Scénario dédié dans la spec et point de recette sur un vrai téléphone ; le réglage se fait dans `fanLayout` et le CSS sans changer l'architecture.
- [Barre du haut trop chargée à 360 px, avec les badges, l'administration, le bouton de mode et Quitter] → Libellés raccourcis et bouton de mode en icône avec `aria-label`, retour à la ligne autorisé en portrait, vérifiés à 360 x 640 et 640 x 360.
- [Peu de hauteur en paysage à 6 joueurs] → Zone de la table en `minmax(0, 1fr)`, joueurs compactés, statut et barre sur une ligne. Si le rendu reste trop serré, on réduit la taille des cartes posées avant de toucher au reste.
- [Comportement réel de `100dvh`, de l'encoche et du rafraîchissement par glissement non reproductible en émulation] → Recette sur au moins un vrai téléphone, idéalement un Android et un iPhone.
- [Retirer la `key` de `Hand` peut laisser une sélection périmée] → La clé de `resetKey` couvre déjà phase, manche, pli et taille de la main ; la décision 4 rend la sélection invalide dès que cette clé change, et la recette vérifie une partie complète.
- [L'idée 14 : don déjà fait lors de la reprise d'une place de bot] → Comportement inchangé par ce change, le bug reste à traiter à part.

## Migration Plan

Aucune migration de données. La préférence absente vaut `fan` : tous les joueurs passent en éventail à la mise en ligne, et le bouton leur permet de revenir à l'étalé. Pour revenir en arrière, il suffit d'annuler la fusion : la clé `localStorage` restante est alors ignorée.
