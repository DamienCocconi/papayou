# Design

## Context

Voir `proposal.md` pour le pourquoi. État actuel utile à l'approche :

- Le moteur est pur, sérialisable en JSON, et fournit `getPlayerView` (projection d'un joueur) et `getBotView`. Les actions sont validées par `applyAction`, qui renvoie un état neuf ou une erreur.
- `GameController` (dans `src/ui/controller/types.ts`) est la façade de l'UI : `getSnapshot`, `subscribe`, `dispatch`, `dispose`. Sa seule implémentation, `createLocalGame` (`local.ts`), garde l'humain sur la place 0 et planifie les coups des bots.
- `src/net/` est vide. Règles de dépendance du projet : `engine` n'importe rien, `bots` et `net` dépendent de `engine`, `ui` dépend de tout.
- Il n'y a pas de backend. Le seul tiers est le serveur de signalisation public de PeerJS, utilisé seulement pour établir les connexions.

## Goals / Non-Goals

**Goals:**
- Jouer une partie complète à 3-6 places, humains et bots mélangés, sans toucher au moteur ni aux bots.
- Garder le protocole petit et facile à tester sans WebRTC.
- Garder les composants de jeu indifférents au mode (local ou réseau).

**Non-Goals:**
- Sauvegarde et reprise après la perte de l'hôte.
- Authentification, bannissement, protection contre un joueur malveillant (jeu entre copains).
- Serveur TURN maison, serveur de signalisation hébergé.
- Refonte du contrôleur local pour mutualiser l'ordonnancement des bots (voir Décision 4).

## Decisions

### 1. Découpe : transport et protocole dans `net/`, sessions branchées sur le contrôleur

```
 ui/ (React)
   |  GameController (inchangé dans sa forme, instantané enrichi)
   v
 ui/controller/  local.ts  host.ts  guest.ts      <- adaptateurs GameController
                              |        |
                              v        v
 net/  session-host.ts   session-guest.ts          <- logique de salle (sans React)
       protocol.ts  transport.ts  peer-transport.ts  room-code.ts  config.ts
                              |
 engine/  bots/              <- utilisés par l'API publique
```

- `net/` contient tout ce qui ne dépend ni de React ni du DOM : messages, codes, transport, logique de salle de l'hôte (sièges, pause, vote, bots) et logique de l'invité (dernière vue, versions).
- `ui/controller/host.ts` et `guest.ts` sont de minces adaptateurs qui exposent ces sessions sous la forme `GameController`. Le sens de dépendance `ui -> net` est respecté ; `net` n'importe jamais `ui`. Les types de session (places, pause, vote) sont définis dans `net/` et repris par l'instantané du contrôleur.
- **Alternative écartée** : mettre l'hôte entier dans `ui/controller/`. Simple, mais la règle « les règles de salle vivent dans `net` » serait violée et les tests dépendraient du dossier UI.

### 2. Transport abstrait, PeerJS en une seule implémentation

`Transport` expose : ouvrir une salle (hôte, avec un code), se connecter à une salle (invité), envoyer un message JSON à une connexion, recevoir les messages, être prévenu de la fermeture d'une connexion. Deux implémentations : PeerJS (production) et un « hub » en mémoire (tests). Toute la logique de salle est testée avec le hub, sans WebRTC ni navigateur. Le comportement réel de PeerJS se vérifie à la main.

### 3. Code, lien et identifiant PeerJS

- Code de 5 caractères tirés d'un alphabet sans ambiguïtés (lettres majuscules sans I et O, chiffres de 2 à 9), identifiant PeerJS = `papayou-` + code. Le préfixe évite les collisions avec les autres applications sur le serveur public.
- Si PeerJS signale que l'identifiant est pris, l'hôte tire un autre code (quelques essais, puis erreur affichée).
- Lien : `<adresse du site>#/rejoindre/<CODE>`. La partie `#` n'est jamais envoyée au serveur d'hébergement, ce qui convient à un site statique. `App` lit ce fragment au chargement.
- Le code est saisi en majuscules, insensible à la casse.

### 4. L'hôte généralise la boucle locale sans toucher à `local.ts`

`local.ts` suppose un humain en place 0. L'hôte a N places humaines, des places de bot et des places libres, qui changent en cours de partie. Plutôt que de refactorer `local.ts` (risque de régression sur une fonctionnalité livrée), `session-host.ts` écrit sa propre boucle en réutilisant `botAction` et les vues du moteur.

- **Compromis** : une part de la planification des bots est dupliquée. Un nettoyage futur pourra faire passer le local par la session de l'hôte (une partie locale = une session sans invité). Hors périmètre ici.

### 5. Modèle des places et identité

Chaque place est dans l'un des états : humain connecté (nom, connexion), bot, libre (dernier nom connu). L'hôte occupe une place humaine sans connexion réseau.

- **La place est liée à la connexion, jamais au message** : l'hôte ignore toute place indiquée par l'invité et utilise celle de sa connexion (spec : place usurpée).
- Il n'y a pas de jeton stocké dans le navigateur : un joueur qui revient choisit sa place dans la liste (décision de l'exploration). Entre copains, n'importe qui avec le lien peut donc prendre une place libre ; c'est accepté.
- Avant le démarrage, il n'y a pas de places : le lobby est une liste de noms. Au démarrage, les humains reçoivent les places dans l'ordre d'arrivée, l'hôte en premier, puis les bots complètent. La place 0 entame la manche 0, donc l'hôte.
- Un nom doit être unique parmi les humains connectés (insensible à la casse). Un nom libre d'un joueur absent ne bloque pas : il sert seulement de pré-remplissage.

