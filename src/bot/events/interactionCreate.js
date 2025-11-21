const { Events } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // Gestion des commandes slash
    if (interaction.isChatInputCommand()) {
      // Vérifier d'abord les commandes standard
      let command = interaction.client.commands.get(interaction.commandName);
      let isCustomCommand = false;

      // Si pas trouvée, vérifier les commandes personnalisées
      if (!command) {
        command = interaction.client.customCommands.get(interaction.commandName);
        isCustomCommand = true;
      }

      if (!command) {
        console.error(`Commande ${interaction.commandName} non trouvée`);
        return;
      }

      // Si c'est une commande personnalisée, vérifier si le module est activé pour ce serveur
      if (isCustomCommand) {
        const moduleId = command.moduleId;
        const isEnabled = await interaction.client.moduleLoader.isModuleEnabledForGuild(
          moduleId, 
          interaction.guildId
        );

        if (!isEnabled) {
          return interaction.reply({
            content: '❌ Ce module n\'est pas activé sur ce serveur.',
            ephemeral: true
          });
        }
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Erreur lors de l'exécution de ${interaction.commandName}:`, error);
        
        const errorMessage = {
          content: '❌ Une erreur est survenue lors de l\'exécution de cette commande.',
          ephemeral: true,
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      }
    }

    // Gestion des modals
    if (interaction.isModalSubmit()) {
      const commandName = interaction.customId.split('_')[0];
      const handler = interaction.client.commands.get(commandName);
      
      if (handler && handler.handleModal) {
        try {
          await handler.handleModal(interaction);
        } catch (error) {
          console.error('Erreur lors du traitement du modal:', error);
          
          const errorMessage = {
            content: '❌ Une erreur est survenue lors du traitement du modal.',
            ephemeral: true,
          };
          
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
          } else {
            await interaction.reply(errorMessage);
          }
        }
      }
    }

    // Gestion des select menus
    if (interaction.isStringSelectMenu()) {
      const commandName = interaction.customId.split('_')[0];
      const handler = interaction.client.commands.get(commandName);
      
      if (handler && handler.handleSelect) {
        try {
          await handler.handleSelect(interaction);
        } catch (error) {
          console.error('Erreur lors du traitement du select menu:', error);
          
          const errorMessage = {
            content: '❌ Une erreur est survenue lors de la sélection.',
            ephemeral: true,
          };
          
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
          } else {
            await interaction.reply(errorMessage);
          }
        }
      }
    }
  },
};
