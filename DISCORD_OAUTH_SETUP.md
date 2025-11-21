# Configuration Discord OAuth2

## Étapes pour configurer Discord OAuth2

### 1. Accéder au Discord Developer Portal

Allez sur https://discord.com/developers/applications et sélectionnez votre application.

### 2. Configurer OAuth2

1. Dans le menu de gauche, cliquez sur **OAuth2**
2. Cliquez sur **General** 

### 3. Ajouter l'URL de redirection

Dans la section "Redirects", ajoutez l'URL suivante :

```
http://localhost:8080/login
```

**Pour la production**, ajoutez également :
```
https://votre-domaine.com/login
```

### 4. Scopes nécessaires

Les scopes suivants seront demandés lors de la connexion :
- `identify` - Pour obtenir l'ID et le nom d'utilisateur Discord
- `email` - Pour obtenir l'email de l'utilisateur

### 5. Vérifier les variables d'environnement

Dans votre fichier `.env`, assurez-vous d'avoir :

```env
DISCORD_CLIENT_ID=votre_client_id
DISCORD_CLIENT_SECRET=votre_client_secret
DISCORD_OAUTH_REDIRECT_URI=http://localhost:8080/login
```

### 6. Tester la connexion

1. Démarrez l'API : `npm run api:dev`
2. Démarrez le panel : `cd panel && npm run serve`
3. Accédez à http://localhost:8080
4. Cliquez sur "Se connecter avec Discord"
5. Autorisez l'application
6. Vous serez redirigé vers le dashboard

## Fonctionnement

1. L'utilisateur clique sur "Se connecter avec Discord"
2. Il est redirigé vers Discord pour autoriser l'application
3. Discord redirige vers `/login?code=...`
4. Le panel envoie le code à l'API via `POST /auth/discord/callback`
5. L'API échange le code contre un access token Discord
6. L'API récupère les informations de l'utilisateur Discord
7. L'utilisateur est créé/mis à jour dans la DB
8. Un token JWT est généré et retourné au panel
9. L'utilisateur est connecté au panel

## Première connexion

Lors de la première connexion d'un utilisateur :
- Un compte est automatiquement créé avec son Discord ID
- Son nom d'utilisateur et avatar sont synchronisés
- Il n'a aucun rôle par défaut (ni Master, ni Admin, ni Moderator)
- Un Master doit lui assigner des rôles via le panel

## Important

⚠️ N'oubliez pas de mettre à jour l'URL de redirection sur Discord Developer Portal !
