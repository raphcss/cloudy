const { Sanction, Guild, GuildConfig } = require('../../models');
const { ROLES } = require('../../config/constants');

/**
 * Obtenir les serveurs Discord de l'utilisateur connecté
 */
const getUserGuilds = async (req, res) => {
  try {
    const userId = req.user.id;
    const userDiscordId = req.user.discordId;

    // Les Masters voient tous les serveurs
    if (req.user.globalRole === ROLES.MASTER) {
      const guilds = await Guild.find().select('guildId name icon configured active memberCount');
      
      // Pour chaque guild, vérifier si le bot est présent
      const discordClient = req.app.get('discordClient');
      const guildsData = [];
      
      for (const guild of guilds) {
        const botPresent = discordClient?.guilds.cache.has(guild.guildId) || false;
        
        guildsData.push({
          guildId: guild.guildId,
          name: guild.name,
          icon: guild.icon,
          configured: guild.configured,
          active: guild.active,
          memberCount: guild.memberCount,
          botPresent,
        });
      }
      
      return res.json({
        success: true,
        guilds: guildsData,
      });
    }

    // Pour les utilisateurs normaux, filtrer par permissions Discord
    if (!userDiscordId) {
      return res.json({
        success: true,
        guilds: [],
      });
    }

    const discordClient = req.app.get('discordClient');
    if (!discordClient) {
      return res.status(503).json({
        success: false,
        message: 'Bot Discord non disponible',
      });
    }

    const guilds = await Guild.find().select('guildId name icon configured active memberCount');
    const accessibleGuilds = [];

    for (const guild of guilds) {
      try {
        console.log(`[getUserGuilds] Checking guild ${guild.guildId} (${guild.name})`);
        const botPresent = discordClient.guilds.cache.has(guild.guildId);
        console.log(`[getUserGuilds] Bot present:`, botPresent);
        
        if (!botPresent) {
          // Le bot n'est pas sur ce serveur, ne pas l'afficher
          // L'utilisateur ne peut pas gérer un serveur où le bot n'est pas présent
          continue;
        }

        const discordGuild = await discordClient.guilds.fetch(guild.guildId);
        
        // Vérifier si l'utilisateur est propriétaire
        console.log(`[getUserGuilds] Owner ID: ${discordGuild.ownerId}, User ID: ${userDiscordId}`);
        if (discordGuild.ownerId === userDiscordId) {
          console.log(`[getUserGuilds] User is owner - granting access`);
          accessibleGuilds.push({
            guildId: guild.guildId,
            name: guild.name,
            icon: guild.icon,
            configured: guild.configured,
            active: guild.active,
            memberCount: guild.memberCount,
            botPresent: true,
          });
          continue;
        }

        // Vérifier si l'utilisateur est membre du serveur
        let member;
        try {
          member = await discordGuild.members.fetch(userDiscordId);
          console.log(`[getUserGuilds] User is member of guild`);
        } catch (error) {
          // L'utilisateur n'est pas membre de ce serveur
          console.log(`[getUserGuilds] User is NOT a member of this guild - skipping`);
          continue;
        }

        // Vérifier la config du serveur
        const guildConfig = await GuildConfig.findOne({ guildId: guild.guildId });
        
        if (!guildConfig) {
          // Pas de config, seul le propriétaire peut accéder (déjà vérifié)
          console.log(`[getUserGuilds] No config found - skipping (not owner)`);
          continue;
        }

        console.log(`[getUserGuilds] Config found. Moderation roles:`, guildConfig.moderationRoles);
        console.log(`[getUserGuilds] User roles:`, member.roles.cache.map(r => `${r.name} (${r.id})`));

        // Vérifier si l'utilisateur a un rôle de modération
        const hasModerationRole = member.roles.cache.some(role => 
          guildConfig.moderationRoles.includes(role.id)
        );

        console.log(`[getUserGuilds] Has moderation role:`, hasModerationRole);

        if (hasModerationRole) {
          console.log(`[getUserGuilds] Granting access via moderation role`);
          accessibleGuilds.push({
            guildId: guild.guildId,
            name: guild.name,
            icon: guild.icon,
            configured: guild.configured,
            active: guild.active,
            memberCount: guild.memberCount,
            botPresent: true,
          });
        } else {
          console.log(`[getUserGuilds] No moderation role - access denied`);
        }
      } catch (error) {
        console.error(`Erreur lors de la vérification du serveur ${guild.guildId}:`, error);
        // Continuer avec le prochain serveur
      }
    }

    res.json({
      success: true,
      guilds: accessibleGuilds,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des serveurs:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Obtenir le nombre total de sanctions d'un utilisateur sur tous les serveurs
 */
const getUserGlobalSanctions = async (req, res) => {
  try {
    const { userId } = req.params;

    // Compter toutes les sanctions de cet utilisateur (exclure les révoquées)
    const totalSanctions = await Sanction.countDocuments({ 
      userId,
      revokedAt: null // Exclure les sanctions révoquées
    });

    // Compter les sanctions actives
    const activeSanctions = await Sanction.countDocuments({
      userId,
      active: true,
      revokedAt: null,
    });

    // Compter par type d'action (exclure les révoquées)
    const sanctionsByType = await Sanction.aggregate([
      { $match: { userId, revokedAt: null } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
    ]);

    // Nombre de serveurs différents
    const guilds = await Sanction.distinct('guildId', { userId });

    // Calculer le Trust Factor (0-100)
    // Formule: 100 - (warns * 2 + mutes * 5 + kicks * 10 + bans * 20)
    const sanctionsMap = sanctionsByType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const warns = sanctionsMap.warn || 0;
    const mutes = sanctionsMap.mute || 0;
    const kicks = sanctionsMap.kick || 0;
    const bans = sanctionsMap.ban || 0;

    let trustScore = 100;
    trustScore -= warns * 2;
    trustScore -= mutes * 5;
    trustScore -= kicks * 10;
    trustScore -= bans * 20;

    // Bonus si aucune sanction active mais historique existant
    if (activeSanctions === 0 && totalSanctions > 0) {
      trustScore += 10;
    }

    // Pénalité si beaucoup de serveurs différents
    if (guilds.length > 1) {
      trustScore -= (guilds.length - 1) * 3;
    }

    // Limiter entre 0 et 100
    trustScore = Math.max(0, Math.min(100, trustScore));

    // Déterminer le niveau de confiance
    let trustLevel = 'excellent';
    let trustColor = '#48bb78'; // green
    if (trustScore < 30) {
      trustLevel = 'très faible';
      trustColor = '#8b0000'; // dark red
    } else if (trustScore < 50) {
      trustLevel = 'faible';
      trustColor = '#f56565'; // red
    } else if (trustScore < 70) {
      trustLevel = 'moyen';
      trustColor = '#ed8936'; // orange
    } else if (trustScore < 85) {
      trustLevel = 'bon';
      trustColor = '#4299e1'; // blue
    }

    console.log(`[getUserGlobalSanctions] User ${userId} - Trust Factor: ${trustScore}/100 (${trustLevel})`);

    res.json({
      success: true,
      totalSanctions,
      activeSanctions,
      guildsCount: guilds.length,
      sanctionsByType: sanctionsMap,
      trustFactor: {
        score: trustScore,
        level: trustLevel,
        color: trustColor,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des sanctions globales:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getUserGlobalSanctions,
  getUserGuilds,
};
