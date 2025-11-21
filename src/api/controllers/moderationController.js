const ModerationService = require('../../services/moderationService');
const EscalationService = require('../../services/escalationService');
const { ModerationLog, InfractionType } = require('../../models');

/**
 * Appliquer une sanction (utilisé par le bot et le panel)
 */
const moderate = async (req, res) => {
  try {
    const { guildId } = req.params;
    const {
      userId,
      moderatorId,
      infractionType,
      reason,
      templateId,
    } = req.body;

    // Validation
    if (!userId || !moderatorId || !infractionType) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres manquants',
      });
    }

    // Si pas de raison fournie, utiliser le label du type d'infraction
    let finalReason = reason;
    if (!finalReason || !finalReason.trim()) {
      const infractionTypeDoc = await InfractionType.findOne({
        guildId,
        key: infractionType,
      });
      finalReason = infractionTypeDoc?.label || infractionType;
    }

    // Récupérer les noms d'utilisateurs depuis Discord
    let userName = null;
    let moderatorName = null;
    const discordClient = req.app.get('discordClient');
    
    if (discordClient && discordClient.isReady()) {
      try {
        const user = await discordClient.users.fetch(userId).catch(() => null);
        if (user) userName = user.tag;
        
        const moderator = await discordClient.users.fetch(moderatorId).catch(() => null);
        if (moderator) moderatorName = moderator.tag;
      } catch (error) {
        console.log('[moderate] Erreur lors de la récupération des noms Discord');
      }
    }

    // Si un templateId est fourni, utiliser le template
    let sanction;
    if (templateId) {
      sanction = await ModerationService.applySanctionFromTemplate(
        guildId,
        userId,
        moderatorId,
        templateId,
        userName,
        moderatorName
      );
    } else {
      // Sinon, appliquer avec escalade automatique
      sanction = await ModerationService.applySanction({
        guildId,
        userId,
        moderatorId,
        infractionType,
        reason: finalReason,
        userName,
        moderatorName,
      });
    }

    // Appliquer la sanction dans Discord (si panel web)
    if (discordClient && discordClient.isReady()) {
      try {
        const guild = await discordClient.guilds.fetch(guildId);
        
        if (guild) {
          const member = await guild.members.fetch(userId).catch(() => null);
          
          if (sanction.action === 'mute' && member) {
            const duration = sanction.durationMs || 3600000; // 1h par défaut
            await member.timeout(duration, finalReason);
            console.log(`[moderate] Timeout appliqué à ${userId} pour ${duration}ms`);
          } else if (sanction.action === 'kick' && member) {
            await member.kick(finalReason);
            console.log(`[moderate] Kick appliqué à ${userId}`);
          } else if (sanction.action === 'ban') {
            await guild.members.ban(userId, { reason: finalReason });
            console.log(`[moderate] Ban appliqué à ${userId}`);
          }
          
          // Envoyer un MP à l'utilisateur
          try {
            const user = await discordClient.users.fetch(userId);
            const { EmbedBuilder } = require('discord.js');
            
            const dmEmbed = new EmbedBuilder()
              .setColor(sanction.action === 'warn' ? '#FFA500' : '#FF0000')
              .setTitle(getActionEmoji(sanction.action) + ' ' + getActionTitle(sanction.action))
              .setDescription(`Vous avez reçu une sanction sur **${guild.name}**`)
              .addFields(
                { name: 'Raison', value: finalReason },
                { name: 'Type', value: infractionType },
                { name: 'Action', value: getActionLabel(sanction.action) },
                { name: 'Niveau', value: `${sanction.infractionLevel}${sanction.infractionLevel === 1 ? 'ère' : 'ème'} infraction de ce type` }
              );

            if (sanction.durationMs) {
              dmEmbed.addFields({ name: 'Durée', value: formatDuration(sanction.durationMs) });
            }

            dmEmbed.setFooter({ text: 'Les infractions répétées entraînent des sanctions progressives' })
              .setTimestamp();

            await user.send({ embeds: [dmEmbed] });
          } catch (error) {
            console.log('[moderate] Impossible d\'envoyer un MP à l\'utilisateur');
          }
        }
      } catch (error) {
        console.error('[moderate] Erreur lors de l\'application Discord:', error);
        // Ne pas bloquer la réponse même si Discord échoue
      }
    }

    res.status(201).json({
      success: true,
      sanction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Révoquer une sanction (unmute/unban)
 */
const revokeSanction = async (req, res) => {
  try {
    const { sanctionId } = req.params;
    const { moderatorId } = req.body;

    if (!moderatorId) {
      return res.status(400).json({
        success: false,
        message: 'moderatorId requis',
      });
    }

    const sanction = await ModerationService.revokeSanction(sanctionId, moderatorId);

    // Appliquer la révocation dans Discord (unmute/unban)
    const discordClient = req.app.get('discordClient');
    if (discordClient && discordClient.sanctionScheduler) {
      await discordClient.sanctionScheduler.applyRevocation(sanction);
    }

    res.json({
      success: true,
      sanction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Obtenir les sanctions d'une guild
 */
const getGuildSanctions = async (req, res) => {
  try {
    const { guildId } = req.params;
    const { page, limit, action, activeOnly, userId } = req.query;

    const result = await ModerationService.getGuildSanctions(guildId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      action,
      activeOnly: activeOnly === 'true',
      userId,
    });

    // Enrichir les sanctions avec les noms des modérateurs et utilisateurs
    const client = req.app.get('discordClient');
    if (client && client.isReady()) {
      const guild = client.guilds.cache.get(guildId);
      
      if (guild) {
        const enrichedSanctions = await Promise.all(
          result.sanctions.map(async (sanction) => {
            const sanctionObj = sanction.toObject();
            
            // Récupérer le nom du modérateur
            try {
              const moderator = await guild.members.fetch(sanction.moderatorId);
              sanctionObj.moderatorName = moderator.user.globalName || moderator.user.username;
            } catch (err) {
              sanctionObj.moderatorName = null;
            }
            
            // Récupérer le nom du modérateur qui a révoqué (si révoquée)
            if (sanctionObj.revokedBy) {
              try {
                const revoker = await guild.members.fetch(sanctionObj.revokedBy);
                sanctionObj.revokedByName = revoker.user.globalName || revoker.user.username;
              } catch (err) {
                sanctionObj.revokedByName = null;
              }
            }
            
            // Récupérer le nom de l'utilisateur sanctionné
            try {
              const user = await guild.members.fetch(sanction.userId);
              sanctionObj.userName = user.user.globalName || user.user.username;
            } catch (err) {
              sanctionObj.userName = null;
            }
            
            return sanctionObj;
          })
        );
        
        result.sanctions = enrichedSanctions;
      }
    }

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Obtenir les sanctions d'un utilisateur
 */
const getUserSanctions = async (req, res) => {
  try {
    const { guildId, userId } = req.params;
    const { page, limit, activeOnly } = req.query;

    const result = await ModerationService.getUserSanctions(guildId, userId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      activeOnly: activeOnly === 'true',
    });

    // Enrichir les sanctions avec les noms des modérateurs et utilisateurs
    const client = req.app.get('discordClient');
    if (client && client.isReady()) {
      const guild = client.guilds.cache.get(guildId);
      
      if (guild) {
        const enrichedSanctions = await Promise.all(
          result.sanctions.map(async (sanction) => {
            const sanctionObj = sanction.toObject();
            
            // Récupérer le nom du modérateur
            try {
              const moderator = await guild.members.fetch(sanction.moderatorId);
              sanctionObj.moderatorName = moderator.user.globalName || moderator.user.username;
            } catch (err) {
              sanctionObj.moderatorName = null;
            }
            
            // Récupérer le nom du modérateur qui a révoqué (si révoquée)
            if (sanctionObj.revokedBy) {
              try {
                const revoker = await guild.members.fetch(sanctionObj.revokedBy);
                sanctionObj.revokedByName = revoker.user.globalName || revoker.user.username;
              } catch (err) {
                sanctionObj.revokedByName = null;
              }
            }
            
            // Récupérer le nom de l'utilisateur sanctionné
            try {
              const user = await guild.members.fetch(sanction.userId);
              sanctionObj.userName = user.user.globalName || user.user.username;
            } catch (err) {
              sanctionObj.userName = null;
            }
            
            return sanctionObj;
          })
        );
        
        result.sanctions = enrichedSanctions;
      }
    }

    // Récupérer les compteurs d'infractions
    const counters = await EscalationService.getCounters(guildId, userId);

    res.json({
      success: true,
      ...result,
      counters,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Réinitialiser le compteur d'infractions d'un utilisateur
 */
const resetUserCounters = async (req, res) => {
  try {
    const { guildId, userId } = req.params;
    const { infractionType } = req.body;

    await EscalationService.resetCounter(guildId, userId, infractionType);

    res.json({
      success: true,
      message: 'Compteur réinitialisé avec succès',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Obtenir les logs de modération d'une guild
 */
const getGuildModerationLogs = async (req, res) => {
  try {
    const { guildId } = req.params;
    const { page = 1, limit = 50, userId = null } = req.query;

    const filter = { guildId };
    
    if (userId) {
      filter.userId = userId;
    }

    const logs = await ModerationLog.find(filter)
      .populate('relatedSanctionId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean(); // Convertir en objets JavaScript simples

    const total = await ModerationLog.countDocuments(filter);

    // Enrichir avec les noms d'utilisateurs depuis Discord
    const discordClient = req.app.get('discordClient');
    if (discordClient && discordClient.isReady()) {
      for (const log of logs) {
        // Récupérer le nom de l'utilisateur
        if (log.userId && !log.userName) {
          try {
            const user = await discordClient.users.fetch(log.userId);
            log.userName = user.tag;
          } catch (error) {
            // Utilisateur introuvable sur Discord
            console.log(`[getModerationLogs] Utilisateur ${log.userId} introuvable`);
          }
        }
        
        // Récupérer le nom du modérateur
        if (log.moderatorId && !log.moderatorName) {
          try {
            const moderator = await discordClient.users.fetch(log.moderatorId);
            log.moderatorName = moderator.tag;
          } catch (error) {
            // Modérateur introuvable sur Discord
            console.log(`[getModerationLogs] Modérateur ${log.moderatorId} introuvable`);
          }
        }
      }
    }

    res.json({
      success: true,
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  moderate,
  revokeSanction,
  getGuildSanctions,
  getUserSanctions,
  resetUserCounters,
  getGuildModerationLogs,
};

// Helper functions pour les messages Discord
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} jour${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} heure${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  return `${seconds} seconde${seconds > 1 ? 's' : ''}`;
}

function getActionEmoji(action) {
  const emojis = {
    warn: '⚠️',
    mute: '🔇',
    kick: '👢',
    ban: '🔨'
  };
  return emojis[action] || '❓';
}

function getActionTitle(action) {
  const titles = {
    warn: 'Avertissement',
    mute: 'Mute',
    kick: 'Expulsion',
    ban: 'Bannissement'
  };
  return titles[action] || 'Sanction';
}

function getActionLabel(action) {
  const labels = {
    warn: '⚠️ Avertissement',
    mute: '🔇 Mute',
    kick: '👢 Kick',
    ban: '🔨 Ban'
  };
  return labels[action] || action;
}
