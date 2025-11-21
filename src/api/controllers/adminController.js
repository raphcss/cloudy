const { User, GuildRoleBinding, Guild } = require('../../models');
const { ROLES } = require('../../config/constants');

/**
 * Lister tous les utilisateurs (Master only)
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash');

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Obtenir un utilisateur par ID (Master only)
 */
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-passwordHash');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Récupérer les rôles de l'utilisateur sur les guilds
    const guildRoles = await GuildRoleBinding.find({ userId: user._id });

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        guildRoles,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Attribuer/retirer un rôle global (Master only)
 */
const updateGlobalRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { globalRole } = req.body;

    if (globalRole && globalRole !== ROLES.MASTER && globalRole !== null) {
      return res.status(400).json({
        success: false,
        message: 'Rôle global invalide',
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { globalRole },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Attribuer/modifier un rôle sur une guild (Master only)
 */
const assignGuildRole = async (req, res) => {
  try {
    const { guildId, userId } = req.params;
    const { role } = req.body;

    if (!role || ![ROLES.GUILD_ADMIN, ROLES.GUILD_MODERATOR].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide',
      });
    }

    // Chercher l'utilisateur par Discord ID ou MongoDB ID
    let user = await User.findOne({ discordId: userId }) || await User.findById(userId);
    
    if (!user) {
      // Créer un utilisateur temporaire avec le Discord ID
      user = await User.create({
        discordId: userId,
        username: `User_${userId}`,
        email: `${userId}@discord.temp`,
      });
    }

    // Créer ou mettre à jour le rôle
    const roleBinding = await GuildRoleBinding.findOneAndUpdate(
      { guildId, userId: user._id },
      { role },
      { upsert: true, new: true }
    ).populate('userId', 'username email discordId');

    res.json({
      success: true,
      roleBinding,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Retirer un rôle sur une guild (Master only)
 */
const removeGuildRole = async (req, res) => {
  try {
    const { guildId, userId } = req.params;

    const result = await GuildRoleBinding.findOneAndDelete({
      guildId,
      userId,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Rôle non trouvé',
      });
    }

    res.json({
      success: true,
      message: 'Rôle retiré avec succès',
    });
  } catch (error) {
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
    const guilds = await Guild.find().sort({ name: 1 });

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
 * Lister les modérateurs d'une guild
 */
const getGuildModerators = async (req, res) => {
  try {
    const { guildId } = req.params;

    const moderators = await GuildRoleBinding.find({ guildId })
      .populate('userId', 'username email discordId avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      moderators,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Retirer un modérateur par binding ID
 */
const removeModeratorByBinding = async (req, res) => {
  try {
    const { guildId, bindingId } = req.params;

    const result = await GuildRoleBinding.findOneAndDelete({
      _id: bindingId,
      guildId,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Modérateur non trouvé',
      });
    }

    res.json({
      success: true,
      message: 'Modérateur retiré avec succès',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Générer un lien d'invitation pour le bot avec un guild ID spécifique
 */
const generateBotInvite = async (req, res) => {
  try {
    const { guildId } = req.body;

    if (!guildId) {
      return res.status(400).json({
        success: false,
        message: 'L\'ID du serveur est requis',
      });
    }

    // Vérifier que le guildId est valide (format Discord ID)
    if (!/^\d{17,19}$/.test(guildId)) {
      return res.status(400).json({
        success: false,
        message: 'L\'ID du serveur n\'est pas valide',
      });
    }

    const clientId = process.env.DISCORD_CLIENT_ID;
    
    if (!clientId) {
      return res.status(500).json({
        success: false,
        message: 'DISCORD_CLIENT_ID non configuré',
      });
    }

    // Permissions requises pour le bot
    const permissions = '8'; // Administrator (ou vous pouvez spécifier des permissions spécifiques)

    // Générer le lien d'invitation avec le guild_id pré-rempli
    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&guild_id=${guildId}&scope=bot%20applications.commands`;

    res.json({
      success: true,
      inviteUrl,
      guildId,
    });
  } catch (error) {
    console.error('Erreur génération invitation:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateGlobalRole,
  assignGuildRole,
  removeGuildRole,
  getAllGuilds,
  getGuildModerators,
  removeModeratorByBinding,
  generateBotInvite,
};
