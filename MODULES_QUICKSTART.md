# Guide de Démarrage Rapide - Modules Personnalisés

## 🎯 Qu'est-ce qu'un Module Personnalisé ?

Les modules personnalisés permettent aux **Masters** de créer des extensions pour le bot Discord avec leurs propres commandes et événements, sans modifier le code source du bot.

## 🚀 Démarrage Rapide

### 1. Créer un Module Simple

**Via l'interface web:**

1. Connectez-vous en tant que Master
2. Allez dans l'onglet **Master** → **Modules Personnalisés**
3. Cliquez sur **"Nouveau Module"**
4. Remplissez les informations:
   - **Nom**: `mon-premier-module`
   - **Description**: `Mon premier module de test`
   - **Icône**: 🎮
   - **Version**: `1.0.0`
5. Créez un fichier `index.js` avec ce contenu:

```javascript
module.exports = {
  name: 'mon-premier-module',
  version: '1.0.0',
  description: 'Mon premier module',
  
  commands: [
    {
      data: {
        name: 'hello',
        description: 'Dit bonjour!'
      },
      async execute(interaction) {
        await interaction.reply('👋 Bonjour depuis mon module personnalisé!');
      }
    }
  ],
  
  async init(client) {
    console.log('[MonModule] Initialisé!');
  }
};
```

6. Uploadez le fichier
7. Cliquez sur **"Créer le module"**
8. Dans le dropdown du module, cliquez sur **"Déployer"**
9. **IMPORTANT**: Exécutez `npm run deploy-commands` pour enregistrer la commande sur Discord

### 2. Activer le Module sur un Serveur

**Pour les Admins de serveur:**

1. Allez dans l'onglet **Modules**
2. Trouvez votre module dans la liste
3. Activez le toggle pour votre serveur

### 3. Tester la Commande

Dans Discord, tapez `/hello` et le bot répondra !

## 📚 Exemples Prêts à l'Emploi

Le dossier `src/bot/modules/custom/examples/` contient des modules d'exemple:

### Commande Ping Avancée

```javascript
// ping-custom.js
module.exports = {
  name: 'ping-custom',
  version: '1.0.0',
  
  commands: [
    {
      data: {
        name: 'pingcustom',
        description: 'Ping avec latence'
      },
      async execute(interaction) {
        const ping = interaction.client.ws.ping;
        await interaction.reply(`🏓 Pong! Latence: ${ping}ms`);
      }
    }
  ]
};
```

### Auto-Role (Event Handler)

```javascript
// auto-role.js
module.exports = {
  name: 'auto-role',
  version: '1.0.0',
  
  events: {
    async guildMemberAdd(member, client) {
      const role = member.guild.roles.cache.get('ROLE_ID');
      if (role) {
        await member.roles.add(role);
        console.log(`Rôle attribué à ${member.user.tag}`);
      }
    }
  }
};
```

## 🔧 Gestion des Modules

### Modifier un Module

1. Dans le dropdown du module, cliquez sur **"Modifier"**
2. Modifiez les fichiers
3. Sauvegardez
4. Cliquez sur **"Recharger"** pour appliquer les changements sans redémarrer le bot

### Désactiver un Module

- **Globalement** (Master): Toggle dans l'onglet Master
- **Par serveur** (Admin): Toggle dans l'onglet Modules

### Supprimer un Module

1. Dans le dropdown du module, cliquez sur **"Supprimer"**
2. Confirmez la suppression
3. Les fichiers sont automatiquement supprimés du serveur

## 📋 API Discord.js Disponible

Dans vos commandes, vous avez accès à toute l'API Discord.js:

```javascript
async execute(interaction) {
  // Le client Discord
  const client = interaction.client;
  
  // Le serveur
  const guild = interaction.guild;
  
  // L'utilisateur
  const user = interaction.user;
  const member = interaction.member;
  
  // Le canal
  const channel = interaction.channel;
  
  // Envoyer un message
  await interaction.reply('Message public');
  
  // Message éphémère (visible uniquement par l'utilisateur)
  await interaction.reply({ 
    content: 'Message secret', 
    ephemeral: true 
  });
  
  // Modifier la réponse
  await interaction.editReply('Message modifié');
  
  // Obtenir un rôle
  const role = guild.roles.cache.get('ROLE_ID');
  
  // Ajouter un rôle
  await member.roles.add(role);
  
  // Envoyer un message dans un canal
  await channel.send('Hello!');
}
```

## 🔒 Restrictions de Sécurité

Pour la sécurité, les modules **NE PEUVENT PAS**:

❌ Accéder au système de fichiers (`fs`)
❌ Exécuter des processus (`child_process`)
❌ Utiliser `eval()` ou `Function()`
❌ Créer des connexions réseau directes

✅ Les modules peuvent:
- Utiliser l'API Discord.js complète
- Enregistrer des commandes slash
- Écouter des événements Discord
- Utiliser des fichiers de configuration JSON
- Logger dans la console

## 🐛 Debugging

### Voir les logs

Les logs de vos modules apparaissent dans la console du serveur:

```javascript
console.log('[MonModule] Message de debug');
console.error('[MonModule] Erreur:', error);
```

### Problèmes Courants

**La commande n'apparaît pas dans Discord:**
- Exécutez `npm run deploy-commands` après avoir déployé le module
- Attendez quelques minutes (les commandes globales peuvent prendre jusqu'à 1h)

**Module ne se charge pas:**
- Vérifiez la syntaxe JavaScript dans vos fichiers
- Vérifiez que `name` et `version` sont définis
- Regardez les logs du serveur pour les erreurs

**Erreur "Module non activé sur ce serveur":**
- Allez dans l'onglet Modules et activez-le pour votre serveur

## 📖 Documentation Complète

Pour plus d'informations détaillées:

- **CUSTOM_MODULES_DEVELOPMENT.md**: Guide complet pour développeurs
- **examples/README.md**: Exemples et templates
- **Discord.js Docs**: https://discord.js.org/#/docs/main/stable/general/welcome

## 🎓 Workflow Recommandé

1. **Développez localement**: Créez vos fichiers `.js` dans votre éditeur préféré
2. **Testez la syntaxe**: Utilisez un linter comme ESLint
3. **Uploadez via l'interface**: Drag & drop vos fichiers
4. **Déployez**: Cliquez sur "Déployer" dans le dropdown
5. **Enregistrez les commandes**: `npm run deploy-commands`
6. **Activez pour votre serveur**: Toggle dans l'onglet Modules
7. **Testez**: Utilisez les commandes dans Discord
8. **Itérez**: Modifiez et rechargez au besoin

## 💡 Astuces

- **Utilisez des emojis** dans les réponses pour rendre les messages plus attrayants
- **Ajoutez des logs** pour faciliter le debugging
- **Utilisez `ephemeral: true`** pour les messages d'erreur ou de confirmation
- **Gérez les erreurs** avec try/catch pour éviter les crashs
- **Documentez votre code** avec des commentaires

## 🆘 Support

En cas de problème:

1. Vérifiez les logs du serveur
2. Consultez la documentation Discord.js
3. Testez avec les modules d'exemple fournis
4. Contactez un Master pour de l'aide

---

**Bon développement ! 🚀**
