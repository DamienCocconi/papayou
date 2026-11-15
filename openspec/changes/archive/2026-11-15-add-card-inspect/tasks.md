# Tasks

## 1. Calque : fermeture sur un appui commencé sur lui

- [x] 1.1 Dans `src/ui/components/Lightbox.tsx`, noter un `pointerdown` reçu sur le calque (`ref` booléenne), ne fermer au `click` que si le drapeau est levé puis le baisser, neutraliser `contextmenu` sur le calque, et mettre à jour le commentaire du composant. Vérifier avec `npm run build`
- [x] 1.2 Vérifier dans le navigateur, avec le QR code du lobby de l'hôte : un toucher sur le QR et un toucher sur le fond ferment le calque, Échap le ferme et rend le focus au bouton, un clic à l'emplacement de « Lancer la partie » ne démarre pas la partie, et un clic droit sur le calque n'ouvre aucun menu

## 2. Appui long : module pur et hook

- [x] 2.1 Créer `src/ui/cards/longPress.ts` avec `INSPECT_DELAY_MS = 700`, `INSPECT_TOLERANCE_PX = 10` et une fonction pure qui dit si un déplacement (dx, dy) depuis l'appui l'annule, et `src/ui/cards/longPress.test.ts` (immobile, juste sous la tolérance, juste au-dessus, déplacement en diagonale). Vérifier avec `npm test`
- [x] 2.2 Créer `src/ui/cards/useLongPress.ts` : minuteur démarré par un `pointerdown` principal non souris, annulé au-delà de la tolérance, au `pointerup`, au `pointercancel` et au démontage, et indicateur « appui tactile en cours » lisible par l'appelant. Vérifier avec `npm run build`

## 3. Carte observable et calque de la carte agrandie

- [x] 3.1 Créer `CardInspectContext` (fourniture de `inspect(card)`, absent par défaut) dans `src/ui/cards/` et, dans `GameScreen`, l'état `inspected`, le fournisseur, et `<Lightbox label={cardName(card)}>` avec la carte dans un conteneur `.card-inspect`. Vérifier avec `npm run build`
- [x] 3.2 Dans `CardView`, pour un atout illustré quand le contexte est présent : `onContextMenu` (`preventDefault`, puis `inspect` sauf appui tactile en cours) et appui long via `useLongPress`, désactivable par une prop `longPress={false}`. Rien pour l'excuse, les cartes de couleur, les atouts sans illustration et les dos. Vérifier avec `npm run build`
- [x] 3.3 Ajouter dans `app.css` les styles `.card-inspect` (`--card-w: min(88vw, 88dvh / 1.5)` avec repli `vh`, `--card-h` à 1,5 fois la largeur, rayon proportionnel). Vérifier dans le navigateur à 360 x 640 et à 640 x 360 qu'un atout agrandi est entièrement visible, aux bonnes proportions, avec son numéro et son titre lisibles
- [x] 3.4 Neutraliser `contextmenu` sur la racine `.game` de `GameScreen`. Vérifier dans le navigateur qu'un clic droit sur une carte de couleur, sur l'excuse et sur le fond de la table n'ouvre aucun menu et n'agrandit rien, et que le clic droit garde son menu dans le lobby de l'hôte
- [x] 3.5 Vérifier dans le navigateur, à la souris, qu'un clic droit agrandit un atout illustré devant un siège, dans le panneau du dernier pli (étalé), dans la surcouche du dernier pli (éventail, la surcouche étant toujours ouverte à la fermeture du calque) et dans un emplacement d'échange (la carte y reste)

## 4. Main étalée : cartes grisées observables

- [x] 4.1 Dans `CardView`, rendre une carte grisée cliquable avec `aria-disabled="true"` au lieu de `disabled`, sans appeler `onClick`, et reporter dans `app.css` les styles `button:disabled` et `button.card:not(:disabled):hover` sur `.card[aria-disabled="true"]`. Vérifier avec `npm test`, `npm run build`, et dans le navigateur que l'aspect des cartes grisées est inchangé et qu'un clic sur l'une d'elles ne sélectionne rien
- [x] 4.2 Vérifier dans le navigateur, en étalé : un clic droit agrandit un atout illustré jouable et un atout grisé, et un clic droit sur l'atout sélectionné l'agrandit sans le jouer, la sélection étant conservée à la fermeture

## 5. Éventail : appui long sur la carte en emphase

