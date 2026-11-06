# Spec Delta

## ADDED Requirements

### Requirement: Emphase d'une carte en éventail
En éventail, le système SHALL mettre en emphase la carte désignée par le doigt qui balaie la main, ou par la souris qui la survole. La carte en emphase SHALL s'afficher redressée, agrandie, devant les autres, entièrement dans l'écran et au-dessus du doigt.

#### Scenario: Balayage au doigt
- **WHEN** le joueur pose le doigt sur la main et le déplace horizontalement
- **THEN** l'emphase passe de carte en carte sous son doigt, sans jouer de carte ni faire défiler la page

#### Scenario: Survol à la souris
- **WHEN** le joueur déplace la souris sur la main sans cliquer
- **THEN** la carte survolée passe en emphase, et l'emphase disparaît quand la souris quitte la main

#### Scenario: Carte visible au-dessus du doigt
- **WHEN** une carte est en emphase au doigt, y compris à une extrémité de la main
- **THEN** son rang et sa couleur restent lisibles, non recouverts par le doigt ni coupés par l'écran

#### Scenario: Fin du balayage
- **WHEN** le joueur lève le doigt sans avoir tiré la carte vers le haut
- **THEN** la carte reste en emphase jusqu'à ce qu'il touche ailleurs, et rien n'est joué

#### Scenario: Paysage
- **WHEN** une carte est en emphase sur un écran de 640 x 360 px
- **THEN** elle est entièrement visible, même si elle recouvre provisoirement la table

### Requirement: Écart des cartes voisines
Le système SHALL écarter de part et d'autre de la carte en emphase ses cartes voisines, d'autant moins qu'elles en sont éloignées, et SHALL les faire glisser vers leur nouvelle place. Sans emphase, elles SHALL reprendre leur place dans l'éventail.

#### Scenario: Voisines écartées
- **WHEN** une carte passe en emphase au milieu de la main
- **THEN** les cartes à sa gauche glissent vers la gauche, celles à sa droite vers la droite, et les plus proches se déplacent le plus

#### Scenario: Déplacement sans saut
- **WHEN** le joueur balaie lentement la main
- **THEN** l'emphase change de carte une seule fois par carte, sans revenir sans cesse entre deux cartes voisines

### Requirement: Jouer une carte en la tirant vers le haut
En éventail, le système SHALL prendre une carte en main quand le joueur la tire vers le haut, la faire suivre son doigt ou sa souris et afficher une ligne de jeu. La relâcher au-dessus de cette ligne SHALL la jouer ; la relâcher en dessous SHALL la remettre dans la main. La position de la ligne SHALL dépendre de la hauteur de l'écran.

#### Scenario: Carte jouée
- **WHEN** c'est le tour du joueur, qu'il tire une carte jouable au-dessus de la ligne et la relâche
- **THEN** la carte est posée dans le pli

#### Scenario: Carte remise dans la main
- **WHEN** il relâche la carte sous la ligne
- **THEN** la carte retourne à sa place et rien n'est joué

#### Scenario: Signal avant de relâcher
- **WHEN** la carte tenue passe au-dessus de la ligne
- **THEN** son aspect change pour indiquer qu'elle sera jouée si on la relâche

#### Scenario: Geste horizontal
- **WHEN** le joueur déplace surtout le doigt horizontalement, même avec un léger mouvement vers le haut
- **THEN** il continue de balayer la main, et aucune carte n'est prise

#### Scenario: Toucher simple
- **WHEN** le joueur touche deux fois de suite la même carte en éventail
- **THEN** la carte reste en emphase et rien n'est joué

#### Scenario: Souris
- **WHEN** le joueur appuie sur la carte survolée, la tire au-dessus de la ligne et relâche
- **THEN** la carte est posée dans le pli

