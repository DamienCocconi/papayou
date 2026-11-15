# table-ui Specification

## Purpose

Décrit ce que le joueur voit et peut faire pendant une partie dans le navigateur : lancer une partie, échanger des cartes, choisir le papayou, jouer les plis et passer d'une manche à l'autre. L'interface n'applique aucune règle du jeu et affiche ce que le moteur autorise.

## Requirements

### Requirement: Écran d'accueil
Le système SHALL proposer, avant la partie, le choix du nombre de joueurs de 3 à 6 et du type de bot (aléatoire ou heuristique), puis lancer la partie avec l'humain et des bots.

#### Scenario: Lancement
- **WHEN** l'utilisateur choisit 5 joueurs et le bot heuristique puis valide
- **THEN** une partie à 5 joueurs démarre avec lui et 4 bots

#### Scenario: Valeur par défaut
- **WHEN** l'écran d'accueil s'affiche
- **THEN** un nombre de joueurs et un type de bot sont déjà sélectionnés, et la partie peut être lancée sans autre choix

### Requirement: Affichage des cartes
Le système SHALL afficher chaque carte lisible sans image : la couleur par son symbole (cœur, carreau, trèfle, pique) et sa teinte, le rang par un chiffre ou par V, C, D, R pour valet, cavalier, dame, roi, les atouts par leur numéro, l'excuse par un libellé propre. Le rang et, pour une carte de couleur, le symbole SHALL figurer ensemble dans le coin supérieur gauche. Le numéro d'un atout illustré SHALL figurer en chiffres arabes, en texte, dans le cercle du coin supérieur gauche de son cadre.

#### Scenario: Figure
- **WHEN** la dame de pique est affichée
- **THEN** la carte montre D et le symbole pique

#### Scenario: Atout
- **WHEN** l'atout 14 est affiché
- **THEN** la carte montre le nombre 14 et se distingue visuellement d'une carte de couleur

#### Scenario: Atout illustré
- **WHEN** l'atout 16 a une illustration et est affiché
- **THEN** le nombre 16 se lit dans le cercle du coin supérieur gauche, par-dessus le cadre

#### Scenario: Carte compréhensible sans la couleur seule
- **WHEN** une carte de cœur ou de carreau est affichée
- **THEN** elle se reconnaît par son symbole et non par sa seule teinte

#### Scenario: Carte recouverte par sa voisine
- **WHEN** seul le bord gauche du 10 de trèfle est visible dans la main
- **THEN** on y lit 10 et le symbole trèfle

### Requirement: Main du joueur
Le système SHALL afficher la main de l'humain triée dans l'ordre du moteur, et en phase de jeu SHALL griser les cartes injouables et empêcher de les jouer.

#### Scenario: Couleur à fournir
- **WHEN** un pique est demandé et que l'humain possède des piques
- **THEN** seuls ses piques sont jouables, les autres cartes sont grisées

#### Scenario: Pas son tour
- **WHEN** ce n'est pas le tour de l'humain
- **THEN** aucune carte n'est jouable et l'interface indique quel joueur doit jouer

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

### Requirement: Choix du papayou
Le système SHALL, quand l'humain est l'entameur, lui proposer les quatre couleurs et enregistrer son choix. Quand un autre joueur est l'entameur, l'interface SHALL indiquer qui choisit. Une fois le papayou choisi, sa couleur SHALL rester visible pendant la manche.

#### Scenario: L'humain choisit
- **WHEN** l'humain est l'entameur et clique sur la couleur trèfle
- **THEN** le papayou de la manche est le trèfle et le jeu commence

#### Scenario: Un bot choisit
- **WHEN** un bot est l'entameur
- **THEN** l'interface indique que ce joueur choisit, puis affiche la couleur choisie

### Requirement: Table et pli en cours
Le système SHALL afficher tous les joueurs autour de la table avec leur nom, leur nombre de cartes en main, leur place dans l'ordre de jeu, la carte qu'ils ont posée dans le pli en cours et le joueur dont c'est le tour. Le gagnant et les points du dernier pli terminé SHALL rester visibles. Ses cartes SHALL être visibles en étalé et s'afficher à la demande en éventail.

#### Scenario: Pli en cours
- **WHEN** deux joueurs sur quatre ont posé leur carte
- **THEN** ces deux cartes sont visibles à côté de leurs joueurs et le joueur suivant est signalé

#### Scenario: Dernier pli
- **WHEN** un pli vient de se terminer en étalé
- **THEN** l'interface affiche les cartes de ce pli, son gagnant et les points qu'il contient

