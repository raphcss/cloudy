const { GuildRoleBinding } = require('../../models');
const { GuildConfig } = require('../../models');
const { ROLES } = require('../../config/constants');

/**
 * Middleware pour vérifier que l'utilisateur est Master
 */
const requireMaster = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise',
    });
  }

  console.log('[requireMaster] User:', req.user);
  console.log('[requireMaster] User globalRole:', req.user.globalRole);
  console.log('[requireMaster] ROLES.MASTER:', ROLES.MASTER);
  console.log('[requireMaster] Comparison:', req.user.globalRole !== ROLES.MASTER);

  if (req.user.globalRole !== ROLES.MASTER) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé : rôle Master requis',
      debug: {
        userRole: req.user.globalRole,
        requiredRole: ROLES.MASTER,
      },
    });
  }

  next();
};

/**
 * Middleware pour vérifier le rôle sur une guild spécifique
 * @param {String|Array} requiredRoles - Rôle(s) requis (GUILD_ADMIN, GUILD_MODERATOR)
 * @param {Boolean} allowMaster - Autoriser les Masters (par défaut: true)
 */
const requireGuildRole = (requiredRoles, allowMaster = true) => {
  // Normaliser en tableau
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentification requise',
        });
      }

      // Les Masters ont accès à tout
      if (allowMaster && req.user.globalRole === ROLES.MASTER) {
        return next();
      }

      // Récupérer le guildId depuis les paramètres
      const guildId = req.params.guildId;

      if (!guildId) {
        return res.status(400).json({
          success: false,
          message: 'Guild ID manquant',
        });
      }

      console.log('[requireGuildRole] User:', req.user);
      console.log('[requireGuildRole] Guild ID:', guildId);
      console.log('[requireGuildRole] Discord ID:', req.user.discordId);

      // Vérifier que l'utilisateur a un discordId
      if (!req.user.discordId) {
        return res.status(403).json({
          success: false,
          message: 'Compte Discord non lié. Veuillez lier votre compte Discord dans votre profil.',
        });
      }

      // Récupérer le bot Discord
      const discordClient = req.app.get('discordClient');
      if (!discordClient) {
        return res.status(503).json({
          success: false,
          message: 'Bot Discord non disponible',
        });
      }

      // Vérifier d'abord si l'utilisateur est le propriétaire du serveur
      try {
        const guild = await discordClient.guilds.fetch(guildId);
        console.log('[requireGuildRole] Guild fetched:', guild.name);

        // Vérifier si l'utilisateur est membre du serveur
        let member;
        try {
          member = await guild.members.fetch(req.user.discordId);
          console.log('[requireGuildRole] Member fetched:', member.user.username);
        } catch (error) {
          console.log('[requireGuildRole] User not a member of this guild');
          return res.status(403).json({
            success: false,
            message: 'Vous n\'êtes pas membre de ce serveur Discord',
          });
        }

        // Vérifier si l'utilisateur est le propriétaire du serveur
        const isOwner = guild.ownerId === req.user.discordId;
        console.log('[requireGuildRole] Is server owner:', isOwner);

        if (isOwner) {
          // Le propriétaire a tous les droits, même si la config n'existe pas encore
          req.guildRole = ROLES.GUILD_ADMIN;
          req.guildId = guildId;
          console.log('[requireGuildRole] Access granted (owner), role: GUILD_ADMIN');
          return next();
        }

        // Si pas owner, on vérifie la config et les rôles
        const guildConfig = await GuildConfig.findOne({ guildId });
        if (!guildConfig) {
          return res.status(404).json({
            success: false,
            message: 'Serveur non configuré',
          });
        }

        console.log('[requireGuildRole] Guild config found:', guildConfig.guildId);
        console.log('[requireGuildRole] Moderation roles:', guildConfig.moderationRoles);
        console.log('[requireGuildRole] Member roles:', member.roles.cache.map(r => `${r.name} (${r.id})`));

        // Vérifier si l'utilisateur a un rôle de modération Discord
        const hasModerationRole = member.roles.cache.some(role => 
          guildConfig.moderationRoles.includes(role.id)
        );

        console.log('[requireGuildRole] Has moderation role:', hasModerationRole);

        if (!hasModerationRole) {
          return res.status(403).json({
            success: false,
            message: 'Vous n\'avez pas les rôles Discord nécessaires pour accéder à ce serveur',
            debug: {
              userRoles: member.roles.cache.map(r => ({ id: r.id, name: r.name })),
              requiredRoles: guildConfig.moderationRoles,
            },
          });
        }

        // Attribuer le rôle panel approprié
        // Pour les actions admin spécifiques, vérifier GuildRoleBinding
        if (roles.includes(ROLES.GUILD_ADMIN)) {
          const roleBinding = await GuildRoleBinding.findOne({
            guildId,
            userId: req.user.id,
            role: ROLES.GUILD_ADMIN,
          });

          if (roleBinding) {
            req.guildRole = ROLES.GUILD_ADMIN;
          } else {
            // A un rôle Discord mais pas GUILD_ADMIN panel
            req.guildRole = ROLES.GUILD_MODERATOR;
          }
        } else {
          // Pour GUILD_MODERATOR, avoir un rôle Discord suffit
          req.guildRole = ROLES.GUILD_MODERATOR;
        }

        req.guildId = guildId;
        console.log('[requireGuildRole] Access granted, role:', req.guildRole);
        next();
      } catch (error) {
        console.error('Erreur lors de la vérification des rôles Discord:', error);
        return res.status(403).json({
          success: false,
          message: 'Impossible de vérifier vos permissions Discord',
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
};

/**
 * Middleware pour vérifier GUILD_ADMIN ou Master
 */
const requireGuildAdmin = requireGuildRole(ROLES.GUILD_ADMIN, true);

/**
 * Middleware pour vérifier GUILD_MODERATOR ou supérieur
 */
const requireGuildModerator = requireGuildRole(
  [ROLES.GUILD_ADMIN, ROLES.GUILD_MODERATOR],
  true
);

/**
 * Vérifie si l'utilisateur a un certain rôle sur une guild
 * Utilitaire réutilisable
 */
const hasGuildRole = async (userId, guildId, requiredRole) => {
  const roleBinding = await GuildRoleBinding.findOne({
    guildId,
    userId,
  });

  if (!roleBinding) return false;

  // GUILD_ADMIN a tous les droits d'un GUILD_MODERATOR
  if (requiredRole === ROLES.GUILD_MODERATOR) {
    return roleBinding.role === ROLES.GUILD_ADMIN || 
           roleBinding.role === ROLES.GUILD_MODERATOR;
  }

  return roleBinding.role === requiredRole;
};

module.exports = {
  requireMaster,
  requireGuildRole,
  requireGuildAdmin,
  requireGuildModerator,
  hasGuildRole,
};
