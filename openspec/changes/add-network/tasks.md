# Tasks

## 1. Socle réseau : protocole, codes, transport

- [ ] 1.1 Ajouter la dépendance `peerjs` et vérifier que `npm install` puis `npm run build` passent.
- [ ] 1.2 Écrire `src/net/room-code.ts` (génération du code de 5 caractères sans ambiguïté, normalisation de la saisie, identifiant PeerJS avec préfixe, construction et lecture du lien `#/rejoindre/CODE`) ; vérifier par `room-code.test.ts` (alphabet, longueur, casse, lien aller-retour, code invalide refusé).
- [ ] 1.3 Écrire `src/net/protocol.ts` : types des messages (`hello`, `claim`, `action`, `nextRound`, `lobby`, `seats`, `state`, `error`, `closed`), types de session partagés (places, pause, vote) et gardes de type qui rejettent tout message mal formé ; vérifier par `protocol.test.ts` (messages valides acceptés, champs manquants ou de mauvais type refusés, message d'administration envoyé par un invité refusé).
- [ ] 1.4 Écrire `src/net/transport.ts` (interface hôte/invité) et `src/net/memory-transport.ts` (hub en mémoire pour les tests, avec simulation de fermeture de connexion) ; vérifier par `memory-transport.test.ts` (envoi, réception, fermeture signalée aux deux côtés).
- [ ] 1.5 Écrire `src/net/config.ts` (serveur de signalisation : par défaut celui de PeerJS, hôte/port/chemin/sécurisé depuis une variable d'environnement Vite) ; vérifier par test (absence de configuration = défaut, configuration complète transmise).

## 2. Session de l'hôte : lobby, places, bots

- [ ] 2.1 Écrire `src/net/session-host.ts`, partie lobby : ouverture de la salle, arrivée des invités avec contrôle du nom (vide, trop long, doublon), refus quand la salle est pleine, diffusion de la liste, choix du nombre et du type de bots, démarrage réservé à l'hôte avec total de 3 à 6 ; vérifier par `session-host.lobby.test.ts` avec le hub en mémoire (un test par scénario du requirement « Lobby avant le démarrage » et « Nom du joueur »).
- [ ] 2.2 Démarrer la partie : création du moteur avec graine, attribution des places (hôte en 0, puis ordre d'arrivée, puis bots), diffusion à chaque invité de sa seule vue avec numéro de version croissant ; vérifier par test que le JSON envoyé à un invité ne contient aucune carte d'un autre joueur et que les versions croissent.
- [ ] 2.3 Traiter les actions des invités : place imposée par la connexion, refus signalé au seul invité concerné, état inchangé en cas d'erreur ; l'hôte joue par le même chemin sur sa propre place ; vérifier par tests (carte illégale, hors tour, place usurpée, message mal formé ignoré).
- [ ] 2.4 Faire jouer les bots sur l'hôte avec `botAction`, délai injectable (nul en test), générateur des bots distinct de celui du moteur, aucun bot tant que le moteur attend un humain ; vérifier par un test de manche avec un bot entre deux humains.

## 3. Pause, reprise de place, administration

- [ ] 3.1 Gérer la déconnexion d'un invité : place libre avec dernier nom, pause diffusée à tous, actions refusées et bots arrêtés pendant la pause ; vérifier par tests (déconnexion en plein pli, action refusée pendant la pause, nom conservé).
- [ ] 3.2 Gérer la prise de place par un arrivant en partie en cours : liste des places envoyée, prise d'une place libre ou d'une place de bot avec nom au choix, refus pour un joueur connecté, première demande gagnante en cas de course, annulation et replanification des coups de bot après chaque changement de place, reprise de la partie quand plus aucune place n'est libre ; vérifier par `session-host.seats.test.ts` (un test par scénario du requirement « Rejoindre une partie en cours par les places », dont le remplacement d'un bot qui hérite de sa main).
- [ ] 3.3 Écrire l'administration de l'hôte : renvoyer un joueur présent (connexion fermée avec le message `closed`, place confiée à un bot), remplacer un absent par un bot, impossibilité de se renvoyer soi-même, aucune commande d'administration acceptée du réseau, retour possible d'un joueur renvoyé ; vérifier par tests (un par scénario du requirement « Administration de la partie par l'hôte »).
- [ ] 3.4 Gérer la perte de l'hôte côté invité (fermeture de la connexion → état « partie interrompue ») dans `src/net/session-guest.ts` en même temps que la réception : mémorisation de la dernière vue, rejet des vues de version inférieure ou égale ; vérifier par `session-guest.test.ts` (vue en retard ignorée, fermeture signalée).

## 4. Fin de manche en réseau

- [ ] 4.1 Ajouter à la session de l'hôte le vote de fin de manche : chronomètre de 30 s injectable, ensemble des demandes, attendus = humains connectés n'ayant pas cliqué, temps restant joint à chaque diffusion, application de `nextRound` quand tous ont cliqué ou à l'expiration, pas de chronomètre avec une seule place humaine ni après la dernière manche ; vérifier par `session-host.round-end.test.ts` (un test par scénario du requirement « Fin de manche avec chronomètre », dont le départ d'un joueur pendant le compte à rebours et la demande répétée).
- [ ] 4.2 Test de partie complète en mémoire : un hôte, deux invités simulés qui jouent le premier coup légal et un bot, de 3 à 6 places, jusqu'à `gameEnd`, avec une déconnexion puis une reprise de place en cours de partie ; vérifier l'absence de carte perdue ou dupliquée dans les vues et la reproductibilité avec la même graine. Lancer `npm test`.

## 5. Transport PeerJS réel

- [ ] 5.1 Écrire `src/net/peer-transport.ts` : création de l'hôte avec nouveau tirage du code si l'identifiant est pris, connexion de l'invité avec délai d'attente et message d'erreur explicite (salle introuvable, réseau bloqué), envoi et réception de JSON, fermeture signalée ; vérifier par `npm run build` et par la checklist manuelle de la tâche 7.2.

## 6. Contrôleurs et interface

- [ ] 6.1 Enrichir `ControllerSnapshot` (`src/ui/controller/types.ts`) d'un champ `session` (places, pause, vote de fin de manche, absent ou neutre en local) et adapter `local.ts` pour qu'il le remplisse avec des valeurs neutres ; vérifier que `local.test.ts` passe sans modification de ses scénarios.
- [ ] 6.2 Écrire les adaptateurs `src/ui/controller/host.ts` et `guest.ts` qui exposent les sessions sous la forme `GameController` (coups légaux calculés avec `legalPlaysFromView`, `dispatch`, abonnement, `dispose` qui ferme la connexion) ; vérifier par `host.test.ts` et `guest.test.ts` avec le hub en mémoire (action d'un invité, notification d'une vue reçue, arrêt sans notification ultérieure, instantané local sans pause).
- [ ] 6.3 Étendre l'accueil et `App.tsx` : choix « partie locale / créer une salle / rejoindre », lecture du lien `#/rejoindre/CODE` au chargement, saisie du code ; vérifier dans le navigateur que la partie locale se lance comme avant et que le lien ouvre l'écran de jonction.
- [ ] 6.4 Écrire le lobby (hôte : code, lien copiable, liste, bots, démarrage ; invité : liste et attente) et l'écran des places (états, ancien nom, champ de nom, prise de place) ; vérifier dans deux fenêtres de navigateur, dont le refus d'un nom pris.
- [ ] 6.5 Écrire le bandeau de pause, le menu d'administration de l'hôte, l'écran « partie interrompue » et la fin de manche en réseau (compte à rebours local, joueurs attendus, bouton désactivé après clic) ; vérifier dans le navigateur avec trois fenêtres (déconnexion, remplacement par un bot, renvoi, retour, vote).

## 7. Vérification d'ensemble

- [ ] 7.1 Lancer `npm test` et `npm run build` sans erreur ; vérifier qu'aucune règle du jeu n'a été écrite dans `src/net/` ou `src/ui/` et que `net` n'importe rien de `ui`.
- [ ] 7.2 Checklist manuelle avec deux navigateurs réels (ou un PC et un téléphone) via le serveur public de PeerJS : création de salle, jonction par lien et par code, partie complète à 3, déconnexion et reprise, renvoi, fin de manche avec compte à rebours, fermeture de l'onglet de l'hôte ; noter dans le compte rendu ce qui n'a pas pu être vérifié.
- [ ] 7.3 Mettre à jour `docs/contexte.md` (feuille de route : étape réseau livrée en partie, sauvegarde et reprise restantes) et la section Stack de `CLAUDE.md` seulement si l'état des lieux a changé.
- [ ] 7.4 Faire relire par l'agent `qa-reviewer` la logique de salle et ses tests par rapport aux specs `multiplayer-room`, `game-controller` et `table-ui`, puis traiter ses remarques.

## Workflow follow-up

- Archiver le changement une fois la relecture passée (`/opsx:archive`).
- Prévoir un changement ultérieur pour la sauvegarde dans `localStorage` et la reprise après la perte de l'hôte, et un autre pour l'adaptation mobile détaillée.
