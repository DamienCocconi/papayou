# Contexte du projet Papayou

Ce document résume ce qui a été décidé avant le premier lancement de Claude Code, pour qu'une nouvelle session reparte avec le même contexte. Les règles du jeu sont dans `regles-papayou.md`, les conventions techniques dans `CLAUDE.md`.

## Objectifs

Le projet a deux buts :
1. Réaliser un jeu de cartes web, le **Papayou** (variante maison jouée au tarot), jouable de 3 à 6 joueurs.
2. **Découvrir le workflow de développement assisté par IA** : spec-driven development avec OpenSpec, sous-agents Claude Code avec des rôles, documents de décision et de conception tenus à jour.

Le second but compte autant que le premier. Il vaut mieux un workflow propre et bien compris qu'un jeu fini à toute vitesse.

## Profil du développeur

- Développeur **back Java** en poste, sans expérience en développement de jeux vidéo.
- Va utiliser **React** dans sa prochaine mission : ce projet sert aussi d'entraînement. Expliquer brièvement les choix et les idiomes React/TypeScript quand ils diffèrent de ce qu'un développeur Java attendrait, sans en faire des cours.
- Connaît déjà JUnit (Vitest s'y apparente), Maven/Gradle (npm et Vite jouent ce rôle) et OpenSpec (utilisé au travail).
- Parle français : documentation et échanges en français, identifiants de code en anglais (voir le glossaire du `CLAUDE.md`).

## Usage visé

- Jeu entre amis ou en famille, **autour d'une même table, chacun sur son téléphone**.
- Doit aussi tourner sur PC, dans un navigateur récent (Chrome, Firefox, Edge, Opera, Safari). Internet Explorer n'est pas supporté.
- Mobile via le **navigateur** (site responsive, éventuellement PWA), **pas d'application APK**.

## Décisions d'architecture et leurs raisons

| Décision | Raison |
|---|---|
| Moteur de règles en **TypeScript pur**, sans dépendance | Tourne dans le navigateur, testable sans DOM, réutilisable côté hôte et par les bots. Évite de le coder deux fois (Java et TypeScript). |
| **Pas de backend** | Chaque joueur a son téléphone, donc les mains restent privées naturellement. Entre amis, la triche n'est pas un enjeu. Rien à héberger : site statique. |
| Multijoueur en **WebRTC avec PeerJS** | Un téléphone « hôte » fait tourner le moteur, les autres s'y connectent par code de salle ou QR code. PeerJS fournit la signalisation gratuitement. |
| **React + Vite + Vitest** | React pour l'apprentissage et la future mission. Vite est l'outil de build standard. Vitest est l'équivalent de JUnit et partage la config de Vite. |
| **Pas de moteur de jeu** (Phaser, Unity...) | Des cartes sur une table se font en HTML, CSS et React, glisser-déposer tactile compris. |
| **Java écarté** pour ce projet | Aurait imposé un backend et un moteur dupliqué. Reste possible si le but devenait l'entraînement Java, mais ce n'est pas le cas ici. |
| **OpenSpec** pour les specs | Déjà utilisé au travail : un seul outil à apprendre. |
| **Peu de sous-agents**, bien ciblés | Architecte, développeur moteur, développeur frontend, relecteur QA. Éviter un zoo d'agents au début. L'agent principal orchestre. |

## Points de vigilance connus

- **Hôte fragile** : si l'hôte ferme son onglet ou verrouille son téléphone, la partie est interrompue. Prévoir tôt la sauvegarde de l'état dans `localStorage` à chaque coup et la reconnexion avec le même code de salle.
- **Veille de l'écran** sur mobile : utiliser l'API Wake Lock pendant la partie.
- **Réseaux wifi avec isolation des clients** (invités, publics) : le WebRTC direct peut échouer. Solution de repli prévue plus tard : un petit relais Node, sans toucher au moteur.
- **L'hôte voit techniquement toutes les mains** via les outils de développement du navigateur. Accepté pour un usage entre amis. Les non-hôtes ne reçoivent que leur propre vue.
- **Cas limites de l'excuse** : principale source d'erreurs. Un test dédié par cas.

## Feuille de route

1. **Moteur de règles** : changement OpenSpec `add-game-engine` (en cours de lancement). Inclut l'initialisation du projet Vite.
2. **Bots** : joueurs automatiques légaux, pour tester seul et compléter une table.
3. **Réseau** : salle PeerJS, vue par joueur, sauvegarde et reprise.
4. **Interface React** : table, main, échange de cartes, choix du papayou, tableau des scores. D'abord sur PC, puis adaptation mobile.
5. **Finitions** : PWA, Wake Lock, ergonomie tactile.

Chaque étape fait l'objet d'un changement OpenSpec distinct.

## Façon de travailler souhaitée

- Spec d'abord, code ensuite. Valider la proposition avant d'implémenter.
- En cas de règle ambiguë ou contradictoire : **poser la question**, ne pas deviner.
- Ne pas modifier `regles-papayou.md` sans accord explicite.
- Faire relire par `qa-reviewer` avant de considérer une tâche du moteur comme terminée.
- Rapporter les résultats de tests tels quels, sans les arrondir.

## État au démarrage

- Présents : `CLAUDE.md`, `docs/regles-papayou.md`, `docs/contexte.md`, changement OpenSpec `add-game-engine` (proposal, design, tasks, spec), quatre sous-agents.
- Absents : le projet Vite, `openspec init`, tout code source.
- Les règles du jeu sont entièrement validées : il ne reste aucune question ouverte à leur sujet.
