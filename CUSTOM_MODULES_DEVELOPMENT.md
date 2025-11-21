# Guide de Développement des Modules Personnalisés

## Vue d'ensemble

Le système de modules personnalisés permet aux **Masters** de créer des extensions pour le bot Discord avec leurs propres fonctionnalités. Les modules sont stockés localement sur le serveur et peuvent être activés/désactivés par serveur Discord.

---

## Architecture du Système

### Structure des Fichiers

```
src/bot/modules/custom/
├── {moduleId}/                    # Dossier unique par module
│   ├── index.js                   # Point d'entrée principal du module
│   ├── commands/                  # Commandes Discord (optionnel)
│   │   └── mycommand.js
│   ├── events/                    # Event handlers (optionnel)
│   │   └── messageCreate.js
│   ├── utils/                     # Utilitaires (optionnel)
│   └── config.json                # Configuration du module
```

### Base de Données MongoDB

Le modèle `CustomModule` stocke uniquement les métadonnées :

```javascript
{
  _id: ObjectId,
  name: String,              // Nom du module
  description: String,       // Description
  icon: String,             // Emoji pour l'UI
  version: String,          // Version (ex: "1.0.0")
  author: String,           // Nom de l'auteur (Master)
  createdBy: ObjectId,      // Référence User
  enabled: Boolean,         // Activé globalement ?
  filesCount: Number,       // Nombre de fichiers
  config: Map,              // Configuration JSON
  deployedAt: Date,         // Date de déploiement
  createdAt: Date,
  updatedAt: Date
}
```

Le modèle `GuildConfig` stocke l'état d'activation par serveur :

```javascript
{
  guildId: String,
  moduleStates: Map<String, Boolean>  // moduleId => enabled
  // ... autres configs
}
```

---

## Cycle de Vie d'un Module

### 1. Création (Master uniquement)

**Frontend** (`GuildPanel.vue` - Tab Master) :
```javascript
// Upload de fichiers via FileReader
const handleFileUpload = async (event) => {
  const files = Array.from(event.target.files);
  for (const file of files) {
    const content = await file.text();
    moduleForm.value.files.push({
      name: file.name,
      size: file.size,
      content: content,
      type: file.type
    });
  }
};

// Envoi au backend
await api.createModule({
  name,
  description,
  icon,
  version,
  enabled: true,
  files: moduleForm.value.files,
  config: {}
});
```

**Backend** (`moduleController.js`) :
1. Créer l'entrée MongoDB avec `filesCount: 0`
2. Sauvegarder les fichiers sur disque dans `src/bot/modules/custom/{moduleId}/`
3. Mettre à jour `filesCount` dans MongoDB

```javascript
const saveModuleFiles = async (moduleId, files) => {
  const modulePath = path.join(__dirname, '../../bot/modules/custom', moduleId.toString());
  await fs.mkdir(modulePath, { recursive: true });
  
  for (const file of files) {
    await fs.writeFile(
      path.join(modulePath, file.name),
      file.content,
      'utf-8'
    );
  }
  
  return files.length;
};
```

### 2. Déploiement

**TODO** : Implémenter la logique de chargement dynamique.

**Objectifs** :
- Charger dynamiquement les fichiers `.js` du module
- Enregistrer les commandes Discord si le module en contient
- Initialiser les event handlers si présents
- Valider la structure du module

**Exemple de structure attendue** :

```javascript
// src/bot/modules/custom/{moduleId}/index.js
module.exports = {
  name: 'mon-module',
  version: '1.0.0',
  
  // Commandes Discord (optionnel)
  commands: [
    {
      data: {
        name: 'macommande',
        description: 'Description de la commande'
      },
      async execute(interaction) {
        await interaction.reply('Hello from custom module!');
      }
    }
  ],
  
  // Event handlers (optionnel)
  events: {
    messageCreate: async (message, client) => {
      // Logique personnalisée
    }
  },
  
  // Initialisation (optionnel)
  async init(client) {
    console.log(`Module ${this.name} initialized`);
  },
  
  // Nettoyage (optionnel)
  async cleanup(client) {
    console.log(`Module ${this.name} cleaned up`);
  }
};
```

### 3. Activation par Serveur

