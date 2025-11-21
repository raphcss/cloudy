const { GuildConfig, GuildRoleBinding, User } = require('../../models');
const { ROLES } = require('../../config/constants');

/**
 * Vérifie si un membre a les permissions de modération
 * Vérifie à la fois les rôles Discord ET les rôles dans la DB
 */
async function canModerate(member, guildId, requiredRole = ROLES.GUILD_MODERATOR) {
  try {
    // 1. Vérifier les permissions Discord natives
    if (member.permissions.has('Administrator')) {
      return true;
    }

    // 2. Récupérer la config de la guild
    const guildConfig = await GuildConfig.findOne({ guildId });
    
    if (guildConfig && guildConfig.moderationRoles.length > 0) {
      // Vérifier si l'utilisateur a un des rôles Discord autorisés
      const hasModRole = member.roles.cache.some(role => 
        guildConfig.moderationRoles.includes(role.id)
      );

      if (hasModRole) {
        return true;
      }
    }

    // 3. Vérifier les rôles dans la DB (panel)
    const user = await User.findOne({ discordId: member.id });
    
    if (!user) {
      return false;
    }

    // Vérifier si Master
    if (user.globalRole === ROLES.MASTER) {
      return true;
    }

    // Vérifier le rôle sur cette guild
    const roleBinding = await GuildRoleBinding.findOne({
      guildId,
      userId: user._id,
    });

    if (!roleBinding) {
      return false;
    }

    // GUILD_ADMIN peut tout faire
    if (roleBinding.role === ROLES.GUILD_ADMIN) {
      return true;
    }

    // GUILD_MODERATOR si c'est le rôle requis minimum
    if (requiredRole === ROLES.GUILD_MODERATOR && 
        roleBinding.role === ROLES.GUILD_MODERATOR) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Erreur vérification permissions:', error);
    return false;
  }
}

/**
 * Vérifie si un membre peut effectuer une action sur une cible
 */
async function canTarget(executor, target) {
  // Ne peut pas se cibler soi-même
  if (executor.id === target.id) {
    return { success: false, message: 'Vous ne pouvez pas vous cibler vous-même.' };
  }

  // Ne peut pas cibler le propriétaire du serveur
  if (target.id === target.guild.ownerId) {
    return { success: false, message: 'Vous ne pouvez pas cibler le propriétaire du serveur.' };
  }

  // Si l'exécuteur est propriétaire du serveur, il peut cibler n'importe qui (sauf lui-même et le propriétaire, déjà vérifiés)
  if (executor.id === target.guild.ownerId) {
    return { success: true };
  }

  // Si l'exécuteur a la permission Administrator, il peut cibler n'importe qui
  if (executor.permissions.has('Administrator')) {
    return { success: true };
  }

  // Vérifier si l'exécuteur est Master dans la DB
  try {
    const executorUser = await User.findOne({ discordId: executor.id });
    if (executorUser && executorUser.globalRole === ROLES.MASTER) {
      return { success: true };
    }
  } catch (error) {
    console.error('Erreur vérification Master:', error);
  }

  // Ne peut pas cibler quelqu'un avec un rôle supérieur ou égal
  if (target.roles.highest.position >= executor.roles.highest.position) {
    return { success: false, message: 'Vous ne pouvez pas cibler quelqu\'un avec un rôle supérieur ou égal au vôtre.' };
  }

  // Le bot doit avoir un rôle supérieur à la cible
  if (target.roles.highest.position >= target.guild.members.me.roles.highest.position) {
    return { success: false, message: 'Je ne peux pas cibler quelqu\'un avec un rôle supérieur ou égal au mien.' };
  }

  return { success: true };
}

module.exports = {
  canModerate,
  canTarget,
};