#### Scenario: Dernier pli en éventail
- **WHEN** un pli vient de se terminer en éventail
- **THEN** l'interface affiche le gagnant et les points, et le joueur peut ouvrir puis refermer le détail des cartes de ce pli

#### Scenario: Cartes des autres
- **WHEN** la table est affichée
- **THEN** les autres joueurs n'y montrent que le nombre de leurs cartes, jamais leur contenu

### Requirement: Fin de manche et fin de partie minimales
Le système SHALL, à la fin d'une manche, afficher les points de la manche et les totaux et proposer de passer à la manche suivante. À la fin de la partie, il SHALL afficher le classement final et proposer de rejouer.

#### Scenario: Fin de manche
- **WHEN** la dernière carte d'une manche est jouée avant la dernière manche
- **THEN** l'interface affiche les points de la manche et les totaux, avec un bouton pour la manche suivante

#### Scenario: Manche suivante
- **WHEN** l'humain clique sur la manche suivante
- **THEN** une nouvelle manche démarre en phase d'échange avec de nouvelles mains

#### Scenario: Fin de partie
- **WHEN** la dernière manche se termine
- **THEN** l'interface affiche les places finales, égalités comprises, et propose de rejouer

#### Scenario: Rejouer
- **WHEN** l'humain choisit de rejouer
- **THEN** il revient à l'écran d'accueil

### Requirement: Aucune règle dans l'interface
Le système SHALL s'appuyer sur le moteur pour toute décision de règle (coups légaux, gagnant du pli, points, classement). L'interface SHALL NOT réimplémenter ces règles.

#### Scenario: Excuse au dernier pli
- **WHEN** l'humain n'a plus que l'excuse pour entamer le dernier pli
- **THEN** elle est jouable parce que le moteur l'indique, sans cas particulier dans l'interface

### Requirement: Choix du mode à l'accueil
Le système SHALL proposer à l'accueil, en plus de la partie locale contre des bots, de créer une salle en réseau ou d'en rejoindre une avec un code. La partie locale SHALL rester lançable comme avant.

#### Scenario: Créer une salle
- **WHEN** l'utilisateur choisit de créer une salle
- **THEN** il arrive dans le lobby de l'hôte

#### Scenario: Rejoindre avec un code
- **WHEN** l'utilisateur saisit un code de salle valide
- **THEN** il arrive dans la salle correspondante

#### Scenario: Ouverture d'un lien
- **WHEN** l'utilisateur ouvre un lien d'invitation
- **THEN** le code est repris du lien et il arrive dans la salle sans le ressaisir

### Requirement: Lobby de l'hôte
Le système SHALL afficher à l'hôte le code, le lien d'invitation avec un moyen de le copier, un bouton « Afficher le QR code », la liste des joueurs présents, le choix du nombre et du type de bots, et un bouton de démarrage actif seulement quand le total est de 3 à 6 joueurs. Les invités SHALL voir la liste des joueurs, l'attente du démarrage et le bouton « Afficher le QR code ».

#### Scenario: Arrivée d'un invité
- **WHEN** un invité rejoint la salle
- **THEN** son nom apparaît dans la liste de l'hôte et des autres invités

#### Scenario: Démarrage impossible
- **WHEN** le total d'humains et de bots est inférieur à 3
- **THEN** le bouton de démarrage est inactif et la raison est indiquée

#### Scenario: QR code chez l'hôte
- **WHEN** l'hôte touche « Afficher le QR code » dans son lobby
- **THEN** le QR code du lien d'invitation s'affiche en grand

#### Scenario: QR code chez l'invité
- **WHEN** un invité qui a donné son nom touche « Afficher le QR code » dans le lobby
- **THEN** le QR code du lien d'invitation de la salle s'affiche en grand

#### Scenario: Pas de QR code avant le nom
- **WHEN** un invité est sur l'écran de saisie de son nom
- **THEN** aucun bouton « Afficher le QR code » n'est proposé

### Requirement: Écran des places
Le système SHALL afficher, à qui rejoint une partie en cours, la liste des places avec pour chacune le nom du joueur connecté, la mention d'un bot, ou la mention d'une place libre suivie du nom de son précédent occupant. Les places libres et les places de bot SHALL proposer de les prendre, avec un champ de nom pré-rempli du dernier nom connu et modifiable.

#### Scenario: Place libre avec ancien nom
- **WHEN** la place d'un joueur nommé Bruno est libre
- **THEN** l'écran la montre libre avec le nom Bruno et un bouton pour la prendre