**Frontend** (`GuildPanel.vue` - Tab Modules) :
```javascript
const toggleServerModule = async (module) => {
  const newState = !module.enabledForGuild;
  await api.toggleModuleForGuild(module.id, guildId, newState);
  module.enabledForGuild = newState;
};
```

**Backend** :
```javascript
// PUT /modules/:moduleId/guild/:guildId/toggle
guildConfig.moduleStates.set(moduleId, enabled);
await guildConfig.save();
```

### 4. Exécution

**TODO** : Implémenter le système de dispatch.

Lorsqu'une commande/événement Discord se produit :
1. Vérifier si un module personnalisé gère cet événement
2. Vérifier si le module est activé pour ce serveur (`GuildConfig.moduleStates`)
3. Si oui, exécuter le handler du module

---

## API Backend

### Routes Modules (`/api/modules`)

| Méthode | Route | Middleware | Description |
|---------|-------|------------|-------------|
| GET | `/` | `requireAuth` | Liste tous les modules |
| POST | `/` | `requireAuth`, `requireMaster` | Créer un module |
| PUT | `/:moduleId` | `requireAuth`, `requireMaster` | Modifier un module |
| DELETE | `/:moduleId` | `requireAuth`, `requireMaster` | Supprimer un module |
| POST | `/:moduleId/deploy` | `requireAuth`, `requireMaster` | Déployer un module |
| PUT | `/:moduleId/guild/:guildId/toggle` | `requireAuth` | Activer/désactiver pour un serveur |
| GET | `/guild/:guildId/states` | `requireAuth` | Récupérer états des modules |

### Permissions

- **Master** : Peut créer, modifier, déployer, supprimer des modules
- **Admin Serveur** : Peut activer/désactiver les modules sur son serveur
- **Modérateur** : Lecture seule

---

## Frontend - Interface Utilisateur

### Tab Master (Modules Personnalisés)

**Composants** :
- Liste des modules (cards avec dropdown)
- Bouton "Nouveau Module"
- Modal de création/édition :
  - Nom, description, icône (emoji picker)
  - Version
  - Upload de fichiers (drag & drop)
  - Liste des fichiers uploadés

**Actions Dropdown** :
- ✅/❌ Activer/Désactiver (globalement)
- ✏️ Modifier
- 🚀 Déployer
- 🗑️ Supprimer

### Tab Modules (Admin Serveur)

**Composants** :
- Liste des modules disponibles
- Toggle pour activer/désactiver sur le serveur actuel
- Badge "Actif/Inactif"
- Affichage du nombre de fichiers

---

## TODO - Fonctionnalités à Implémenter

### 1. Système de Chargement Dynamique

**Fichier** : `src/bot/services/moduleLoader.js`

```javascript
const fs = require('fs').promises;
const path = require('path');

class ModuleLoader {
  constructor(client) {
    this.client = client;
    this.loadedModules = new Map(); // moduleId => module instance
  }

  async loadModule(moduleId) {
    const modulePath = path.join(__dirname, '../modules/custom', moduleId, 'index.js');
    
    try {
      // Supprimer du cache Node.js pour reload à chaud
      delete require.cache[require.resolve(modulePath)];
      
      // Charger le module
      const moduleCode = require(modulePath);
      
      // Valider la structure
      if (!moduleCode.name || !moduleCode.version) {
        throw new Error('Module invalide : name et version requis');
      }
      
      // Initialiser si méthode init présente
      if (typeof moduleCode.init === 'function') {
        await moduleCode.init(this.client);
      }
      
      // Enregistrer les commandes
      if (moduleCode.commands && Array.isArray(moduleCode.commands)) {
        for (const cmd of moduleCode.commands) {
          this.client.customCommands.set(cmd.data.name, cmd);
        }
      }
      
      this.loadedModules.set(moduleId, moduleCode);
      console.log(`[ModuleLoader] Module ${moduleCode.name} chargé`);
      
      return moduleCode;
    } catch (error) {
      console.error(`[ModuleLoader] Erreur chargement module ${moduleId}:`, error);
      throw error;
    }
  }

  async unloadModule(moduleId) {
    const module = this.loadedModules.get(moduleId);
    if (!module) return;
    
    // Cleanup
    if (typeof module.cleanup === 'function') {
      await module.cleanup(this.client);
    }
    
    // Supprimer les commandes
    if (module.commands) {
      for (const cmd of module.commands) {
        this.client.customCommands.delete(cmd.data.name);
      }
    }
    
    this.loadedModules.delete(moduleId);
    console.log(`[ModuleLoader] Module ${module.name} déchargé`);
  }

  isModuleEnabledForGuild(moduleId, guildId) {
    // TODO: Vérifier dans GuildConfig.moduleStates
    return false;
  }
}

module.exports = ModuleLoader;
```

