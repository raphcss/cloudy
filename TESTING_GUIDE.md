# Guide de Test - Système de Modules Personnalisés

## 🧪 Tests Étape par Étape

### Prérequis
- ✅ Bot Discord configuré et en ligne
- ✅ API backend en cours d'exécution
- ✅ Panel Vue.js accessible
- ✅ Compte Master créé

---

## Test 1: Créer un Module Simple (Ping)

### 1.1 Préparation du Fichier

Créez un fichier `ping-test.js` localement:

```javascript
module.exports = {
  name: 'ping-test',
  version: '1.0.0',
  description: 'Module de test pour ping',
  
  commands: [
    {
      data: {
        name: 'pingtest',
        description: 'Commande de test ping'
      },
      async execute(interaction) {
        const ping = interaction.client.ws.ping;
        await interaction.reply(`🏓 Pong! Latence: ${ping}ms`);
      }
    }
  ],
  
  async init(client) {
    console.log('[PingTest] Module initialisé!');
  }
};
```

### 1.2 Upload via Interface

1. Connectez-vous au panel web
2. Allez dans **Guild Panel** → Tab **Master**
3. Cliquez sur **"Nouveau Module"**
4. Remplissez:
   - Nom: `ping-test`
   - Description: `Module de test`
   - Icône: 🏓
   - Version: `1.0.0`
5. Uploadez `ping-test.js`
6. Cliquez **"Créer le module"**

### 1.3 Vérifications

**Dans le panel:**
- ✅ Module apparaît dans la liste
- ✅ Badge affiche "Inactif" (pas encore déployé)
- ✅ Badge "📁 1 fichiers"

**Dans les logs backend:**
```
[createModule] Module created: <moduleId>
[createModule] Files saved on disk: 1
```

**Sur le disque:**
```
src/bot/modules/custom/<moduleId>/
└── ping-test.js
```

---

## Test 2: Déployer le Module

### 2.1 Déploiement

1. Ouvrez le dropdown du module (⋮)
2. Cliquez sur **"Déployer"**
3. Attendez la confirmation

### 2.2 Vérifications

**Dans les logs backend:**
```
[ModuleValidator] Module <moduleId> validé avec succès
[ModuleLoader] Commande /pingtest enregistrée pour module ping-test
[ModuleLoader] Module ping-test v1.0.0 chargé (ID: <moduleId>)
[PingTest] Module initialisé!
```

**Dans le panel:**
- ✅ Badge affiche maintenant "Actif"
- ✅ `deployedAt` est défini

**Via API REST:**
```bash
# Vérifier les modules chargés
curl -H "Authorization: Bearer <token>" http://localhost:3000/modules/loaded
```

Devrait retourner:
```json
{
  "loadedModules": [
    {
      "id": "<moduleId>",
      "name": "ping-test",
      "version": "1.0.0",
      "description": "Module de test pour ping",
      "commandsCount": 1,
      "eventsCount": 0
    }
  ]
}
```

---

## Test 3: Enregistrer la Commande Discord

### 3.1 Exécution du Script

Dans le terminal:
```bash
cd src
node scripts/deploy-commands.js
```

### 3.2 Vérifications

**Logs attendus:**
```
✅ Commande standard chargée: ban
✅ Commande standard chargée: kick
...
📦 Chargement des commandes de 1 module(s) déployé(s)...
  ✅ Commande de module: /pingtest (ping-test)

🚀 Déploiement de 8 commande(s) au total...
✅ 8 commande(s) déployée(s) avec succès!
```

**Dans Discord (peut prendre 1h pour commandes globales):**
- Tapez `/` et vérifiez que `pingtest` apparaît dans l'autocomplétion

---

## Test 4: Activer pour un Serveur

### 4.1 Interface Admin Serveur

1. Dans le panel, allez dans **Guild Panel** → Tab **Modules**
2. Trouvez `ping-test` dans la liste
3. Activez le toggle

### 4.2 Vérifications

**Logs backend:**
```
PUT /modules/<moduleId>/guild/<guildId>/toggle
État du module mis à jour
```

**Dans MongoDB:**
```javascript
db.guildconfigs.findOne({ guildId: "<guildId>" })
// Devrait avoir:
{
  ...
  moduleStates: {
    "<moduleId>": true
  }
}
```

---

## Test 5: Tester la Commande

### 5.1 Dans Discord

