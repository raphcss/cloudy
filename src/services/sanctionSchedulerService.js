const { Sanction } = require('../models');

/**
 * Service pour gérer l'expiration automatique des sanctions
 */
class SanctionSchedulerService {
  constructor(discordClient) {
    this.client = discordClient;
    this.intervalId = null;
  }

  /**
   * Démarre le scheduler
   */
  start() {
    console.log('📅 Démarrage du scheduler de sanctions...');
    
    // Vérifier toutes les 30 secondes
    this.intervalId = setInterval(() => {
      this.checkExpiredSanctions();
    }, 30000);

    // Vérifier immédiatement au démarrage
    this.checkExpiredSanctions();
  }

  /**
   * Arrête le scheduler
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('📅 Scheduler de sanctions arrêté');
    }
  }

  /**
   * Vérifie et applique les sanctions expirées
   */
  async checkExpiredSanctions() {
    try {
      const now = new Date();

      // Trouver les sanctions actives avec une expiration passée
      const expiredSanctions = await Sanction.find({
        active: true,
        revokedAt: null,
        expiresAt: { $lte: now },
      });

      if (expiredSanctions.length === 0) return;

      console.log(`⏰ ${expiredSanctions.length} sanctions expirées trouvées`);

      for (const sanction of expiredSanctions) {
        try {
          await this.expireSanction(sanction);
        } catch (error) {
          console.error(`Erreur lors de l'expiration de la sanction ${sanction._id}:`, error);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des sanctions expirées:', error);
    }
  }

  /**
   * Expire une sanction (unmute ou unban)
   */
  async expireSanction(sanction) {
    const guildId = sanction.guildId;
    const userId = sanction.userId;

    console.log(`⏰ Expiration de la sanction ${sanction.action} pour ${userId} dans ${guildId}`);

    // Récupérer la guild Discord
    const guild = await this.client.guilds.fetch(guildId).catch(() => null);
    
    if (!guild) {
      console.warn(`Guild ${guildId} introuvable, marquage de la sanction comme expirée sans action Discord`);
      sanction.active = false;
      await sanction.save();
      return;
    }

    // Appliquer l'action Discord selon le type
    try {
      if (sanction.action === 'mute') {
        // Unmute (retirer le timeout)
        const member = await guild.members.fetch(userId).catch(() => null);
        
        if (member && member.communicationDisabledUntil) {
          await member.timeout(null, '⏰ Expiration de la sanction mute');
          console.log(`✅ Unmute appliqué pour ${userId} dans ${guildId}`);
        }
      } else if (sanction.action === 'ban') {
        // Unban
        const banned = await guild.bans.fetch(userId).catch(() => null);
        
        if (banned) {
          await guild.members.unban(userId, '⏰ Expiration de la sanction ban');
          console.log(`✅ Unban appliqué pour ${userId} dans ${guildId}`);
        }
      }

      // Marquer la sanction comme inactive
      sanction.active = false;
      await sanction.save();
    } catch (error) {
      console.error(`Erreur lors de l'application de l'expiration Discord:`, error);
      // On marque quand même comme expiré en base
      sanction.active = false;
      await sanction.save();
    }
  }

  /**
   * Applique une révocation immédiate depuis le site (unmute/unban)
   */
  async applyRevocation(sanction) {
    const guildId = sanction.guildId;
    const userId = sanction.userId;

    console.log(`🔄 Révocation de la sanction ${sanction.action} pour ${userId} dans ${guildId}`);

    const guild = await this.client.guilds.fetch(guildId).catch(() => null);
    
    if (!guild) {
      console.warn(`Guild ${guildId} introuvable pour révocation`);
      return;
    }

    try {
      if (sanction.action === 'mute') {
        const member = await guild.members.fetch(userId).catch(() => null);
        
        if (member && member.communicationDisabledUntil) {
          await member.timeout(null, '🔄 Sanction révoquée depuis le panel');
          console.log(`✅ Unmute appliqué pour révocation ${userId}`);
        }
      } else if (sanction.action === 'ban') {
        const banned = await guild.bans.fetch(userId).catch(() => null);
        
        if (banned) {
          await guild.members.unban(userId, '🔄 Sanction révoquée depuis le panel');
          console.log(`✅ Unban appliqué pour révocation ${userId}`);
        }
      }
    } catch (error) {
      console.error(`Erreur lors de l'application de la révocation Discord:`, error);
    }
  }
}

module.exports = SanctionSchedulerService;
