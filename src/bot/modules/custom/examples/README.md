# Exemples de Modules Personnalisés

Ce dossier contient des exemples de modules que vous pouvez utiliser comme templates pour créer vos propres modules.

## Structure d'un Module

Chaque module doit exporter un objet avec les propriétés suivantes :

```javascript
module.exports = {
  // OBLIGATOIRE
  name: 'nom-du-module',
  version: '1.0.0',
  
  // OPTIONNEL
  description: 'Description du module',
  
  // OPTIONNEL - Commandes Discord
  commands: [
    {
      data: {
        name: 'commandname',
        description: 'Description de la commande'
      },
      async execute(interaction) {
        // Logique de la commande
        await interaction.reply('Réponse');
      }
    }
  ],
  
  // OPTIONNEL - Event handlers
  events: {
    async messageCreate(message, client) {
      // Logique quand un message est créé
    },
    async guildMemberAdd(member, client) {
      // Logique quand un membre rejoint
    }
  },
  
  // OPTIONNEL - Initialisation
  async init(client) {
    console.log('Module initialisé');
  },
  
  // OPTIONNEL - Nettoyage
  async cleanup(client) {
    console.log('Module nettoyé');
  }
};
```

## Modules Disponibles

### 1. ping-custom.js
Commande simple qui répond "Pong!" avec la latence du bot.

**Utilisation:**
- Upload `ping-custom.js` dans l'interface
- Déployer le module
- Utiliser `/pingcustom` dans Discord

### 2. auto-role.js
Attribue automatiquement un rôle aux nouveaux membres.

**Utilisation:**
- Créer `config.json` avec la structure:
  ```json
  {
    "roles": {
      "SERVER_ID": "ROLE_ID"
    }
  }
  ```
- Upload `auto-role.js` et `config.json`
- Déployer le module
- Activer pour votre serveur

## Restrictions de Sécurité

Les modules **NE PEUVENT PAS** utiliser:
- `require('fs')` - Accès au système de fichiers
- `require('child_process')` - Exécution de processus
- `eval()` - Exécution de code arbitraire
- `Function()` - Création de fonctions dynamiques
- `require('http')`, `require('https')`, `require('net')` - Connexions réseau

## Créer Votre Propre Module

1. **Via l'interface web:**
   - Allez dans la section Master
   - Cliquez sur "Nouveau Module"
   - Uploadez vos fichiers `.js`
   - Cliquez sur "Déployer"

2. **Structure recommandée:**
   ```
   mon-module/
   ├── index.js          # Point d'entrée
   ├── commands/         # Commandes (optionnel)
   │   └── mycommand.js
   ├── events/           # Event handlers (optionnel)
   │   └── messageCreate.js
   └── config.json       # Configuration (optionnel)
   ```

3. **Exemple index.js:**
   ```javascript
   const myCommand = require('./commands/mycommand.js');
   const myEvent = require('./events/messageCreate.js');
   
   module.exports = {
     name: 'mon-module',
     version: '1.0.0',
     description: 'Mon super module',
     commands: [myCommand],
     events: {
       messageCreate: myEvent
     }
   };
   ```

## API Discord.js Disponible

Vos modules ont accès à l'API Discord.js complète via `interaction.client` :

```javascript
// Dans une commande
async execute(interaction) {
  const client = interaction.client;
  const guild = interaction.guild;
  const member = interaction.member;
  const channel = interaction.channel;
  
  // Envoyer un message
  await interaction.reply('Hello!');
  
  // Message éphémère
  await interaction.reply({ content: 'Secret!', ephemeral: true });
  
  // Obtenir un rôle
  const role = guild.roles.cache.get('ROLE_ID');
  
  // Ajouter un rôle
  await member.roles.add(role);
}
```

## Debugging

Les logs de votre module apparaissent dans la console du serveur :

```javascript
console.log('[MonModule] Message de debug');
console.error('[MonModule] Erreur:', error);
```

## Support

Pour plus d'informations, consultez:
- [Documentation Discord.js](https://discord.js.org/#/docs/main/stable/general/welcome)
- `CUSTOM_MODULES_DEVELOPMENT.md` pour le guide complet
