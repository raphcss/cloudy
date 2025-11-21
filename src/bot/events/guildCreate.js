const { Events, EmbedBuilder } = require('discord.js');
const { GuildConfig } = require('../../models');
const { syncGuild } = require('../../services/guildSyncService');

module.exports = {
  name: Events.GuildCreate,
  async execute(guild) {
    console.log(`✅ Ajouté au serveur: ${guild.name} (${guild.id})`);

    try {
      // Synchroniser le serveur vers MongoDB
      await syncGuild(guild);
      
      // Créer la configuration par défaut
      await GuildConfig.findOneAndUpdate(
        { guildId: guild.id },
        {
          guildId: guild.id,
          name: guild.name,
          enabled: true,
          moderationRoles: [],
          defaultLanguage: 'fr',
          escalationRules: [],
        },
        { upsert: true, new: true }
      );

      // Trouver un canal pour envoyer un message de bienvenue
      const channel = guild.channels.cache.find(
        ch => ch.type === 0 && ch.permissionsFor(guild.members.me).has('SendMessages')
      );

      if (channel) {
        const embed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('👋 Merci d\'avoir ajouté le Bot de Modération!')
          .setDescription(
            'Je suis maintenant prêt à vous aider à modérer votre serveur.\n\n' +
            '**Pour commencer:**\n' +
            '1. Configurez les rôles de modération via le panel web\n' +
            '2. Créez des templates de sanctions personnalisés\n' +
            '3. Définissez vos règles d\'escalade\n\n' +
            '**Commandes disponibles:**\n' +
            '`/warn` - Avertir un utilisateur\n' +
            '`/mute` - Mute un utilisateur\n' +
            '`/kick` - Expulser un utilisateur\n' +
            '`/ban` - Bannir un utilisateur\n' +
            '`/history` - Voir l\'historique d\'un utilisateur'
          )
          .setFooter({ text: 'Consultez le panel web pour plus d\'options' })
          .setTimestamp();

        await channel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Erreur lors de la création de la config guild:', error);
    }
  },
};