#### Scenario: Nom modifiable
- **WHEN** le joueur prend la place libre en saisissant un autre nom
- **THEN** la place est affichée avec ce nouveau nom

#### Scenario: Place non disponible
- **WHEN** une place est tenue par un joueur connecté
- **THEN** elle est affichée sans bouton pour la prendre

### Requirement: Aucune place disponible
Le système SHALL, quand toutes les places d'une partie en cours sont tenues par des joueurs connectés, l'indiquer sur l'écran des places en expliquant que l'hôte peut renvoyer un joueur absent, et SHALL mettre la liste à jour toute seule.

#### Scenario: Toutes les places sont tenues
- **WHEN** un arrivant ouvre le lien et qu'aucune place n'est libre ni tenue par un bot
- **THEN** l'écran dit qu'aucune place n'est disponible et pointe vers le menu d'administration de l'hôte

### Requirement: Indication de pause
Le système SHALL afficher à tous les joueurs, hôte compris, un bandeau de pause qui nomme la ou les places libres tant que la partie est interrompue, et SHALL empêcher de jouer pendant ce temps.

#### Scenario: Bandeau de pause
- **WHEN** Alice se déconnecte
- **THEN** chaque joueur voit un bandeau indiquant qu'Alice est partie et que la partie est en pause

#### Scenario: Fin de la pause
- **WHEN** la place d'Alice est reprise ou confiée à un bot
- **THEN** le bandeau disparaît et le jeu reprend

### Requirement: Menu d'administration de l'hôte
Le système SHALL proposer à l'hôte un menu d'administration, ouvrable et fermable à tout moment, qui liste les autres places avec « Renvoyer le joueur » pour un joueur présent et « Remplacer le joueur par un bot » pour un joueur absent. Ce menu n'apparaît pas chez les invités.

#### Scenario: Joueur présent
- **WHEN** l'hôte ouvre le menu et que Chloé est connectée
- **THEN** la ligne de Chloé propose « Renvoyer le joueur »

#### Scenario: Joueur absent
- **WHEN** l'hôte ouvre le menu et que la place d'Alice est libre
- **THEN** la ligne d'Alice propose « Remplacer le joueur par un bot »

### Requirement: Fin de manche en réseau
Le système SHALL afficher, en fin de manche à plusieurs humains, le compte à rebours, le nombre de joueurs encore attendus et le bouton « Manche suivante ». Une fois le bouton cliqué par le joueur, il SHALL indiquer que sa demande est prise en compte. L'affichage reste simple.

#### Scenario: Compte à rebours visible
- **WHEN** la manche se termine
- **THEN** chaque joueur voit le temps restant et « en attente de N joueurs »

#### Scenario: Après avoir cliqué
- **WHEN** le joueur clique sur « Manche suivante »
- **THEN** le bouton n'est plus actif et un texte indique qu'il attend les autres

### Requirement: Hôte parti
Le système SHALL afficher à un invité, quand l'hôte est injoignable, un écran indiquant que la partie est interrompue avec un moyen de revenir à l'accueil.

#### Scenario: Partie interrompue
- **WHEN** la connexion avec l'hôte est perdue
- **THEN** l'invité voit que la partie est interrompue et peut revenir à l'accueil

### Requirement: Deux affichages de la main
Le système SHALL proposer deux affichages de la main, en éventail et étalé, l'éventail étant celui par défaut. Un bouton de l'écran de jeu SHALL permettre de passer de l'un à l'autre, sans modifier la partie ni la carte sélectionnée.

#### Scenario: Premier lancement
- **WHEN** un joueur arrive pour la première fois sur l'écran de jeu
- **THEN** sa main s'affiche en éventail

#### Scenario: Changement d'affichage
- **WHEN** le joueur utilise le bouton pendant une partie
- **THEN** sa main passe à l'autre affichage et reste composée des mêmes cartes

#### Scenario: Sélection conservée
- **WHEN** une carte est sélectionnée et que le joueur change d'affichage
- **THEN** la même carte reste sélectionnée

### Requirement: Choix d'affichage mémorisé sur l'appareil
Le système SHALL mémoriser le choix d'affichage sur l'appareil du joueur. Ce choix SHALL ne s'appliquer qu'à cet appareil, et l'éventail SHALL être utilisé si la mémorisation est impossible.

#### Scenario: Après un rechargement
- **WHEN** le joueur a choisi l'affichage étalé puis recharge la page
- **THEN** sa main s'affiche en étalé

#### Scenario: Autres joueurs non concernés
- **WHEN** un joueur change d'affichage dans une partie en réseau
- **THEN** l'affichage des autres joueurs ne change pas