1. Allez dans votre serveur
2. Tapez `/pingtest`
3. Exécutez la commande

### 5.2 Résultat Attendu

Le bot devrait répondre:
```
🏓 Pong! Latence: 42ms
```

### 5.3 Vérifications Logs

**Backend logs:**
```
[interactionCreate] Commande custom détectée
[interactionCreate] Module activé pour le serveur
```

---

## Test 6: Hot-Reload (Modification)

### 6.1 Modifier le Module

Modifiez `ping-test.js` localement:

```javascript
module.exports = {
  name: 'ping-test',
  version: '1.1.0', // ⬅️ Version incrémentée
  description: 'Module de test pour ping (MODIFIÉ)',
  
  commands: [
    {
      data: {
        name: 'pingtest',
        description: 'Commande de test ping'
      },
      async execute(interaction) {
        const ping = interaction.client.ws.ping;
        // ⬇️ Message modifié
        await interaction.reply(`🚀 PONG! Latence du bot: ${ping}ms`);
      }
    }
  ],
  
  async init(client) {
    console.log('[PingTest v1.1] Module modifié et rechargé!');
  }
};
```

### 6.2 Update via Interface

1. Dropdown → **"Modifier"**
2. Uploadez le nouveau `ping-test.js`
3. Sauvegardez

### 6.3 Recharger

1. Dropdown → **"Recharger"** (ou redéployez)
2. Attendez la confirmation

### 6.4 Vérifications

**Logs:**
```
[ModuleLoader] Rechargement du module <moduleId>...
[ModuleLoader] Module ping-test déchargé
[ModuleLoader] Module ping-test v1.1.0 chargé (ID: <moduleId>)
[PingTest v1.1] Module modifié et rechargé!
```

**Dans Discord:**
- `/pingtest` devrait maintenant répondre avec le nouveau message:
```
🚀 PONG! Latence du bot: 42ms
```

---

## Test 7: Module avec Events (Auto-Role)

### 7.1 Créer le Module

**Fichier `auto-role-test.js`:**
```javascript
module.exports = {
  name: 'auto-role-test',
  version: '1.0.0',
  description: 'Test attribution automatique de rôle',
  
  events: {
    async guildMemberAdd(member, client) {
      console.log(`[AutoRoleTest] Nouveau membre: ${member.user.tag}`);
      
      // Remplacez par un vrai role ID de votre serveur
      const roleId = 'YOUR_ROLE_ID';
      const role = member.guild.roles.cache.get(roleId);
      
      if (role) {
        await member.roles.add(role);
        console.log(`[AutoRoleTest] Rôle ${role.name} attribué`);
      }
    }
  },
  
  async init(client) {
    console.log('[AutoRoleTest] Event handler enregistré!');
  }
};
```

### 7.2 Upload et Déploiement

1. Créez le module
2. Déployez
3. Activez pour votre serveur

### 7.3 Vérifications Logs

```
[ModuleLoader] Event handler guildMemberAdd enregistré pour module auto-role-test
[AutoRoleTest] Event handler enregistré!
```

### 7.4 Test

**Option 1: Inviter un bot test**
- Invitez un autre bot sur votre serveur

**Option 2: Rejoindre avec un alt**
- Utilisez un compte alternatif

**Résultat attendu:**
```
[AutoRoleTest] Nouveau membre: TestUser#1234
[AutoRoleTest] Rôle Member attribué
```

---

## Test 8: Validation de Sécurité

### 8.1 Créer un Module Dangereux

**Fichier `dangerous-test.js`:**
```javascript
const fs = require('fs'); // ⬅️ INTERDIT

module.exports = {
  name: 'dangerous',
  version: '1.0.0',
  
  commands: [
    {
      data: {
        name: 'danger',
        description: 'Test dangereux'
      },
      async execute(interaction) {
        // Tenter de lire un fichier
        const data = fs.readFileSync('/etc/passwd');
        await interaction.reply('Hacked!');
      }
    }
  ]
};
```

### 8.2 Tenter le Déploiement

1. Uploadez le fichier
2. Créez le module
3. Tentez de déployer

### 8.3 Résultat Attendu

**Le déploiement doit ÉCHOUER:**

**Logs:**
```
[ModuleValidator] Erreur validation module <moduleId>:
Error: Code dangereux détecté : require\s*\(\s*['"]fs['"]\s*\)
```