### 2. Intégration dans le Bot

**Fichier** : `src/bot/index.js`

```javascript
const ModuleLoader = require('./services/moduleLoader');

// Initialiser le loader
client.moduleLoader = new ModuleLoader(client);
client.customCommands = new Map();

// Charger tous les modules déployés au démarrage
client.once('ready', async () => {
  const CustomModule = require('../models/CustomModule');
  const deployedModules = await CustomModule.find({ deployedAt: { $exists: true } });
  
  for (const module of deployedModules) {
    try {
      await client.moduleLoader.loadModule(module._id.toString());
    } catch (error) {
      console.error(`Erreur chargement module ${module.name}:`, error);
    }
  }
});

// Hook dans interactionCreate
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  
  // Vérifier les commandes personnalisées
  const customCommand = client.customCommands.get(interaction.commandName);
  
  if (customCommand) {
    // Vérifier si le module est activé pour ce serveur
    const moduleId = customCommand.moduleId; // À ajouter dans la structure
    const isEnabled = client.moduleLoader.isModuleEnabledForGuild(moduleId, interaction.guildId);
    
    if (!isEnabled) {
      return interaction.reply({
        content: 'Ce module n\'est pas activé sur ce serveur.',
        ephemeral: true
      });
    }
    
    try {
      await customCommand.execute(interaction);
    } catch (error) {
      console.error('Erreur exécution commande custom:', error);
      await interaction.reply({
        content: 'Erreur lors de l\'exécution de la commande.',
        ephemeral: true
      });
    }
  }
});
```

### 3. Déploiement de Module

**Fichier** : `src/api/controllers/moduleController.js`

```javascript
const deployModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const userId = req.user.id;

    const module = await CustomModule.findById(moduleId);
    
    if (!module) {
      return res.status(404).json({ error: 'Module non trouvé' });
    }

    // Vérifier que l'utilisateur est le créateur
    if (module.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    // Charger le module via le bot
    const discordClient = req.app.get('discordClient');
    
    if (!discordClient || !discordClient.moduleLoader) {
      return res.status(503).json({ error: 'Bot Discord non disponible' });
    }

    try {
      await discordClient.moduleLoader.loadModule(moduleId);
      
      module.deployedAt = new Date();
      await module.save();

      res.json({ message: 'Module déployé avec succès', module });
    } catch (loadError) {
      console.error('Erreur chargement module:', loadError);
      res.status(500).json({ 
        error: 'Erreur lors du déploiement du module',
        details: loadError.message
      });
    }
  } catch (error) {
    console.error('Erreur déploiement module:', error);
    res.status(500).json({ error: 'Erreur lors du déploiement' });
  }
};
```

### 4. Validation de Sécurité

**Fichier** : `src/bot/services/moduleValidator.js`

```javascript
const validateModuleCode = async (moduleId) => {
  const modulePath = path.join(__dirname, '../modules/custom', moduleId, 'index.js');
  const content = await fs.readFile(modulePath, 'utf-8');
  
  // Vérifications de sécurité basiques
  const dangerousPatterns = [
    /require\s*\(\s*['"]child_process['"]\s*\)/,
    /require\s*\(\s*['"]fs['"]\s*\)/,
    /eval\s*\(/,
    /Function\s*\(/,
    /process\.exit/,
    /process\.kill/
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(content)) {
      throw new Error(`Code dangereux détecté : ${pattern.source}`);
    }
  }
  
  return true;
};
```

### 5. Interface pour Créer un Module avec Tabs

**Frontend** : Ajouter un éditeur de code dans le modal