- [x] 5.1 Dans `src/ui/hand/handGesture.ts`, ajouter le champ `still` à `scrubbing`, l'événement `longPress` et l'effet `inspect`. L'événement n'est accepté qu'en `scrubbing`, avec le même pointeur, `pressed`, `still` et `!mouse`. Il ramène l'état à `idle` avec les effets `select(cardId)` et `inspect(cardId)`. Compléter `handGesture.test.ts` : accepté sur la carte en emphase pressée et immobile, refusé après un déplacement au-delà de la tolérance, refusé sur une carte atteinte en balayant, refusé à la souris, refusé en `holding`, refusé pour un autre pointeur, et un `up` qui suit est sans effet. Vérifier avec `npm test`
- [x] 5.2 Dans `useHandGesture.ts`, démarrer le minuteur `INSPECT_DELAY_MS` au `pointerdown` quand l'état devient `scrubbing` avec `pressed && !mouse`, l'annuler au relâchement, à l'annulation et à la sortie de `scrubbing`, relâcher la capture du pointeur et appeler `onInspect` sur l'effet `inspect`. Dans `FanHand`, retrouver la carte, appeler `inspect` si elle est illustrée, et passer `longPress={false}` au `CardView` de l'éventail. Vérifier avec `npm run build`
- [x] 5.3 Dans `FanHand`, ne pas retirer l'emphase conservée sur un `pointerdown` situé dans `.lightbox`. Vérifier dans le navigateur (mode tactile) qu'après un appui long sur l'atout en emphase, le calque s'ouvre, reste ouvert au relâchement, se ferme au toucher suivant, et que l'atout est toujours en emphase
- [x] 5.4 Vérifier dans le navigateur, en éventail : un clic droit sur l'atout en emphase l'agrandit ; un appui long sur une carte au repos la met en emphase sans rien agrandir ; un balayage arrêté 700 ms sur un atout n'agrandit rien ; tirer l'atout en emphase vers le haut avant 700 ms le prend normalement et le joue au-dessus de la ligne

## 6. Vérification d'ensemble

- [x] 6.1 Lancer `npm test` et `npm run build` : tout passe
- [x] 6.2 Vérifier qu'aucun fichier de `src/engine/`, `src/bots/` ni `src/net/` n'est modifié (`git diff --stat main`)
- [x] 6.3 Sur un vrai téléphone Android (site publié ou `vite --host`) : appui long de 700 ms sur un atout du pli en cours, du dernier pli, de l'étalé (jouable, grisé, sélectionné) et sur l'atout en emphase de l'éventail. Vérifier que le calque s'ouvre, qu'aucun menu du navigateur ni aucune sélection de texte n'apparaît, qu'aucune carte n'est jouée, et qu'un appui de 400 ms n'agrandit rien. Si `pointercancel` annule l'appui vers 500 ms, appliquer le repli prévu dans `design.md` (risques), puis vérifier de nouveau
- [x] 6.4 Si un iPhone est disponible, refaire 6.3 sur Safari iOS. Sinon, le noter dans le compte rendu du change (Pas d'iPhone disponible : non testé sur Safari iOS, appui long vérifié seulement sur Android.)

## 7. Corrections après relecture QA

- [x] 7.1 Éventail : ajouter `canInspect` à `GestureContext` et refuser `longPress` sur une carte non agrandissable, le geste restant en `scrubbing`. Tests ajoutés dans `handGesture.test.ts` (carte non illustrée toujours jouable après 700 ms, carte devenue emphase pendant l'appui). Vérifié avec `npm test`, et dans le navigateur : une carte de couleur en emphase se tire encore après 800 ms d'hésitation
- [x] 7.2 Ignorer le `contextmenu` venu du doigt grâce à un suivi global des doigts posés (`src/ui/cards/touchPress.ts`, tests dans `touchPress.test.ts`), à la place du suivi par carte qui ne couvrait pas l'éventail. Vérifié avec `npm test`, et dans le navigateur (événements simulés) : un menu tactile à 500 ms sur l'atout en emphase n'ouvre rien, le calque s'ouvre à 700 ms, le clic droit à la souris agrandit toujours
- [x] 7.4 Neutraliser `contextmenu` sur tout le document dans `App.tsx` et retirer les blocages devenus inutiles de `.game` (`GameScreen`) et de `Lightbox`. Vérifier avec `npm run build`, et dans le navigateur qu'aucun menu ne s'ouvre à l'accueil (champ du code de la salle compris), dans le lobby, sur le QR code, en jeu et sur l'atout agrandi, et que le clic droit agrandit toujours un atout illustré
- [x] 7.3 Refaire sur Android l'appui long sur l'atout en emphase de l'éventail (il passe désormais seulement par notre délai de 700 ms), et sur une carte de couleur en emphase : hésiter une seconde puis la tirer doit la jouer ou la placer

## Workflow follow-up

- Relecture par `qa-reviewer` avant de considérer le change terminé.
- Archiver le change (`/opsx:archive`) une fois livré.