#### Scenario: Stockage indisponible
- **WHEN** le stockage du navigateur est indisponible
- **THEN** la main s'affiche en éventail, le bouton fonctionne pendant la session et aucune erreur n'apparaît

### Requirement: Main en éventail
En éventail, le système SHALL afficher la main en arc en bas de l'écran, avec des cartes superposées dans l'ordre du moteur et le coin supérieur gauche de chacune visible. La main SHALL tenir dans la largeur de l'écran, et une carte sélectionnée SHALL passer devant les autres.

#### Scenario: Grande main sur téléphone
- **WHEN** une main de 19 cartes s'affiche sur un écran de 375 px de large
- **THEN** toutes les cartes sont dans l'écran, sans défilement horizontal, et le rang et la couleur de chacune se lisent

#### Scenario: Petite main
- **WHEN** il reste 3 cartes en main
- **THEN** elles restent groupées au centre, sans s'étirer sur toute la largeur

#### Scenario: Carte posée
- **WHEN** une carte quitte la main
- **THEN** les cartes restantes glissent vers leur nouvelle place au lieu d'y apparaître d'un coup

#### Scenario: Carte sélectionnée
- **WHEN** le joueur sélectionne une carte de l'éventail
- **THEN** elle se lève et s'affiche devant ses voisines

#### Scenario: Grand écran
- **WHEN** une main s'affiche en éventail sur un écran de PC, par exemple 1920 x 1000 px
- **THEN** les cartes sont plus grandes que sur téléphone, dans la limite d'un plafond, et l'éventail occupe une part raisonnable de la largeur

#### Scenario: Redimensionnement
- **WHEN** le joueur réduit ou agrandit la fenêtre
- **THEN** la taille des cartes s'adapte, sans jamais passer sous la taille minimale lisible

### Requirement: Écran fixe en éventail
En éventail, le système SHALL faire tenir l'écran de jeu dans la fenêtre, sans défilement de la page, en portrait comme en paysage, à partir de 360 x 640 px. Tourner l'appareil SHALL replacer les éléments sans changer la partie ni la sélection.

#### Scenario: Portrait
- **WHEN** une partie à 6 joueurs s'affiche en éventail sur un écran de 360 x 640 px
- **THEN** la barre du haut, le statut, tous les joueurs et la main sont visibles sans défiler

#### Scenario: Paysage
- **WHEN** une partie à 6 joueurs s'affiche en éventail sur un écran de 640 x 360 px
- **THEN** la barre du haut, le statut, tous les joueurs et la main sont visibles sans défiler

#### Scenario: Rotation en pleine partie
- **WHEN** le joueur tourne son téléphone alors qu'une carte est sélectionnée
- **THEN** l'écran se réorganise et la carte reste sélectionnée

#### Scenario: Geste de rafraîchissement
- **WHEN** le joueur glisse vers le bas sur l'écran de jeu en éventail
- **THEN** la page ne se recharge pas

### Requirement: Panneaux dans l'écran fixe
En éventail, le système SHALL garder accessibles dans l'écran fixe le choix du papayou, la fin de manche, la fin de partie, le menu d'administration et le bandeau de pause. Un panneau plus haut que l'espace disponible SHALL défiler à l'intérieur de lui-même.

#### Scenario: Fin de manche en paysage
- **WHEN** une manche à 6 joueurs se termine sur un écran de 640 x 360 px
- **THEN** tous les scores et le bouton de manche suivante sont accessibles

#### Scenario: Administration ouverte
- **WHEN** l'hôte ouvre le menu d'administration en éventail
- **THEN** toutes les lignes du menu sont accessibles et il peut le refermer

### Requirement: Écran défilant en étalé
En étalé, le système SHALL laisser la page défiler et afficher les cartes à leur taille actuelle. La barre du haut et le message de statut SHALL rester visibles pendant le défilement.

#### Scenario: Défilement
- **WHEN** le joueur fait défiler la page jusqu'au bas de sa main en étalé
- **THEN** la barre du haut et le message indiquant à qui c'est le tour restent visibles

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

### Requirement: Emphase d'une carte en éventail
En éventail, le système SHALL mettre en emphase la carte désignée par le doigt qui balaie la main, ou par la souris qui la survole. La carte en emphase SHALL s'afficher redressée, agrandie, devant les autres, entièrement dans l'écran et au-dessus du doigt.

#### Scenario: Balayage au doigt
- **WHEN** le joueur pose le doigt sur la main et le déplace horizontalement
- **THEN** l'emphase passe de carte en carte sous son doigt, sans jouer de carte ni faire défiler la page

