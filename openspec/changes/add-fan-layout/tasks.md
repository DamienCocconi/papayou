# Tasks

Branche d'implémentation : `feat/add-fan-layout`, tirée de `origin/main` une fois les propositions fusionnées.

## 1. Coin des cartes

- [ ] 1.1 Dans `src/ui/components/CardView.tsx` et `src/ui/styles/app.css`, empiler le rang et le symbole de couleur dans le coin supérieur gauche ; atouts et excuse gardent leur numéro seul. Vérifier avec `npm run dev` : 10 de trèfle, dame de pique, atout 14 et excuse sont lisibles, en taille normale et petite.

## 2. Préférence d'affichage

- [ ] 2.1 Créer `src/ui/hand/layoutPreference.ts` (design, décision 9). Vérifier avec `layoutPreference.test.ts` : valeur absente ou inconnue donne `fan`, valeur enregistrée relue, lecture et écriture qui lèvent une exception sans la propager.
- [ ] 2.2 Ajouter dans `GameScreen` le bouton de mode en icône avec `aria-label`, branché sur `localStorage`, et le calcul de l'affichage effectif (décision 10). Vérifier avec `npm run dev` : le choix survit à un rechargement, et le bouton est masqué tant que les cartes à donner ne sont pas choisies.

## 3. Géométrie de l'éventail

- [ ] 3.1 Créer `src/ui/hand/fanLayout.ts` (décisions 1 et 5). Vérifier avec `fanLayout.test.ts`, pour 1, 3, 13, 15, 19 et 26 cartes à des largeurs de 360, 375, 640 et 812 px : cartes dans la largeur, x croissants, arc symétrique, rotation plafonnée, petite main groupée au centre.
- [ ] 3.2 Créer le hook de mesure de largeur basé sur `ResizeObserver` (décision 2). Vérifier avec `npm run dev` en redimensionnant la fenêtre : l'arc se recalcule, sans erreur en console.

## 4. Composant Hand

- [ ] 4.1 Remplacer la `key` de `Hand` par la prop `resetKey`, avec la sélection stockée `{ key, ids }` (décision 4). Vérifier avec `npm test` et `npm run dev` : la sélection se vide quand la situation change, et une partie contre des bots se déroule normalement en étalé.
- [ ] 4.2 Ajouter le rendu `fan` à `Hand` : position, rotation et transition (décisions 3 et 12), carte sélectionnée devant. Vérifier avec `npm run dev` : les cartes restantes glissent après une carte posée, une carte se joue en deux clics, et les cartes injouables restent grisées et inactives. Vérifier aussi que la sélection survit au changement d'affichage.

## 5. Écran fixe en éventail

- [ ] 5.1 Mettre en place `.game.fan` : grille, `100dvh`, surdéfilement, encoche via `index.html`, compactage de la barre et des joueurs (décision 6). Vérifier dans le mode appareil du navigateur, à 360 x 640 et 640 x 360 avec 6 joueurs : tout est visible sans défiler.
- [ ] 5.2 Afficher `RoundEnd`, `GameEnd` et le menu d'administration en surcouche à défilement interne, et garder le choix du papayou et le bandeau de pause accessibles (décision 7). Vérifier aux mêmes tailles : chaque panneau est lisible, complet et utilisable, sans défilement de la page.
- [ ] 5.3 Ajouter le résumé du dernier pli avec ouverture et fermeture du détail (décision 8). Vérifier avec `npm run dev` : après un pli, le gagnant et les points sont visibles, et le détail montre les bonnes cartes.

## 6. Écran défilant en étalé

- [ ] 6.1 Rendre la barre du haut et le statut `sticky` en étalé. Vérifier avec `npm run dev` à 360 x 640 et 19 cartes : ils restent visibles jusqu'au bas de la main, et aucun panneau n'est recouvert.

## 7. Documentation

- [ ] 7.1 Mettre à jour la feuille de route de `docs/contexte.md` (éventail et changes liés) et retirer des idées ce qui est couvert, s'il y a lieu. Vérifier par relecture du diff.

## 8. Vérification d'ensemble

- [ ] 8.1 Lancer `npm test` et `npm run build`. Vérifier qu'ils réussissent, puis rapporter les résultats tels quels.
- [ ] 8.2 Recette manuelle par l'utilisateur sur un vrai téléphone (`npm run dev -- --host`), en portrait et en paysage : écran sans défilement, rotation en pleine partie avec une carte sélectionnée, absence de rafraîchissement par glissement, encoche, coin « 10 » lisible à 19 cartes, bouton de mode et mémorisation, échange en étalé, partie complète dans chacun des deux modes.
- [ ] 8.3 Vérifier les panneaux en paysage à 6 joueurs : fin de manche, fin de partie, dernier pli, bandeau de pause et menu d'administration.
- [ ] 8.4 Faire une courte partie en réseau, avec le PC en hôte et le téléphone en invité. Vérifier que chacun garde son propre affichage et que la partie se déroule normalement.
- [ ] 8.5 Faire relire le change par `qa-reviewer` par rapport à la spec. Vérifier que les remarques sont traitées ou explicitement écartées.

## Workflow follow-up

- Archiver le change avec `/opsx:archive` après la fusion et avant d'appliquer `add-fan-gestures`.
- Relire ensuite `add-fan-gestures` et `add-gift-slots`, et les mettre à jour si ce change a appris quelque chose.
