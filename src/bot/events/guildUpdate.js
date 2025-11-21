const { syncGuild } = require('../../services/guildSyncService');

module.exports = {
  name: 'guildUpdate',
  execute: async (oldGuild, newGuild) => {
    try {
      await syncGuild(newGuild);
      console.log(`🔄 Serveur mis à jour: ${newGuild.name}`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du serveur:', error);
    }
  },
};