**Dans le panel:**
- Message d'erreur: "Validation du module échouée"
- Module non déployé

---

## Test 9: Désactivation par Serveur

### 9.1 Désactiver

1. Tab Modules
2. Désactivez le toggle pour `ping-test`

### 9.2 Test

Dans Discord:
- `/pingtest` devrait retourner:
```
❌ Ce module n'est pas activé sur ce serveur.
```

### 9.3 Réactiver

1. Réactivez le toggle
2. `/pingtest` fonctionne à nouveau

---

## Test 10: Suppression

### 10.1 Supprimer le Module

1. Dropdown → **"Supprimer"**
2. Confirmez

### 10.2 Vérifications

**Logs:**
```
[deleteModule] Files deleted from disk
Module supprimé
```

**Sur le disque:**
- Le dossier `src/bot/modules/custom/<moduleId>/` est supprimé

**Dans MongoDB:**
- Document `CustomModule` supprimé

**Dans le panel:**
- Module n'apparaît plus dans la liste

---

## 🔍 Checklist Complète

### Création
- [ ] Module apparaît dans la liste
- [ ] Fichiers sauvegardés sur disque
- [ ] Nombre de fichiers correct

### Déploiement
- [ ] Validation de sécurité passe
- [ ] Module chargé dans le bot
- [ ] Logs `[ModuleLoader]` affichés
- [ ] Commandes enregistrées
- [ ] Events enregistrés (si applicable)
- [ ] `init()` appelé
- [ ] Badge "Actif" affiché

### Enregistrement Discord
- [ ] Script `deploy-commands` réussit
- [ ] Commandes apparaissent dans Discord (1h max)

### Activation Serveur
- [ ] Toggle fonctionne
- [ ] État sauvegardé en DB
- [ ] Vérification dans `interactionCreate`

### Exécution
- [ ] Commande exécute correctement
- [ ] Events déclenchés
- [ ] Logs du module affichés

### Hot-Reload
- [ ] Modifications uploadées
- [ ] Reload sans redémarrage
- [ ] Nouveaux changements appliqués

### Sécurité
- [ ] Code dangereux rejeté
- [ ] Patterns interdits détectés
- [ ] Message d'erreur clair

### Désactivation
- [ ] Message d'erreur si désactivé
- [ ] Réactivation fonctionne

### Suppression
- [ ] Fichiers supprimés du disque
- [ ] Document MongoDB supprimé
- [ ] Module disparaît de l'interface

---

## 🐛 Problèmes Courants

### "Commande non trouvée"
- Exécutez `npm run deploy-commands`
- Attendez jusqu'à 1h pour propagation

### "Module non activé sur ce serveur"
- Vérifiez le toggle dans l'onglet Modules
- Vérifiez `GuildConfig.moduleStates` en DB

### "Validation du module échouée"
- Vérifiez les patterns interdits (`fs`, `eval`, etc.)
- Vérifiez la syntaxe JavaScript

### "Bot Discord non disponible"
- Assurez-vous que le bot est en ligne
- Vérifiez que `client.moduleLoader` est initialisé
- Vérifiez la connexion API ↔ Bot

### Event ne se déclenche pas
- Vérifiez les logs `[ModuleLoader]` pour event registration
- Vérifiez que le module est activé pour le serveur
- Vérifiez les intents du bot (ex: `GuildMembers` pour `guildMemberAdd`)

---

## 📊 Monitoring

### Endpoints Utiles

```bash
# Liste tous les modules
curl -H "Authorization: Bearer <token>" http://localhost:3000/modules

# Modules chargés en mémoire
curl -H "Authorization: Bearer <token>" http://localhost:3000/modules/loaded

# États pour un serveur
curl -H "Authorization: Bearer <token>" http://localhost:3000/modules/guild/<guildId>/states
```

### Logs à Surveiller

- `[ModuleLoader]` - Chargement/déchargement
- `[ModuleValidator]` - Validation sécurité
- `[NomModule]` - Logs spécifiques au module
- `[interactionCreate]` - Exécution commandes

---

## ✅ Test Complet Réussi

Si tous les tests passent:
- ✅ Système de modules fonctionnel
- ✅ Validation de sécurité active
- ✅ Hot-reload opérationnel
- ✅ Activation par serveur fonctionnelle
- ✅ Commandes et events supportés

**Le système est prêt pour la production ! 🎉**
