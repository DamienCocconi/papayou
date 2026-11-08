# Tasks

Branche d'implémentation : `feat/add-gift-slots`, tirée de `origin/main` une fois `add-fan-layout` et `add-fan-gestures` fusionnés et archivés.

## 1. Préparation

- [x] 1.1 Relire `proposal.md`, `design.md` et la spec de ce change face au code livré par les deux changes précédents, et les mettre à jour avec `/opsx:update` si besoin. Vérifier que `openspec validate add-gift-slots --strict` réussit.

## 2. Choix du don

- [x] 2.1 Créer `src/ui/hand/giftDraft.ts` (design, décision 1). Vérifier avec `giftDraft.test.ts` : ajout dans la première place vide, sans doublon, sans effet si plein, retrait qui laisse un trou, comblement du trou, ordre de `ids`, et les séquences des scénarios « Aller-retour » et « Retrait en étalé ».
- [x] 2.2 Créer `useGiftDraft` et le brancher dans `GameScreen`, puis faire passer le mode `give` de `Hand` sur ce choix partagé (décisions 2 et 3). Vérifier avec `npm test` et `npm run dev` : l'échange en étalé fonctionne comme avant, et le choix se vide à la manche suivante.

## 3. Geste vers les emplacements

- [x] 3.1 Rendre le geste indépendant de sa destination : renommer l'effet `play` en `release`, et fournir `canPlay` et l'action au relâchement selon la phase (décision 5). Vérifier avec `handGesture.test.ts` mis à jour, et avec `npm run dev` : la phase de jeu se comporte exactement comme avant.
- [x] 3.2 Séparer l'emphase du choix pendant l'échange (décision 4). Vérifier avec `npm run dev` : lire une carte ne remplit pas d'emplacement, et ne la sélectionne pas en passant en étalé.

## 4. Emplacements

- [x] 4.1 Créer `GiftSlots` : emplacements vides, cartes placées, bouton de retrait, réaction quand c'est plein (décision 7). Vérifier avec `npm run dev` : placer, retirer et combler un trou donnent les résultats de la spec.
- [x] 4.2 Retirer de l'éventail les cartes placées (décision 6). Vérifier avec `npm run dev` : l'éventail se referme au placement, et une carte retirée reprend sa place dans l'ordre de la main.
- [x] 4.3 Ajouter le bouton de don et l'état « don en cours d'envoi » (décision 9), puis l'affichage après le don. Vérifier avec `npm run dev` : le bouton n'apparaît qu'à 3 cartes, les cartes restent sans retrait après l'envoi, et les emplacements disparaissent à la fin de l'échange.
- [x] 4.4 Retirer le passage forcé en étalé et le masquage du bouton d'affichage pendant l'échange. Vérifier avec `npm run dev` : l'échange suit le choix du joueur, et un aller-retour conserve l'ordre des cartes.
- [x] 4.5 Placer les emplacements dans l'écran fixe et masquer les emplacements de carte des joueurs pendant l'échange (décision 8). Vérifier dans le mode appareil du navigateur à 360 x 640 et 640 x 360 avec 6 joueurs : tout est accessible sans défiler.
- [x] 4.6 Gérer la pause (décision 10). Vérifier en réseau, ou avec le bandeau de pause : rien n'est modifiable pendant la pause, et le choix est retrouvé à la reprise.

## 5. Documentation

- [x] 5.1 Mettre à jour la feuille de route de `docs/contexte.md`. Vérifier par relecture du diff.

## 6. Vérification d'ensemble

- [x] 6.1 Lancer `npm test` et `npm run build`. Vérifier qu'ils réussissent, puis rapporter les résultats tels quels.
- [x] 6.2 Recette manuelle par l'utilisateur sur un vrai téléphone (`npm run dev -- --host`), en portrait et en paysage : emplacements bien visibles et compréhensibles, placement, retrait, comblement, emplacements pleins, zone tactile du bouton de retrait, don, attente puis nouvelle main.
- [x] 6.3 Vérifier les changements d'affichage : ordre conservé après un aller-retour, retrait en étalé, et aucun changement possible après le don. Trancher à cette occasion si le message de statut reste utile en éventail (design, Risks).
- [x] 6.4 Faire une courte partie en réseau, avec le PC en hôte et le téléphone en invité : don envoyé sans double envoi, attente des autres, nouvelle main, et pause pendant le choix.
- [x] 6.5 Faire relire le change par `qa-reviewer` par rapport à la spec. Vérifier que les remarques sont traitées ou explicitement écartées.

## Workflow follow-up

- Archiver le change avec `/opsx:archive` après la fusion.
