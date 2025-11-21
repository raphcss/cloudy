const { Guild } = require('../models');

/**
 * Synchronise tous les serveurs Discord vers MongoDB
 * @param {Client} client - Client Discord.js
 */
const syncGuilds = async (client) => {
  try {
    console.log('🔄 Synchronisation des serveurs Discord...');
    
    const discordGuilds = client.guilds.cache;
    let syncedCount = 0;
    let updatedCount = 0;
    let newCount = 0;

    for (const [guildId, discordGuild] of discordGuilds) {
      try {
        // Vérifier si le serveur existe déjà
        const existingGuild = await Guild.findOne({ guildId });

        const guildData = {
          guildId: discordGuild.id,
          name: discordGuild.name,
          icon: discordGuild.icon 
            ? `https://cdn.discordapp.com/icons/${discordGuild.id}/${discordGuild.icon}.png`
            : null,
          ownerId: discordGuild.ownerId,
          memberCount: discordGuild.memberCount,
          active: true,
        };

        if (existingGuild) {
          // Mettre à jour les informations
          await Guild.findOneAndUpdate(
            { guildId },
            guildData,
            { new: true }
          );
          updatedCount++;
          console.log(`  ✅ Serveur mis à jour: ${discordGuild.name}`);
        } else {
          // Créer un nouveau serveur
          await Guild.create({
            ...guildData,
            joinedAt: discordGuild.joinedAt || new Date(),
          });
          newCount++;
          console.log(`  ➕ Nouveau serveur ajouté: ${discordGuild.name}`);
        }

        syncedCount++;
      } catch (error) {
        console.error(`  ❌ Erreur lors de la synchronisation de ${discordGuild.name}:`, error.message);
      }
    }

    // Marquer comme inactifs les serveurs qui ne sont plus présents
    const allGuildIds = Array.from(discordGuilds.keys());
    await Guild.updateMany(
      { guildId: { $nin: allGuildIds }, active: true },
      { active: false }
    );

    console.log(`✅ Synchronisation terminée:`);
    console.log(`   - ${newCount} nouveau(x) serveur(s)`);
    console.log(`   - ${updatedCount} serveur(s) mis à jour`);
    console.log(`   - Total: ${syncedCount} serveur(s) synchronisé(s)`);

    return { syncedCount, newCount, updatedCount };
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation des serveurs:', error);
    throw error;
  }
};

/**
 * Synchronise un seul serveur Discord
 * @param {Guild} discordGuild - Serveur Discord
 */
const syncGuild = async (discordGuild) => {
  try {
    const guildData = {
      guildId: discordGuild.id,
      name: discordGuild.name,
      icon: discordGuild.icon 
        ? `https://cdn.discordapp.com/icons/${discordGuild.id}/${discordGuild.icon}.png`
        : null,
      ownerId: discordGuild.ownerId,
      memberCount: discordGuild.memberCount,
      active: true,
    };

    const existingGuild = await Guild.findOne({ guildId: discordGuild.id });

    if (existingGuild) {
      return await Guild.findOneAndUpdate(
        { guildId: discordGuild.id },
        guildData,
        { new: true }
      );
    } else {
      return await Guild.create({
        ...guildData,
        joinedAt: discordGuild.joinedAt || new Date(),
      });
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la synchronisation du serveur ${discordGuild.name}:`, error);
    throw error;
  }
};

/**
 * Marque un serveur comme inactif
 * @param {string} guildId - ID du serveur Discord
 */
const markGuildInactive = async (guildId) => {
  try {
    await Guild.findOneAndUpdate(
      { guildId },
      { active: false },
      { new: true }
    );
    console.log(`  ➖ Serveur marqué comme inactif: ${guildId}`);
  } catch (error) {
    console.error(`❌ Erreur lors de la désactivation du serveur ${guildId}:`, error);
    throw error;
  }
};

module.exports = {
  syncGuilds,
  syncGuild,
  markGuildInactive,
};
