# 🤖 Discord Moderation Bot - Système Complet de Modération

> Bot Discord avancé avec panel web Vue.js, système d'escalade automatique, synchronisation bidirectionnelle complète, et **système de modules personnalisés** ⭐ **NOUVEAU**

---

## ✨ Fonctionnalités principales

### 🎮 Bot Discord
- ✅ **7 commandes slash** : warn, mute, unmute, kick, ban, unban, history
- ✅ **Système d'escalade automatique** : sanctions progressives selon l'historique
- ✅ **Expiration automatique** : unmute/unban automatiques à expiration
- ✅ **Types d'infractions** : SPAM, INSULT, HARASSMENT, NSFW, RAID, ADVERTISING, OTHER
- ✅ **Notifications DM** : embeds Discord informatifs pour les utilisateurs sanctionnés
- ✅ **Permissions hiérarchiques** : impossible de modérer un rôle supérieur
- ✅ **Modules personnalisés** : créez vos propres commandes et events ⭐ **NOUVEAU**

### 🌐 Panel Web (Vue.js)
- ✅ **Authentification Discord OAuth2** : connexion sécurisée via Discord
- ✅ **Gestion multi-serveurs** : gérez tous vos serveurs Discord depuis un seul panel
- ✅ **10 onglets complets** : ⭐ **2 NOUVEAUX**
  - **Config** : paramètres généraux du serveur
  - **Templates** : créer des sanctions pré-configurées
  - **Modérateurs** : gérer les rôles ADMIN/MODERATOR
  - **Logs** : historique complet des actions de modération
  - **Recherche** : rechercher un utilisateur et voir son historique
  - **Escalade** : configurer les niveaux d'escalade par type d'infraction
  - **Permissions** : gérer les permissions avec Discord IDs
  - **Stats** : statistiques de modération en temps réel
  - **Master** : créer et gérer des modules personnalisés (Masters uniquement) ⭐ **NOUVEAU**
  - **Modules** : activer/désactiver les modules pour votre serveur (Admins) ⭐ **NOUVEAU**
- ✅ **Trust Factor** : score de confiance basé sur l'historique (0-100)
- ✅ **Révocation** : annuler une sanction avec affichage du modérateur révocateur
- ✅ **Création utilisateurs** : créer des utilisateurs avec Discord ID, auto-complétion OAuth
- ✅ **Interface responsive** : dark mode, animations, notifications toast

### 🔌 Système de Modules Personnalisés ⭐ **NOUVEAU**
- ✅ **Création facile** : interface web avec upload de fichiers (drag & drop)
- ✅ **Chargement dynamique** : modules chargés sans redémarrer le bot
- ✅ **Hot-reload** : recharger un module après modification
- ✅ **Validation de sécurité** : code scanné pour patterns dangereux
- ✅ **Support complet** : commandes slash ET event handlers Discord
- ✅ **Activation par serveur** : chaque serveur peut activer/désactiver les modules
- ✅ **Gestion des permissions** :
  - **Masters** : créer, modifier, déployer, supprimer modules
  - **Admins** : activer/désactiver pour leur serveur
- ✅ **Exemples fournis** : ping-custom, auto-role
- ✅ **Documentation complète** : guides utilisateur et développeur

### 🔄 Intégration Bot ↔ Site
- ✅ **Synchronisation complète** : sanctions depuis le bot apparaissent sur le site et vice-versa
- ✅ **Révocation depuis le site** : révoquer un mute/ban sur le site applique unmute/unban sur Discord
- ✅ **API REST complète** : communication bot ↔ API via BOT_API_KEY
- ✅ **Scheduler intelligent** : vérifie les expirations toutes les 30s
- ✅ **Modules chargés automatiquement** : au démarrage du bot ⭐ **NOUVEAU**

### 📊 Système de modération
- ✅ **Escalade automatique** : warn → mute → kick → ban selon l'historique
- ✅ **Compteurs par type** : chaque type d'infraction a son propre compteur
- ✅ **Sanctions temporaires** : mute et ban avec durées configurables
- ✅ **Templates** : sanctions pré-configurées pour actions rapides
- ✅ **Trust factor excluant révocations** : sanctions révoquées ne comptent pas
- ✅ **Historique complet** : logs détaillés avec modérateur et date

---

## 🚀 Installation rapide

### 1. Prérequis
```bash
# Installer Node.js 18+
node --version  # v18.0.0+

# Installer MongoDB 6+
mongod --version  # v6.0.0+
```

### 2. Cloner et installer
```bash
git clone <votre-repo>
cd discord-moderation-bot
npm install
cd panel
npm install
cd ..
```

### 3. Configuration .env
Créez `.env` à la racine :

