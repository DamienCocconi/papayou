# Spec Delta

## ADDED Requirements

### Requirement: Emplacements d'échange en éventail
En éventail, tant que le joueur n'a pas donné ses cartes, le système SHALL afficher dans la zone de jeu 3 emplacements visibles, vides au départ. Ils SHALL tenir dans l'écran fixe, en portrait comme en paysage, à partir de 360 x 640 px.

#### Scenario: Début de l'échange
- **WHEN** l'échange commence pour un joueur en éventail
- **THEN** 3 emplacements vides sont visibles et toute sa main est dans l'éventail

#### Scenario: Paysage à 6 joueurs
- **WHEN** l'échange s'affiche en éventail sur un écran de 640 x 360 px à 6 joueurs
- **THEN** les emplacements, leurs boutons, tous les joueurs et la main sont accessibles sans défiler

### Requirement: Placer une carte dans un emplacement
Pendant l'échange en éventail, le système SHALL laisser le joueur tirer n'importe quelle carte de sa main vers le haut. La relâcher au-dessus de la ligne de jeu SHALL la placer dans le premier emplacement vide et la retirer de l'éventail. La relâcher en dessous SHALL la remettre dans la main.

#### Scenario: Première carte
- **WHEN** le joueur tire une carte au-dessus de la ligne et la relâche alors que les 3 emplacements sont vides
- **THEN** elle occupe le premier emplacement et l'éventail se referme sans elle

#### Scenario: N'importe quelle carte
- **WHEN** le joueur tire l'excuse ou un atout au-dessus de la ligne et la relâche
- **THEN** la carte est placée dans un emplacement

#### Scenario: Relâchée sous la ligne
- **WHEN** le joueur relâche la carte sous la ligne
- **THEN** elle retourne à sa place dans la main et les emplacements ne changent pas

#### Scenario: Emplacements pleins
- **WHEN** les 3 emplacements sont remplis et que le joueur tire une autre carte
- **THEN** elle ne quitte pas la main, les emplacements réagissent brièvement et un message indique qu'ils sont pleins

### Requirement: Retirer une carte d'un emplacement
Le système SHALL afficher sous chaque carte placée un bouton de retrait, qui la remet à sa place dans l'éventail. Les autres cartes SHALL rester dans leur emplacement, et le prochain placement SHALL remplir le premier emplacement vide.

#### Scenario: Retrait
- **WHEN** le joueur utilise le bouton sous une carte placée
- **THEN** la carte retourne dans l'éventail à sa place dans l'ordre de la main

#### Scenario: Retrait au milieu
- **WHEN** les 3 emplacements sont remplis et que le joueur retire la carte du deuxième
- **THEN** le deuxième emplacement est vide et les deux autres cartes ne bougent pas

#### Scenario: Comblement du trou
- **WHEN** le deuxième emplacement est vide et que le joueur place une nouvelle carte
- **THEN** elle occupe le deuxième emplacement

### Requirement: Validation du don en éventail
Le système SHALL proposer le don des cartes seulement lorsque les 3 emplacements sont remplis, sans jamais l'envoyer automatiquement. Après le don, les cartes SHALL rester visibles dans les emplacements, sans bouton de retrait et hors de l'éventail, jusqu'à la fin de l'échange.

#### Scenario: Deux cartes placées
- **WHEN** 2 emplacements sont remplis
- **THEN** le don n'est pas proposé

#### Scenario: Trois cartes placées
- **WHEN** le troisième emplacement est rempli
- **THEN** le bouton de don apparaît, aucune carte n'est encore donnée et les retraits restent possibles

#### Scenario: Don envoyé
- **WHEN** le joueur valide son don
- **THEN** les boutons de don et de retrait disparaissent, les 3 cartes restent dans les emplacements et l'attente des autres joueurs est indiquée

#### Scenario: Don refusé
- **WHEN** l'hôte refuse le don
- **THEN** le joueur voit la raison du refus, retrouve ses cartes dans les emplacements et peut les modifier

#### Scenario: Fin de l'échange
- **WHEN** tous les joueurs ont donné
- **THEN** les emplacements disparaissent et la nouvelle main s'affiche dans l'éventail

