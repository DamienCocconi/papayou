# Spec Delta

## Purpose

Rend le jeu accessible à tous depuis un navigateur, à une adresse publique stable en HTTPS, sans que personne n'ait à installer ou lancer quoi que ce soit, et garde cette version à jour avec le code livré.

## ADDED Requirements

### Requirement: Site public en HTTPS
Le système SHALL être accessible publiquement à l'adresse `https://damiencocconi.github.io/papayou/`, en HTTPS, sans installation ni commande côté joueur.

#### Scenario: Ouverture depuis un navigateur
- **WHEN** un joueur ouvre l'adresse du site dans un navigateur récent, sur PC ou sur téléphone
- **THEN** l'accueil du jeu s'affiche, avec son style et ses scripts chargés

#### Scenario: Contexte sécurisé
- **WHEN** le site est ouvert à son adresse publique
- **THEN** la page est dans un contexte sécurisé (HTTPS), condition des API réservées à ces contextes

### Requirement: Fonctionnement sous un sous-chemin
Le système SHALL fonctionner quand il est servi sous un sous-chemin (`/papayou/`) : tous ses fichiers SHALL se charger depuis cet emplacement, sans dépendre de la racine du domaine.

#### Scenario: Chargement des fichiers
- **WHEN** la page d'accueil est chargée à `/papayou/`
- **THEN** aucune requête de style ou de script n'échoue

#### Scenario: Rechargement
- **WHEN** un joueur recharge la page à l'adresse du site
- **THEN** l'accueil s'affiche de nouveau, sans erreur du serveur

### Requirement: Lien d'invitation public
Le lien d'invitation d'une salle SHALL être construit sur l'adresse publique du site et SHALL ouvrir directement la salle chez qui le suit.

#### Scenario: Hôte sur le site public
- **WHEN** un hôte crée une salle depuis le site publié
- **THEN** le lien d'invitation commence par `https://damiencocconi.github.io/papayou/` et contient le code de la salle

#### Scenario: Invité depuis le lien
- **WHEN** un invité ouvre ce lien sur un autre appareil
- **THEN** il arrive dans l'écran de la salle correspondante, pas à l'accueil

### Requirement: Déploiement automatique
Le système SHALL republier le site automatiquement à chaque intégration sur `main`, après réussite de la vérification de types et des tests. Un échec SHALL empêcher la publication et laisser en ligne la version précédente.

#### Scenario: Intégration réussie
- **WHEN** un changement est intégré sur `main` et que les tests passent
- **THEN** le site publié reflète ce changement sans autre action manuelle

#### Scenario: Tests en échec
- **WHEN** un changement est intégré sur `main` et qu'un test échoue
- **THEN** rien n'est publié et la version précédente reste accessible

### Requirement: Indications de réseau pour les joueurs
La documentation SHALL indiquer que la connexion entre appareils dépend du réseau, que certains réseaux (wifi invité ou d'entreprise) peuvent l'empêcher, et qu'un hôte sur un réseau mobile (4G/5G) est le choix le plus sûr.

#### Scenario: Consultation du README
- **WHEN** un joueur lit la section sur l'hébergement
- **THEN** il y trouve l'adresse du site et le conseil de choisir l'hôte sur 4G/5G en cas d'échec de connexion