#### Scenario: Survol à la souris
- **WHEN** le joueur déplace la souris sur la main sans cliquer
- **THEN** la carte survolée passe en emphase, et l'emphase disparaît quand la souris quitte la main, sauf emphase maintenue

#### Scenario: Clic à la souris
- **WHEN** le joueur clique sur une carte sans la tirer vers le haut
- **THEN** rien n'est joué ni retenu : la carte reste en emphase tant qu'elle est survolée, et l'emphase disparaît quand la souris quitte la main

#### Scenario: Emphase maintenue à la souris
- **WHEN** le joueur tire une carte à la souris puis la relâche sous la ligne
- **THEN** elle retourne en emphase et y reste quand la souris quitte la main, jusqu'à ce qu'une autre carte passe en emphase ou qu'il clique ailleurs que sur un bouton

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
En éventail, le système SHALL prendre une carte en main quand le joueur la tire vers le haut, la faire suivre son doigt ou sa souris et afficher une ligne de jeu. La relâcher au-dessus de cette ligne SHALL la jouer ; la relâcher en dessous SHALL la remettre dans la main. La position de la ligne SHALL dépendre de la hauteur de l'écran et de la position de la carte au moment de la prise, puis SHALL rester fixe jusqu'au relâchement.

#### Scenario: Carte jouée
- **WHEN** c'est le tour du joueur, qu'il tire une carte jouable au-dessus de la ligne et la relâche
- **THEN** la carte est posée dans le pli

#### Scenario: Carte remise dans la main
- **WHEN** il relâche la carte sous la ligne
- **THEN** la carte retourne à sa place et rien n'est joué

#### Scenario: Signal avant de relâcher
- **WHEN** la carte tenue passe au-dessus de la ligne
- **THEN** son aspect change pour indiquer qu'elle sera jouée si on la relâche

#### Scenario: Ligne fixée à la prise
- **WHEN** le joueur prend une carte, au doigt ou à la souris, quel que soit le chemin suivi jusque-là
- **THEN** la ligne apparaît au moins 70 px au-dessus du bas de la carte et à au moins 70 px du haut de l'écran, sans bouger jusqu'au relâchement

#### Scenario: Petit coup
- **WHEN** le joueur prend une carte puis la relâche sans l'avoir montée jusqu'à la ligne
- **THEN** rien n'est joué

#### Scenario: Prise près du haut d'un écran bas
- **WHEN** la limite haute de la ligne ne laisse pas 70 px au-dessus du bas de la carte
- **THEN** la limite haute l'emporte : l'écart est réduit, voire nul, et la carte reste jouable

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

### Requirement: Atouts illustrés
Le système SHALL afficher un atout qui dispose d'une illustration en superposant trois calques : son illustration dans la fenêtre du cadre, un cadre identique pour tous les atouts, puis son numéro et son titre en texte, le titre en majuscules dans le cartouche du bas. Ces éléments SHALL s'afficher à toutes les tailles de carte, aux mêmes proportions.

#### Scenario: Atout illustré en main
- **WHEN** l'atout 16, intitulé « La tour » et illustré, est dans la main de l'humain
- **THEN** la carte montre l'illustration dans la fenêtre du cadre, 16 dans le cercle en haut à gauche et LA TOUR dans le cartouche du bas

#### Scenario: Même cadre pour tous les atouts
- **WHEN** les atouts 3 et 16, tous deux illustrés, sont affichés côte à côte
- **THEN** leurs cadres sont identiques et seuls l'illustration, le numéro et le titre diffèrent

#### Scenario: Toutes les tailles
- **WHEN** un atout illustré est affiché dans la main, posé sur la table, devant un siège ou dans le détail du dernier pli
- **THEN** il montre dans chaque cas le cadre, l'illustration, le numéro et le titre, aux mêmes proportions

### Requirement: Repli et neutralité de l'habillage des atouts
Un atout sans illustration SHALL garder l'affichage d'un atout non illustré, et une illustration qui ne charge pas SHALL laisser la carte lisible. Le nom accessible d'un atout illustré SHALL inclure son titre. L'habillage SHALL rester purement visuel : il ne change ni les coups autorisés ni l'ordre des cartes, et ne dépend d'aucun service externe à l'exécution.

#### Scenario: Atout pas encore illustré
- **WHEN** l'atout 5 n'a pas d'illustration et est affiché
- **THEN** il s'affiche comme un atout non illustré, avec son numéro dans le coin supérieur gauche

