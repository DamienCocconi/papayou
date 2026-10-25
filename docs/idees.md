# Idées d'amélioration

Idées recueillies en testant le jeu, pas encore arbitrées. Ce fichier n'est pas la feuille de route : celle-ci (étapes décidées) est dans `contexte.md`. Une idée sort d'ici quand elle devient un changement OpenSpec (`/opsx:propose`), et on la raye alors avec le nom du change.

Dernière mise à jour : 2026-10-20.

## Vue d'ensemble

| # | Idée | Nature | Regroupement |
|---|---|---|---|
| 1 | Accueil : séparer solo / héberger / rejoindre | UX | Salle et accueil |
| 2 | Bouton « lien et code » en partie, avec copie | UX | Salle et accueil |
| 3 | QR code dans ce même panneau | UX | Salle et accueil |
| 4 | Lien d'invitation sur téléphone : arrive à l'accueil | Bug à diagnostiquer | Salle et accueil |
| 5 | Scores en partie : manches passées, manche en cours, total | Fonction | `add-ui-scores-mobile` (déjà prévu) |
| 6 | Indicateur de la couleur demandée | UX | Lisibilité de la table |
| 7 | Lobby : nombre total de joueurs, bots en complément, récapitulatif | Fonction | Salle et accueil |
| 8 | À 3 joueurs : cartes de 1 à 10 seulement | Règle | Variantes de jeu |
| 9 | À 4 joueurs ou plus : le papayou est le 10 | Règle | Variantes de jeu |
| 10 | Visuel distinct du papayou | UX | Lisibilité de la table |
| 11 | Teintes trèfle et carreau, option par client | UX | Lisibilité de la table |
| 12 | Délai avant le pli suivant | UX | Rythme du pli |
| 13 | Animation du pli vers le gagnant | UX | Rythme du pli |
| 14 | Remplacer un bot pendant l'échange : cartes à désélectionner | Bug | Salle et accueil |

Les regroupements sont des pistes pour découper en changements OpenSpec, pas des décisions.

## Salle et accueil

### 1. Accueil plus net

La page d'accueil est ambiguë. Séparer nettement trois entrées : **mode solo**, **héberger une partie**, **rejoindre une partie**.

Piste : le solo pourrait devenir un cas particulier de l'hôte (un seul humain, tous les autres joueurs en bots). À examiner avec le point 7.

### 2. Lien et code consultables en cours de partie

Une fois la partie lancée, on ne sait plus quelle est l'adresse à partager ni le code. Les joueurs **et** l'administrateur doivent avoir un bouton qui affiche le lien et le code, avec un bouton « copier » qui place dans le presse-papier l'adresse complète avec le code.

Contrainte : l'API presse-papier exige un contexte sécurisé (HTTPS ou `localhost`). Sur une adresse `http://<ip locale>:5173`, la copie échouera. Lié à la question de l'hébergement.

### 3. QR code

Dans le panneau du point 2, afficher aussi un QR code pour qu'un téléphone rejoigne la salle en le scannant.

Question ouverte : générer un QR code à la main est lourd, une petite bibliothèque est probablement nécessaire. C'est une dépendance à valider.

### 4. Lien d'invitation ouvert sur téléphone

Ouvrir le lien contenant le code depuis un navigateur de PC rejoint bien la salle. Le même lien collé dans le navigateur d'un téléphone mène à l'accueil. Avec le lien complet, on doit rejoindre la salle directement.

À reproduire avant d'en faire une tâche. Le code lit bien `#/rejoindre/<code>` à l'initialisation (`src/ui/App.tsx`), donc la cause est à chercher ailleurs : fragment `#` perdu par une application de messagerie ou par le navigateur, lien tronqué, etc.

### 7. Lobby par nombre total de joueurs

Aujourd'hui on choisit le nombre de bots, puis on attend d'avoir 3 joueurs : c'est ambigu. À la place, l'hôte choisit le **nombre total de joueurs** (par exemple 5). Au lancement, la partie est complétée automatiquement par des bots. Un récapitulatif se met à jour au fil des arrivées :
- joueurs ayant rejoint et ayant une place ;
- joueurs ayant rejoint en trop par rapport aux places ;
- bots qui complèteront la partie s'il manque des joueurs.

