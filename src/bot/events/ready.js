const { syncGuilds } = require('../../services/guildSyncService');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
    console.log(`📊 Présent sur ${client.guilds.cache.size} serveurs`);
    
    // Synchroniser tous les serveurs Discord vers MongoDB
    try {
      await syncGuilds(client);
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation initiale des serveurs:', error);
    }
    
    // Pré-charger les membres de tous les serveurs (pour éviter les rate limits)
    console.log('👥 Pré-chargement des membres des serveurs...');
    for (const [guildId, guild] of client.guilds.cache) {
      try {
        await guild.members.fetch({ limit: 1000 });
        console.log(`  ✅ ${guild.memberCount} membres chargés pour ${guild.name}`);
      } catch (error) {
        console.error(`  ❌ Erreur chargement membres pour ${guild.name}:`, error.message);
      }
    }
    
    // Mettre à jour le statut
    client.user.setPresence({
      activities: [{
        name: 'la modération',
        type: 3, // Watching
      }],
      status: 'online',
    });
  },
};
