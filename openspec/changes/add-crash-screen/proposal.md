# Proposal

## Why

Sur Android, fermer puis rouvrir un volet magnétique pendant une partie en éventail laissait un écran vert vide, sans aucun bouton. Il fallait recharger la page et la partie était perdue. Deux choses manquaient. D'une part, l'éventail ne supportait pas le rallumage de l'écran. D'autre part, une erreur inattendue vidait toute l'application sans rien dire, ce qui rendait le problème impossible à diagnostiquer sur le téléphone.

Le correctif a déjà été écrit et validé sur le téléphone concerné, sur la branche `fix/crash-diagnostic` (PR #15). Ce change met les specs à jour pour qu'elles décrivent ce comportement.

## What Changes

- Une erreur inattendue de l'interface n'affiche plus un écran vide. Un écran de plantage la remplace, avec :
  - un titre et une consigne : faire une capture, puis recharger ;
  - un bouton « Recharger » ;
  - un rapport lisible sur une capture de téléphone : date, navigateur, taille de l'écran, message d'erreur, composants concernés et erreurs survenues juste avant.
- La main en éventail reste affichée et utilisable quand l'écran du téléphone s'éteint puis se rallume (volet magnétique, bouton marche) pendant une partie.
- Hors périmètre :
  - la sauvegarde de la partie et sa reprise après un rechargement, prévues dans un change à part ;
  - l'envoi automatique des rapports de plantage (aucun backend) ;
  - la récupération sans rechargement : après un plantage, on recharge la page.

## Capabilities

### New Capabilities

Aucune.

### Modified Capabilities

- `table-ui` : ajout de l'écran de plantage et de la tenue de l'éventail au rallumage de l'écran.

## Impact

- `src/main.tsx` : l'application est enveloppée dans le filet de sécurité.
- `src/ui/components/CrashScreen.tsx` : nouvel écran de plantage, avec la collecte des erreurs globales.
- `src/ui/components/FanHand.tsx` et `src/ui/hand/fanOrigin.ts` (avec ses tests) : mesure de position de l'éventail qui ne relance plus le rendu quand rien ne change.
- `src/ui/styles/app.css` : style du rapport.
- Aucun changement du moteur, du réseau ni des dépendances.
