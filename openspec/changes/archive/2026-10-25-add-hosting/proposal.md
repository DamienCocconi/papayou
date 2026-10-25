# Proposal

## Why

Aujourd'hui, jouer suppose de lancer `npm run dev` sur une machine du réseau local : l'hôte doit avoir Node installé, et les invités n'ont qu'une adresse `http://<ip locale>:5173`, peu partageable. Le site est entièrement statique (aucun backend, voir `docs/contexte.md`) : il suffit de le publier pour que n'importe qui crée ou rejoigne une partie depuis un navigateur, sans commande.

La publication en HTTPS débloque aussi des fonctions qui exigent un contexte sécurisé : le bouton « copier le lien » (idée 2 de `docs/idees.md`), le Wake Lock et la PWA (étape « Finitions »).

## What Changes

- Publication du site sur GitHub Pages, à l'adresse `https://damiencocconi.github.io/papayou/`.
- Déploiement automatique à chaque fusion sur `main` : tests, build, publication.
- Configuration du build pour que le site fonctionne sous le sous-chemin `/papayou/` (chemins des assets relatifs).
- Documentation : adresse du site, procédure de déploiement, réglage unique à faire dans les paramètres du dépôt GitHub, et conseil pratique sur le réseau (l'hôte de préférence en 4G/5G ou sur un réseau qui laisse passer le WebRTC).
- `docs/contexte.md` : l'hébergement est décidé, et le test du WebRTC sur réseau d'entreprise est noté comme prochaine étape ; un éventuel TURN en TLS/443 fera un changement séparé, seulement si ce test échoue.

Hors périmètre : domaine personnalisé, serveur de signalisation ou TURN auto-hébergé, PWA, bouton « copier le lien ».

## Capabilities

### New Capabilities
- `site-hosting`: le site est accessible publiquement en HTTPS à une adresse stable, se met à jour à chaque livraison sur `main`, et permet de créer ou rejoindre une partie sans aucune installation.

### Modified Capabilities
<!-- Aucune : le comportement de la salle ne change pas. Le lien d'invitation est déjà construit depuis l'adresse courante. -->

## Impact

- `vite.config.ts` : option `base`.
- Nouveau `.github/workflows/deploy.yml`.
- `README.md` et `docs/contexte.md`.
- Réglage manuel, hors dépôt : Settings > Pages > Source = « GitHub Actions ».
- Aucun changement dans `src/` ni dans les dépendances.
