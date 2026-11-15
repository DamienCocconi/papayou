# Proposal

## Why

La carte papayou (50 points) ressemble au 7 ou au 10 des autres couleurs : rien ne la distingue dans la main ni sur la table, alors que c'est la carte que chacun surveille pendant la manche. C'est l'idée 10 de `docs/idees.md`, débloquée par `papayou-ten`, qui fournit `isPapayou` dans le moteur.

## What Changes

- Une fois la couleur du papayou choisie, la carte papayou porte un **liseré luisant** dans le registre de la chaleur : bord rouge orangé et halo autour de la carte.
- Le liseré apparaît **partout où la carte est affichée** : dans la main (étalée ou en éventail, y compris en emphase), dans le pli en cours sur la table et dans le dernier pli. Aucune autre carte ne le porte.
- Le liseré est permanent et sans option.

Abandonné en cours d'implémentation : un effet d'escarbilles animé avec tsParticles. Il a été codé, puis retiré à la relecture : les braises apparaissaient et disparaissaient n'importe où et filaient par moments trop vite, l'effet n'était pas crédible. Le liseré seul suffit.

Hors périmètre (noté dans `docs/idees.md` pour plus tard) :
- un effet animé sur le papayou, et le choix de son style dans les options ;
- le respect de `prefers-reduced-motion`, si un effet animé revient.

## Capabilities

### New Capabilities

Aucune.

### Modified Capabilities

- `table-ui` : nouvelle exigence « Liseré du papayou » : la carte papayou de la manche porte un liseré luisant partout où elle est affichée, sans gêner la lecture ni les gestes.

## Impact

- `src/ui/cards/papayouContext.ts` (nouveau) : contexte React qui fournit aux cartes la couleur du papayou et le nombre de joueurs, sur le modèle de `CardInspectContext`, et reconnaît la carte via `isPapayou` du moteur.
- `src/ui/screens/GameScreen.tsx` : fournit ce contexte.
- `src/ui/components/CardView.tsx` : ajoute la classe `papayou` à la carte reconnue.
- `src/ui/styles/app.css` : le liseré, y compris en emphase et prête à jouer dans l'éventail.
- `docs/idees.md` : l'idée 10 est rayée avec le nom du change.
- Aucune dépendance ajoutée. Aucun changement dans `engine`, `bots` ni `net`.
