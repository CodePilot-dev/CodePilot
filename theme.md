# 🎨 Guide de Création de Thèmes CodePilot (.thmx)

Le format `.thmx` est un fichier JSON puissant qui permet de personnaliser **intégralement** l'apparence de CodePilot : couleurs, typographie, espacements, effets visuels et bien plus !

## 📋 Structure Complète

Voici un exemple de fichier `.thmx` avec **toutes** les options disponibles :

```json
{
    "name": "Nom du Thème",
    "author": "Votre Nom",
    "description": "Description de votre thème",
    "version": "1.0.0",
    
    "colors": {
        "--primary": "#8b5cf6",
        "--primary-dark": "#7c3aed",
        "--accent": "#ec4899",
        "--bg-app": "#0f172a",
        "--bg-sidebar": "#1e293b",
        "--bg-card": "rgba(30, 41, 59, 0.6)",
        "--bg-hub": "#1e293b",
        "--border": "rgba(148, 163, 184, 0.1)",
        "--text-main": "#f1f5f9",
        "--text-muted": "#94a3b8",
        "--danger": "#ef4444",
        "--success": "#10b981"
    },
    
    "typography": {
        "--font-main": "'Outfit', sans-serif",
        "--font-mono": "'JetBrains Mono', monospace"
    },
    
    "dimensions": {
        "--card-size": "280px",
        "--border-radius": "12px",
        "--glass-blur": "10px"
    },
    
    "effects": {
        "--transition": "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "--sidebar-opacity": "1"
    },
    
    "interface": {
        "appName": "CODEPILOT",
        "bgGlow": true,
        "compactMode": false
    }
}
```

> **Note :** Toutes les sections sont **optionnelles**. Vous pouvez ne définir que les propriétés que vous souhaitez modifier.

---

## 🎨 Section : `colors`

Personnalisez la palette de couleurs de l'application.

| Variable | Description | Exemple |
| :--- | :--- | :--- |
| `--primary` | Couleur principale (boutons, icônes actives) | `#8b5cf6` |
| `--primary-dark` | Variante hover de la couleur principale | `#7c3aed` |
| `--accent` | Couleur d'accentuation (badges, highlights) | `#ec4899` |
| `--bg-app` | Fond principal de l'application | `#0f172a` |
| `--bg-sidebar` | Fond de la barre latérale | `#1e293b` |
| `--bg-card` | Fond des cartes projets (supporte rgba) | `rgba(30, 41, 59, 0.6)` |
| `--bg-hub` | Fond du modal de détail projet | `#1e293b` |
| `--border` | Couleur des bordures | `rgba(148, 163, 184, 0.1)` |
| `--text-main` | Texte principal | `#f1f5f9` |
| `--text-muted` | Texte secondaire/désactivé | `#94a3b8` |
| `--danger` | Couleur d'erreur/suppression | `#ef4444` |
| `--success` | Couleur de succès | `#10b981` |

---

## ✍️ Section : `typography`

Contrôlez les polices utilisées dans l'interface.

| Variable | Description | Valeurs possibles |
| :--- | :--- | :--- |
| `--font-main` | Police principale | `'Outfit', sans-serif`<br>`'Inter', sans-serif`<br>`system-ui` |
| `--font-mono` | Police monospace (code) | `'JetBrains Mono', monospace`<br>`'Fira Code', monospace` |

---

## 📐 Section : `dimensions`

Ajustez les tailles et espacements.

| Variable | Description | Plage recommandée |
| :--- | :--- | :--- |
| `--card-size` | Largeur des cartes projets | `200px` - `400px` |
| `--border-radius` | Arrondi des angles | `0px` - `30px` |
| `--glass-blur` | Intensité du flou (glassmorphism) | `0px` - `40px` |

---

## ✨ Section : `effects`

Contrôlez les animations et effets visuels.

| Variable | Description | Exemples |
| :--- | :--- | :--- |
| `--transition` | Durée et courbe des animations | `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)` (Fluide)<br>`all 0.15s ease` (Rapide)<br>`none` (Désactivé) |
| `--sidebar-opacity` | Opacité de la sidebar | `0.5` - `1` |

---

## 🖥️ Section : `interface`

Paramètres généraux de l'interface.

| Propriété | Type | Description | Valeur par défaut |
| :--- | :--- | :--- | :--- |
| `appName` | `string` | Nom affiché dans la barre de titre | `"CODEPILOT"` |
| `bgGlow` | `boolean` | Activer la lueur d'arrière-plan | `true` |
| `compactMode` | `boolean` | Mode compact (réduit les espacements) | `false` |

---

## 📦 Métadonnées du Thème

| Propriété | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | **Requis.** Nom du thème |
| `author` | `string` | Optionnel. Créateur du thème |
| `description` | `string` | Optionnel. Description courte |
| `version` | `string` | Optionnel. Version du thème (ex: `1.0.0`) |

---

## 🚀 Comment appliquer un thème ?

1. Ouvrez les **Paramètres (⚙️)** dans CodePilot
2. Dans la section **🎨 Thème & Apparence**, cliquez sur **Charger**
3. Sélectionnez votre fichier `.thmx`
4. L'apparence s'actualise instantanément !

Pour revenir au thème par défaut, cliquez sur **Réinitialiser**.

---

## 💡 Exemples de Thèmes

### Thème Minimaliste Clair
```json
{
    "name": "Minimal Light",
    "author": "CodePilot Team",
    "colors": {
        "--bg-app": "#ffffff",
        "--bg-sidebar": "#f8fafc",
        "--text-main": "#0f172a",
        "--text-muted": "#64748b",
        "--primary": "#3b82f6"
    },
    "dimensions": {
        "--border-radius": "4px"
    }
}
```

### Thème Cyberpunk
```json
{
    "name": "Cyberpunk 2077",
    "author": "Community",
    "colors": {
        "--primary": "#00f0ff",
        "--accent": "#ff00aa",
        "--bg-app": "#0a0e27",
        "--bg-sidebar": "#1a1f3a"
    },
    "typography": {
        "--font-main": "'JetBrains Mono', monospace"
    },
    "effects": {
        "--transition": "all 0.15s ease"
    },
    "interface": {
        "bgGlow": true
    }
}
```

---

## 🌐 Partagez vos thèmes !

Créez des thèmes uniques et partagez-les avec la communauté CodePilot. Les autres utilisateurs pourront les charger instantanément pour transformer leur espace de travail.

**Astuce :** Utilisez des couleurs cohérentes et testez votre thème dans différentes conditions d'éclairage pour une expérience optimale !
