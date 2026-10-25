# Tasks

Branche : `feat/trump-as-fifth-suit` (tirée de `origin/main`).

## 1. Moteur : règles du pli

- [x] 1.1 Modifier `legalCards` dans `src/engine/rules.ts` : sans la couleur demandée, toute la main est jouable ; atout demandé inchangé. Vérifier avec les tests de `rules.test.ts` : fournir la couleur, défausse libre (atout et excuse jouables), atout demandé, excuse seul atout en main, excuse interdite en entame, excuse forcée au dernier pli.
- [x] 1.2 Modifier `trickWinner` : le gagnant est déterminé par la famille de la carte d'entame ; l'entame par l'excuse au dernier pli reste prioritaire. Vérifier avec des tests dédiés : atout posé sur une couleur ne gagne pas (même 21), excuse défaussée sur une couleur ne gagne pas et donne ses 100 points au gagnant, pli d'atout (plus fort atout), excuse battue, excuse en entame au dernier pli, excuse sans entamer au dernier pli.
- [x] 1.3 Passer en revue `game.test.ts`, `scoring.test.ts`, `view.test.ts`, `testing.ts` et `testing.test.ts` pour corriger les cas qui supposaient la coupe. Vérifier que `npm test` passe pour `src/engine`, dont l'invariant des 390 points, le nombre de cartes par joueur et l'absence de carte perdue ou dupliquée sur des parties complètes avec seeds.

## 2. Bots

- [x] 2.1 Vérifier que `src/bots/heuristic.ts` n'a pas besoin d'évoluer (cf. design, décision 5) ; sinon l'adapter. Vérifier avec les tests de `heuristic.test.ts` : défausse de l'excuse sans la couleur, défausse du gros atout, obligé de gagner, excuse seule carte légale.
- [x] 2.2 Supprimer ou réécrire dans `heuristic.test.ts` le test « excuse évitée quand elle gagnerait ». Vérifier que `npm test` passe pour `src/bots`, y compris `driver.test.ts`, `random.test.ts` et les parties complètes bot contre bot.

## 3. Interface et réseau

- [x] 3.1 Rechercher dans `src/ui` et `src/net` tout libellé ou texte d'aide qui annonce une coupe obligatoire ou un atout gagnant, et le corriger. Vérifier avec `rg -i "coup|atout" src/ui src/net` et `npm test`.
- [x] 3.2 Vérifier en lançant le jeu (`npm run dev`) qu'une partie contre des bots se déroule jusqu'au bout et que les cartes grisées correspondent aux nouvelles règles (sans la couleur : tout est jouable).

## 4. Documentation

- [x] 4.1 Réécrire `docs/regles-papayou.md` : section 5 (cartes obligatoires, gagnant du pli, résumé de l'excuse), exemples 2, 3 et 4 (nouveaux exemples : défausse d'atout sur une couleur, excuse défaussée, pli d'atout) et section 8 (décisions validées). Vérifier en faisant relire le diff par l'utilisateur.
- [x] 4.2 Mettre à jour `docs/idees.md` si besoin (les points 8 et 9 restent pour les changements suivants) et la feuille de route de `docs/contexte.md` si elle mentionne la coupe. Vérifier par relecture.

## 5. Intégration

- [x] 5.1 Lancer `npm test`, `npx tsc --noEmit` et `npm run build`, et vérifier qu'ils passent sans erreur.
- [x] 5.2 Relecture par `qa-reviewer` du code et des tests par rapport à `docs/regles-papayou.md` et aux specs du change.

## Workflow follow-up

- Archiver le change (`/opsx:archive`) une fois la relecture de l'utilisateur faite : les specs `game-engine` et `bots` de référence sont alors mises à jour.
