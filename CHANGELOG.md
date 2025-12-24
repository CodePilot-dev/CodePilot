# Changelog

All notable changes to this project will be documented in this file.

## [0.0.6] - 2025-12-24

### Fixed
- **Refonte Architecturale** : Migration du système de mises à jour global vers un système **par projet**. Chaque projet gère désormais sa propre roadmap indépendamment.
- **Persistence des Données** : Correction de la sauvegarde des MAJ dans le fichier de configuration pour chaque entrée projet.
- **Intégration Hub** : Inclusion de la gestion des MAJ directement dans la vue détail (Hub Projet).

### Added
- **Système de Toast** : Notifications de confirmation lors de la programmation d'une mise à jour.

## [0.0.5] - 2025-12-24

### Fixed
- **Alignement des Badges** : Correction de l'étiquette Next.js qui ne se calait pas correctement à droite des cartes projets.
- **Z-Index** : Correction des problèmes de superposition.

## [0.0.4] - 2025-12-24

### Added
- **Focus Mode & Hub Projet** : Refonte totale de la navigation. La page d'accueil affiche désormais une liste épurée de vos projets. Cliquez sur un projet pour ouvrir son "Hub" dédié.
- **Vue "Tous les projets"** : Nouveau raccourci dans la barre latérale pour voir l'intégralité de vos projets en un seul coup d'œil, sans changer d'espace.

### Changed
- **Interface Épurée** : Les actions (Terminal, VS Code, Scripts) sont désormais masquées par défaut et centralisées dans la vue détail pour réduire le bruit visuel.
- **Cartes Compactes** : Design miniaturisé des cartes projets sur l'accueil pour une meilleure gestion des larges volumes de projets.

### Fixed
- **Correction Overlap Badges** : Les badges de frameworks (Next.js, React, etc.) se décalent désormais dynamiquement au survol pour éviter tout chevauchement avec les icônes d'action (Épinglage, Édition, Suppression).
- **Z-Index & Layers** : Amélioration de la superposition des éléments flottants sur les cartes.

## [0.0.2] - 2025-12-24

### Added
- **Détection automatique de Framework** : CodePilot détecte maintenant si ton projet utilise React, Vue, Next.js, Svelte, Electron, Vite ou TypeScript et affiche un badge correspondant.
- **Système d'Épinglage (Pinning)** : Tu peux désormais épingler tes projets favoris pour qu'ils restent toujours en haut de la liste.
- **Notes de Projet** : Ajout d'un champ "Notes" pour chaque projet, idéal pour stocker des TODOs ou des rappels rapides.
- **Recherche Améliorée** : La barre de recherche scanne désormais aussi les notes de tes projets.

### UI/UX
- Nouveau design pour le header des cartes avec accès rapide au Pin/Edit/Delete.
- Effets de survol améliorés et badges colorés pour les frameworks.
- Support des zones de texte (textarea) dans les formulaires.
- Amélioration de la lisibilité des chemins de fichiers.

## [0.0.1] - 2025-12-24

### Added
- Gestion des Espaces et Projets.
- Intégration Git (GitHub/GitLab).
- Lancement rapide (Dossier, Terminal, VS Code/Éditeur personnalisé).
- Détection intelligente des scripts npm.
- Build portable en un seul fichier .exe.