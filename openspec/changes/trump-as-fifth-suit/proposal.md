# Proposal

## Why

Aujourd'hui, un joueur qui n'a plus la couleur demandée est obligé de jouer atout, et cet atout remporte le pli. Le jeu devient une course à la coupe. On veut un jeu où l'atout est une **cinquième couleur** qui rapporte des points : il ne gagne un pli que si un atout est entamé, et la défausse devient libre quand on n'a pas la couleur demandée.

C'est le premier de trois changements de règles (voir `docs/idees.md`, points 8 et 9, traités ensuite séparément : hauteur du papayou, puis jeu réduit à 3 joueurs).

## What Changes

- **Défausse libre sans la couleur demandée.** Si la carte d'entame est une carte de couleur et que le joueur n'en a plus, toutes ses cartes sont jouables (atouts et excuse compris). L'obligation de jouer atout disparaît.
- **L'atout ne coupe plus.** Sur un pli entamé à la couleur, le gagnant est toujours le joueur qui a posé la plus haute carte de la couleur demandée. Les atouts et l'excuse posés sur ce pli ne gagnent jamais, mais leurs points vont au gagnant.
- **Atout entamé : inchangé.** Il faut jouer atout si on en a (excuse comprise, obligatoire si c'est le seul atout), sinon n'importe quelle carte. Le plus gros atout gagne, l'excuse valant 0.
- **L'excuse reste interdite en entame**, sauf au dernier pli quand c'est la dernière carte du joueur : il l'entame alors et gagne automatiquement le pli. Ce cas particulier est conservé.
- **Disparition du cas « excuse seul atout du pli ».** Sur un pli d'atout, l'entameur a un atout (l'excuse ne peut pas entamer), donc l'excuse ne gagne plus que par l'entame forcée du dernier pli.
- **Réécriture de `docs/regles-papayou.md`** : section 5 (obligations, gagnant du pli) et exemples 2, 3 et 4 (accord de l'utilisateur pour cette réécriture, validation par relecture du diff).
- **Bots** : le bot heuristique doit continuer à éviter de gagner les plis, avec des cartes légales différentes. Le scénario « excuse évitée quand elle gagnerait » n'a plus d'objet.
- Le mot « atout » et l'identifiant `trump` sont conservés.

## Capabilities

### New Capabilities

Aucune.

### Modified Capabilities

- `game-engine` : les exigences « Obligations pour suivre » et « Gagnant d'un pli » changent.
- `bots` : l'exigence « Bot heuristique, jeu d'un pli » change (scénarios sur l'excuse).

## Impact

- `src/engine/rules.ts` (`legalCards`, `trickWinner`) et `src/engine/rules.test.ts`, avec un test dédié pour chaque cas limite de l'excuse.
- Tests dépendants des règles de pli : `game.test.ts`, `scoring.test.ts`, `view.test.ts`, `testing.ts` si des fixtures supposent la coupe.
- `src/bots/heuristic.ts` et ses tests : cartes légales, estimation du gain du pli.
- `src/ui` : aucune règle à modifier (le moteur dit ce qui est jouable), à vérifier qu'aucun libellé n'annonce une coupe obligatoire.
- `docs/regles-papayou.md` : section 5, exemples 2 à 4, section 8 (décisions validées).
- Aucun changement du format d'état ni du protocole réseau : la sauvegarde et la reprise restent compatibles. Une partie en cours sauvegardée avant le changement continuerait avec les nouvelles règles.
