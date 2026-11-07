# Design

## Context

Voir `proposal.md` pour la motivation et `specs/table-ui/spec.md` pour les comportements attendus. Ce design suppose `add-fan-layout` livré : `fanLayout` fournit les positions, `Hand` possède un rendu `fan` et la sélection `{ key, ids }` n'est plus remontée à chaque coup. Relu après l'archivage d'`add-fan-layout`, puis ajusté avec ce que l'implémentation a appris (décisions 2, 4, 5 et 9).

Faits établis dans le code actuel :

- `legalPlays` vient du moteur et est vide hors du tour du joueur ; `turnSeat` (`labels.ts`) dit à qui c'est le tour.
- `dispatch` renvoie `{ ok }` immédiatement. Chez l'invité, ce `ok` veut seulement dire « envoyé » : un refus de l'hôte arrive plus tard dans `session.error`, et la carte reste dans `view.hand` jusqu'à la vue suivante.
- Vitest tourne sans DOM : la logique à tester doit être pure.

## Goals / Non-Goals

**Goals:**
- Écrire la logique du geste dans du code pur, rejouable en test sans navigateur.
- Garder le mouvement fluide sur un téléphone modeste.
- N'ajouter aucune règle du jeu dans l'interface.

**Non-Goals:**
- Bibliothèque de geste ou d'animation : les `pointer events` et les transitions CSS suffisent pour ce besoin.
- Animation de la carte jusqu'à la place du joueur : elle dépend du rythme du pli (idées 12 et 13) et se traitera avec lui.
- Ressort physique par calcul : une courbe CSS avec léger dépassement donne déjà l'effet recherché.

## Decisions

