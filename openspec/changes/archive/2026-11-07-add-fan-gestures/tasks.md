# Tasks

Branche d'implémentation : `feat/add-fan-gestures`, tirée de `origin/main` une fois `add-fan-layout` fusionné et archivé.

## 1. Préparation

- [x] 1.1 Relire `proposal.md`, `design.md` et la spec de ce change face au code livré par `add-fan-layout`, et les mettre à jour avec `/opsx:update` si besoin. Vérifier que `openspec validate add-fan-gestures --strict` réussit.

## 2. Calcul de l'emphase

- [x] 2.1 Créer `src/ui/hand/emphasis.ts` : carte la plus proche du pointeur avec hystérésis, positions affichées, échelle selon la hauteur, ligne de jeu (design, décisions 2, 3 et 5). Vérifier avec `emphasis.test.ts` : la carte désignée ne dépend que des positions de repos, les voisines s'écartent de moins en moins, tout reste dans l'écran à 360 x 640 et 640 x 360, y compris aux extrémités, et la ligne reste au-dessus de la main.

## 3. États du geste

- [x] 3.1 Créer `src/ui/hand/handGesture.ts` : balayage, survol, prise, relâchement et annulation (décisions 1, 4 et 6). Vérifier avec `handGesture.test.ts` : un balayage ne joue rien, un mouvement surtout horizontal ne prend pas la carte, relâcher au-dessus produit `play` et en dessous rien, une carte refusée ne passe pas en `holding`, deux touchers ne jouent rien.
- [x] 3.2 Ajouter l'attente de réponse et les interruptions (décisions 7 et 11). Vérifier avec les mêmes tests : `pointercancel` n'envoie rien, un second `pointerId` est ignoré, `canPlay` devenu faux au relâchement empêche `play`, `pending` se termine sur confirmation, sur refus et sur délai dépassé, et une carte qui quitte la main annule le geste.

## 4. Branchement dans l'interface

- [x] 4.1 Créer le hook du geste (`ref`, capture du pointeur, rendus limités, position directe dans le `style`, décision 8), et le brancher sur le rendu `fan` de `Hand` à la place des boutons (décision 10). Vérifier avec `npm run dev` à la souris : survol, voisines qui glissent, prise, ligne, retour dans la main et coup joué.
- [x] 4.2 Afficher l'état de la ligne franchie et les messages de refus dans le statut, à partir de `legalPlays` et de `turnSeat` (décision 6). Vérifier avec `npm run dev` : carte grisée à son tour et carte tirée hors de son tour affichent chacune leur message. Vérifier aussi avec `rg` qu'aucune règle du jeu n'est ajoutée dans `src/ui`.
- [x] 4.3 Partager l'emphase et la sélection entre les deux affichages (décision 9). Vérifier avec `npm run dev` : une carte conserve son état en changeant d'affichage, le survol seul ne change pas la sélection, et aucun changement d'affichage ne joue de carte.
- [x] 4.4 Ajouter `touch-action`, le blocage du menu d'appui long et le respect de `prefers-reduced-motion` (décision 11). Vérifier dans le mode appareil du navigateur que l'écran ne défile pas pendant un geste.

## 5. Documentation

- [x] 5.1 Mettre à jour la feuille de route de `docs/contexte.md`, où « glisser-déposer » et « ergonomie tactile » figurent dans les finitions. Vérifier par relecture du diff.

## 6. Vérification d'ensemble

- [x] 6.1 Lancer `npm test` et `npm run build`. Vérifier qu'ils réussissent, puis rapporter les résultats tels quels.
- [x] 6.2 Recette manuelle par l'utilisateur sur un vrai téléphone (`npm run dev -- --host`), en portrait et en paysage : balayage sans défilement ni rechargement, carte lisible au-dessus du doigt et aux extrémités, passage naturel du balayage à la prise, annulation sous la ligne, coup joué au-dessus, fluidité. Trancher à cette occasion la position de l'emphase (design, Open Questions).
- [x] 6.3 Provoquer les cas limites sur téléphone : notification pendant une prise, deuxième doigt, départ depuis le bord de l'écran sur iPhone, appui long. Résultat : notifications (SMS, appel) validées ; iPhone non testé, faute d'appareil, point écarté par l'utilisateur.
- [x] 6.4 Vérifier sur PC, à la souris, dans au moins Chrome et Firefox : survol, prise, retour et coup joué.
- [x] 6.5 Faire une courte partie en réseau, avec le PC en hôte et le téléphone en invité : la carte relâchée ne clignote pas et ne revient pas dans la main avant la réponse, et une mise en pause pendant une prise n'envoie aucun coup.
- [x] 6.6 Faire relire le change par `qa-reviewer` par rapport à la spec. Vérifier que les remarques sont traitées ou explicitement écartées.
- [x] 6.7 Corriger les retours de la recette : ligne fixée à la prise et limite haute, carte au-dessus de la barre, texte non sélectionnable (panneau de recherche de Chrome), position remesurée à la rotation, emphase maintenue à la souris. Vérifier par les tests, puis par la recette de l'utilisateur, qui a repris le tactile, la souris et le réseau après ces corrections.

## Workflow follow-up

- Archiver le change avec `/opsx:archive` après la fusion et avant d'appliquer `add-gift-slots`.
- Relire ensuite `add-gift-slots` et le mettre à jour si ce change a appris quelque chose.
