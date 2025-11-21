# Débogage Discord OAuth2

## Problèmes courants et solutions

### 1. "Erreur lors de la redirection vers Discord"

**Causes possibles :**
- Variables d'environnement manquantes ou incorrectes
- L'API n'est pas démarrée
- Problème CORS

**Vérifications :**

1. **Vérifier les variables d'environnement** (`.env`) :
```bash
DISCORD_CLIENT_ID=976601943252295700
DISCORD_CLIENT_SECRET=votre_secret
DISCORD_OAUTH_REDIRECT_URI=http://localhost:8080/login
```

2. **Vérifier que l'API est démarrée** :
```bash
cd c:\Users\rapha\Desktop\Claude\discord-moderation-bot
node src/index.js
```

3. **Vérifier les logs dans la console du navigateur** (F12)
   - Chercher les messages `[Discord OAuth]`
   - Vérifier l'URL générée

4. **Tester l'endpoint API directement** :
```bash
curl http://localhost:3000/api/auth/discord
```

Devrait retourner :
```json
{
  "success": true,
  "url": "https://discord.com/api/oauth2/authorize?client_id=..."
}
```

### 2. "invalid_request" après redirection Discord

**Cause :** L'URL de redirection n'est pas configurée sur Discord Developer Portal

**Solution :**
1. Aller sur https://discord.com/developers/applications
2. Sélectionner votre application (ID: `976601943252295700`)
3. Aller dans **OAuth2 > General**
4. Dans **Redirects**, ajouter **exactement** :
   ```
   http://localhost:8080/login
   ```
5. Cliquer sur **Save Changes**

⚠️ **IMPORTANT** : L'URL doit correspondre EXACTEMENT (pas de `/` final, même protocole, même port)

### 3. "Unauthorized" lors de l'échange du code

**Causes possibles :**
- `DISCORD_CLIENT_SECRET` incorrect
- Le code a déjà été utilisé (codes à usage unique)
- Le code a expiré (10 minutes max)

**Solution :**
1. Vérifier le `CLIENT_SECRET` dans le `.env`
2. Retester la connexion (nouveau code)
3. Vérifier les logs de l'API pour voir l'erreur exacte Discord

### 4. Vérifier la configuration complète

**Checklist :**
- [ ] MongoDB est démarré (`mongod` ou service)
- [ ] API démarrée sur port 3000
- [ ] Panel démarré sur port 8080
- [ ] `.env` contient les bonnes variables
- [ ] Redirect URI configuré sur Discord Portal
- [ ] CLIENT_ID et CLIENT_SECRET corrects

## Logs utiles

### Côté Frontend (Console navigateur - F12)
```
[Discord OAuth] Demande de l'URL d'authentification...
[Discord OAuth] Redirection vers Discord: https://discord.com/...
[Discord OAuth] Code reçu depuis Discord: ABC123...
[Discord OAuth] Envoi du code à l'API...
[Discord OAuth] Connexion réussie, redirection vers dashboard
```

### Côté Backend (Terminal API)
```
[Discord OAuth] URL générée: https://discord.com/api/oauth2/authorize...
[Discord OAuth] Redirect URI: http://localhost:8080/login
[Discord OAuth] Code reçu: ABC123...
[Discord OAuth] Échange du code contre un token...
[Discord OAuth] Token reçu avec succès
[Discord OAuth] Utilisateur Discord récupéré: username - 123456789
[Discord OAuth] Nouvel utilisateur créé
[Discord OAuth] Connexion réussie pour: username
```

## Test manuel complet

1. **Démarrer MongoDB** :
```bash
# Windows
mongod
```

2. **Démarrer l'API** (Terminal 1) :
```bash
cd c:\Users\rapha\Desktop\Claude\discord-moderation-bot
node src/index.js
```

Attendez : `✅ API démarrée sur le port 3000`

3. **Démarrer le Panel** (Terminal 2) :
```bash
cd c:\Users\rapha\Desktop\Claude\discord-moderation-bot\panel
npm run serve
```

Attendez : `App running at: http://localhost:8080/`

4. **Ouvrir le navigateur** :
   - Aller sur http://localhost:8080
   - Ouvrir la console (F12)
   - Cliquer sur "Se connecter avec Discord"
   - Regarder les logs dans la console et dans les terminaux

5. **Autoriser l'application sur Discord**

6. **Vérifier la redirection vers le dashboard**

## URL de test directe

Pour tester directement l'URL Discord OAuth :

```
https://discord.com/api/oauth2/authorize?client_id=976601943252295700&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Flogin&response_type=code&scope=identify%20email%20guilds
```

Si cette URL ne fonctionne pas, le problème vient de la configuration Discord Portal.

## Contact support Discord

Si le problème persiste, vérifier :
- Status Discord : https://discordstatus.com/
- Documentation OAuth2 : https://discord.com/developers/docs/topics/oauth2
