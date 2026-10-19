# Spec Delta

## Purpose

Permet de jouer une partie à plusieurs humains, chacun sur son appareil : un hôte héberge la partie et les bots, les autres la rejoignent par un code ou un lien, et la partie survit à l'absence temporaire d'un joueur. L'hôte reste la seule autorité sur les règles.

## ADDED Requirements

### Requirement: Création d'une salle avec code et lien
Le système SHALL permettre à un hôte de créer une salle identifiée par un code court, lisible à voix haute (sans caractères pouvant se confondre, comme 0/O ou 1/I), et d'en tirer un lien d'invitation qui contient ce code. Si le code est déjà pris, un autre SHALL être tiré.

#### Scenario: Salle créée
- **WHEN** l'hôte crée une salle
- **THEN** il voit le code de la salle et un lien d'invitation qui le contient

#### Scenario: Code déjà utilisé
- **WHEN** le code tiré est déjà utilisé par une autre salle
- **THEN** l'hôte obtient un autre code sans intervention de sa part

### Requirement: Rejoindre par lien ou par code
Le système SHALL permettre à un invité de rejoindre une salle en ouvrant le lien ou en saisissant le code. Un code inconnu, ou une salle injoignable, SHALL être signalé à l'invité sans le laisser en attente indéfiniment.

#### Scenario: Lien valide
- **WHEN** un invité ouvre le lien d'une salle ouverte
- **THEN** il arrive dans la salle et choisit son nom

#### Scenario: Code inconnu
- **WHEN** un invité saisit un code qui ne correspond à aucune salle
- **THEN** un message lui indique que la salle est introuvable et il peut ressaisir un code

### Requirement: Nom du joueur
Le système SHALL exiger un nom de joueur non vide, de 20 caractères au plus après suppression des espaces en début et en fin, et SHALL refuser un nom déjà porté par un autre joueur humain connecté de la salle (sans tenir compte de la casse).

#### Scenario: Nom vide
- **WHEN** un invité valide un nom vide
- **THEN** le nom est refusé et il peut en saisir un autre

#### Scenario: Nom déjà pris
- **WHEN** un invité choisit un nom déjà porté par un joueur connecté
- **THEN** le nom est refusé et le motif lui est indiqué

### Requirement: Lobby avant le démarrage
Le système SHALL montrer à l'hôte et aux invités la liste des joueurs présents dans la salle avant le démarrage. L'hôte SHALL choisir le nombre de bots et leur type (aléatoire ou heuristique), et lui seul SHALL pouvoir démarrer la partie. Le total de joueurs (humains et bots) SHALL être compris entre 3 et 6, et chaque place non tenue par un humain devient un bot.

#### Scenario: Démarrage avec des bots
- **WHEN** trois humains sont dans la salle et que l'hôte demande 1 bot puis démarre
- **THEN** la partie démarre à 4 joueurs, trois humains et un bot

#### Scenario: Total trop faible
- **WHEN** l'hôte est seul dans la salle et demande 1 bot
- **THEN** le démarrage est refusé car le total n'atteint pas 3 joueurs

#### Scenario: Salle pleine
- **WHEN** six humains sont déjà dans la salle avant le démarrage et qu'un septième veut rejoindre
- **THEN** il est refusé avec l'indication que la salle est pleine

#### Scenario: Seul l'hôte démarre
- **WHEN** un invité tente de démarrer la partie
- **THEN** la demande est ignorée et la partie ne démarre pas

### Requirement: Chaque joueur ne reçoit que sa vue
Le système SHALL envoyer à chaque invité sa propre vue de la partie (sa main, le nombre de cartes des autres), jamais l'état complet, ni la main d'un autre joueur, ni l'état du générateur aléatoire. Une vue complète SHALL être renvoyée à chaque changement.

#### Scenario: Pas de main adverse sur le réseau
- **WHEN** un invité reçoit une mise à jour pendant une partie
- **THEN** elle ne contient que sa main et le nombre de cartes des autres joueurs

#### Scenario: Mise à jour à tous
- **WHEN** un joueur ou un bot pose une carte
- **THEN** chaque invité reçoit sa nouvelle vue contenant cette carte dans le pli

### Requirement: Vues versionnées
Le système SHALL numéroter les vues envoyées par un numéro qui croît à chaque changement, et l'invité SHALL ignorer une vue dont le numéro est inférieur ou égal à celui de la dernière vue affichée.

