# Changelog

## [0.1.6] - 2025-12-25

### ✨ Nouvelles Fonctionnalités
- **In-App Updating** : Mettez à jour CodePilot directement depuis l'application sans passer par un navigateur. L'app télécharge et s'installe toute seule !
- **Système de Mise à Jour** : Notification automatique au lancement si une nouvelle version est disponible sur GitHub. Bouton de vérification manuelle ajouté aux paramètres.
- **Personnalisation Avancée (10 options)** : Modifiez l'appellation de l'app, les couleurs, polices, arrondis, flous, tailles de cartes, et bien plus via le nouveau panneau "Apparence".
- **Interface Git Native** : Accédez à une interface GUI moderne directement dans l'application pour gérer vos commits, pushs et pulls sans quitter votre hub.
- **Bouton Éditeur Intelligent** : Le bouton de lancement d'éditeur détecte maintenant automatiquement votre commande personnalisée (Cursor, Sublime, etc.).

### 🎨 Design & Expérience Utilisateur
- **Paramètres Redessinés** : Nouveau panneau de configuration en deux colonnes, plus compact et ergonomique.
- **Grille de Projets Améliorée** : Correction de l'étirement excessif des cartes sur les écrans larges (Full Screen). Les cartes conservent désormais leur taille idéale.
- **Micro-animations** : Ajout de transitions fluides lors de l'ouverture des modales et du survol des cartes.

### 🛠️ Améliorations Techniques
- **Correctif Mise à Jour** : Résolution de l'erreur `ENOENT` sur les versions installées. L'app utilise désormais un dossier d'écriture sécurisé dans `AppData` pour les mises à jour à chaud.
- **Version Automatisée** : L'application lit sa version directement depuis `package.json`. Plus besoin de changer la version manuellement dans le code.
- **Optimisation Git** : Gestion plus robuste des erreurs et staging automatique lors des commits.
- **Gitignore Automatisé** : Inclusion de règles standards pour Electron/Vite pour des dépôts plus propres.