### Requirement: Carte non jouable tirée vers le haut
Le système SHALL laisser lire toute carte de la main, y compris hors de son tour. Tirer une carte non jouable SHALL la laisser résister sans la détacher de la main ni la jouer, et afficher un message. Ce message SHALL indiquer si ce n'est pas le tour du joueur, sans jamais énoncer de règle du jeu.

#### Scenario: Carte grisée
- **WHEN** c'est le tour du joueur et qu'il tire une carte que le moteur n'autorise pas
- **THEN** elle remonte à peine, revient à sa place, et un message indique que cette carte ne peut pas être jouée

#### Scenario: Hors de son tour
- **WHEN** ce n'est pas le tour du joueur et qu'il tire une carte
- **THEN** rien n'est joué et un message indique que ce n'est pas à lui de jouer

#### Scenario: Lecture d'une carte grisée
- **WHEN** le joueur balaie la main sur une carte grisée
- **THEN** cette carte passe en emphase et reste identifiable comme non jouable

### Requirement: Carte en attente de la réponse de l'hôte
Le système SHALL garder hors de la main une carte relâchée pour être jouée, jusqu'à ce que le coup soit confirmé ou refusé. En cas de refus ou sans réponse après quelques secondes, la carte SHALL retourner dans la main, et un refus SHALL être signalé.

#### Scenario: Coup confirmé
- **WHEN** un invité relâche une carte au-dessus de la ligne et que l'hôte accepte
- **THEN** la carte passe de la position d'attente au pli sans revenir dans la main

#### Scenario: Coup refusé
- **WHEN** l'hôte refuse le coup
- **THEN** la carte retourne dans la main et le joueur voit la raison du refus

#### Scenario: Partie mise en pause
- **WHEN** la partie passe en pause alors que le joueur tient une carte, puis qu'il la relâche au-dessus de la ligne
- **THEN** rien n'est joué et la carte retourne dans la main

### Requirement: Geste interrompu
Le système SHALL remettre la carte tenue dans la main, sans la jouer, si le geste est interrompu par le système ou si la situation change au point de retirer cette carte de la main. Seul le premier doigt posé SHALL piloter le geste.

#### Scenario: Interruption par le système
- **WHEN** un appel ou une notification interrompt le geste pendant que le joueur tient une carte
- **THEN** la carte retourne dans la main et rien n'est joué

#### Scenario: Deuxième doigt
- **WHEN** un deuxième doigt touche l'écran pendant un geste
- **THEN** il est ignoré, et le geste du premier doigt continue normalement

### Requirement: Emphase et sélection entre les deux affichages
Le système SHALL faire correspondre la carte en emphase de l'éventail et la carte sélectionnée de l'étalé quand le joueur change d'affichage. Aucun changement d'affichage SHALL ne jouer de carte.

#### Scenario: De l'éventail vers l'étalé
- **WHEN** une carte est en emphase et que le joueur passe en étalé
- **THEN** cette carte y est sélectionnée et pas encore jouée

#### Scenario: De l'étalé vers l'éventail
- **WHEN** une carte est sélectionnée en étalé et que le joueur passe en éventail
- **THEN** cette carte y est en emphase

## MODIFIED Requirements

### Requirement: Jouer par sélection puis confirmation
En affichage étalé, le système SHALL faire jouer une carte en deux clics : le premier la sélectionne, le second sur la même carte la joue. Cliquer sur une autre carte jouable déplace la sélection.

#### Scenario: Sélection
- **WHEN** l'humain clique sur une carte jouable
- **THEN** la carte est mise en avant et n'est pas encore posée

#### Scenario: Confirmation
- **WHEN** l'humain clique à nouveau sur la carte sélectionnée
- **THEN** la carte est posée dans le pli

#### Scenario: Changement de sélection
- **WHEN** une carte est sélectionnée et que l'humain clique sur une autre carte jouable
- **THEN** la sélection passe à cette autre carte et rien n'est posé

#### Scenario: Carte injouable
- **WHEN** l'humain clique sur une carte grisée
- **THEN** rien n'est sélectionné ni posé
