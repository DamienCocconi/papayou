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
Le système SHALL afficher chaque carte lisible sans image : la couleur par son symbole (cœur, carreau, trèfle, pique) et sa teinte, le rang par un chiffre ou par V, C, D, R pour valet, cavalier, dame, roi, les atouts par leur numéro, l'excuse par un libellé propre. Le rang et, pour une carte de couleur, le symbole SHALL figurer ensemble dans le coin supérieur gauche.

#### Scenario: Figure
- **WHEN** la dame de pique est affichée
- **THEN** la carte montre D et le symbole pique

#### Scenario: Atout
- **WHEN** l'atout 14 est affiché
- **THEN** la carte montre le nombre 14 et se distingue visuellement d'une carte de couleur

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
Le système SHALL faire jouer une carte en deux clics : le premier la sélectionne, le second sur la même carte la joue. Cliquer sur une autre carte jouable déplace la sélection.

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
Le système SHALL, en phase d'échange, laisser l'humain sélectionner exactement trois cartes de sa main puis les donner, et SHALL afficher ensuite l'attente des autres joueurs en indiquant qui a déjà donné.

#### Scenario: Trois cartes exactement
- **WHEN** l'humain a sélectionné deux cartes
- **THEN** le bouton de validation du don est inactif

#### Scenario: Pas plus de trois
- **WHEN** trois cartes sont déjà sélectionnées et que l'humain en sélectionne une quatrième
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
Le système SHALL afficher à l'hôte le code, le lien d'invitation avec un moyen de le copier, la liste des joueurs présents, le choix du nombre et du type de bots, et un bouton de démarrage actif seulement quand le total est de 3 à 6 joueurs. Les invités SHALL voir la liste des joueurs et l'attente du démarrage.

#### Scenario: Arrivée d'un invité
- **WHEN** un invité rejoint la salle
- **THEN** son nom apparaît dans la liste de l'hôte et des autres invités

#### Scenario: Démarrage impossible
- **WHEN** le total d'humains et de bots est inférieur à 3
- **THEN** le bouton de démarrage est inactif et la raison est indiquée

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

### Requirement: Échange affiché en étalé
Le système SHALL afficher la main en étalé tant que le joueur doit encore choisir ses cartes à donner, quel que soit son choix d'affichage, sans modifier ce choix. Le bouton d'affichage SHALL ne pas être proposé pendant ce temps.

#### Scenario: Début de l'échange
- **WHEN** l'échange commence pour un joueur qui a choisi l'éventail
- **THEN** sa main s'affiche en étalé et le bouton d'affichage n'est pas proposé

#### Scenario: Après le don
- **WHEN** ce joueur a donné ses 3 cartes
- **THEN** sa main revient en éventail et le bouton d'affichage est de nouveau proposé