#### Scenario: Vue en retard
- **WHEN** un invité reçoit la vue 12 après avoir reçu la vue 13
- **THEN** la vue 12 est ignorée et l'affichage reste sur la vue 13

### Requirement: Actions des invités validées par l'hôte
Le système SHALL faire contrôler chaque action d'un invité par le moteur de l'hôte. La place jouée SHALL être celle de la connexion de l'invité, quelle que soit la place indiquée dans le message. Une action refusée SHALL laisser la partie inchangée et SHALL être signalée, avec sa cause, au seul invité concerné.

#### Scenario: Carte illégale
- **WHEN** un invité envoie une carte que le moteur juge illégale
- **THEN** la partie ne change pas et cet invité reçoit l'erreur

#### Scenario: Place usurpée
- **WHEN** un invité envoie une action portant la place d'un autre joueur
- **THEN** l'action est traitée comme venant de la place de cet invité

#### Scenario: Hors tour
- **WHEN** un invité joue alors que ce n'est pas son tour
- **THEN** la partie ne change pas et il reçoit l'erreur

### Requirement: Bots tenus par l'hôte
Le système SHALL faire jouer les bots sur l'appareil de l'hôte, aux mêmes conditions que dans une partie locale (aucun bot ne joue quand le moteur attend un humain, coups espacés d'un délai), et SHALL faire jouer l'hôte comme un joueur humain ordinaire sur sa propre place.

#### Scenario: Bot entre deux humains
- **WHEN** un humain pose sa carte et que le suivant est un bot
- **THEN** le bot joue sans intervention humaine et tous les invités reçoivent la vue mise à jour

### Requirement: Pause quand un joueur est absent
Le système SHALL mettre la partie en pause tant qu'au moins une place n'est tenue ni par un humain connecté ni par un bot. Quand un joueur humain se déconnecte, sa place devient libre en gardant son dernier nom. Pendant la pause, aucune action de jeu n'est acceptée et aucun bot ne joue ; tous les joueurs, hôte compris, SHALL voir qu'un joueur est parti et lequel.

#### Scenario: Déconnexion en plein pli
- **WHEN** un joueur se déconnecte pendant un pli
- **THEN** la partie est en pause, sa place est marquée libre et tous voient son nom

#### Scenario: Aucun coup pendant la pause
- **WHEN** une place est libre et qu'un joueur connecté tente de jouer
- **THEN** l'action est refusée et la partie ne change pas

#### Scenario: Reprise
- **WHEN** la dernière place libre est reprise par un joueur ou remplacée par un bot
- **THEN** la pause prend fin et la partie reprend où elle s'était arrêtée

### Requirement: Détection d'une connexion silencieuse
Le système SHALL considérer comme déconnecté un invité dont l'hôte n'a plus aucune nouvelle depuis 15 secondes (réseau coupé, écran verrouillé), même si sa connexion technique reste ouverte, et SHALL le traiter comme une déconnexion (place libre, pause). Réciproquement, un invité qui n'entend plus l'hôte depuis 15 secondes SHALL le signaler comme connexion perdue. Les invités se manifestent par un message de vie envoyé toutes les 5 secondes.

#### Scenario: Joueur muet
- **WHEN** un invité n'envoie plus rien pendant plus de 15 secondes alors que sa connexion reste ouverte
- **THEN** sa place est libérée avec son dernier nom, la partie est en pause et tous les joueurs le voient

#### Scenario: Salle occupée par un invité fantôme
- **WHEN** un invité muet occupait une place et qu'il est détecté absent
- **THEN** un arrivant peut prendre cette place alors qu'auparavant toutes les places semblaient tenues

#### Scenario: Hôte muet
- **WHEN** un invité ne reçoit plus aucun message de l'hôte pendant plus de 15 secondes
- **THEN** il voit que la connexion est perdue et peut revenir à l'accueil

### Requirement: Rejoindre une partie en cours par les places
Le système SHALL montrer à toute personne qui ouvre le lien d'une partie en cours la liste des places : le nom du joueur connecté, « bot » pour une place tenue par un bot, « libre » pour une place libre avec le nom de son précédent occupant. La personne SHALL pouvoir prendre une place libre ou une place de bot, sous le nom de son choix, mais pas la place d'un joueur connecté.

#### Scenario: Reprise de sa place
- **WHEN** un joueur déconnecté rouvre le lien et prend sa place libre
- **THEN** il retrouve sa main et l'état de la partie, et peut garder son ancien nom ou en donner un autre

#### Scenario: Remplacer un bot
- **WHEN** un nouvel arrivant prend la place d'un bot
- **THEN** il hérite de la main, des plis gagnés et du tour de ce bot, et le bot ne joue plus

#### Scenario: Place d'un joueur connecté
- **WHEN** un arrivant tente de prendre la place d'un joueur connecté
- **THEN** la demande est refusée

#### Scenario: Deux demandes pour la même place
- **WHEN** deux personnes demandent la même place libre quasi en même temps
- **THEN** la première reçue l'obtient et l'autre reçoit un refus et la liste des places mise à jour

### Requirement: Administration de la partie par l'hôte
Le système SHALL offrir à l'hôte, à sa demande, un menu d'administration listant les autres places. Pour un joueur présent, « Renvoyer le joueur » SHALL le déconnecter de sa place et la confier à un bot. Pour un joueur absent, « Remplacer le joueur par un bot » SHALL confier sa place à un bot. L'hôte SHALL ne pas pouvoir se renvoyer lui-même, et les invités n'ont pas ce menu.

#### Scenario: Renvoyer un joueur inactif
- **WHEN** l'hôte renvoie un joueur dont la connexion est restée ouverte
- **THEN** sa place est confiée à un bot et la partie continue

#### Scenario: Remplacer un absent
- **WHEN** l'hôte remplace par un bot un joueur déconnecté
- **THEN** la place est tenue par un bot et, s'il n'y a plus de place libre, la partie reprend

#### Scenario: Retour d'un joueur renvoyé
- **WHEN** un joueur renvoyé rouvre le lien
- **THEN** il voit la liste des places et peut reprendre la place de bot comme n'importe qui

#### Scenario: Menu réservé à l'hôte
- **WHEN** un invité envoie une demande de renvoi ou de remplacement
- **THEN** elle est ignorée

### Requirement: Fin de manche avec chronomètre
Le système SHALL, à la fin d'une manche qui n'est pas la dernière et quand plusieurs humains participent, lancer un compte à rebours de 30 secondes et attendre que les humains connectés demandent la manche suivante. La manche suivante démarre dès que tous les humains connectés l'ont demandée, ou à la fin du compte à rebours. Les bots et les places libres ne sont pas attendus.

#### Scenario: Tous ont cliqué
- **WHEN** tous les humains connectés demandent la manche suivante avant la fin des 30 secondes
- **THEN** la manche suivante démarre immédiatement

#### Scenario: Temps écoulé
- **WHEN** 30 secondes passent alors qu'un joueur n'a pas cliqué
- **THEN** la manche suivante démarre

#### Scenario: Information partagée
- **WHEN** une manche vient de se terminer
- **THEN** tous les joueurs voient le temps restant et le nombre de joueurs encore attendus

#### Scenario: Joueur parti pendant le compte à rebours
- **WHEN** un joueur se déconnecte pendant le compte à rebours
- **THEN** il n'est plus attendu et le compte à rebours continue

#### Scenario: Fin de partie
- **WHEN** la dernière manche se termine
- **THEN** aucun compte à rebours n'est lancé et le classement est affiché

### Requirement: Hôte absent
Le système SHALL prévenir les invités quand la connexion avec l'hôte est perdue, en indiquant que la partie est interrompue. Cette version ne sauvegarde pas la partie : sans l'hôte, elle est perdue.

#### Scenario: L'hôte ferme son onglet
- **WHEN** la connexion avec l'hôte est coupée
- **THEN** chaque invité voit que la partie est interrompue et peut revenir à l'accueil

### Requirement: Serveur de signalisation configurable
Le système SHALL utiliser par défaut le serveur public de PeerJS pour mettre en relation hôte et invités, et SHALL permettre de configurer l'adresse, le port, le chemin et le mode sécurisé d'un autre serveur sans modifier le reste du code.

#### Scenario: Configuration par défaut
- **WHEN** aucune configuration de serveur n'est fournie
- **THEN** le serveur public de PeerJS est utilisé

#### Scenario: Serveur personnalisé
- **WHEN** une configuration précise un autre serveur
- **THEN** la création et la jonction de salle passent par ce serveur
