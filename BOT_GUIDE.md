# 🤖 Guide Complet du Bot Discord de Modération

## 📋 Table des matières
1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Démarrage](#démarrage)
4. [Commandes disponibles](#commandes-disponibles)
5. [Système d'escalade](#système-descalade)
6. [Intégration Bot ↔ Site](#intégration-bot--site)
7. [Système d'expiration automatique](#système-dexpiration-automatique)

---

## 🔧 Installation

### Prérequis
- Node.js v18 ou supérieur
- MongoDB v6 ou supérieur
- Un bot Discord créé sur le [Discord Developer Portal](https://discord.com/developers/applications)

### 1. Installer les dépendances
```bash
npm install
```

### 2. Configurer le fichier .env
Créez un fichier `.env` à la racine du projet :

```env
# Discord Bot
DISCORD_BOT_TOKEN=votre_token_bot
DISCORD_CLIENT_ID=votre_client_id
DISCORD_CLIENT_SECRET=votre_client_secret

# MongoDB
MONGODB_URI=mongodb://localhost:27017/discord-moderation

# API
PORT=3000
JWT_SECRET=votre_secret_jwt_tres_long_et_securise
BOT_API_KEY=votre_cle_api_bot_tres_securisee

# OAuth2
DISCORD_REDIRECT_URI=http://localhost:3000/auth/discord/callback
CLIENT_URL=http://localhost:8080
```

### 3. Déployer les commandes slash
```bash
npm run deploy-commands
```

Cette commande enregistre toutes les commandes slash auprès de Discord. Les commandes globales peuvent prendre jusqu'à 1h pour se propager.

---

## 🚀 Démarrage

### Démarrer le bot ET l'API ensemble
```bash
npm start
```

### Démarrer seulement le bot (développement)
```bash
npm run bot:dev
```

### Démarrer seulement l'API (développement)
```bash
npm run api:dev
```

---

## 📖 Commandes disponibles

### 🔨 Commandes de modération

#### `/warn` - Avertir un membre
Avertit un membre pour une infraction.

**Options :**
- `utilisateur` *(requis)* - Le membre à avertir
- `raison` *(requis)* - Raison de l'avertissement
- `type` *(requis)* - Type d'infraction (SPAM, INSULT, HARASSMENT, NSFW, RAID, ADVERTISING, OTHER)

**Permissions :** Modérer les membres

**Exemple :**
```
/warn @User raison:Spam type:SPAM
```

---

#### `/mute` - Mute un membre
Met un membre en timeout (mute).

**Options :**
- `utilisateur` *(requis)* - Le membre à mute
- `raison` *(requis)* - Raison du mute
- `type` *(requis)* - Type d'infraction
- `duree` *(optionnel)* - Durée du mute (1h, 12h, 1day, 3days, 1week)

**Permissions :** Modérer les membres

**Exemple :**
```
/mute @User raison:Flood duree:12h type:SPAM
```

**Note :** Si aucune durée n'est spécifiée, le système d'escalade détermine automatiquement la durée selon l'historique.

---

#### `/unmute` - Retirer un timeout
Retire le timeout d'un membre.

**Options :**
- `utilisateur` *(requis)* - Le membre à unmute
- `raison` *(optionnel)* - Raison de l'unmute

**Permissions :** Modérer les membres

**Exemple :**
```
/unmute @User raison:Erreur de modération
```

---

#### `/kick` - Expulser un membre
Expulse un membre du serveur.

**Options :**
- `utilisateur` *(requis)* - Le membre à kick
- `raison` *(requis)* - Raison du kick
- `type` *(requis)* - Type d'infraction

**Permissions :** Expulser des membres

**Exemple :**
```
/kick @User raison:Comportement toxique type:HARASSMENT
```

---

#### `/ban` - Bannir un membre
Bannit un membre du serveur.

**Options :**
- `utilisateur` *(requis)* - Le membre à bannir
- `raison` *(requis)* - Raison du ban
- `type` *(requis)* - Type d'infraction
- `supprimer-messages` *(optionnel)* - Nombre de jours de messages à supprimer (0-7)

**Permissions :** Bannir des membres

**Exemple :**
```
/ban @User raison:Raid type:RAID supprimer-messages:7
```

---

#### `/unban` - Débannir un utilisateur
Retire le ban d'un utilisateur.

**Options :**
- `userid` *(requis)* - L'ID Discord de l'utilisateur à unban
- `raison` *(optionnel)* - Raison de l'unban

**Permissions :** Bannir des membres

**Exemple :**
```
/unban userid:123456789012345678 raison:Appel accepté
```

**Note :** Nécessite l'ID Discord car l'utilisateur n'est plus dans le serveur.

---

#### `/history` - Voir l'historique
Affiche l'historique des sanctions d'un utilisateur.

**Options :**
- `utilisateur` *(requis)* - L'utilisateur dont voir l'historique

**Permissions :** Modérer les membres

**Exemple :**
```
/history @User
```

**Affiche :**
- Total de sanctions
- Compteurs par type d'infraction
- Les 10 dernières sanctions (avec détails complets)
- Lien vers le panel web pour voir l'historique complet

---

## 🎯 Système d'escalade

Le bot utilise un **système d'escalade automatique** basé sur l'historique des infractions.

### Comment ça fonctionne ?

1. **Compteur par type d'infraction** : Chaque type d'infraction (SPAM, INSULT, etc.) a son propre compteur
2. **Niveaux d'escalade** : Plus un utilisateur commet d'infractions du même type, plus les sanctions sont sévères
3. **Escalade progressive** : warn → mute court → mute long → kick → ban temporaire → ban permanent

### Exemple d'escalade pour SPAM

| Niveau | Action | Durée | Après combien d'infractions |
|--------|--------|-------|----------------------------|
| 1 | WARN | - | 1ère infraction SPAM |
| 2 | MUTE | 1 heure | 2ème infraction SPAM |
| 3 | MUTE | 12 heures | 3ème infraction SPAM |
| 4 | MUTE | 3 jours | 4ème infraction SPAM |
| 5 | KICK | - | 5ème infraction SPAM |
| 6 | BAN | 7 jours | 6ème infraction SPAM |
| 7+ | BAN | Permanent | 7+ infractions SPAM |

### Configuration de l'escalade

L'escalade est configurable par serveur depuis le **Panel Web** :
1. Connectez-vous au panel web
2. Sélectionnez votre serveur
3. Allez dans l'onglet **"Escalade"**
4. Configurez les niveaux pour chaque type d'infraction

---

## 🔄 Intégration Bot ↔ Site

Le bot et le site web sont **complètement synchronisés** grâce à l'API.

### 📡 Bot → Site

Toutes les sanctions appliquées via les commandes Discord sont automatiquement :
- ✅ Enregistrées dans la base de données MongoDB
- ✅ Visibles dans le panel web
- ✅ Comptabilisées dans les statistiques
- ✅ Prises en compte pour le trust factor

**Flux :**
```
/warn @User → Bot appelle API → MongoDB mis à jour → Visible sur le site
```

### 📲 Site → Bot

Les sanctions appliquées depuis le panel web sont automatiquement :
- ✅ Appliquées sur Discord (timeout, ban, etc.)
- ✅ Envoyées en notification DM à l'utilisateur
- ✅ Révoquées automatiquement à expiration

**Flux :**
```
Modérateur clique "Mute" sur le site → API enregistre → Bot applique timeout Discord
```

### 🔐 Authentification API

Le bot utilise une **API Key** pour communiquer avec l'API :
- Header : `X-Bot-Api-Key`
- Valeur : définie dans `.env` (`BOT_API_KEY`)
- Routes protégées : toutes les routes `/moderation/*`

### Endpoints utilisés par le bot

| Endpoint | Méthode | Utilisation |
|----------|---------|-------------|
| `/guilds/:id/moderate` | POST | Appliquer une sanction |
| `/guilds/:id/users/:userId/sanctions` | GET | Récupérer l'historique |
| `/guilds/:id/config` | GET | Récupérer la config d'escalade |
| `/guilds/:id/templates` | GET | Récupérer les templates de sanction |

---

## ⏰ Système d'expiration automatique

Le bot inclut un **scheduler** qui vérifie toutes les 30 secondes les sanctions expirées.

### Fonctionnalités

#### 1. Expiration automatique des mutes
- Les mutes avec durée définie expirent automatiquement
- Le bot retire le timeout Discord
- La sanction est marquée comme `active: false` en base

#### 2. Expiration automatique des bans
- Les bans temporaires expirent automatiquement
- Le bot unban l'utilisateur sur Discord
- La sanction est marquée comme `active: false` en base

#### 3. Révocation depuis le panel web
- Quand un modérateur révoque une sanction sur le site :
  - L'API marque la sanction comme révoquée
  - Le scheduler applique immédiatement l'action Discord (unmute/unban)
  - L'utilisateur reçoit une notification

### Architecture du scheduler

```javascript
// Démarre automatiquement au lancement du bot
client.once('ready', () => {
  const sanctionScheduler = new SanctionSchedulerService(client);
  sanctionScheduler.start(); // Vérifie toutes les 30s
});
```

**Vérifications :**
1. Récupère toutes les sanctions avec `expiresAt <= now` et `active: true`
2. Pour chaque sanction expirée :
   - Si `action === 'mute'` → Retire le timeout Discord
   - Si `action === 'ban'` → Unban l'utilisateur
3. Marque la sanction comme `active: false`

### Gestion des erreurs

Si le serveur Discord est inaccessible ou si l'utilisateur est déjà parti :
- ✅ La sanction est quand même marquée comme expirée en base
- ⚠️ Un warning est loggé dans la console
- ➡️ Le scheduler continue avec les autres sanctions

---

## 🛡️ Système de permissions

### Rôles dans le système

1. **MASTER** (super-admin global) - Accès total
2. **GUILD_ADMIN** - Admin d'un serveur spécifique
3. **GUILD_MODERATOR** - Modérateur d'un serveur spécifique

### Permissions Discord requises

Les commandes nécessitent les permissions Discord suivantes :
- `/warn`, `/mute`, `/unmute`, `/history` → **Modérer les membres**
- `/kick` → **Expulser des membres**
- `/ban`, `/unban` → **Bannir des membres**

### Vérifications de permissions

Le bot vérifie automatiquement :
1. ✅ Permissions Discord de l'utilisateur
2. ✅ Rôle dans le système (via API `canModerate()`)
3. ✅ Hiérarchie des rôles (impossible de modérer un rôle supérieur)

---

## 📊 Logs et monitoring

### Console du bot

Le bot affiche en temps réel :
- ✅ Commandes chargées au démarrage
- ✅ Événements chargés
- ✅ Connexion à MongoDB
- ⏰ Sanctions expirées détectées
- ❌ Erreurs et warnings

### Panel Web - Onglet "Logs"

Le panel web affiche :
- Toutes les sanctions appliquées
- Date, heure, modérateur
- Utilisateur ciblé
- Type d'action et raison
- Statut (actif/révoqué)

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

1. Vérifier que MongoDB est connecté :
   ```bash
   # Dans les logs, chercher :
   ✅ MongoDB connecté
   ```

2. Vérifier que `BOT_API_KEY` est identique dans :
   - `.env` (racine)
   - Variable d'environnement du bot

3. Tester l'API manuellement :
   ```bash
   curl -H "X-Bot-Api-Key: votre_cle" http://localhost:3000/guilds/GUILD_ID/sanctions
   ```

### Les sanctions n'expirent pas automatiquement

1. Vérifier que le scheduler est démarré :
   ```bash
   # Dans les logs, chercher :
   📅 Démarrage du scheduler de sanctions...
   ```

2. Vérifier que les sanctions ont une `expiresAt` définie :
   ```javascript
   // Dans MongoDB
   db.sanctions.find({ expiresAt: { $exists: true, $ne: null } })
   ```

3. Vérifier les logs du scheduler :
   ```bash
   # Toutes les 30s, devrait afficher :
   ⏰ X sanctions expirées trouvées
   ```

---

## 🔐 Sécurité

### Bonnes pratiques

1. **Ne jamais commit le .env**
   - Ajouté dans `.gitignore`
   - Utiliser `.env.example` pour le template

2. **Générer des secrets forts**
   ```javascript
   // JWT_SECRET (64+ caractères)
   require('crypto').randomBytes(64).toString('hex')
   
   // BOT_API_KEY (32+ caractères)
   require('crypto').randomBytes(32).toString('hex')
   ```

3. **Limiter les permissions du bot**
   - Ne donner que les permissions nécessaires
   - Éviter `Administrator` en production

4. **Rate limiting**
   - L'API a déjà un rate limiter configuré
   - 100 requêtes / 15 minutes par IP

---

## 📚 Ressources supplémentaires

- [Documentation Discord.js](https://discord.js.org/)
- [Guide des Slash Commands](https://discord.com/developers/docs/interactions/application-commands)
- [API Documentation](./API_DOCUMENTATION.md)
- [Discord Developer Portal](https://discord.com/developers/applications)

---

## 🆘 Support

En cas de problème :
1. Vérifier les logs du bot et de l'API
2. Consulter les fichiers `DEBUG_DISCORD.md` et `API_DOCUMENTATION.md`
3. Vérifier que toutes les dépendances sont installées
4. S'assurer que MongoDB est en cours d'exécution

---

*Dernière mise à jour : Janvier 2025*
