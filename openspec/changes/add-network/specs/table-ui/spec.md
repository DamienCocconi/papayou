# Spec Delta

## ADDED Requirements

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