```env
# Discord Bot
DISCORD_BOT_TOKEN=votre_token_bot
DISCORD_CLIENT_ID=votre_client_id
DISCORD_CLIENT_SECRET=votre_client_secret

# MongoDB
MONGODB_URI=mongodb://localhost:27017/discord-moderation

# API
PORT=3000
JWT_SECRET=generer_secret_long_et_securise
BOT_API_KEY=generer_cle_api_securisee

# OAuth2
DISCORD_REDIRECT_URI=http://localhost:3000/auth/discord/callback
CLIENT_URL=http://localhost:8080
```

**Générer des secrets sécurisés :**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"  # JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # BOT_API_KEY
```

### 4. Déployer les commandes Discord
```bash
npm run deploy-commands
```

### 5. Démarrer l'application
```bash
# Démarrer bot + API ensemble
npm start

# OU démarrer séparément (développement)
npm run bot:dev  # Bot seulement
npm run api:dev  # API seulement
```

### 6. Démarrer le panel web (terminal séparé)
```bash
cd panel
npm run serve
```

Le panel sera accessible sur http://localhost:8080

---

## 📖 Utilisation

### Commandes Discord (slash commands)

| Commande | Description | Exemple |
|----------|-------------|---------|
| `/warn` | Avertir un membre | `/warn @User raison:Spam type:SPAM` |
| `/mute` | Mute un membre | `/mute @User raison:Flood duree:12h type:SPAM` |
| `/unmute` | Retirer un timeout | `/unmute @User raison:Erreur` ⭐ **NOUVEAU** |
| `/kick` | Expulser un membre | `/kick @User raison:Toxique type:HARASSMENT` |
| `/ban` | Bannir un membre | `/ban @User raison:Raid type:RAID` |
| `/unban` | Débannir un utilisateur | `/unban userid:123456789 raison:Appel accepté` ⭐ **NOUVEAU** |
| `/history` | Voir l'historique | `/history @User` |

### Panel Web

1. **Se connecter** : http://localhost:8080 → Login with Discord
2. **Sélectionner un serveur** : Dashboard → Cliquer sur un serveur
3. **Appliquer une sanction** :
   - Onglet "Recherche" → Entrer Discord ID → Cliquer "Warn/Mute/Kick/Ban"
   - OU utiliser un template depuis l'onglet "Templates"
4. **Révoquer une sanction** ⭐ **NOUVEAU** :
   - Onglet "Logs" → Trouver la sanction → Cliquer "Révoquer"
   - Le bot appliquera unmute/unban automatiquement sur Discord
5. **Configurer l'escalade** :
   - Onglet "Escalade" → Configurer les niveaux par type d'infraction

---

## 🏗️ Architecture

```
discord-moderation-bot/
├── src/
│   ├── index.js              # Point d'entrée (API + Bot)
│   ├── api/                  # API REST Express
│   │   ├── controllers/      # Logique métier (auth, moderation, etc.)
│   │   ├── routes/           # Routes Express
│   │   └── middleware/       # Auth, permissions, rate-limiting
│   ├── bot/                  # Bot Discord
│   │   ├── commands/         # 7 commandes slash
│   │   ├── events/           # Événements Discord (ready, interactions, etc.)
│   │   └── utils/            # API client, permissions
│   ├── models/               # Modèles MongoDB (User, Sanction, Guild, etc.)
│   ├── services/             # Services métier
│   │   ├── moderationService.js      # Logique de modération
│   │   ├── escalationService.js      # Système d'escalade
│   │   ├── guildSyncService.js       # Synchronisation guildes
│   │   └── sanctionSchedulerService.js  # Expiration automatique ⭐ NOUVEAU
│   └── config/               # Configuration (DB, constantes)
├── panel/                    # Frontend Vue.js
│   └── src/
│       ├── views/            # Pages (Login, Dashboard, GuildPanel, etc.)
│       ├── components/       # Composants réutilisables
│       ├── services/         # API client Axios
│       └── stores/           # Pinia stores (auth, notifications, etc.)
└── .env                      # Configuration
```

---

## 🔌 Modules Personnalisés ⭐ **NOUVEAU**

### Vue d'ensemble

Le système de modules permet aux **Masters** de créer des extensions pour le bot sans modifier le code source.

### Fonctionnalités

- 🎨 **Création facile** : interface web avec upload drag & drop
- 🔥 **Hot-reload** : rechargement sans redémarrer le bot
- 🔒 **Validation de sécurité** : code scanné pour patterns dangereux
- ⚙️ **Support complet** : commandes slash + event handlers Discord
- 🎯 **Activation par serveur** : chaque serveur choisit ses modules
- 📦 **Exemples fournis** : ping-custom, auto-role

### Exemple : Module Simple

```javascript
// index.js
module.exports = {
  name: 'mon-module',
  version: '1.0.0',
  
  commands: [
    {
      data: {
        name: 'hello',
        description: 'Dit bonjour'
      },
      async execute(interaction) {
        await interaction.reply('👋 Bonjour!');
      }
    }
  ]
};
```

### Workflow

1. **Master** : Crée module via panel web
2. **Upload** : Fichiers `.js` uploadés
3. **Déployer** : Validation + chargement dynamique
4. **Enregistrer** : `npm run deploy-commands`
5. **Admin** : Active pour son serveur
6. **Utiliser** : `/hello` dans Discord

### Documentation

- 📖 [**Guide Rapide**](./MODULES_QUICKSTART.md) - Démarrage rapide modules
- 📖 [**Guide Développeur**](./CUSTOM_MODULES_DEVELOPMENT.md) - Documentation complète (4000+ lignes)
- 📖 [**Guide de Test**](./TESTING_GUIDE.md) - Tests étape par étape
- 📖 [**Exemples**](./src/bot/modules/custom/examples/) - Modules d'exemple

### Restrictions de Sécurité

❌ Bloqué : `fs`, `child_process`, `eval()`, `Function()`, connexions réseau
✅ Autorisé : API Discord.js complète, configuration JSON, logs console

---

## 🔄 Workflow complet Bot ↔ Site

### Scénario 1 : Sanction depuis Discord
```
1. Modérateur utilise /mute @User sur Discord
2. Bot appelle API POST /guilds/:id/moderate avec BOT_API_KEY
3. API enregistre la sanction en MongoDB
4. Bot applique timeout Discord
5. Sanction visible immédiatement sur le panel web
6. Scheduler vérifie expiration toutes les 30s
7. À expiration : bot retire timeout + marque sanction inactive
```

### Scénario 2 : Révocation depuis le panel web
```
1. Modérateur clique "Révoquer" sur le panel web
2. Frontend appelle API POST /guilds/:id/sanctions/:id/revoke
3. API marque sanction comme révoquée (revokedAt, revokedBy)
4. API appelle sanctionScheduler.applyRevocation()
5. Bot retire timeout/ban sur Discord immédiatement
6. Sanction marquée comme inactive
7. Trust factor recalculé (révocations exclues)
```

### Scénario 3 : Module Personnalisé ⭐ **NOUVEAU**
```
1. Master crée module via panel web (tab Master)
2. Upload fichiers .js (drag & drop)
3. Fichiers sauvegardés dans src/bot/modules/custom/{moduleId}/
4. Master clique "Déployer"
5. ModuleValidator scanne le code pour sécurité
6. ModuleLoader charge dynamiquement le module
7. Commandes enregistrées dans client.customCommands
8. Events enregistrés avec listeners
9. npm run deploy-commands pour enregistrer sur Discord
10. Admin active module pour son serveur (tab Modules)
11. interactionCreate vérifie activation par serveur
12. Commande exécutée si activée ✅
```

---

## 🎯 Système d'escalade

### Exemple d'escalade SPAM

| Infraction | Action | Durée | Niveau |
|-----------|--------|-------|--------|
| 1ère fois | WARN | - | 1 |
| 2ème fois | MUTE | 1h | 2 |
| 3ème fois | MUTE | 12h | 3 |
| 4ème fois | MUTE | 3 jours | 4 |
| 5ème fois | KICK | - | 5 |
| 6ème fois | BAN | 7 jours | 6 |
| 7+ fois | BAN | Permanent | 7 |

**Configurable depuis le panel web** (onglet Escalade)

---

## 🔐 Sécurité

- ✅ **JWT** : authentification sécurisée avec expiration 7 jours
- ✅ **Discord OAuth2** : délégation d'authentification à Discord
- ✅ **BOT_API_KEY** : clé API pour communication bot ↔ API
- ✅ **Rate limiting** : 100 req/15min par IP
- ✅ **Helmet.js** : headers de sécurité HTTP
- ✅ **Permissions hiérarchiques** : impossible de modérer un rôle supérieur
- ✅ **CORS** : restriction aux origines autorisées
- ✅ **Validation modules** : scan sécurité pour code personnalisé ⭐ **NOUVEAU**

---

## 📚 Documentation complète

### Guides Généraux
- 📖 [**Guide complet du bot**](./BOT_GUIDE.md) - Documentation détaillée (commandes, systèmes, dépannage)
- 📖 [API Documentation](./API_DOCUMENTATION.md) - Endpoints, exemples, schémas
- 📖 [Discord OAuth Setup](./DISCORD_OAUTH_SETUP.md) - Configuration OAuth2
- 📖 [Quickstart](./QUICKSTART.md) - Démarrage rapide
- 📖 [Debug Discord](./DEBUG_DISCORD.md) - Dépannage

### Modules Personnalisés ⭐ **NOUVEAU**
- 📖 [**Guide Rapide Modules**](./MODULES_QUICKSTART.md) - Démarrage rapide (5 min)
- 📖 [**Guide Développeur**](./CUSTOM_MODULES_DEVELOPMENT.md) - Documentation complète (4000+ lignes)
- 📖 [**Guide de Test**](./TESTING_GUIDE.md) - Tests étape par étape
- 📖 [**Status Implémentation**](./IMPLEMENTATION_STATUS.md) - État du système
- 📖 [**Exemples**](./src/bot/modules/custom/examples/) - Modules prêts à l'emploi

---

## 🆕 Nouveautés (Janvier 2025)

### 🔌 Système de modules personnalisés
- ✅ **ModuleLoader** : chargement dynamique sans redémarrage
- ✅ **ModuleValidator** : validation de sécurité automatique
- ✅ **Interface web** : création/upload/déploiement modules
- ✅ **Hot-reload** : rechargement à chaud
- ✅ **Activation par serveur** : contrôle granulaire
- ✅ **Exemples fournis** : ping-custom, auto-role
- ✅ **Documentation complète** : 3 guides + exemples

### ⏰ Système d'expiration automatique
- ✅ **Scheduler intelligent** : vérifie les sanctions expirées toutes les 30s
- ✅ **Unmute/Unban automatiques** : actions Discord appliquées automatiquement
- ✅ **Révocation depuis le site** : révocation web applique action Discord
- ✅ **Gestion d'erreurs** : continue même si serveur inaccessible

### 🆔 Système de permissions avec Discord IDs
- ✅ **Création utilisateurs avec Discord ID** : plus besoin d'attendre connexion OAuth
- ✅ **Placeholder users** : auto-complétion lors de la première connexion
- ✅ **Validation Discord ID** : pattern regex `\d{17,20}`

### 📊 Trust Factor amélioré
- ✅ **Exclusion révocations** : sanctions révoquées ne comptent pas
- ✅ **Affichage modérateur révocateur** : qui a révoqué + quand
- ✅ **Calcul précis** : `100 - (warns*2 + mutes*5 + kicks*10 + bans*20)`

### 🤖 Commandes supplémentaires
- ✅ `/unmute` : retirer timeout manuellement
- ✅ `/unban` : débannir avec Discord ID
- ✅ Script `deploy-commands` : déploiement automatique des slash commands

---

## 🛠️ Scripts disponibles

```bash
# Application complète
npm start              # Démarrer bot + API
npm run dev            # Dev avec nodemon

