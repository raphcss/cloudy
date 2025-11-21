module.exports = {
  // Rôles globaux
  ROLES: {
    MASTER: 'MASTER',
    GUILD_ADMIN: 'GUILD_ADMIN',
    GUILD_MODERATOR: 'GUILD_MODERATOR',
  },

  // Actions de modération
  SANCTION_ACTIONS: {
    WARN: 'warn',
    MUTE: 'mute',
    KICK: 'kick',
    BAN: 'ban',
    UNMUTE: 'unmute',
    UNBAN: 'unban',
  },

  // Types d'infractions
  INFRACTION_TYPES: {
    SPAM: 'spam',
    TOXICITY: 'toxicity',
    HARASSMENT: 'harassment',
    ADVERTISING: 'advertising',
    NSFW: 'nsfw',
    RAID: 'raid',
    INSULT: 'insult',
    OTHER: 'other',
  },

  // Durées prédéfinies (en millisecondes)
  DURATIONS: {
    HOUR: 3600000,
    HOURS_12: 43200000,
    DAY: 86400000,
    DAYS_3: 259200000,
    WEEK: 604800000,
    MONTH: 2592000000,
  },

  // Permissions Discord requises
  DISCORD_PERMISSIONS: {
    MODERATE_MEMBERS: 'ModerateMembers',
    KICK_MEMBERS: 'KickMembers',
    BAN_MEMBERS: 'BanMembers',
    MANAGE_MESSAGES: 'ManageMessages',
  },

  // URL d'invitation du bot (permissions: 1099511627910)
  // Permissions: Gérer les rôles, Expulser, Bannir, Timeout, Gérer les messages, Envoyer des messages, Utiliser des commandes
  BOT_INVITE_URL: process.env.BOT_INVITE_URL || 'https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=1099511627910&scope=bot%20applications.commands',
};

