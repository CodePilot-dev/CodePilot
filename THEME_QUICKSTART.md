# 🎨 Guide Rapide - Thèmes CodePilot

## 🚀 Démarrage Rapide

### Appliquer un Thème Existant

1. Ouvrez **CodePilot**
2. Cliquez sur **⚙️** (Paramètres)
3. Section **🎨 Thème & Apparence**
4. Cliquez sur **Charger**
5. Sélectionnez un fichier `.thmx` (essayez les thèmes dans `themes/`)
6. ✨ Profitez de votre nouveau look !

### Créer Votre Propre Thème

#### Méthode 1 : Export (Recommandé)
1. Personnalisez l'apparence dans les paramètres
2. Cliquez sur **Exporter**
3. Renseignez le nom, auteur, description
4. Sauvegardez votre fichier `.thmx`
5. Partagez-le avec la communauté !

#### Méthode 2 : Création Manuelle
1. Créez un fichier `mon-theme.thmx`
2. Copiez cette structure de base :

```json
{
    "name": "Mon Thème",
    "colors": {
        "--primary": "#8b5cf6",
        "--bg-app": "#0f172a",
        "--text-main": "#f1f5f9"
    }
}
```

3. Personnalisez les couleurs
4. Chargez-le dans CodePilot !

## 🎯 Sections Disponibles

| Section | Description | Obligatoire |
|---------|-------------|-------------|
| `name` | Nom du thème | ✅ Oui |
| `colors` | Palette de couleurs | ❌ Non |
| `typography` | Polices de caractères | ❌ Non |
| `dimensions` | Tailles et espacements | ❌ Non |
| `effects` | Animations et effets | ❌ Non |
| `interface` | Paramètres d'interface | ❌ Non |

## 💡 Exemples Rapides

### Thème Minimaliste
```json
{
    "name": "Simple",
    "colors": {
        "--primary": "#3b82f6"
    },
    "dimensions": {
        "--border-radius": "4px"
    }
}
```

### Thème Complet
```json
{
    "name": "Complet",
    "author": "Vous",
    "colors": { ... },
    "typography": { ... },
    "dimensions": { ... },
    "effects": { ... },
    "interface": { ... }
}
```

## 🔧 Astuces

### Couleurs
- Utilisez des codes hex : `#8b5cf6`
- Ou rgba : `rgba(139, 92, 246, 0.5)`
- Testez sur [coolors.co](https://coolors.co)

### Polices
- Google Fonts : `'Outfit', sans-serif`
- Système : `system-ui`
- Monospace : `'JetBrains Mono', monospace`

### Dimensions
- Cartes : `200px` à `400px`
- Arrondi : `0px` (carré) à `30px` (très arrondi)
- Flou : `0px` (net) à `40px` (très flou)

## 🐛 Dépannage

### Le thème ne se charge pas
- Vérifiez que le fichier est un JSON valide
- Assurez-vous qu'il y a un `"name"`
- Au moins une section doit être présente

### Les couleurs ne changent pas
- Vérifiez les noms des variables CSS
- Utilisez le format correct (`#rrggbb` ou `rgba()`)

### Retour au thème par défaut
- Paramètres → Thème & Apparence → **Réinitialiser**

## 📖 Documentation Complète

Pour plus de détails, consultez :
- `theme.md` - Guide complet de création
- `THEME_CHANGELOG.md` - Nouveautés et améliorations
- `themes/README.md` - Catalogue des thèmes

## 🌐 Partage

Créez des thèmes uniques et partagez-les !
- GitHub
- Discord
- Forums CodePilot

---

**Besoin d'aide ?** Consultez la documentation complète dans `theme.md`
