const { GuildConfig, Guild } = require('../../models');

/**
 * Obtenir l'URL d'invitation du bot pour un serveur spécifique
 */
const getBotInviteUrl = async (req, res) => {
  try {
    const { guildId } = req.params;
    
    // Récupérer le client Discord pour obtenir le client ID
    const discordClient = req.app.get('discordClient');
    if (!discordClient || !discordClient.user) {
      return res.status(503).json({
        success: false,
        message: 'Bot Discord non disponible',
      });
    }
    
    const clientId = discordClient.user.id;
    
    // Permissions: Gérer les rôles, Expulser, Bannir, Timeout, Gérer les messages, Envoyer des messages, Utiliser des commandes
    const permissions = '1099511627910';
    
    // Construire l'URL avec le guildId pré-sélectionné
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=bot%20applications.commands&guild_id=${guildId}`;
    
    res.json({
      success: true,
      inviteUrl,
    });
  } catch (error) {
    console.error('Erreur getBotInviteUrl:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Obtenir la configuration d'une guild
 */
const getGuildConfig = async (req, res) => {
  try {
    const { guildId } = req.params;
    const { EscalationRule } = require('../../models');

    let config = await GuildConfig.findOne({ guildId });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration non trouvée',
      });
    }

    // Charger les règles d'escalation depuis la collection EscalationRule
    const escalationRulesRaw = await EscalationRule.find({ guildId }).sort({ infractionType: 1, level: 1 });
    
    // Grouper par infractionType
    const escalationRules = [];
    const groupedByType = {};
    
    for (const rule of escalationRulesRaw) {
      if (!groupedByType[rule.infractionType]) {
        groupedByType[rule.infractionType] = {
          infractionType: rule.infractionType,
          levels: []
        };
        escalationRules.push(groupedByType[rule.infractionType]);
      }
      
      groupedByType[rule.infractionType].levels.push({
        level: rule.level,
        action: rule.action,
        durationMs: rule.durationMs
      });
    }

    // Ajouter escalationRules à la config
    const configObj = config.toObject();
    configObj.escalationRules = escalationRules;

    res.json({
      success: true,
      config: configObj,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Créer ou mettre à jour la configuration d'une guild
 */
const updateGuildConfig = async (req, res) => {
  try {
    const { guildId } = req.params;
    const updateData = req.body;

    // Ne pas permettre de modifier le guildId
    delete updateData.guildId;

    // Si on met à jour les escalationRules, les sauvegarder dans la collection EscalationRule
    if (updateData.escalationRules) {
      const { EscalationRule } = require('../../models');
      const escalationRules = updateData.escalationRules;
      
      // Supprimer toutes les règles existantes pour cette guild
      await EscalationRule.deleteMany({ guildId });
      
      // Créer les nouvelles règles dans la collection EscalationRule
      for (const rule of escalationRules) {
        for (const level of rule.levels) {
          await EscalationRule.create({
            guildId,
            infractionType: rule.infractionType,
            level: level.level,
            action: level.action,
            durationMs: level.durationMs
          });
        }
      }
      
      // Ne pas stocker escalationRules dans GuildConfig (utiliser seulement EscalationRule collection)
      delete updateData.escalationRules;
    }

    const config = await GuildConfig.findOneAndUpdate(
      { guildId },
      updateData,
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('[updateGuildConfig] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Lister toutes les guilds (Master only)
 */
const getAllGuilds = async (req, res) => {
  try {
    const guilds = await GuildConfig.find();

    res.json({
      success: true,
      guilds,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Lister les guilds de l'utilisateur (selon ses permissions)
 */
const getUserGuilds = async (req, res) => {
  try {
    const userId = req.user.id;
    const User = require('../../models/User');

    console.log('[getUserGuilds] User ID:', userId);
    console.log('[getUserGuilds] Global Role:', req.user.globalRole);

    // Si Master, retourner toutes les guilds où le bot est présent
    if (req.user.globalRole === 'MASTER') {
      console.log('[getUserGuilds] Master - Fetching all guilds');
      
      // Récupérer le client Discord
      const discordClient = req.app.get('discordClient');
      if (!discordClient || !discordClient.isReady()) {
        // Fallback: retourner seulement les guilds configurées
        const guilds = await GuildConfig.find();
        return res.json({
          success: true,
          guilds: guilds.map(g => ({
            ...g.toObject(),
            name: g.guildId,
            icon: null,
            memberCount: 0,
            active: g.enabled ?? true,
            botPresent: false,
            configured: true,
          })),
        });
      }

      // Récupérer TOUTES les guilds où le bot est présent
      const discordGuilds = discordClient.guilds.cache;
      console.log('[getUserGuilds] Master - Discord guilds:', discordGuilds.size);
      
      const allGuilds = await Promise.all(
        Array.from(discordGuilds.values()).map(async (guild) => {
          try {
            const guildConfig = await GuildConfig.findOne({ guildId: guild.id });
            return {
              guildId: guild.id,
              name: guild.name,
              icon: guild.iconURL({ dynamic: true, size: 128 }) || null,
              memberCount: guild.memberCount,
              active: guildConfig?.enabled ?? true,
              enabled: guildConfig?.enabled ?? true,
              configured: !!guildConfig,
              botPresent: true,
              moderationRoles: guildConfig?.moderationRoles || [],
              logChannelId: guildConfig?.logChannelId || '',
              muteRoleId: guildConfig?.muteRoleId || '',
              defaultLanguage: guildConfig?.defaultLanguage || 'fr',
              escalationRules: guildConfig?.escalationRules || [],
            };
          } catch (error) {
            console.error(`[getUserGuilds] Error processing guild ${guild.id}:`, error.message);
            return null;
          }
        })
      );

      const filteredGuilds = allGuilds.filter(g => g !== null);
      console.log('[getUserGuilds] Master - Total guilds:', filteredGuilds.length);

      return res.json({
        success: true,
        guilds: filteredGuilds,
      });
    }

    // Récupérer l'utilisateur pour avoir son discordId
    const user = await User.findById(userId);
    console.log('[getUserGuilds] User found:', user ? user.username : 'NOT FOUND');
    console.log('[getUserGuilds] Discord ID:', user?.discordId);

    if (!user || !user.discordId) {
      console.log('[getUserGuilds] No user or no Discord ID');
      return res.json({
        success: true,
        guilds: [],
      });
    }

    // Récupérer le client Discord
    const discordClient = req.app.get('discordClient');
    if (!discordClient || !discordClient.isReady()) {
      console.log('[getUserGuilds] Discord client not ready');
      return res.json({
        success: true,
        guilds: [],
        message: 'Bot Discord non disponible',
      });
    }

    // Récupérer toutes les guilds où le bot est présent
    const discordGuilds = discordClient.guilds.cache;
    console.log('[getUserGuilds] Total Discord guilds:', discordGuilds.size);
    const userGuilds = [];

    // Pour chaque serveur Discord où le bot est présent
    for (const [guildId, guild] of discordGuilds) {
      try {
        console.log(`[getUserGuilds] Checking guild ${guildId} (${guild.name})`);
        
        // Vérifier si l'utilisateur est membre
        const member = await guild.members.fetch(user.discordId).catch(() => null);
        if (!member) {
          console.log(`[getUserGuilds] User not member of ${guild.name}`);
          continue;
        }

        // Vérifier si l'utilisateur est propriétaire
        const isOwner = guild.ownerId === user.discordId;
        console.log(`[getUserGuilds] Is owner of ${guild.name}:`, isOwner);

        // Récupérer la config (peut ne pas exister)
        const guildConfig = await GuildConfig.findOne({ guildId });
        
        // Si propriétaire, toujours afficher le serveur
        if (isOwner) {
          userGuilds.push({
            guildId: guild.id,
            name: guild.name,
            icon: guild.iconURL({ dynamic: true, size: 128 }) || null,
            memberCount: guild.memberCount,
            active: guildConfig?.enabled ?? true,
            enabled: guildConfig?.enabled ?? true,
            configured: !!guildConfig,
            botPresent: true, // Bot est présent dans cette guilde
            moderationRoles: guildConfig?.moderationRoles || [],
            logChannelId: guildConfig?.logChannelId || '',
            muteRoleId: guildConfig?.muteRoleId || '',
            defaultLanguage: guildConfig?.defaultLanguage || 'fr',
            escalationRules: guildConfig?.escalationRules || [],
          });
          console.log(`[getUserGuilds] Added ${guild.name} (owner, configured: ${!!guildConfig})`);
          continue;
        }

        // Si pas propriétaire, vérifier les permissions Discord ou rôles de modération
        // Vérifier si l'utilisateur a la permission Gérer le serveur ou Administrateur
        const hasManageGuild = member.permissions.has('ManageGuild');
        const hasAdministrator = member.permissions.has('Administrator');
        const hasModerateMembers = member.permissions.has('ModerateMembers');
        const hasKickMembers = member.permissions.has('KickMembers');
        const hasBanMembers = member.permissions.has('BanMembers');
        
        console.log(`[getUserGuilds] ${guild.name} permissions:`, {
          hasManageGuild,
          hasAdministrator,
          hasModerateMembers,
          hasKickMembers,
          hasBanMembers,
          isOwner,
        });
        
        // Si l'utilisateur a des permissions de gestion/modération
        if (hasManageGuild || hasAdministrator || hasModerateMembers || hasKickMembers || hasBanMembers) {
          // L'utilisateur a les permissions Discord pour configurer
          userGuilds.push({
            guildId: guild.id,
            name: guild.name,
            icon: guild.iconURL({ dynamic: true, size: 128 }) || null,
            memberCount: guild.memberCount,
            active: guildConfig?.enabled ?? true,
            enabled: guildConfig?.enabled ?? true,
            configured: !!guildConfig,
            botPresent: true,
            moderationRoles: guildConfig?.moderationRoles || [],
            logChannelId: guildConfig?.logChannelId || '',
            muteRoleId: guildConfig?.muteRoleId || '',
            defaultLanguage: guildConfig?.defaultLanguage || 'fr',
            escalationRules: guildConfig?.escalationRules || [],
          });
          console.log(`[getUserGuilds] Added ${guild.name} (discord permissions, configured: ${!!guildConfig})`);
          continue;
        }

        // Sinon, vérifier les rôles de modération (seulement si config existe)
        if (guildConfig && guildConfig.moderationRoles && guildConfig.moderationRoles.length > 0) {
          const hasModerationRole = member.roles.cache.some(role => 
            guildConfig.moderationRoles.includes(role.id)
          );

          console.log(`[getUserGuilds] ${guild.name}: Has moderation role:`, hasModerationRole);

          if (hasModerationRole) {
            userGuilds.push({
              ...guildConfig.toObject(),
              name: guild.name,
              icon: guild.iconURL({ dynamic: true, size: 128 }) || null,
              memberCount: guild.memberCount,
              active: guildConfig.enabled ?? true,
              configured: true,
              botPresent: true,
            });
            console.log(`[getUserGuilds] Added ${guild.name} (moderator)`);
          }
        } else {
          console.log(`[getUserGuilds] ${guild.name}: No access (no manage guild perm, no moderation roles)`);
        }
      } catch (error) {
        console.log(`[getUserGuilds] Error checking guild ${guildId}:`, error.message);
        continue;
      }
    }

    console.log('[getUserGuilds] Final guilds count:', userGuilds.length);

    // Vérifier les serveurs configurés mais où le bot n'est plus présent
    const allConfiguredGuilds = await GuildConfig.find();
    for (const guildConfig of allConfiguredGuilds) {
      // Si le bot n'est pas dans cette guilde
      const botIsInGuild = discordGuilds.has(guildConfig.guildId);
      if (!botIsInGuild) {
        // Vérifier si l'utilisateur a accès à cette guilde (via permissions explicites ou rôle global)
        // Pour simplifier, on vérifie juste si c'est dans les guilds de l'utilisateur
        const alreadyAdded = userGuilds.some(g => g.guildId === guildConfig.guildId);
        if (!alreadyAdded) {
          // Ajouter la guilde avec le flag botPresent: false
          userGuilds.push({
            ...guildConfig.toObject(),
            name: guildConfig.guildId, // Pas de nom Discord disponible
            icon: null,
            memberCount: 0,
            configured: true,
            botPresent: false, // Bot n'est plus présent
          });
          console.log(`[getUserGuilds] Added ${guildConfig.guildId} (bot not present)`);
        } else {
          // Mettre à jour la guilde existante pour indiquer que le bot n'est plus présent
          const existingGuild = userGuilds.find(g => g.guildId === guildConfig.guildId);
          if (existingGuild && botIsInGuild === false) {
            existingGuild.botPresent = false;
          }
        }
      }
    }

    res.json({
      success: true,
      guilds: userGuilds,
    });
  } catch (error) {
    console.error('Erreur getUserGuilds:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Supprimer une guild (Master only)
 */
const deleteGuild = async (req, res) => {
  try {
    const { guildId } = req.params;

    const result = await GuildConfig.findOneAndDelete({ guildId });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Guild non trouvée',
      });
    }

    res.json({
      success: true,
      message: 'Guild supprimée avec succès',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Récupérer les membres Discord ayant les rôles de modération
 */
const getGuildModerators = async (req, res) => {
  try {
    const { guildId } = req.params;

    // Récupérer la config pour avoir les rôles de modération
    const config = await GuildConfig.findOne({ guildId });
    
    console.log(`[getGuildModerators] GuildId: ${guildId}`);
    console.log(`[getGuildModerators] Config trouvée:`, config);
    
    if (!config || !config.moderationRoles || config.moderationRoles.length === 0) {
      console.log(`[getGuildModerators] Pas de rôles de modération configurés`);
      return res.json({
        success: true,
        moderators: [],
      });
    }

    console.log(`[getGuildModerators] Rôles de modération:`, config.moderationRoles);

    // Récupérer le client Discord depuis l'app
    const discordClient = req.app.get('discordClient');
    
    if (!discordClient || !discordClient.isReady()) {
      console.log(`[getGuildModerators] Bot Discord non prêt`);
      return res.json({
        success: true,
        moderators: [],
        message: 'Bot Discord en cours de connexion',
      });
    }

    try {
      const guild = await discordClient.guilds.fetch(guildId);
      
      if (!guild) {
        console.log(`[getGuildModerators] Serveur Discord non trouvé`);
        return res.status(404).json({
          success: false,
          message: 'Serveur Discord non trouvé',
        });
      }

      console.log(`[getGuildModerators] Serveur Discord trouvé: ${guild.name}`);

      // Récupérer les membres (uniquement si le cache est vide ou incomplet)
      if (guild.members.cache.size < guild.memberCount * 0.9) {
        console.log(`[getGuildModerators] Fetching membres...`);
        try {
          await guild.members.fetch({ limit: 1000 });
        } catch (fetchError) {
          console.log(`[getGuildModerators] Erreur fetch membres (utilisation du cache):`, fetchError.message);
        }
      }
      
      console.log(`[getGuildModerators] Nombre de membres en cache: ${guild.members.cache.size}`);

      // Filtrer les membres ayant au moins un rôle de modération
      const moderators = [];
      
      guild.members.cache.forEach(member => {
        if (!member || !member.user) return;
        
        const hasModRole = member.roles.cache.some(role => 
          config.moderationRoles.includes(role.id)
        );
        
        if (hasModRole) {
          const userRoles = member.roles.cache
            .filter(role => config.moderationRoles.includes(role.id))
            .map(role => ({ 
              id: role.id, 
              name: role.name,
              color: role.hexColor
            }));
          
          // Vérifier si le membre a la permission ADMINISTRATOR
          const isAdmin = member.permissions.has('Administrator');
          
          moderators.push({
            userId: member.user.id,
            username: member.user.username,
            globalName: member.user.globalName || member.user.username,
            avatar: member.user.displayAvatarURL({ dynamic: true }),
            nickname: member.nickname,
            roles: userRoles,
            joinedAt: member.joinedAt,
            isAdmin: isAdmin,
          });
        }
      });

      console.log(`[getGuildModerators] Nombre de modérateurs trouvés: ${moderators.length}`);

      res.json({
        success: true,
        moderators,
      });
    } catch (discordError) {
      console.error('Erreur Discord API:', discordError);
      return res.json({
        success: true,
        moderators: [],
        message: 'Erreur lors de la récupération des membres Discord',
      });
    }
  } catch (error) {
    console.error('Erreur getGuildModerators:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Obtenir un membre Discord d'une guild par son ID
 */
const getGuildMember = async (req, res) => {
  try {
    const { guildId, userId } = req.params;

    console.log(`[getGuildMember] Recherche du membre ${userId} dans la guild ${guildId}`);

    // Vérifier que le bot Discord est prêt
    const client = req.app.get('discordClient');
    if (!client || !client.isReady()) {
      console.log('[getGuildMember] Bot Discord non disponible');
      return res.status(503).json({
        success: false,
        message: 'Bot Discord non disponible',
      });
    }

    // Récupérer la guild
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      console.log(`[getGuildMember] Guild ${guildId} non trouvée`);
      return res.status(404).json({
        success: false,
        message: 'Serveur non trouvé',
      });
    }

    console.log(`[getGuildMember] Guild trouvée: ${guild.name}`);

    // Récupérer le membre
    let member;
    try {
      member = await guild.members.fetch(userId);
      console.log(`[getGuildMember] Membre trouvé: ${member.user.username}`);
    } catch (error) {
      console.log(`[getGuildMember] Membre ${userId} non trouvé:`, error.message);
      return res.status(404).json({
        success: false,
        message: 'Membre non trouvé dans ce serveur',
      });
    }

    // Formater les données du membre
    const memberData = {
      id: member.user.id,
      username: member.user.username,
      globalName: member.user.globalName || member.user.username,
      avatar: member.user.avatar,
      discriminator: member.user.discriminator,
      joinedAt: member.joinedAt,
      roles: member.roles.cache
        .filter(role => role.id !== guildId)
        .map(role => ({
          id: role.id,
          name: role.name,
          color: role.hexColor,
        })),
    };

    res.json({
      success: true,
      member: memberData,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du membre:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Récupérer les détails Discord d'une guild (roles + channels)
 * Pour éviter le rate limit, cette méthode devrait être appelée rarement
 */
const getGuildDetails = async (req, res) => {
  try {
    const { guildId } = req.params;
    const discordClient = req.app.get('discordClient');

    if (!discordClient || !discordClient.isReady()) {
      return res.status(503).json({
        success: false,
        message: 'Bot Discord non disponible',
      });
    }

    // Récupérer la guild Discord
    const guild = await discordClient.guilds.fetch(guildId).catch(() => null);

    if (!guild) {
      return res.status(404).json({
        success: false,
        message: 'Serveur Discord introuvable',
      });
    }

    // Récupérer les rôles
    const roles = [];
    guild.roles.cache.forEach(role => {
      if (role.id !== guild.id) { // Exclure @everyone
        roles.push({
          id: role.id,
          name: role.name,
          color: role.hexColor,
          position: role.position,
        });
      }
    });

    // Trier les rôles par position (descendant)
    roles.sort((a, b) => b.position - a.position);

    // Récupérer les channels
    const channels = [];
    guild.channels.cache.forEach(channel => {
      // Filtrer uniquement les channels textuels (0 = text, 5 = news)
      if (channel.type === 0 || channel.type === 5) {
        channels.push({
          id: channel.id,
          name: channel.name,
          type: channel.type,
          position: channel.position,
        });
      }
    });

    // Trier les channels par position
    channels.sort((a, b) => a.position - b.position);

    res.json({
      success: true,
      guild: {
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL(),
        roles,
        channels,
      },
    });
  } catch (error) {
    console.error('Erreur getGuildDetails:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getGuildConfig,
  updateGuildConfig,
  getAllGuilds,
  getUserGuilds,
  deleteGuild,
  getGuildModerators,
  getGuildMember,
  getGuildDetails,
  getBotInviteUrl,
};