Question ouverte : que devient un joueur en trop ? Refusé dès l'arrivée, mis en attente, ou l'hôte choisit qui reste ?

### 14. Remplacer un bot pendant l'échange

Quand un joueur rejoint et prend la place d'un bot pendant la phase d'échange de cartes, le bot a généralement déjà choisi les cartes à donner, et le joueur ne peut plus les désélectionner. Dans ce cas, la sélection doit être vidée pour que le joueur choisisse à la place du bot.

À rapprocher du point 7 : les deux touchent à la prise de place d'un bot.

## Règles et variantes de jeu

Ces deux points obligent à modifier `regles-papayou.md` (le contrat). Pas de modification sans accord explicite au moment du change.

### 8. Trois joueurs : jeu réduit

À 3 joueurs, les manches sont trop longues (26 cartes en main). On n'utilise plus que les cartes de **1 à 10** pour les couleurs (plus les atouts et l'excuse). Le papayou reste le 7.

Question ouverte : ce jeu compte 62 cartes (4 × 10 + 21 + l'excuse), que 3 ne divise pas. Par analogie avec 4 joueurs, on retirerait 2 « 1 » de couleur pour arriver à 60, soit 20 cartes par joueur. À confirmer, ainsi que le fait que 20 cartes sont assez court (à 4 joueurs : 19). L'invariant des 390 points n'est pas touché, puisque le 7 reste en jeu.

### 9. Quatre joueurs ou plus : papayou = 10

Quand les figures sont jouées (à partir de 4 joueurs), le papayou est le **10** de la couleur choisie, et non le 7. À 3 joueurs, il reste le 7.

Question ouverte : la section 4 des règles dit « Il peut choisir une couleur dont il possède le 7 ». Est-ce « seulement une couleur dont il a la carte » ou « n'importe laquelle » ? Il faut trancher, et la réponse vaudra pour le 10.

Impacts à prévoir quand ce sera un change : moteur, bots, libellés de l'interface, exemples de `regles-papayou.md`. Le plus simple serait une table « variante par nombre de joueurs » unique dans le moteur.

## Lisibilité de la table

### 6. Couleur demandée

Dans un pli, dès que la première carte est posée, afficher un indicateur de la couleur demandée.

### 10. Papayou reconnaissable

Une fois la couleur du papayou choisie, la carte papayou (le 7 ou le 10 selon le nombre de joueurs) doit avoir un visuel un peu différent, pour ne pas être confondue avec le 7 ou le 10 d'une autre couleur. Dépend des points 8 et 9 pour savoir quelle carte.

### 11. Couleurs plus lisibles, option par client

Donner au trèfle et au carreau une teinte différente de celle du cœur et du pique : le cœur et le pique restent rouge et noir, le trèfle tire vers le **vert**, le carreau vers le **jaune**. Les joueurs peuvent basculer entre couleurs standard et modifiées. Ce réglage ne s'applique **qu'à leur écran** : c'est un réglage par client, pas par partie.

Ce sera sans doute le premier réglage stocké en `localStorage`. À rapprocher du futur change de sauvegarde.

## Rythme du pli

### 12. Délai avant le pli suivant

Contre des bots, un petit délai sépare la pose de deux cartes, mais pas la dernière carte du pli et le début du pli suivant. Ajouter le **même délai**, pour que le joueur humain comprenne qui a remporté le pli.

### 13. Animation de ramassage

Une fois la dernière carte posée, un effet visuel montre que le pli et ses points vont à tel joueur : un mouvement du pli sur la table vers l'emplacement du joueur qui le remporte.

## Scores en cours de partie

### 5. Affichage des scores

Les joueurs et l'administrateur doivent pouvoir consulter pendant la partie :
- le score des manches passées ;
- le score de la manche en cours ;
- le total de la partie.

C'est le périmètre de `add-ui-scores-mobile` (voir `contexte.md`). À fusionner avec ce change plutôt qu'à traiter à part.
