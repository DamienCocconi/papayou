# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
Le système SHALL fermer le calque au premier toucher ou clic, n'importe où sur le calque, sur son contenu comme sur le fond assombri, et à la touche Échap. Ce toucher SHALL seulement fermer le calque : il ne SHALL déclencher aucune action de l'écran de derrière. Le joueur SHALL alors retrouver l'écran tel qu'il l'a laissé.

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