#### Scenario: Pause pendant le choix
- **WHEN** la partie passe en pause puis reprend alors que des cartes sont placées
- **THEN** pendant la pause, le joueur ne peut ni placer, ni retirer, ni donner de carte, et il retrouve ses emplacements à la reprise

### Requirement: Choix du don conservé entre les affichages
Le système SHALL garder le même choix de cartes à donner dans les deux affichages : les cartes placées deviennent les cartes sélectionnées de l'étalé, et inversement. La place de chaque carte dans les emplacements SHALL être conservée lors des changements d'affichage.

#### Scenario: De l'éventail vers l'étalé
- **WHEN** 2 cartes sont placées et que le joueur passe en étalé
- **THEN** ces 2 cartes y sont sélectionnées, et les autres ne le sont pas

#### Scenario: De l'étalé vers l'éventail
- **WHEN** le joueur a sélectionné 2 cartes en étalé puis passe en éventail
- **THEN** elles occupent les emplacements dans l'ordre où il les a sélectionnées

#### Scenario: Aller-retour
- **WHEN** les emplacements contiennent A, B et C dans cet ordre, puis que le joueur passe en étalé et revient en éventail
- **THEN** ils contiennent toujours A, B et C dans le même ordre

#### Scenario: Retrait en étalé
- **WHEN** le joueur désélectionne B en étalé, sélectionne D, puis revient en éventail
- **THEN** les emplacements contiennent A, D et C

#### Scenario: Pas de changement du don
- **WHEN** le joueur change d'affichage après avoir donné
- **THEN** ses 3 cartes restent données et ne peuvent pas être modifiées

## MODIFIED Requirements

### Requirement: Échange de trois cartes
Le système SHALL, en phase d'échange, laisser l'humain choisir exactement trois cartes de sa main puis les donner, par sélection en étalé et par emplacements en éventail, et SHALL afficher ensuite l'attente des autres joueurs en indiquant qui a déjà donné.

#### Scenario: Trois cartes exactement
- **WHEN** l'humain a sélectionné deux cartes en étalé
- **THEN** le bouton de validation du don est inactif

#### Scenario: Pas plus de trois
- **WHEN** trois cartes sont déjà sélectionnées en étalé et que l'humain en sélectionne une quatrième
- **THEN** la sélection reste à trois cartes sans erreur

#### Scenario: N'importe quelle carte
- **WHEN** l'humain sélectionne l'excuse ou un atout à donner
- **THEN** la sélection est acceptée

#### Scenario: Attente
- **WHEN** l'humain a donné ses cartes et que d'autres joueurs n'ont pas fini
- **THEN** l'interface indique l'attente et qui a déjà donné, et ne permet plus de changer son don

### Requirement: Emphase et sélection entre les deux affichages
En phase de jeu, le système SHALL faire correspondre la carte en emphase de l'éventail et la carte sélectionnée de l'étalé quand le joueur change d'affichage. Pendant l'échange, l'emphase SHALL ne pas être reportée dans le choix du don. Aucun changement d'affichage SHALL ne jouer ni ne donner de carte.

#### Scenario: De l'éventail vers l'étalé
- **WHEN** en phase de jeu, une carte est en emphase et que le joueur passe en étalé
- **THEN** cette carte y est sélectionnée et pas encore jouée

#### Scenario: De l'étalé vers l'éventail
- **WHEN** en phase de jeu, une carte est sélectionnée en étalé et que le joueur passe en éventail
- **THEN** cette carte y est en emphase

#### Scenario: Emphase pendant l'échange
- **WHEN** pendant l'échange, une carte est en emphase sans être placée et que le joueur passe en étalé
- **THEN** cette carte n'est pas sélectionnée

## REMOVED Requirements

### Requirement: Échange affiché en étalé
**Reason**: Cette exigence était une étape provisoire d'`add-fan-layout`, le temps que les emplacements d'échange existent.
**Migration**: L'échange suit désormais le choix d'affichage du joueur, et le bouton d'affichage reste disponible pendant l'échange.
