# Design

## Context

- Toutes les cartes face visible passent par `src/ui/components/CardView.tsx`. Le papayou peut apparaître dans la main étalée (`Hand.tsx`), la main en éventail (`FanHand.tsx`), le pli en cours (`Table.tsx`, taille `small`) et le dernier pli (`LastTrick.tsx`, `small`).
- `CardView` ne reçoit que la carte. Pour savoir si elle est le papayou, il lui faut la couleur choisie et le nombre de joueurs, que seule la vue de `GameScreen` porte. Le projet a déjà un précédent : `CardInspectContext`, fourni par `GameScreen` à toutes les cartes affichées.
- Le moteur exporte `isPapayou(card, papayouSuit, playerCount)` (change `papayou-ten`). L'interface ne code ni le 7 ni le 10.

## Goals / Non-Goals

**Goals :**
- Reconnaître le papayou d'un coup d'œil, à toutes les tailles de carte, sans rien ajouter au poids du site.

**Non-Goals :**
- Effet animé (voir « Abandon des escarbilles » ci-dessous), choix de style, désactivation.

## Decisions

### 1. Le papayou est connu par un contexte React

`src/ui/cards/papayouContext.ts` définit `PapayouContext` (`{ papayouSuit, playerCount }`, ou `null` hors de l'écran de jeu), la fonction pure `isPapayouCard(card, info)` (qui appelle `isPapayou` du moteur) et le hook `useIsPapayou(card)`. `GameScreen` fournit le contexte autour de tout l'écran. `CardView` ajoute la classe `papayou` à la carte reconnue.

- Pourquoi : `CardView` est utilisé par cinq composants. Passer une prop à chacun obligerait chaque parent à transmettre la vue. Le contexte suit le modèle déjà en place, à côté de `cardInspect.ts`.
- Alternative écartée : une prop calculée par chaque parent. Cinq endroits à modifier, autant d'occasions d'en oublier un.

### 2. Liseré en CSS pur

`.card.papayou` : bordure rouge orangé, anneau de 1 px et halo (`box-shadow`). Les règles de l'éventail qui posent leur propre ombre (carte en emphase, carte prête à jouer) sont plus spécifiques : deux règles `.fan-slot.emphasized .card.papayou` et `.fan-slot.ready .card.papayou` combinent leur ombre avec le halo, pour que le papayou reste reconnaissable pendant le geste. Une carte grisée (non jouable) garde le liseré, atténué par l'opacité existante.

- Pourquoi du CSS : aucun coût, aucun chargement, visible même sur les petites cartes de 30×45 px des sièges en éventail.
- Le liseré ne change pas la taille de la carte et ne capte rien : les gestes et le clic sont inchangés.

### 3. Abandon des escarbilles

Un effet de braises animées avec tsParticles (4.5.0, chargé à part et préchargé à l'entrée de l'écran de jeu) a été implémenté, puis retiré à la relecture dans le navigateur : les braises naissaient et s'éteignaient n'importe où sur le calque, et la dérive aléatoire les faisait par moments filer trop vite. Le rendu n'était pas crédible. Si un effet animé revient, il fera l'objet d'un change à part ; ce qu'on en retient :
- en version 4, `@tsparticles/react` n'affiche rien de ses enfants tant que le moteur n'est pas initialisé : il vaut mieux appeler `tsParticles.load({ id, element })` directement ;
- chaque animation doit avoir un identifiant unique et son propre élément hôte, sinon le double montage de React en développement détruit le canvas de l'animation suivante ;
- des braises crédibles demanderaient un point d'émission fixe sur la carte (émetteur) plutôt que des particules réparties sur tout le calque, et une vitesse sans dérive aléatoire forte.

## Risks / Trade-offs

- [Le halo rouge orangé se confond un peu avec un cœur ou un carreau rouges] → Le halo déborde de la carte et la bordure change de couleur : il se voit aussi sur les cartes rouges. À juger à l'usage.
- [Le halo de la carte en emphase et celui du papayou se superposent dans l'éventail] → Règles combinées dédiées (décision 2).