#### Scenario: Illustration introuvable
- **WHEN** l'image d'un atout illustré ne peut pas être chargée
- **THEN** la carte reste lisible par son numéro et aucune erreur n'interrompt la partie

#### Scenario: Nom accessible
- **WHEN** un lecteur d'écran ou une info-bulle décrit l'atout 16 intitulé « La tour »
- **THEN** la description contient le numéro 16 et le titre La tour

#### Scenario: Habillage sans effet sur le jeu
- **WHEN** un atout est illustré ou ne l'est pas
- **THEN** il est jouable dans exactement les mêmes situations et à la même place dans la main

### Requirement: QR code d'invitation en grand
Le système SHALL afficher le QR code dans un calque qui couvre toute la fenêtre, par-dessus un fond assombri qui laisse voir l'écran de derrière. Le QR code SHALL encoder le lien d'invitation de la salle, être noir sur fond blanc avec sa marge blanche, et occuper la plus grande taille que permet la fenêtre, sans légende. Il SHALL être produit dans le navigateur, sans appel à un service externe.

#### Scenario: Scan du QR code
- **WHEN** un joueur scanne le QR code affiché avec l'appareil photo de son téléphone et ouvre le lien proposé
- **THEN** il arrive dans la salle correspondante, sur l'écran où il donne son nom, sans saisir de code

#### Scenario: Taille en portrait et en paysage
- **WHEN** le calque est ouvert sur un écran de 360 x 640 px, puis de 640 x 360 px
- **THEN** le QR code est carré, entièrement visible, et occupe presque toute la plus petite dimension de la fenêtre

#### Scenario: Thème de la table
- **WHEN** le calque est ouvert
- **THEN** les modules du QR code sont noirs sur fond blanc, quel que soit le fond de l'écran de derrière

#### Scenario: Aucun service externe
- **WHEN** le calque est ouvert
- **THEN** aucune requête réseau n'est émise pour produire le QR code

### Requirement: Fermeture du calque
Le système SHALL fermer le calque au premier toucher ou clic commencé sur le calque, n'importe où sur le calque, sur son contenu comme sur le fond assombri, et à la touche Échap. Un appui commencé avant l'ouverture du calque, comme le doigt d'un appui long encore posé, SHALL ne pas le fermer en se relâchant. Ce toucher SHALL seulement fermer le calque : il ne SHALL déclencher aucune action de l'écran de derrière. Le joueur SHALL alors retrouver l'écran tel qu'il l'a laissé.

#### Scenario: Toucher le QR code
- **WHEN** le joueur touche le QR code
- **THEN** le calque se ferme

#### Scenario: Toucher le fond
- **WHEN** le joueur touche le fond assombri, à côté du QR code
- **THEN** le calque se ferme

#### Scenario: Pas de clic traversant
- **WHEN** le joueur touche le calque à l'endroit où se trouve, derrière, le bouton de démarrage de la partie
- **THEN** le calque se ferme et la partie ne démarre pas

#### Scenario: Touche Échap
- **WHEN** le calque est ouvert et que le joueur appuie sur Échap
- **THEN** le calque se ferme et le focus revient au bouton qui l'a ouvert

#### Scenario: Doigt de l'appui long relâché
- **WHEN** un atout vient de s'afficher en grand après un appui long et que le joueur lève le doigt
- **THEN** le calque reste ouvert, et le toucher suivant le ferme

#### Scenario: Toucher la carte agrandie
- **WHEN** un atout est agrandi et que le joueur touche la carte
- **THEN** le calque se ferme

### Requirement: Écran de derrière inactif
Tant que le calque est ouvert, le système SHALL rendre l'écran de derrière inaccessible : ni clic, ni toucher, ni navigation au clavier ne SHALL l'atteindre, et la page ne SHALL pas défiler. L'écran de derrière SHALL continuer de se mettre à jour (arrivée de joueurs, coups joués) pendant que le calque est ouvert.

#### Scenario: Navigation au clavier
- **WHEN** le calque est ouvert et que le joueur appuie sur Tab
- **THEN** le focus n'atteint aucun bouton de l'écran de derrière

#### Scenario: Défilement
- **WHEN** le calque est ouvert sur le lobby et que le joueur glisse le doigt verticalement
- **THEN** la page de derrière ne défile pas

#### Scenario: Arrivée d'un joueur pendant l'affichage
- **WHEN** un invité rejoint la salle pendant que l'hôte affiche le QR code
- **THEN** son nom figure dans la liste du lobby quand l'hôte ferme le calque

