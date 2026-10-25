# Design

## Context

Voir `proposal.md` pour la motivation. Les règles d'un pli vivent dans deux fonctions pures de `src/engine/rules.ts` :

- `legalCards(hand, trick)` : coups légaux. Aujourd'hui, sans la couleur demandée, elle impose l'atout (excuse comprise).
- `trickWinner(plays)` : gagnant. Aujourd'hui, tout atout posé l'emporte sur les cartes de couleur.

Tout le reste s'appuie sur elles : `legalPlays` et `legalPlaysFromView` (donc l'interface et les bots), la résolution des plis dans `game.ts`, le décompte dans `scoring.ts`. Le bot heuristique appelle `trickWinner` sur le pli partiel pour savoir quelles cartes « perdent ». L'état de partie et le protocole réseau ne changent pas.

## Goals / Non-Goals

**Goals:**
- Changer les règles uniquement dans `legalCards` et `trickWinner`, pour que moteur, bots et interface restent cohérents sans autre modification de règle.
- Conserver l'invariant des 390 points : seul le gagnant des plis change, pas la valeur des cartes.

**Non-Goals:**
- Hauteur du papayou et jeu réduit à 3 joueurs : changements séparés.
- Nouvelle stratégie des bots : on garde « éviter de gagner », seul le jeu légal change.
- Changement de format de sauvegarde ou de protocole.

## Decisions

**1. La famille de la carte d'entame détermine tout.** `trickWinner` ne regarde plus « y a-t-il un atout dans le pli », mais « quelle famille a été demandée ». Pli de couleur : plus haute carte de cette couleur. Pli d'atout : plus fort atout (excuse = 0). L'entame par l'excuse (dernier pli) reste traitée en premier, comme aujourd'hui.
*Alternative écartée :* ajouter un drapeau « coupe interdite » dans l'état. Inutile, la règle est entièrement déterminée par le pli.

**2. Défausse libre = on ne filtre plus que sur la couleur.** `legalCards` : pli de couleur, on fournit si possible, sinon toute la main. Pli d'atout : on joue atout (excuse comprise) si possible, sinon toute la main. L'excuse suit donc la règle de l'atout uniquement quand un atout est entamé.

**3. Excuse en entame inchangée.** Interdite sauf si c'est la seule carte (dernier pli). Le gagnant automatique du dernier pli reste codé dans `trickWinner` avant le reste.

**4. Le cas « excuse seul atout du pli » disparaît sans code dédié.** Il découle de la décision 1 : sur un pli d'atout, l'entameur a posé un atout non excuse, donc l'excuse perd toujours. Il suffit de supprimer son scénario et son test.

**5. Bots : pas de changement d'algorithme attendu.** `follow` utilise déjà `trickWinner` et les coups légaux du moteur. Seuls les tests et la spec changent. À vérifier à l'implémentation que `outstandingHigher` (famille de l'entame) reste pertinent pour estimer le risque d'une entame à l'atout, désormais le seul moyen de gagner avec un atout.

**6. Réécriture des règles de référence.** `docs/regles-papayou.md` est la source des specs. Section 5 (obligations, gagnant du pli, résumé de l'excuse), exemples 2 (la coupe), 3 et 4 (excuse) et section 8 sont réécrits dans ce change, après accord de l'utilisateur, qui valide par relecture du diff. Les exemples réécrits montrent : une défausse d'atout ou d'excuse qui donne ses points au gagnant, et un pli d'atout.

## Risks / Trade-offs

- [Les exemples de `docs/regles-papayou.md` et les tests existants supposent la coupe] → Passer en revue tous les tests de `engine/` et `bots/` qui construisent des plis avec atouts ; ceux qui décrivaient la coupe sont réécrits, pas supprimés en silence.
- [Équilibre du jeu : l'atout ne gagnant plus, les points d'atouts se défaussent sur d'autres] → Hors périmètre, l'utilisateur veut cette règle. À observer en jouant contre les bots ; les bots défaussent déjà « la carte la plus chère qui perd ».
- [Parties en cours sauvegardées avant le changement] → Elles reprennent avec les nouvelles règles, sans incohérence d'état, puisque seules les fonctions de règle changent.
- [Hôte et client avec des versions différentes] → Le client n'applique pas les règles (il affiche ce que le moteur de l'hôte autorise), donc pas de désynchronisation grave ; à confirmer dans le code de `net/` pendant l'implémentation.
