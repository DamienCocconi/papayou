## MODIFIED Requirements

### Requirement: Affichage des cartes
Le système SHALL afficher chaque carte lisible sans image : la couleur par son symbole (cœur, carreau, trèfle, pique) et sa teinte, le rang par un chiffre ou par V, C, D, R pour valet, cavalier, dame, roi, les atouts par leur numéro, l'excuse par un libellé propre. Le rang et, pour une carte de couleur, le symbole SHALL figurer ensemble dans le coin supérieur gauche. Le numéro d'un atout illustré SHALL figurer en chiffres arabes, en texte, dans le cercle du coin supérieur gauche de son cadre.

#### Scenario: Figure
- **WHEN** la dame de pique est affichée
- **THEN** la carte montre D et le symbole pique

#### Scenario: Atout
- **WHEN** l'atout 14 est affiché
- **THEN** la carte montre le nombre 14 et se distingue visuellement d'une carte de couleur

#### Scenario: Atout illustré
- **WHEN** l'atout 16 a une illustration et est affiché
- **THEN** le nombre 16 se lit dans le cercle du coin supérieur gauche, par-dessus le cadre

#### Scenario: Carte compréhensible sans la couleur seule
- **WHEN** une carte de cœur ou de carreau est affichée
- **THEN** elle se reconnaît par son symbole et non par sa seule teinte

#### Scenario: Carte recouverte par sa voisine
- **WHEN** seul le bord gauche du 10 de trèfle est visible dans la main
- **THEN** on y lit 10 et le symbole trèfle

## ADDED Requirements

### Requirement: Atouts illustrés
Le système SHALL afficher un atout qui dispose d'une illustration en superposant trois calques : son illustration dans la fenêtre du cadre, un cadre identique pour tous les atouts, puis son numéro et son titre en texte, le titre en majuscules dans le cartouche du bas. Ces éléments SHALL s'afficher à toutes les tailles de carte, aux mêmes proportions.

#### Scenario: Atout illustré en main
- **WHEN** l'atout 16, intitulé « La tour » et illustré, est dans la main de l'humain
- **THEN** la carte montre l'illustration dans la fenêtre du cadre, 16 dans le cercle en haut à gauche et LA TOUR dans le cartouche du bas

#### Scenario: Même cadre pour tous les atouts
- **WHEN** les atouts 3 et 16, tous deux illustrés, sont affichés côte à côte
- **THEN** leurs cadres sont identiques et seuls l'illustration, le numéro et le titre diffèrent

#### Scenario: Toutes les tailles
- **WHEN** un atout illustré est affiché dans la main, posé sur la table, devant un siège ou dans le détail du dernier pli
- **THEN** il montre dans chaque cas le cadre, l'illustration, le numéro et le titre, aux mêmes proportions

### Requirement: Repli et neutralité de l'habillage des atouts
Un atout sans illustration SHALL garder l'affichage d'un atout non illustré, et une illustration qui ne charge pas SHALL laisser la carte lisible. Le nom accessible d'un atout illustré SHALL inclure son titre. L'habillage SHALL rester purement visuel : il ne change ni les coups autorisés ni l'ordre des cartes, et ne dépend d'aucun service externe à l'exécution.

#### Scenario: Atout pas encore illustré
- **WHEN** l'atout 5 n'a pas d'illustration et est affiché
- **THEN** il s'affiche comme un atout non illustré, avec son numéro dans le coin supérieur gauche

#### Scenario: Illustration introuvable
- **WHEN** l'image d'un atout illustré ne peut pas être chargée
- **THEN** la carte reste lisible par son numéro et aucune erreur n'interrompt la partie

#### Scenario: Nom accessible
- **WHEN** un lecteur d'écran ou une info-bulle décrit l'atout 16 intitulé « La tour »
- **THEN** la description contient le numéro 16 et le titre La tour

#### Scenario: Habillage sans effet sur le jeu
- **WHEN** un atout est illustré ou ne l'est pas
- **THEN** il est jouable dans exactement les mêmes situations et à la même place dans la main
