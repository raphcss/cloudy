# Test de l'authentification Discord OAuth2

Utilisez ce fichier pour tester manuellement l'authentification.

## Prérequis

1. ✅ Installer form-data : `npm install form-data`
2. ✅ Configurer `.env` avec DISCORD_OAUTH_REDIRECT_URI=http://localhost:8080/login
3. ⚠️ **IMPORTANT** : Aller sur https://discord.com/developers/applications
   - Sélectionner votre application
   - Aller dans OAuth2 > General
   - Ajouter `http://localhost:8080/login` dans les "Redirects"
   - Sauvegarder

## Démarrage

Terminal 1 - API :
```bash
cd c:\Users\rapha\Desktop\Claude\discord-moderation-bot
npm run api:dev
```

Terminal 2 - Panel :
```bash
cd c:\Users\rapha\Desktop\Claude\discord-moderation-bot\panel
npm run serve
```

## Test

1. Ouvrir http://localhost:8080
2. Vous devriez voir un bouton "Se connecter avec Discord"
3. Cliquer dessus
4. Autoriser l'application sur Discord
5. Vous serez redirigé vers le dashboard

## Vérification

Si tout fonctionne :
- ✅ Redirection vers Discord
- ✅ Autorisation de l'application
- ✅ Retour sur le panel avec code
- ✅ Connexion automatique
- ✅ Redirection vers /dashboard

## Problèmes courants

### "Invalid redirect_uri"
➜ L'URL n'est pas configurée sur Discord Developer Portal

### "Erreur lors de l'authentification Discord"
➜ Vérifier les logs de l'API pour voir l'erreur exacte
➜ Vérifier DISCORD_CLIENT_ID et DISCORD_CLIENT_SECRET

### Boucle infinie
➜ Vérifier que DISCORD_OAUTH_REDIRECT_URI correspond exactement à l'URL configurée
