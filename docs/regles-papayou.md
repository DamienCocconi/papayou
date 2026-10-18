# Papayou maison, règles de référence

Document de référence du jeu. Il sert de source pour les specs (OpenSpec) et les tests du moteur de règles.

## 1. Matériel

Jeu de tarot de 78 cartes :

- **4 couleurs** (cœur, carreau, trèfle, pique), chacune de 14 cartes. Ordre croissant : `1 < 2 < 3 < 4 < 5 < 6 < 7 < 8 < 9 < 10 < valet < cavalier < dame < roi`. Le 1 n'est pas un as, c'est la carte la plus basse.
- **21 atouts**, numérotés de 1 à 21. Plus le numéro est grand, plus l'atout est fort.
- **L'excuse**, qui compte comme un atout de force 0 (le plus faible de tous) pour déterminer le gagnant d'un pli.

## 2. Joueurs et distribution

De 3 à 6 joueurs. Toutes les cartes sont distribuées, équitablement et au hasard.

| Joueurs | Cartes retirées | Cartes en jeu | Cartes par joueur |
|---|---|---|---|
| 3 | aucune | 78 | 26 |
| 4 | 2 cartes « 1 » de couleur | 76 | 19 |
| 5 | 3 cartes « 1 » de couleur | 75 | 15 |
| 6 | aucune | 78 | 13 |

Les « 1 » retirés sont choisis au hasard **une seule fois, au début de la partie** (pas à chaque manche) et restent retirés pendant toute la partie. Leurs couleurs n'ont pas d'importance. On ne retire jamais que des « 1 » de couleur, donc le 7 de chaque couleur est toujours en jeu.

## 3. Points

Le but est de faire **le moins de points possible**. Seules ces cartes valent des points :

| Carte | Points |
|---|---|
| Excuse | 100 |
| Atout 21 | 30 |
| Atouts 1 à 20 | valeur faciale (1 à 20) |
| **Papayou** (le 7 de la couleur choisie pour la manche) | 50 |
| Toutes les autres cartes de couleur | 0 |

**Invariant :** chaque manche distribue exactement **390 points** (atouts 1 à 20 : 210, plus 30, plus 100, plus 50).

## 4. Déroulement d'une partie

Une partie comporte **autant de manches que de joueurs**.

Le **joueur entameur** de la manche tourne d'un joueur à chaque manche, pour que chacun choisisse la couleur du papayou une fois.

**Sens de rotation :** tout tourne dans le **sens horaire** : l'ordre de jeu au sein d'un pli, le joueur à qui on donne ses 3 cartes (le joueur qui joue juste après soi) et le passage du rôle d'entameur d'une manche à l'autre.

### Déroulement d'une manche

1. **Distribution** de la totalité du paquet.
2. **Échange de 3 cartes** : chaque joueur choisit 3 cartes de sa main (n'importe lesquelles, excuse et atouts compris) et les donne au joueur qui joue après lui dans l'ordre de jeu. L'échange est **simultané** : on ne voit pas ce qu'on reçoit tant qu'on n'a pas choisi ce qu'on donne.
3. **Choix du papayou** : le joueur entameur choisit la couleur du papayou. Il peut choisir une couleur dont il possède le 7.
4. **Premier pli** : le joueur entameur pose la première carte.
5. **Plis suivants** : le gagnant d'un pli entame le suivant.
6. On joue jusqu'à épuisement des mains. Il y a autant de plis que de cartes par joueur.
7. **Décompte** : chaque joueur additionne les points des cartes de ses plis. Les scores de la manche sont ajoutés au tableau.
8. Remélange et nouvelle distribution pour la manche suivante.

### Fin de partie

Après la dernière manche, le gagnant est le joueur avec le **moins de points**. Le classement est un classement de compétition : les égalités partagent la même place et la suivante est sautée (exemple : `1, 2, 2, 4, 5`).

## 5. Règles d'un pli

Un pli comporte **une carte par joueur**.

### Carte d'entame

- Toute carte peut entamer, **sauf l'excuse**.
- Un atout peut entamer.
- **Exception :** si l'excuse est la dernière carte du joueur qui entame le dernier pli, il est contraint de l'entamer. Il **remporte alors automatiquement ce dernier pli**, quelles que soient les cartes jouées par les autres.

### Cartes obligatoires pour les suivants

Soit C la couleur de la carte d'entame.

1. Si C est une couleur : on **doit fournir** de cette couleur si on en a. L'excuse ne peut pas être jouée à la place.
2. Si on n'a plus de cette couleur : on **doit jouer un atout** si on en a (l'excuse compte comme un atout et peut donc être jouée ici).
3. Si on n'a ni la couleur ni atout : on joue **n'importe quelle carte**.
4. Si C est atout : on **doit jouer un atout** si on en a (excuse comprise). Sinon, n'importe quelle carte.

