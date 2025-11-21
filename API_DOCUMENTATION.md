# API Documentation

Documentation complète de l'API REST du bot de modération Discord.

## Base URL

```
http://localhost:3000
```

## Authentification

Toutes les routes protégées nécessitent un token JWT dans l'header :

```
Authorization: Bearer <token>
```

Pour les requêtes du bot vers l'API, utilisez :

```
X-Bot-Api-Key: <BOT_API_KEY>
```

---

## Auth Routes

### POST `/auth/login`

Connexion d'un utilisateur.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "username": "John Doe",
    "globalRole": null
  }
}
```

### POST `/auth/register`

Inscription d'un nouvel utilisateur.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "John Doe",
  "discordId": "123456789012345678"
}
```

### GET `/auth/me`

Obtenir l'utilisateur connecté.

**Headers:** `Authorization: Bearer <token>`

---

## Admin Routes (Master only)

### GET `/admin/users`

Liste tous les utilisateurs.

### GET `/admin/users/:userId`

Détails d'un utilisateur avec ses rôles.

### PATCH `/admin/users/:userId/global-role`

Modifier le rôle global d'un utilisateur.

**Body:**
```json
{
  "globalRole": "MASTER"
}
```

### POST `/admin/guilds/:guildId/users/:userId/role`

Assigner un rôle sur une guild.

**Body:**
```json
{
  "role": "GUILD_ADMIN"
}
```

### DELETE `/admin/guilds/:guildId/users/:userId/role`

Retirer un rôle sur une guild.

### GET `/admin/guilds`

Liste tous les serveurs.

---

## Guild Routes

### GET `/guilds/:guildId/config`

Configuration d'une guild.

**Permissions:** GUILD_MODERATOR+

### PUT `/guilds/:guildId/config`

Mettre à jour la configuration.

**Permissions:** GUILD_ADMIN+

**Body:**
```json
{
  "name": "Mon Serveur",
  "moderationRoles": ["role_id_1", "role_id_2"],
  "logChannelId": "channel_id",
  "defaultLanguage": "fr",
  "escalationRules": [
    {
      "infractionType": "spam",
      "levels": [
        { "level": 1, "action": "warn", "durationMs": null },
        { "level": 2, "action": "mute", "durationMs": 3600000 },
        { "level": 3, "action": "ban", "durationMs": null }
      ]
    }
  ]
}
```

---

## Template Routes

### GET `/guilds/:guildId/sanction-templates`

Liste des templates.

**Query params:**
- `active` (boolean) - Filtrer par actif/inactif
- `infractionType` (string) - Filtrer par type

### POST `/guilds/:guildId/sanction-templates`

Créer un template.

**Permissions:** GUILD_ADMIN+

**Body:**
```json
{
  "name": "Spam léger",
  "infractionType": "spam",
  "reason": "Spam de messages",
  "suggestedAction": "warn",
  "emoji": "⚠️"
}
```

### PUT `/guilds/:guildId/sanction-templates/:templateId`

Modifier un template.

### DELETE `/guilds/:guildId/sanction-templates/:templateId`

Supprimer un template.

---

## Moderation Routes

### POST `/guilds/:guildId/moderate`

Appliquer une sanction.

**Permissions:** GUILD_MODERATOR+ ou Bot API Key

**Body:**
```json
{
  "userId": "discord_user_id",
  "moderatorId": "discord_moderator_id",
  "infractionType": "spam",
  "reason": "Spam répété dans le chat",
  "templateId": "template_id_optionnel",
  "overrideAction": "mute",
  "overrideDuration": 3600000
}
```

**Response:**
```json
{
  "success": true,
  "sanction": {
    "_id": "...",
    "guildId": "...",
    "userId": "...",
    "moderatorId": "...",
    "action": "mute",
    "reason": "Spam répété",
    "infractionType": "spam",
    "infractionLevel": 2,
    "durationMs": 3600000,
    "expiresAt": "2024-01-01T13:00:00.000Z",
    "active": true,
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### GET `/guilds/:guildId/sanctions`

Logs de sanctions de la guild.

**Query params:**
- `page` (number) - Page (défaut: 1)
- `limit` (number) - Limite par page (défaut: 50)
- `action` (string) - Filtrer par action
- `activeOnly` (boolean) - Sanctions actives uniquement
- `userId` (string) - Filtrer par utilisateur

### GET `/guilds/:guildId/users/:userId/sanctions`

Historique d'un utilisateur.

### POST `/guilds/:guildId/sanctions/:sanctionId/revoke`

Révoquer une sanction (unmute/unban).

**Body:**
```json
{
  "moderatorId": "discord_moderator_id"
}
```

### POST `/guilds/:guildId/users/:userId/reset-counters`

Réinitialiser les compteurs d'infractions.

**Permissions:** GUILD_ADMIN+

**Body:**
```json
{
  "infractionType": "spam"
}
```

---

## Error Responses

Format standard :

```json
{
  "success": false,
  "message": "Description de l'erreur"
}
```

Status codes :
- `400` - Bad Request (paramètres invalides)
- `401` - Unauthorized (non authentifié)
- `403` - Forbidden (permissions insuffisantes)
- `404` - Not Found
- `500` - Internal Server Error
