const { markGuildInactive } = require('../../services/guildSyncService');

module.exports = {
  name: 'guildDelete',
  execute: async (guild) => {
    try {
      await markGuildInactive(guild.id);
      console.log(`➖ Bot retiré du serveur: ${guild.name}`);
    } catch (error) {
      console.error('Erreur lors de la suppression du serveur:', error);
    }
  },
};
