# Design

## Context

Voir `proposal.md` (Why). État observé :

- Le site est statique : `npm run build` produit `dist/` (`index.html` + `assets/`). Aucun backend.
- `vite.config.ts` n'a pas d'option `base` : les assets sont référencés avec un `/` initial (`/assets/...`), ce qui casse sous `/papayou/`.
- La navigation d'invitation passe par le fragment (`#/rejoindre/<code>`, `src/net/room-code.ts`). Il n'y a pas de routes côté serveur, donc aucune règle de réécriture à prévoir.
- `buildInviteLink(window.location.href, code)` (`HostRoomScreen.tsx`) bâtit le lien depuis l'adresse courante : il suivra l'adresse publique sans modification.
- `src/net/config.ts` lit `VITE_PEER_*` à la compilation. Sans variable, PeerJS utilise son serveur public (signalisation + STUN + TURN en 3478).
- Le dépôt est sur GitHub (`DamienCocconi/papayou`) et n'a pas de dossier `.github`.

## Goals / Non-Goals

**Goals:**
- Une URL stable en HTTPS, mise à jour sans geste manuel à chaque fusion sur `main`.
- Ne publier que du code dont le typage et les tests passent.

**Non-Goals:**
- Domaine personnalisé, PWA, service worker.
- Toute modification de la couche réseau (ICE, TURN, signalisation) : à décider après un test sur le réseau d'entreprise, dans un changement séparé.
- Aperçus par branche ou pull request.

## Decisions

**1. GitHub Pages plutôt que Netlify ou Cloudflare Pages.** Le dépôt y est déjà, aucun compte de plus, gratuit. L'adresse `damiencocconi.github.io/papayou/` convient à l'utilisateur. Alternative écartée : les autres hébergeurs, utiles surtout pour des aperçus par branche, hors périmètre.

**2. `base: './'` dans Vite plutôt que `'/papayou/'`.** Les chemins relatifs fonctionnent sous n'importe quel sous-chemin, et le serveur de développement reste servi à `http://localhost:5173/` (pas de changement d'habitude). Cela suppose que la page soit servie à `/papayou/` avec la barre finale ; GitHub Pages redirige `/papayou` vers `/papayou/`. Alternative : `'/papayou/'`, plus explicite mais lie le build au nom du dépôt et déplace l'adresse de développement. À revoir si une PWA exige un `start_url` et un scope absolus.

**3. Déploiement par GitHub Actions officielles** (`actions/upload-pages-artifact` puis `actions/deploy-pages`) plutôt qu'une branche `gh-pages`. Pas de branche générée à entretenir, pas de commit de build dans l'historique. Déclenchement sur `push` vers `main`, plus `workflow_dispatch` pour republier à la main.

**4. Le workflow rejoue `npm ci`, `npm test` puis `npm run build`** (ce dernier inclut `tsc -b`). Les tests sont une barrière : un échec arrête avant l'étape de publication. Node 22 (LTS), supérieur au minimum de Vite et d'OpenSpec. Le workflow est découpé en deux jobs (`build`, `deploy`) avec les permissions minimales (`pages: write`, `id-token: write` sur le seul job de déploiement, `contents: read` pour le build) et un groupe de concurrence pour qu'un déploiement plus récent remplace un plus ancien.

**5. Aucune configuration réseau modifiée.** Le serveur PeerJS public reste par défaut. Le risque est documenté (README) et le test sur le réseau d'entreprise est la prochaine étape, avec ce site comme support.

## Risks / Trade-offs

- [Page blanche si `base` est mal réglé] → vérifier le build en local avec `npm run preview` servi sous un sous-chemin, puis sur l'URL réelle après le premier déploiement.
- [Réglage Pages non activé : le déploiement échoue] → étape manuelle explicite dans les tâches et dans le README (Settings > Pages > Source = GitHub Actions).
- [La barre finale manque : `/papayou` sans `/`] → GitHub Pages redirige ; les liens d'invitation générés contiennent déjà la barre finale car ils partent de `window.location.href`.
- [Le serveur PeerJS public tombe, ou un réseau filtre le WebRTC] → hors de ce changement, voir `proposal.md` (hors périmètre) ; documenté.
- [Un dépôt public expose le code, dont les clés `VITE_*`] → aucune clé n'est utilisée aujourd'hui ; à garder en tête si un TURN avec identifiants est ajouté plus tard.

## Migration Plan

1. Fusionner ce changement sur `main`.
2. Régler Settings > Pages > Source sur « GitHub Actions » (une seule fois).
3. Le premier déploiement part du push, ou de `workflow_dispatch`.
4. Vérifier l'URL publique, puis un aller-retour hôte/invité entre deux appareils.

Retour arrière : relancer le workflow sur le commit précédent, ou désactiver Pages dans les réglages. Aucune donnée n'est concernée.