**Il n'y a pas d'obligation de surcouper.** Un joueur peut jouer un petit atout même si un atout plus fort est déjà posé (stratégie « sécurité »), ou un gros atout (stratégie « charger le pli »).

**Excuse seul atout en main :** si un atout est demandé et que l'excuse est le seul atout du joueur, il est obligé de la jouer.

**Résumé pour l'excuse :** elle n'est jouable que quand un atout est jouable, c'est-à-dire si l'atout est demandé ou si on n'a plus la couleur demandée. Elle ne peut jamais entamer, sauf dans le cas du dernier pli ci-dessus.

### Gagnant du pli

1. Si au moins un atout a été joué (l'excuse en est un, de force 0) : le **plus gros atout** l'emporte.
2. Sinon : la **plus haute carte de la couleur demandée** l'emporte. Les cartes d'une autre couleur ne gagnent jamais.

Pour désigner le gagnant, l'excuse vaut 0. Pour le décompte, elle vaut **100 points**. Si elle est le seul atout du pli, son joueur remporte le pli et les 100 points avec.

**Dernier pli :** la victoire automatique ne s'applique que si l'excuse **entame** le pli (le joueur n'a pas eu le choix). Si l'excuse est jouée sans entamer, elle suit la règle normale : elle perd contre tout autre atout, et ne gagne que si c'est le seul atout du pli.

## 6. Exemples de plis

Papayou : 7 de cœur. 4 joueurs, A entame.

**Exemple 1 : la couleur gagne.**
A : roi de pique, B : 3 de pique, C : dame de pique, D : 10 de pique.
Aucun atout, le roi de pique est le plus haut de la couleur demandée. A gagne, le pli vaut 0 point.

**Exemple 2 : la coupe.**
A : 7 de cœur (papayou), B : 2 de cœur, C : atout 8 (plus de cœur), D : roi de cœur.
Un atout a été joué, C gagne. Le pli vaut 50 + 8 = 58 points pour C.

**Exemple 3 : l'excuse comme atout.**
A : 5 de trèfle, B : atout 14 (plus de trèfle), C : excuse (plus de trèfle, mais atouts disponibles), D : 9 de trèfle.
B gagne avec l'atout 14, l'excuse perd. Le pli vaut 14 + 100 = 114 points pour B : l'excuse a été « donnée » à B.

**Exemple 4 : l'excuse qui se retourne contre son joueur.**
A : 5 de trèfle, B : 2 de trèfle, C : excuse (plus de trèfle), D : 9 de trèfle.
C est le seul à avoir joué un atout, il gagne le pli et récupère 100 points.

**Exemple 5 : dernier pli avec excuse en entame.**
Dernier pli, A n'a plus que l'excuse. Il l'entame et remporte automatiquement le pli, y compris des atouts élevés posés par les autres.

## 7. Points d'attention pour l'implémentation

- Le moteur de règles doit être pur (sans dépendance au réseau ni à l'interface) et couvert par des tests.
- Invariant à tester : la somme des points de tous les joueurs à la fin d'une manche vaut toujours 390.
- Chaque joueur ne doit recevoir que sa propre main, jamais celles des autres.
- L'échange de cartes est simultané : le serveur attend les 3 cartes de chaque joueur avant de les redistribuer.
- Classement de compétition pour les égalités.

## 8. Décisions validées

1. **Tirage des « 1 » retirés** (4 et 5 joueurs) : une seule fois en début de partie.
2. **Excuse seul atout en main quand l'atout est demandé** : obligation de la jouer. Au dernier pli, elle ne gagne automatiquement que si elle entame ; sinon elle gagne uniquement si c'est le seul atout du pli.
3. **Sens de l'échange et de l'ordre de jeu** : toujours le sens horaire (ordre dans un pli, don des 3 cartes, premier joueur de chaque manche).

Il ne reste aucune question ouverte sur les règles.
