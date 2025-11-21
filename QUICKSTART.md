# Guide de démarrage rapide

## Prérequis

- Node.js 18+ et npm
- MongoDB (local ou cloud)
- Un bot Discord créé sur le [Discord Developer Portal](https://discord.com/developers/applications)

## Installation

### 1. Cloner et installer les dépendances

```bash
cd discord-moderation-bot
npm install

cd panel
npm install
cd ..
```

### 2. Configuration

Copiez le fichier `.env.example` vers `.env` et remplissez les valeurs :

```bash
cp .env.example .env
```

Éditez `.env` :

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/discord-moderation

# API
PORT=3000
JWT_SECRET=changez_moi_avec_une_longue_chaine_aleatoire
BOT_API_KEY=changez_moi_aussi_cle_securisee

# Bot Discord
DISCORD_BOT_TOKEN=votre_token_bot
DISCORD_CLIENT_ID=votre_client_id
DISCORD_CLIENT_SECRET=votre_client_secret

# Master User (premier admin)
MASTER_EMAIL=admin@example.com
MASTER_PASSWORD=MotDePasseSecurise123
MASTER_DISCORD_ID=votre_discord_id
```

### 3. Créer l'utilisateur Master

```bash
npm run seed
```

Cela créera le premier compte administrateur Master.

### 4. Déployer les commandes Discord

```bash
node src/scripts/deploy-commands.js
```

### 5. Démarrer l'application

**Option 1 : Tout démarrer ensemble**
```bash
npm start
```

**Option 2 : Démarrer séparément (recommandé en développement)**

Terminal 1 - API :
```bash
npm run api:dev
```

Terminal 2 - Bot :
```bash
npm run bot:dev
```

Terminal 3 - Panel Vue :
```bash
cd panel
npm run serve
```

## Accès

- **Panel Web** : http://localhost:8080
- **API** : http://localhost:3000

Connectez-vous au panel avec l'email et le mot de passe Master configurés dans `.env`.

## Configuration du Bot Discord

1. Allez sur le [Discord Developer Portal](https://discord.com/developers/applications)
2. Créez une application ou sélectionnez-en une existante
3. Dans l'onglet "Bot" :
   - Copiez le token → `DISCORD_BOT_TOKEN`
   - Activez les intents : `SERVER MEMBERS INTENT`, `MESSAGE CONTENT INTENT` (si nécessaire)
4. Dans l'onglet "General Information" :
   - Copiez "Application ID" → `DISCORD_CLIENT_ID`
5. Dans l'onglet "OAuth2" :
   - Copiez "Client Secret" → `DISCORD_CLIENT_SECRET`
   - Ajoutez l'URL de redirection : `http://localhost:8080/auth/callback`

## Inviter le bot sur votre serveur

URL d'invitation (remplacez YOUR_CLIENT_ID) :

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=1099780063414&scope=bot%20applications.commands
```

Permissions requises :
- Kick Members
- Ban Members
- Timeout Members
- Manage Messages
- View Channels
- Send Messages
- Embed Links

## Premiers pas

1. Connectez-vous au panel web avec le compte Master
2. Allez dans "Administration" → "Serveurs"
3. Sélectionnez votre serveur Discord
4. Configurez :
   - Les rôles Discord autorisés à modérer
   - Les templates de sanctions
   - Les règles d'escalade
5. Assignez des rôles (GUILD_ADMIN / GUILD_MODERATOR) aux utilisateurs

## Commandes Discord disponibles

- `/warn <user> <type> <raison>` - Avertir un utilisateur
- `/mute <user> <type> <raison> [durée]` - Timeout un utilisateur
- `/kick <user> <type> <raison>` - Expulser un utilisateur
- `/ban <user> <type> <raison>` - Bannir un utilisateur
- `/history <user>` - Voir l'historique des sanctions

## Support

Pour toute question ou problème, consultez la documentation complète dans le README.md principal.
