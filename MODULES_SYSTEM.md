# Système de Modules Personnalisés

## 📋 Vue d'ensemble

Le système de modules permet aux **Masters** de créer des modules personnalisés avec des fichiers JavaScript et de les déployer sur les serveurs Discord.

Les **Admins du serveur** peuvent ensuite activer/désactiver ces modules selon leurs besoins.

---

## 🎯 Fonctionnalités

### Pour les Masters (Onglet Master)

#### 1. **Créer un Module**
- Nom et description
- Icône (emoji)
- Version et auteur
- **Upload de fichiers** (.js, .json, .txt, .md)
  - Maximum 5MB par fichier
  - Stockage du contenu
- État par défaut (actif/inactif)

#### 2. **Gérer les Modules**
- Toggle activé/désactivé (état global du module)
- Modifier les informations
- Ajouter/supprimer des fichiers
- **Déployer** le module sur le bot
- Supprimer un module

#### 3. **Déploiement**
Quand un module est déployé :
1. Les fichiers sont envoyés au serveur backend
2. Les fichiers .js sont chargés dynamiquement dans le bot
3. Les commandes sont enregistrées si nécessaire
4. Le module devient disponible pour tous les serveurs

### Pour les Admins (Onglet Modules)

#### 1. **Voir les Modules Disponibles**
- Liste de tous les modules créés par les Masters
- Informations : nom, description, version, auteur
- Liste des fichiers inclus avec tailles
- Badge de statut (Actif/Inactif)

#### 2. **Contrôler les Modules**
- Toggle pour activer/désactiver sur **ce serveur uniquement**
- Voir les détails complets du module
- État indépendant par serveur

---

## 💾 Stockage

### localStorage
Actuellement, le système utilise le localStorage pour le stockage :

```javascript
// Modules globaux (créés par Masters)
localStorage.setItem(`modules_${guildId}`, JSON.stringify(modules))

// États par serveur (gérés par Admins)
localStorage.setItem(`module_states_${guildId}`, JSON.stringify(states))
```

### Structure d'un Module

```javascript
{
  id: "1234567890",
  name: "Mon Module",
  description: "Description du module",
  icon: "🎮",
  version: "1.0.0",
  author: "Master Name",
  enabled: true,  // État global
  enabledForGuild: true,  // État spécifique au serveur
  files: [
    {
      name: "command.js",
      size: 1024,
      content: "// Code JavaScript...",
      type: "text/javascript"
    }
  ],
  config: {}
}
```

---

## 🔧 Logique de Déploiement

### Phase 1 : Création (Frontend)
1. Master crée le module avec fichiers
2. Fichiers lus via FileReader API
3. Contenu stocké en localStorage

### Phase 2 : Déploiement (À implémenter)

```javascript
// Backend API à créer
POST /api/guilds/:guildId/modules/deploy
{
  moduleId: "123",
  files: [{
    name: "command.js",
    content: "..."
  }]
}
```

**Backend devra :**
1. Recevoir les fichiers du module
2. Valider le code JavaScript (sécurité)
3. Sauvegarder dans `src/bot/modules/custom/`
4. Charger dynamiquement avec `require()`
5. Si commande Discord : enregistrer avec `client.commands.set()`
6. Stocker la config en DB

### Phase 3 : Activation (Backend)

```javascript
// Quand un admin toggle un module
PUT /api/guilds/:guildId/modules/:moduleId/toggle
{
  enabled: true
}
```

**Backend devra :**
1. Vérifier si le module est déployé
2. Mettre à jour GuildConfig avec l'état du module
3. Activer/désactiver les commandes du module pour ce serveur

---

## 📁 Structure Backend (Proposition)

```
src/
  bot/
    modules/
      custom/           # Modules déployés
        module-123/
          command.js
          config.json
          utils.js
        module-456/
          ...
      moduleLoader.js   # Charge les modules dynamiquement
  
  models/
    CustomModule.js     # Nouveau modèle
      - id
      - name
      - description
      - author
      - version
      - files[]
      - createdBy (Master userId)
      - createdAt
      - deployedAt
  
  api/
    controllers/
      moduleController.js
        - deployModule()
        - deleteModule()
        - getModules()
        - toggleModuleForGuild()
```

---

## 🔐 Sécurité

### Validation des Fichiers
```javascript
// À implémenter côté backend
const validateModuleCode = (code) => {
  // 1. Interdire require() de modules système sensibles
  const forbidden = ['fs', 'child_process', 'net', 'http'];
  
  // 2. Vérifier syntaxe JavaScript
  try {
    new Function(code);
  } catch (e) {
    throw new Error('Code JavaScript invalide');
  }
  
  // 3. Scanner pour code malveillant
  // eval(), exec(), etc.
};
```

### Permissions
- **Créer/Déployer** : MASTER uniquement
- **Activer/Désactiver** : Admin du serveur (ManageGuild)
- **Voir** : Tous les admins

---

## 🚀 Exemple de Module

### module-welcome.js
```javascript
// Module de bienvenue personnalisé
module.exports = {
  name: 'welcome-custom',
  description: 'Message de bienvenue personnalisé',
  
  // Événement Discord
  event: 'guildMemberAdd',
  
  async execute(member, config) {
    // config contient les settings du module pour ce serveur
    const channel = member.guild.channels.cache.get(config.welcomeChannelId);
    
    if (channel) {
      await channel.send(
        `Bienvenue ${member} ! ${config.customMessage || ''}`
      );
    }
  }
};
```

### Configuration côté panel
```javascript
// Admin peut configurer via un formulaire
moduleConfig = {
  welcomeChannelId: '123456789',
  customMessage: 'Nous sommes ravis de t\'accueillir !'
}
```

---

## 📊 État Actuel vs. Futur

| Fonctionnalité | Actuel | À Implémenter |
|----------------|--------|---------------|
| Créer module (Master) | ✅ Frontend | ⏳ Backend API |
| Upload fichiers | ✅ Frontend | ⏳ Stockage serveur |
| Toggle module (Admin) | ✅ Frontend | ⏳ Backend sync |
| Déploiement | ❌ Mock | ⏳ Chargement dynamique |
| Validation code | ❌ | ⏳ Sécurité |
| Stockage DB | ❌ | ⏳ CustomModule model |
| Chargement bot | ❌ | ⏳ Module loader |

---

## 🎯 Prochaines Étapes

1. **Créer le modèle CustomModule** dans MongoDB
2. **API Backend** pour déploiement et gestion
3. **Module Loader** pour charger dynamiquement les .js
4. **Validation de sécurité** pour le code uploadé
5. **Système de configuration** par module et par serveur
6. **Hot reload** pour recharger les modules sans redémarrer le bot

---

## 💡 Cas d'Usage

### Exemple 1 : Commande Custom
Un Master crée un module avec une commande `/stats-custom` qui affiche des statistiques spécifiques.

### Exemple 2 : Auto-modération Custom
Un module qui détecte des patterns spécifiques dans les messages et applique des actions.

### Exemple 3 : Intégration Externe
Un module qui se connecte à une API externe (météo, jeux, etc.) et fournit des données.

### Exemple 4 : Event Handler
Un module qui réagit à des événements Discord (messages, reactions, etc.) avec une logique personnalisée.

---

**Note :** Le système actuel est fonctionnel côté frontend. L'implémentation backend permettra de réellement charger et exécuter les modules dans le bot Discord.