**1. États du geste dans un réducteur pur.** `src/ui/hand/handGesture.ts` expose une fonction `(état, événement) -> état` (le `useReducer` de React, proche d'une machine à états en Java). États : `idle`, `hover`, `scrubbing`, `holding`, `pending`. Événements : appui, déplacement, relâchement, annulation, changement de la main, réponse au coup. Le résultat peut porter des effets à exécuter, `play(cardId)`, `refuse(cardId)` ou `select(cardId)`, que le hook applique : le réducteur reste sans effet de bord. Le texte du refus est choisi par `GameScreen` (décision 6).

```
idle --survol--> hover --appui--> scrubbing
idle --appui---> scrubbing
scrubbing --tire vers le haut--> holding      (carte jouable)
scrubbing --tire vers le haut--> scrubbing    (carte refusée : résistance et message)
holding --relâche au-dessus de la ligne--> pending --confirmé--> idle
holding --relâche sous la ligne ou annulation--> idle   (emphase conservée si relâché)
pending --refus ou délai dépassé--> idle
```

*Alternative écartée :* gérer le geste directement dans les gestionnaires d'événements du composant. Moins de fichiers, mais impossible à tester sans navigateur, alors que c'est la logique la plus risquée du change.

**2. Carte désignée par calcul, pas par le DOM.** Le conteneur de la main reçoit les événements, et les cartes ont `pointer-events: none`, sauf la carte en emphase : elle déborde du conteneur et doit pouvoir être tirée là où elle s'affiche. La carte désignée est celle dont la **partie visible au repos**, déduite de `fanLayout`, est sous le pointeur : du bord gauche de la carte à celui de la suivante, à la hauteur où se pose le doigt pour tenir compte de la rotation. Viser le centre des cartes décalait la désignation d'une à deux cartes, puisqu'elles se recouvrent. Utiliser les positions de repos empêche le va-et-vient : écarter les voisines ne change pas la carte désignée. Une petite hystérésis (un seuil à franchir pour quitter la carte courante) absorbe les tremblements du doigt.
*Alternative écartée :* `elementFromPoint` ou les événements de chaque carte. Avec des cartes qui bougent, tournent et se recouvrent, la cible change sous le doigt, d'où le scintillement.

**3. Calcul de l'emphase dans un module pur.** `src/ui/hand/emphasis.ts` part des positions de repos et de la carte en emphase, et renvoie les positions affichées. Les voisines sont poussées d'une distance qui décroît avec l'éloignement, et restent dans l'écran. L'échelle de la carte en emphase dépend de la hauteur disponible, pour rester entière à 640 x 360. Sa position est bornée pour ne pas sortir de l'écran.

**4. Passage du balayage à la prise.** La prise se déclenche quand le mouvement vers le haut dépasse environ 30 px **et** domine le mouvement horizontal, mesurés depuis l'appui ou le dernier changement de carte. Mesurer depuis l'appui seul empêcherait de prendre une carte à la fin d'un long balayage. Un appui sur la carte agrandie la garde désignée tant que le pointeur ne s'en éloigne pas franchement, car elle est bien plus large que sa partie visible au repos. Une fois en `holding`, la carte désignée ne change plus. Ces seuils sont des constantes à ajuster à la recette.

**5. Ligne de jeu proportionnelle.** Sa position est un pourcentage de la hauteur de la zone de jeu, avec un minimum au-dessus de la main, calculé dans le module pur et testé en portrait et en paysage. Elle n'apparaît que pendant une prise. Elle est franchie quand le bas de la carte tenue passe au-dessus d'elle : la carte étant dessinée au-dessus du doigt, comparer son centre la donnerait pour franchie dès la prise en paysage. Si l'appui était déjà haut, la ligne de cette prise est remontée pour exiger une vraie montée : un petit coup ne joue pas la carte.

**6. Légalité lue au moment du relâchement.** Le réducteur reçoit une fonction `canPlay(cardId)` construite à partir de `legalPlays`, et ne connaît aucune règle. La vérification a lieu à la prise et de nouveau au relâchement, car la situation peut changer entre-temps (pause, tour). Le moteur reste le dernier juge via `dispatch`. Le message distingue seulement la pause, « pas votre tour » et « carte non jouable », à partir de la vue et de `turnSeat`.

**7. Attente de la réponse.** Après `play`, l'état `pending` garde la carte hors de l'éventail, à sa position de relâchement. Il se termine si la carte quitte `view.hand`, si `dispatch` échoue, si `session.error` apparaît, ou après 5 secondes. Le même code peut être renvoyé deux fois sans vue entre les deux : un refus se repère donc à l'heure de réception de la session (`receivedAt`), qui change à chaque refus, et non à la valeur de l'erreur. L'interface n'anticipe donc pas la vue de l'hôte. Un contrôleur local répond tout de suite : l'état `pending` ne dure alors qu'un rendu.
*Alternative écartée :* retirer la carte de la main dès l'envoi et la remettre en cas de refus. On simulerait l'état de jeu côté interface, alors que le moteur doit rester la seule source de vérité.

**8. Fluidité : peu de rendus React.** `setPointerCapture` garde le pointeur, et `touch-action: none` sur la zone de la main empêche le navigateur de récupérer le geste. Le réducteur vit dans un hook qui garde l'état complet dans une `ref` et ne déclenche un rendu React que lorsque l'état visible change (carte en emphase, phase, ligne franchie). Pendant une prise, la position de la carte est écrite directement dans son `style`, sans passer par le rendu, avec une transition désactivée pour cette seule carte. C'est l'usage habituel d'une `ref` en React pour ce qui change à chaque image.

**9. Emphase et sélection partagées.** Une seule donnée : l'id déjà stocké dans `{ key, ids }` par `Hand`. En éventail, il s'affiche comme l'emphase ; en étalé, comme la sélection. Cela satisfait directement les scénarios « Sélection conservée » et de rotation d'`add-fan-layout`. Une emphase obtenue par survol n'est pas stockée tant qu'elle n'est pas posée par un appui, pour éviter de changer la sélection en déplaçant simplement la souris. En éventail, l'emphase survit aux changements de `resetKey` tant que la carte est en main (scénario « Fin du balayage » : un coup d'un autre joueur ne la retire pas) ; en étalé, la sélection repart de zéro comme avant, pour qu'un clic ne joue pas une carte choisie dans une autre situation. Toucher ailleurs la retire, sauf sur un bouton : le bouton d'affichage doit au contraire la transmettre à l'étalé.

**10. Les cartes de l'éventail ne sont plus des boutons.** Elles deviennent de simples éléments d'affichage, avec le nom de la carte en texte accessible. Cela remplace la décision 11 d'`add-fan-layout` : pas de second comportement au clic à garder cohérent avec le geste. Le clavier et les lecteurs d'écran passent par l'étalé, atteint par le bouton de mode, qui reste un vrai bouton.

**11. Interruptions et détails mobiles.** `pointercancel` est traité comme une annulation. Seul le `pointerId` de l'appui initial est suivi. `onContextMenu` empêché, `user-select: none` et `-webkit-touch-callout: none` évitent le menu de l'appui long. Si la carte tenue quitte `view.hand`, l'événement « changement de la main » renvoie à `idle`.

## Risks / Trade-offs

- [Geste de retour de Safari depuis le bord de l'écran, impossible à bloquer entièrement] → Marges latérales conservées autour de l'éventail, et point de recette dédié sur iPhone.
- [Message trop générique] → Choix assumé : énoncer la raison précise reviendrait à coder une règle dans l'interface. Le grisé donne déjà l'information principale.
- [Coup joué par erreur en remontant le doigt pendant un balayage] → Seuil plus domination verticale (décision 4), puis ligne de jeu et possibilité d'annuler sous la ligne. Seuils ajustés à la recette.
- [Clavier moins bien servi en éventail] → L'étalé reste complet au clavier. Une navigation au clavier dans l'éventail pourra faire l'objet d'un change séparé.
- [Carte visible en attente pendant une coupure réseau] → Délai de 5 secondes, puis retour dans la main. Si l'hôte est perdu, l'écran dédié prend le relais.
- [Une emphase conservée après le lever du doigt masque une partie de la table] → Toucher ailleurs la retire ; à évaluer à la recette, notamment en paysage.

## Migration Plan

Aucune migration de données. Pour revenir en arrière, il suffit d'annuler la fusion : on retrouve l'éventail en deux touchers d'`add-fan-layout`.

## Open Questions

- **Position de l'emphase :** sur place (bornée à l'écran, comme Slay the Spire) ou recentrée à l'écran, comme envisagé au départ ? Les scénarios valent pour les deux. Le comportement par défaut est « sur place », et le choix se fait à la recette sur téléphone, avec une seule constante à changer dans `emphasis.ts`.