```vue
<template>
  <div class="module-editor">
    <div class="tabs">
      <button @click="activeFile = 'index.js'">index.js</button>
      <button @click="activeFile = 'config.json'">config.json</button>
      <button @click="addNewFile">+ Nouveau fichier</button>
    </div>
    
    <textarea 
      v-model="fileContents[activeFile]"
      class="code-editor"
      spellcheck="false"
    ></textarea>
  </div>
</template>

<script setup>
const activeFile = ref('index.js');
const fileContents = ref({
  'index.js': `module.exports = {
  name: 'mon-module',
  version: '1.0.0',
  commands: [],
  events: {}
};`
});
</script>
```

---

## Exemples de Modules

### Module Simple : Commande Ping Custom

```javascript
// src/bot/modules/custom/{moduleId}/index.js
module.exports = {
  name: 'ping-custom',
  version: '1.0.0',
  description: 'Commande ping personnalisée',
  
  commands: [
    {
      data: {
        name: 'pingcustom',
        description: 'Répond avec pong!'
      },
      async execute(interaction) {
        const ping = interaction.client.ws.ping;
        await interaction.reply(`🏓 Pong! Latence: ${ping}ms`);
      }
    }
  ]
};
```

### Module Avancé : Auto-Role

```javascript
// src/bot/modules/custom/{moduleId}/index.js
const config = require('./config.json');

module.exports = {
  name: 'auto-role',
  version: '1.0.0',
  description: 'Attribue automatiquement un rôle aux nouveaux membres',
  
  events: {
    async guildMemberAdd(member, client) {
      const roleId = config.roles[member.guild.id];
      if (!roleId) return;
      
      try {
        const role = member.guild.roles.cache.get(roleId);
        if (role) {
          await member.roles.add(role);
          console.log(`[AutoRole] Rôle ${role.name} attribué à ${member.user.tag}`);
        }
      } catch (error) {
        console.error('[AutoRole] Erreur:', error);
      }
    }
  }
};
```

```json
// src/bot/modules/custom/{moduleId}/config.json
{
  "roles": {
    "1182419011523326046": "1182421336866426981"
  }
}
```

---

## Sécurité

### Restrictions

1. **Pas d'accès au système de fichiers** : Interdire `require('fs')`
2. **Pas d'exécution de code arbitraire** : Interdire `eval()`, `Function()`
3. **Pas de processus enfants** : Interdire `child_process`
4. **Sandbox Node.js** : Utiliser `vm2` pour isoler l'exécution (optionnel, avancé)

### Validation

- Vérifier la syntaxe JavaScript avant déploiement
- Scanner le code pour patterns dangereux
- Limiter la taille des fichiers (5MB max par défaut)
- Logger toutes les actions des modules pour audit

---

## Dépannage

### Erreur : Module ne se charge pas

1. Vérifier les logs du serveur backend
2. Vérifier que `deployedAt` est défini dans MongoDB
3. Vérifier la structure du fichier `index.js`
4. Redémarrer le bot Discord

### Erreur : Commande ne s'exécute pas

1. Vérifier que le module est activé pour le serveur (`GuildConfig.moduleStates`)
2. Vérifier les permissions Discord du bot
3. Vérifier les logs d'erreur dans `interactionCreate`

### Fichiers non sauvegardés

1. Vérifier les permissions du dossier `src/bot/modules/custom/`
2. Vérifier les logs backend lors de `createModule`
3. Vérifier que `filesCount` est mis à jour dans MongoDB

---

## Roadmap

- [ ] Implémenter `ModuleLoader` avec chargement dynamique
- [ ] Ajouter système de validation de code
- [ ] Créer éditeur de code dans l'interface (tabs multiples)
- [ ] Implémenter hot-reload des modules
- [ ] Ajouter système de versioning avec rollback
- [ ] Créer marketplace de modules (optionnel)
- [ ] Ajouter logs d'exécution par module
- [ ] Implémenter sandbox sécurisé avec `vm2`
- [ ] Ajouter tests automatisés pour modules
- [ ] Documentation interactive avec exemples

---

## Support

Pour toute question sur le développement de modules personnalisés, contactez l'équipe Master ou consultez les exemples dans `src/bot/modules/custom/examples/`.
