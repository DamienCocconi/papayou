# Tasks

## 1. Build sous sous-chemin

- [x] 1.1 Ajouter `base: './'` dans `vite.config.ts`. Vérification : `npm run build` réussit et `dist/index.html` référence ses assets sans `/` initial.
- [x] 1.2 Vérifier le rendu sous un sous-chemin : servir le build sous `/papayou/` (par exemple `npm run preview -- --base /papayou/` ou un serveur statique sur un dossier `papayou/`) et ouvrir `/papayou/`. Vérification : l'accueil s'affiche avec son style, aucune requête en erreur dans la console.
- [x] 1.3 Vérifier le lien d'invitation sous ce sous-chemin : créer une salle et lire le lien affiché. Vérification : il commence par l'adresse servie, contient `/papayou/#/rejoindre/<code>`, et l'ouvrir dans un second onglet arrive dans la salle. Aucun changement de code attendu ; sinon corriger et ajouter un test dans `src/net/room-code.test.ts`.

## 2. Déploiement automatique

- [x] 2.1 Créer `.github/workflows/deploy.yml` : déclencheurs `push` sur `main` et `workflow_dispatch` ; job `build` (checkout, Node 22 avec cache npm, `npm ci`, `npm test`, `npm run build`, `actions/configure-pages`, `actions/upload-pages-artifact` sur `dist`) ; job `deploy` (`actions/deploy-pages`, environnement `github-pages`) ; permissions minimales et groupe de concurrence. Vérification : le fichier est du YAML valide (par exemple `npx --yes yaml valid < .github/workflows/deploy.yml`) et relu contre la documentation des actions Pages.
- [x] 2.2 Régler une seule fois, dans GitHub, Settings > Pages > Source = « GitHub Actions » (étape manuelle de l'utilisateur). Vérification : la page Pages du dépôt affiche cette source.

## 3. Documentation

- [x] 3.1 Mettre à jour `README.md` : retirer la mention obsolète « seul le moteur est écrit », ajouter une section « Jouer en ligne » avec l'adresse du site, la procédure de déploiement, le réglage Pages, et le conseil réseau (hôte en 4G/5G en cas d'échec de connexion). Vérification : relire le README ; les commandes et l'adresse citées correspondent au workflow.
- [x] 3.2 Mettre à jour `docs/contexte.md` : hébergement décidé (GitHub Pages, signalisation PeerJS publique conservée), test à faire sur le réseau d'entreprise, TURN en TLS/443 en changement séparé si le test échoue. Vérification : relire ; la feuille de route reste cohérente avec `docs/idees.md` (idée 2 débloquée par l'HTTPS).

## 4. Mise en ligne et contrôle

- [x] 4.1 Après fusion sur `main` et réglage de la tâche 2.2, vérifier que le workflow passe au vert et que `https://damiencocconi.github.io/papayou/` affiche l'accueil. Vérification : exécution du workflow en succès, page ouverte.
- [x] 4.2 Faire un aller-retour réel : un hôte crée une salle sur le site publié, un second appareil la rejoint par le lien. Vérification : les deux voient le lobby ; noter le résultat (réseau utilisé) pour la décision sur le TURN.

## Workflow follow-up

- Faire relire par `qa-reviewer`, puis archiver le change (`/opsx:archive`) une fois le site en ligne vérifié.
