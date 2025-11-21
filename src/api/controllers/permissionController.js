const GuildRoleBinding = require('../../models/GuildRoleBinding');
const User = require('../../models/User');

/**
 * Get all permissions for a guild
 */
exports.getGuildPermissions = async (req, res) => {
  try {
    const { guildId } = req.params;

    const permissions = await GuildRoleBinding.find({ guildId })
      .populate('userId', 'username discordId email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      permissions,
    });
  } catch (error) {
    console.error('Error fetching guild permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des permissions',
    });
  }
};

/**
 * Add a permission to a guild
 */
exports.addGuildPermission = async (req, res) => {
  try {
    const { guildId } = req.params;
    const { userId, role } = req.body; // userId doit être un Discord ID (snowflake)

    console.log('[Permission] Tentative d\'ajout:', { guildId, userId, role });

    // Validate role
    if (!['GUILD_ADMIN', 'GUILD_MODERATOR'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide',
      });
    }

    // Vérifier que c'est bien un Discord ID (snowflake)
    const isDiscordId = typeof userId === 'string' && /^\d{17,20}$/.test(userId);
    if (!isDiscordId) {
      return res.status(400).json({
        success: false,
        message: 'L\'ID doit être un Discord ID (snowflake de 17-20 chiffres)',
      });
    }

    console.log('[Permission] Discord ID valide:', userId);
    
    // Chercher ou créer l'utilisateur avec ce Discord ID
    let user = await User.findOne({ discordId: userId });
    
    if (!user) {
      // Créer un utilisateur placeholder qui sera complété lors de la première connexion
      console.log('[Permission] Création d\'un nouvel utilisateur placeholder pour Discord ID:', userId);
      user = await User.create({
        discordId: userId,
        username: `User_${userId}`, // Placeholder, sera mis à jour lors de la connexion
        email: `${userId}@discord.placeholder`, // Placeholder
        passwordHash: null, // Pas de mot de passe, l'utilisateur devra se connecter via Discord
        globalRole: null,
      });
      console.log('[Permission] Utilisateur placeholder créé');
    } else {
      console.log('[Permission] Utilisateur existant trouvé:', user.username);
    }

    console.log('[Permission] Utilisateur trouvé/créé:', user.username, '-', user.discordId);

    // Check if permission already exists (store the binding by Mongo _id)
    const existing = await GuildRoleBinding.findOne({ guildId, userId: user._id });
    if (existing) {
      // Update existing permission
      existing.role = role;
      await existing.save();

      const updated = await GuildRoleBinding.findById(existing._id)
        .populate('userId', 'username discordId email');

      return res.json({
        success: true,
        message: 'Permission mise à jour',
        permission: updated,
      });
    }

    // Create new permission
    const permission = new GuildRoleBinding({
      guildId,
      userId: user._id,
      role,
    });

    await permission.save();

    const populated = await GuildRoleBinding.findById(permission._id)
      .populate('userId', 'username discordId email');

    res.status(201).json({
      success: true,
      message: 'Permission ajoutée',
      permission: populated,
    });
  } catch (error) {
    console.error('Error adding guild permission:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de la permission',
    });
  }
};

/**
 * Delete a permission
 */
exports.deleteGuildPermission = async (req, res) => {
  try {
    const { guildId, permissionId } = req.params;

    const permission = await GuildRoleBinding.findOne({
      _id: permissionId,
      guildId,
    });

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission non trouvée',
      });
    }

    await permission.deleteOne();

    res.json({
      success: true,
      message: 'Permission supprimée',
    });
  } catch (error) {
    console.error('Error deleting guild permission:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la permission',
    });
  }
};