# Bot uniquement
npm run bot            # Démarrer bot
npm run bot:dev        # Dev bot avec nodemon

# API uniquement
npm run api            # Démarrer API
npm run api:dev        # Dev API avec nodemon

# Utilitaires
npm run deploy-commands  # Déployer commandes slash Discord ⭐ NOUVEAU
npm run seed             # Seed base de données

# Panel web (depuis /panel)
cd panel
npm run serve          # Dev server Vue.js
npm run build          # Build production
npm run lint           # Linter
```

---

## 🐛 Dépannage

### Le bot ne répond pas aux commandes

1. Vérifier que les commandes sont déployées :
   ```bash
   npm run deploy-commands
   ```

2. Vérifier les permissions du bot sur Discord :
   - Scope OAuth2 : `bot` + `applications.commands`
   - Permissions : Administrator (ou permissions spécifiques)

3. Vérifier les logs console pour erreurs

### Les sanctions ne s'affichent pas sur le site

1. Vérifier que MongoDB est connecté
2. Vérifier que `BOT_API_KEY` est identique dans `.env`
3. Consulter [BOT_GUIDE.md](./BOT_GUIDE.md) pour plus de détails

### Les sanctions n'expirent pas automatiquement

1. Vérifier que le scheduler est démarré (logs : "📅 Démarrage du scheduler")
2. Consulter [BOT_GUIDE.md](./BOT_GUIDE.md) section "Système d'expiration automatique"

---

## 👥 Rôles

### MASTER (super-admin global)
- Accès total à tous les serveurs
- Gestion des permissions globales
- Création d'admins de serveur

### GUILD_ADMIN (admin de serveur)
- Configuration du serveur
- Gestion des templates
- Gestion des modérateurs
- Paramétrage de l'escalade

### GUILD_MODERATOR (modérateur de serveur)
- Application des sanctions
- Consultation des logs
- Utilisation des commandes bot

---

## 📜 License

MIT

---

*Dernière mise à jour : Janvier 2025*
