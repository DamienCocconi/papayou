## ADDED Requirements

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

## MODIFIED Requirements

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
