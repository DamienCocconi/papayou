# Spec Delta

## ADDED Requirements

### Requirement: Écran de plantage
Quand une erreur inattendue empêche l'interface de s'afficher, le système SHALL remplacer l'écran vide par un écran de plantage. Cet écran SHALL dire que le jeu a planté, inviter à faire une capture puis à recharger, et proposer un bouton « Recharger » qui recharge la page.

#### Scenario: Erreur pendant une partie
- **WHEN** une erreur inattendue survient pendant l'affichage d'une partie
- **THEN** l'écran de plantage s'affiche à la place d'un écran vide, avec le bouton « Recharger »

#### Scenario: Rechargement
- **WHEN** le joueur appuie sur « Recharger » depuis l'écran de plantage
- **THEN** la page se recharge et l'écran d'accueil s'affiche

### Requirement: Rapport de plantage
L'écran de plantage SHALL afficher un rapport lisible sur une capture de téléphone : date et heure, navigateur, taille de l'écran et visibilité de la page, message de l'erreur, éléments de l'interface concernés et dernières erreurs survenues juste avant. Le rapport SHALL rester sur l'appareil : rien n'est envoyé sur le réseau.

#### Scenario: Contenu du rapport
- **WHEN** l'écran de plantage s'affiche
- **THEN** le rapport indique la date, le navigateur, la taille de l'écran et le message de l'erreur

#### Scenario: Erreurs précédentes
- **WHEN** des erreurs sont survenues hors de l'affichage peu avant le plantage
- **THEN** le rapport liste les plus récentes, avec leur heure

#### Scenario: Rapport long
- **WHEN** le rapport est plus haut que la place disponible
- **THEN** il défile à l'intérieur de son cadre et le bouton « Recharger » reste visible au-dessus

#### Scenario: Aucun envoi
- **WHEN** l'écran de plantage s'affiche
- **THEN** aucune requête réseau n'envoie le rapport

### Requirement: Éventail au rallumage de l'écran
En éventail, le système SHALL garder l'écran de jeu affiché et utilisable quand l'écran du téléphone s'éteint puis se rallume pendant une partie, sans changer la partie, la main ni la sélection.

#### Scenario: Volet magnétique fermé puis rouvert
- **WHEN** le joueur, en éventail pendant l'échange de cartes, ferme le volet magnétique de son téléphone puis le rouvre
- **THEN** l'écran de jeu s'affiche comme avant, avec la même main et le même choix de don

#### Scenario: Choix du papayou
- **WHEN** l'écran s'éteint puis se rallume pendant le choix de la couleur du papayou, en éventail
- **THEN** le choix du papayou est toujours affiché et utilisable
