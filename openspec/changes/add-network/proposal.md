# Proposal

## Why

Le jeu se joue aujourd'hui seul contre des bots, sur un seul écran. L'usage visé est une table de copains, chacun sur son téléphone. L'interface a été construite derrière une façade `GameController` précisément pour que le réseau s'y branche sans toucher aux composants : c'est le moment de le faire, avec le minimum utile pour jouer une partie complète à plusieurs.

## What Changes

- Un **hôte** crée une salle : un téléphone (ou un navigateur) fait tourner le moteur et les bots, et les autres s'y connectent en **pair à pair (WebRTC via PeerJS)**. Aucun serveur à écrire.
- **Code de salle et lien** : le code court (sans caractères ambigus) sert d'identifiant PeerJS, avec un préfixe propre à Papayou. Le lien d'invitation le porte dans la partie `#` de l'adresse, ce qui convient à un site statique.
- **Lobby** : l'hôte attend ses invités, choisit le nombre et le type de bots, puis démarre. Le total reste de 3 à 6 joueurs. Les places non prises par des humains deviennent des bots.
- **Messages hôte/invités** : l'invité envoie ses actions ; l'hôte les valide avec le moteur et renvoie à chacun sa **vue entière** (`PlayerView`), accompagnée d'un numéro de version croissant. Jamais l'état complet ni les mains des autres.
- **Contrôleur distant** : côté invité, un `GameController` qui implémente la même interface que le contrôleur local ; côté hôte, la partie utilise le moteur et les bots existants, plusieurs places humaines au lieu d'une seule.
- **Déconnexion en cours de partie** : la partie se met en pause, tous les joueurs voient qu'un joueur est parti, l'hôte aussi. Une personne qui ouvre le lien d'une partie en cours voit la **liste des places** (joueur connecté, bot, ou libre avec le nom du précédent occupant) et peut prendre une place libre ou remplacer un bot, sous un nom de son choix.
- **Menu d'administration de l'hôte** : « Renvoyer le joueur » pour un joueur présent, « Remplacer le joueur par un bot » pour un joueur absent. Le renvoi est léger : pas de bannissement, le joueur renvoyé peut reprendre une place.
- **Fin de manche à plusieurs humains** : chronomètre de 30 secondes et bouton « Manche suivante » ; si tous les humains connectés ont cliqué, on passe tout de suite à la manche suivante. Tous voient le chronomètre et le nombre de joueurs attendus (affichage simple dans cette version).
- **Serveur de signalisation configurable** : par défaut le serveur public gratuit de PeerJS, avec hôte, port et chemin réglables pour basculer plus tard sur un serveur auto-hébergé.

Hors périmètre : sauvegarde dans `localStorage` et reprise après la perte de l'hôte (la partie est perdue si l'hôte part), bannissement ou protection contre le mauvais comportement, serveur TURN/relais pour les réseaux qui bloquent le pair à pair, tableau des scores et adaptation mobile détaillée (changement `add-ui-scores-mobile`), Wake Lock, PWA, hébergement d'un serveur PeerJS.

## Capabilities

### New Capabilities
- `multiplayer-room`: salle de jeu en réseau : création et rejoindre par code ou lien, lobby, protocole de messages hôte/invités (actions, vues versionnées), sièges (humain, bot, libre), déconnexion avec pause, reprise de place, administration par l'hôte, vote de fin de manche avec chronomètre.

### Modified Capabilities
- `game-controller`: la façade doit pouvoir être fournie par le réseau, et son instantané porte désormais l'information de session nécessaire à l'interface (pause, joueurs absents, chronomètre de fin de manche) ; le comportement local contre des bots ne change pas.
- `table-ui`: nouveaux écrans et indications pour jouer en réseau : choix « partie locale » ou « partie en réseau » à l'accueil, lobby de l'hôte, écran des places pour rejoindre, bandeau de pause, chronomètre de fin de manche, menu d'administration.

## Impact

- Code : nouveau module `src/net/` (protocole, hôte, invité, code de salle, configuration du serveur) ; extension de `GameController` (`src/ui/controller/types.ts`) et de l'instantané ; nouveaux écrans et composants dans `src/ui/` ; `App.tsx` et `HomeScreen.tsx` adaptés.
- Dépendances : ajout de `peerjs`.
- Dépendance externe : le serveur de signalisation public de PeerJS, sans garantie de disponibilité ; une panne empêche seulement de créer ou rejoindre une salle, pas de continuer une partie connectée.
- Tests : Vitest sur le protocole et la logique de salle de l'hôte, avec un transport simulé en mémoire (pas de vrai WebRTC en test) ; la couche PeerJS réelle se vérifie à la main.
- Moteur, bots : inchangés, utilisés par leur API publique.
- Documentation : `docs/contexte.md` (feuille de route) à ajuster à l'archivage.