### 6. Protocole : peu de messages, vue entière versionnée

Tous les messages sont du JSON, validés à la réception par des gardes de type (pas de `any`). Un message mal formé est ignoré.

```
Invité -> Hôte                         Hôte -> Invité
  hello     { name }                     lobby    { players, botCount, ... }
  claim     { seat, name }               seats    { seats }            (partie en cours : écran des places)
  action    { action }                   state    { version, view, session }
  nextRound {}                           error    { code }             (à l'invité concerné)
                                         closed   { reason }           (renvoi, fin de salle)
  admin (hôte uniquement, local) :
    kick(seat), replaceWithBot(seat), start(botCount, botKind)
```

- `state.session` contient la liste des places (nom, état), la pause, et l'état du vote de fin de manche. Chaque invité reçoit ses propres informations : la vue n'a que sa main.
- **Vue entière à chaque changement** (décision de l'exploration) : une perte ou un retard n'a pas d'effet durable, la reprise de place est gratuite (on renvoie la vue). `version` croît d'un à chaque envoi ; l'invité garde la dernière version affichée et ignore toute vue plus ancienne ou égale.
- Les demandes d'administration viennent de l'hôte lui-même, pas du réseau : un message d'invité de ce type n'existe pas dans le protocole, donc il est ignoré comme mal formé.

### 7. Pause et reprise

La pause est un état dérivé : « au moins une place libre ». Tant qu'elle dure, `session-host` refuse les actions de jeu et ne planifie aucun bot. Quand une place est reprise, remplacée ou prise, la pause est réévaluée, la planification des bots est annulée puis relancée (un bot qui avait un coup planifié ne joue plus si sa place est devenue humaine), et la vue est rediffusée.

- Détection d'une déconnexion : l'événement de fermeture de la connexion PeerJS. Il peut arriver avec retard (téléphone verrouillé, réseau coupé) ; c'est précisément le cas couvert par « Renvoyer le joueur » quand la connexion reste ouverte mais que le joueur est absent.

### 8. Fin de manche : l'hôte tient le chronomètre

À la fin d'une manche qui n'est pas la dernière, si la partie compte au moins deux places humaines, l'hôte démarre 30 secondes et conserve l'ensemble des places ayant demandé la manche suivante.

- À chaque diffusion, la session contient le **temps restant en millisecondes au moment de l'envoi** ; chaque appareil décompte localement depuis la réception. Pas de trafic par seconde et pas de dépendance aux horloges des téléphones.
- Les attendus sont les humains connectés qui n'ont pas cliqué. Un départ ou une arrivée recalcule cet ensemble et diffuse. Quand il est vide, ou quand le chronomètre expire, l'hôte applique l'action `nextRound` du moteur.
- Avec une seule place humaine (hôte seul avec des bots), pas de chronomètre : le clic suffit, comme en local.

### 9. Configuration du serveur de signalisation

Un petit objet `{ host, port, path, secure }` optionnel, lu depuis une variable d'environnement Vite au build, passé à PeerJS ; absent, PeerJS utilise son serveur public. Rien d'autre ne change pour basculer sur un serveur auto-hébergé.

### 10. Interface

`ControllerSnapshot` gagne un champ `session` (absent ou à valeurs neutres en local). Les composants de jeu existants lisent la vue et les coups légaux comme avant ; les coups légaux sont recalculés côté invité avec `legalPlaysFromView` à partir de la vue reçue, ce qui évite de les faire transiter. Nouveaux écrans : accueil enrichi, lobby de l'hôte, écran des places, bandeau de pause, menu d'administration, fin de manche avec compte à rebours, écran « hôte parti ». L'affichage reste volontairement simple.

## Risks / Trade-offs

- [Le serveur public de PeerJS n'offre aucune garantie] → Une panne n'empêche que la création ou la jonction ; la configuration du serveur permet de basculer sans refonte.
- [Wifi qui isole les clients, réseaux d'entreprise : le pair à pair direct peut échouer] → Hors périmètre, déjà noté dans `docs/contexte.md` ; le message d'erreur de connexion doit être explicite.
- [Détection tardive d'une déconnexion] → « Renvoyer le joueur » contourne le cas ; pas de battement de cœur applicatif dans cette version.
- [L'hôte voit techniquement toutes les mains via les outils de développement] → Accepté (voir `docs/contexte.md`) ; les invités ne reçoivent que leur vue.
- [Hôte en arrière-plan sur mobile : minuteries ralenties, partie qui se fige] → Le Wake Lock est prévu dans les finitions ; en attendant, l'hôte doit laisser l'écran allumé.
- [Prise de place disputée] → Le JavaScript de l'hôte traite les messages un par un : le premier arrivé gagne, l'autre reçoit un refus et la liste à jour.
- [Duplication partielle de la boucle des bots] → Documentée en Décision 4.
- [Un bot dont la main est reprise en pleine réflexion] → Annulation et replanification à chaque changement de place (Décision 7).
- [Aucun test avec un vrai WebRTC] → Le hub en mémoire teste toute la logique ; une checklist manuelle (deux navigateurs) est prévue dans les tâches.

## Open Questions

- L'ordre des places au démarrage (hôte en 0, puis ordre d'arrivée) est une hypothèse ; il pourra devenir aléatoire plus tard sans changer les specs.
- Le moyen de copier le lien (API du presse-papiers, avec repli par sélection du texte) est un détail d'interface à régler à l'implémentation.