### Requirement: Bouton QR code en jeu
En partie en réseau, le système SHALL proposer dans la barre du haut, à l'hôte comme aux invités, un bouton icône en forme de QR code, avec un nom accessible explicite, qui ouvre le calque du QR code d'invitation. Ce bouton SHALL être absent d'une partie locale contre des bots.

#### Scenario: Retardataire
- **WHEN** un joueur touche le bouton QR code pendant une partie en réseau
- **THEN** le QR code du lien d'invitation s'affiche en grand, et un arrivant qui le scanne voit l'écran des places

#### Scenario: Partie locale
- **WHEN** une partie locale contre des bots est affichée
- **THEN** la barre du haut ne contient pas de bouton QR code

#### Scenario: Barre du haut chez l'hôte
- **WHEN** l'hôte d'une partie à 6 joueurs l'affiche en éventail sur un écran de 360 x 640 px, puis de 640 x 360 px
- **THEN** tous les boutons de la barre du haut, dont le bouton QR code, sont visibles sans défiler

#### Scenario: Calque au-dessus de la main en éventail
- **WHEN** le calque est ouvert pendant une partie affichée en éventail
- **THEN** le QR code passe devant la main et les panneaux ouverts, et ceux-ci restent dans leur état à la fermeture

### Requirement: Atout illustré agrandi
Le système SHALL permettre d'afficher un atout illustré en grand dans le calque plein écran, par-dessus un fond assombri qui laisse voir l'écran de derrière. La carte SHALL y apparaître entière, avec son illustration, son cadre, son numéro et son titre, aux mêmes proportions qu'à petite taille, à la plus grande taille que permet la fenêtre.

#### Scenario: Carte entière en portrait et en paysage
- **WHEN** l'atout 12 est agrandi sur un écran de 360 x 640 px, puis de 640 x 360 px
- **THEN** la carte est entièrement visible, occupe presque toute la hauteur ou la largeur disponible, et montre son illustration, son cadre, 12 et son titre

#### Scenario: Partie qui continue
- **WHEN** l'atout agrandi est une carte du pli en cours et que ce pli est ramassé pendant que le calque est ouvert
- **THEN** le calque continue d'afficher cet atout jusqu'à sa fermeture

#### Scenario: Aucun service externe
- **WHEN** un atout est agrandi
- **THEN** aucune requête vers un service externe n'est émise

### Requirement: Agrandissement au clic droit
À la souris, le système SHALL agrandir un atout illustré quand le joueur fait un clic droit dessus, où qu'il soit affiché : devant un siège dans le pli en cours, dans le détail du dernier pli, dans un emplacement d'échange, dans la main étalée, et en éventail sur la carte en emphase.

#### Scenario: Pli en cours
- **WHEN** l'atout 7 est posé devant le siège d'un bot et que le joueur fait un clic droit dessus
- **THEN** l'atout 7 s'affiche en grand dans le calque

#### Scenario: Détail du dernier pli
- **WHEN** le détail du dernier pli est ouvert et que le joueur fait un clic droit sur l'atout qu'il contient
- **THEN** cet atout s'affiche en grand, et le détail du dernier pli est toujours ouvert à la fermeture du calque

#### Scenario: Carte en emphase
- **WHEN** en éventail, la souris survole un atout illustré, qui est en emphase, et que le joueur fait un clic droit
- **THEN** cet atout s'affiche en grand

#### Scenario: Main étalée, carte grisée
- **WHEN** en étalé, le joueur fait un clic droit sur un atout illustré grisé
- **THEN** cet atout s'affiche en grand

### Requirement: Agrandissement par appui long
Au toucher, le système SHALL agrandir un atout illustré quand le joueur garde le doigt immobile dessus pendant 700 ms : dans le pli en cours, le détail du dernier pli, un emplacement d'échange, la main étalée, jouable ou grisé, et la carte en emphase de l'éventail. Un doigt qui se déplace de plus de quelques pixels, ou qui se lève avant le délai, SHALL ne rien agrandir. Aucun signe visuel ne SHALL annoncer l'agrandissement.

#### Scenario: Appui long sur une carte posée
- **WHEN** le joueur garde le doigt immobile pendant 700 ms sur un atout illustré posé devant un siège
- **THEN** cet atout s'affiche en grand

#### Scenario: Appui trop court
- **WHEN** le joueur lève le doigt après 400 ms
- **THEN** rien n'est agrandi

#### Scenario: Doigt qui glisse
- **WHEN** le joueur pose le doigt sur un atout illustré puis le déplace de 30 px avant 700 ms
- **THEN** rien n'est agrandi

#### Scenario: Main étalée, carte jouable
- **WHEN** en étalé, c'est le tour du joueur et il garde le doigt 700 ms sur un atout illustré jouable
- **THEN** cet atout s'affiche en grand

