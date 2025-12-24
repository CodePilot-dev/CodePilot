# 🎨 Guide de Création de Thèmes CodePilot (.thmx)

Le format `.thmx` est un simple fichier JSON qui permet de personnaliser intégralement l'apparence de CodePilot en redéfinissant les variables CSS racines.

## Structure du fichier

Chaque fichier `.thmx` doit suivre cette structure :

```json
{
    "name": "Nom du Thème",
    "colors": {
        "--primary": "#couleur",
        "--primary-dark": "#couleur",
        "--accent": "#couleur",
        "--bg-app": "#couleur",
        "--bg-sidebar": "#couleur",
        "--bg-card": "rgba(r, g, b, a)",
        "--bg-hub": "#couleur",
        "--border": "rgba(r, g, b, a)",
        "--text-main": "#couleur",
        "--text-muted": "#couleur",
        "--danger": "#couleur",
        "--success": "#couleur"
    }
}
```

## Description des Variables

| Variable | Description |
| :--- | :--- |
| `--primary` | Couleur principale (boutons, icônes actives, bordures de focus). |
| `--primary-dark` | Variante plus sombre de la couleur principale pour les états hover. |
| `--accent` | Couleur d'accentuation pour les badges ou éléments spéciaux. |
| `--bg-app` | Couleur de fond principale de la zone de contenu. |
| `--bg-sidebar` | Couleur de fond de la barre latérale. |
| `--bg-card` | Fond des cartes projets (conseillé: semi-transparent). |
| `--bg-hub` | Fond du modal de détail du projet (Hub). |
| `--border` | Couleur des bordures et séparateurs. |
| `--text-main` | Couleur du texte principal (Titres, noms). |
| `--text-muted` | Couleur du texte secondaire ou désactivé. |
| `--danger` | Utilisé pour les boutons de suppression ou erreurs (par défaut rouge). |
| `--success` | Utilisé pour les notifications de succès ou badges de complétion. |

## Comment appliquer un thème ?

1.  Ouvrez les **Paramètres (⚙️)** dans CodePilot.
2.  Dans la section **Apparence**, cliquez sur **Charger un thème**.
3.  Sélectionnez votre fichier `.thmx`.
4.  L'apparence s'actualise instantanément !

## Partagez vos thèmes !
Vous pouvez partager vos fichiers `.thmx` avec d'autres utilisateurs de CodePilot. Il leur suffit de charger votre fichier pour transformer leur espace de travail.
