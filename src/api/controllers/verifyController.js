const express = require('express');
const router = express.Router();

/**
 * Vérifier si un salon Discord existe
 */
const verifyChannel = async (req, res) => {
  try {
    const { guildId, channelId } = req.params;

    const discordClient = req.app.get('discordClient');
    if (!discordClient || !discordClient.isReady()) {
      return res.status(503).json({
        success: false,
        message: 'Bot Discord non disponible',
      });
    }

    const guild = discordClient.guilds.cache.get(guildId);
    if (!guild) {
      console.log('[verifyChannel] Serveur non trouvé dans le cache:', guildId);
      console.log('[verifyChannel] Serveurs disponibles:', 
        Array.from(discordClient.guilds.cache.values()).map(g => ({ id: g.id, name: g.name })));
      return res.status(404).json({
        success: false,
        message: 'Serveur non trouvé',
      });
    }

    console.log('[verifyChannel] Vérification du channel', channelId, 'sur le serveur', guild.name);
    
    // Force refresh du cache
    await guild.channels.fetch();
    const channel = guild.channels.cache.get(channelId);
    
    if (!channel) {
      console.log('[verifyChannel] Salon non trouvé. Channels disponibles:', 
        Array.from(guild.channels.cache.values()).map(c => ({ id: c.id, name: c.name })));
      return res.status(404).json({
        success: false,
        message: 'Salon non trouvé',
      });
    }

    console.log('[verifyChannel] Salon trouvé:', channel.name);

    res.json({
      success: true,
      channel: {
        id: channel.id,
        name: channel.name,
        type: channel.type,
      },
    });
  } catch (error) {
    console.error('Erreur verifyChannel:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Vérifier si un rôle Discord existe
 */
const verifyRole = async (req, res) => {
  try {
    const { guildId, roleId } = req.params;

    const discordClient = req.app.get('discordClient');
    if (!discordClient || !discordClient.isReady()) {
      return res.status(503).json({
        success: false,
        message: 'Bot Discord non disponible',
      });
    }

    const guild = discordClient.guilds.cache.get(guildId);
    if (!guild) {
      console.log('[verifyRole] Serveur non trouvé dans le cache:', guildId);
      console.log('[verifyRole] Serveurs disponibles:', 
        Array.from(discordClient.guilds.cache.values()).map(g => ({ id: g.id, name: g.name })));
      return res.status(404).json({
        success: false,
        message: 'Serveur non trouvé',
      });
    }

    console.log('[verifyRole] Vérification du rôle', roleId, 'sur le serveur', guild.name);
    
    // Force refresh du cache
    await guild.roles.fetch();
    const role = guild.roles.cache.get(roleId);
    
    if (!role) {
      console.log('[verifyRole] Rôle non trouvé. Rôles disponibles:', 
        Array.from(guild.roles.cache.values()).map(r => ({ id: r.id, name: r.name })));
      return res.status(404).json({
        success: false,
        message: 'Rôle non trouvé',
      });
    }

    console.log('[verifyRole] Rôle trouvé:', role.name);

    res.json({
      success: true,
      role: {
        id: role.id,
        name: role.name,
        color: role.hexColor,
      },
    });
  } catch (error) {
    console.error('Erreur verifyRole:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  verifyChannel,
  verifyRole,
};