#### Scenario: Main étalée, carte grisée
- **WHEN** en étalé, il garde le doigt 700 ms sur un atout illustré grisé
- **THEN** cet atout s'affiche en grand

### Requirement: Agrandissement en éventail limité à l'emphase
En éventail, le système SHALL agrandir par appui long seulement la carte déjà en emphase quand le doigt se pose sur elle. Un appui long commencé sur une carte au repos, ou sur une carte atteinte en balayant, SHALL ne rien agrandir. Tirer la carte vers le haut avant le délai SHALL la prendre normalement, sans l'agrandir.

#### Scenario: Appui long sur la carte en emphase
- **WHEN** un atout illustré est en emphase après un toucher, et que le joueur pose de nouveau le doigt dessus et le garde immobile 700 ms
- **THEN** cet atout s'affiche en grand, et il est toujours en emphase à la fermeture du calque

#### Scenario: Appui long sur une carte au repos
- **WHEN** aucune carte n'est en emphase et que le joueur garde le doigt immobile 700 ms sur un atout illustré de l'éventail
- **THEN** cette carte passe en emphase et rien n'est agrandi

#### Scenario: Carte atteinte en balayant
- **WHEN** le joueur balaie la main jusqu'à un atout illustré puis s'arrête dessus 700 ms sans lever le doigt
- **THEN** rien n'est agrandi

#### Scenario: Prise avant le délai
- **WHEN** le joueur pose le doigt sur l'atout en emphase et le tire vers le haut avant 700 ms
- **THEN** la carte est prise comme d'habitude et rien n'est agrandi

### Requirement: Agrandissement sans effet sur le jeu
Agrandir un atout SHALL ne jouer, ne sélectionner, ne placer et ne retirer aucune carte. Le relâchement du doigt après un appui long SHALL ne déclencher aucune action de l'écran de derrière. À la fermeture du calque, le joueur SHALL retrouver l'écran tel qu'il l'a laissé, emphase et sélection comprises.

#### Scenario: Carte sélectionnée en étalé
- **WHEN** en étalé, un atout illustré jouable est sélectionné et que le joueur garde le doigt dessus 700 ms puis le lève
- **THEN** l'atout s'affiche en grand, n'est pas joué, et il est toujours sélectionné à la fermeture du calque

#### Scenario: Clic droit sur la carte sélectionnée
- **WHEN** en étalé, le joueur fait un clic droit sur l'atout sélectionné
- **THEN** l'atout s'affiche en grand et n'est pas joué

#### Scenario: Emplacement d'échange
- **WHEN** pendant l'échange, le joueur garde le doigt 700 ms sur un atout placé dans un emplacement
- **THEN** l'atout s'affiche en grand et reste dans son emplacement

### Requirement: Cartes non illustrées
Le système SHALL n'agrandir que les atouts illustrés. Un clic droit ou un appui long sur l'excuse, une carte de couleur, un atout sans illustration ou un dos de carte SHALL ne rien afficher.

#### Scenario: Carte de couleur
- **WHEN** le joueur fait un clic droit sur le roi de cœur posé devant un siège
- **THEN** rien n'est agrandi

#### Scenario: Excuse
- **WHEN** le joueur garde le doigt 700 ms sur l'excuse dans le détail du dernier pli
- **THEN** rien n'est agrandi

### Requirement: Pas de menu contextuel
Le système SHALL empêcher l'ouverture du menu contextuel du navigateur, au clic droit comme à l'appui long, partout dans l'application : accueil, lobbies, écran de jeu, calques, champs de saisie compris. Coller du texte par ce menu n'est pas pris en charge.

#### Scenario: Clic droit sur la table
- **WHEN** pendant une partie, le joueur fait un clic droit sur une carte de couleur ou sur le fond de la table
- **THEN** aucun menu du navigateur ne s'ouvre et rien n'est agrandi

#### Scenario: Clic droit sur le calque
- **WHEN** un atout est agrandi et que le joueur fait un clic droit sur le calque
- **THEN** aucun menu du navigateur ne s'ouvre

#### Scenario: Lobby et QR code
- **WHEN** le joueur fait un clic droit dans le lobby de l'hôte, ou sur le QR code affiché en grand
- **THEN** aucun menu du navigateur ne s'ouvre

#### Scenario: Champ de saisie
- **WHEN** le joueur fait un clic droit ou un appui long dans le champ du code de la salle, à l'accueil
- **THEN** aucun menu du navigateur ne s'ouvre
