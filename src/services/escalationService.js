const { InfractionCounter, EscalationRule } = require('../models');

/**
 * Service d'escalade des sanctions
 * Gère la logique de progression des infractions
 */
class EscalationService {
  /**
   * Calcule la sanction à appliquer en fonction du niveau d'infraction
   * @param {String} guildId - ID de la guild
   * @param {String} userId - Discord ID de l'utilisateur
   * @param {String} infractionType - Type d'infraction
   * @returns {Object} Action et durée à appliquer
   */
  static async calculateSanction(guildId, userId, infractionType) {
    try {
      // Récupérer ou créer le compteur d'infractions
      let counter = await InfractionCounter.findOne({
        guildId,
        userId,
        infractionType,
      });

      if (!counter) {
        counter = await InfractionCounter.create({
          guildId,
          userId,
          infractionType,
          count: 0,
        });
      }

      // Incrémenter le compteur
      const newLevel = counter.count + 1;

      // Récupérer la règle d'escalation pour ce niveau
      let rule = await EscalationRule.findOne({
        guildId,
        infractionType,
        level: newLevel,
      });

      // Si pas de règle pour ce niveau exact, prendre le niveau le plus élevé disponible
      if (!rule) {
        const rules = await EscalationRule.find({
          guildId,
          infractionType,
        }).sort({ level: -1 }).limit(1);
        
        rule = rules[0];
      }

      if (!rule) {
        // Pas de règle définie, utiliser un warn par défaut
        return {
          level: newLevel,
          action: 'warn',
          durationMs: null,
        };
      }

      return {
        level: newLevel,
        action: rule.action,
        durationMs: rule.durationMs,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Met à jour le compteur d'infractions
   * @param {String} guildId - ID de la guild
   * @param {String} userId - Discord ID de l'utilisateur
   * @param {String} infractionType - Type d'infraction
   * @param {Number} level - Nouveau niveau
   */
  static async updateCounter(guildId, userId, infractionType, level) {
    await InfractionCounter.findOneAndUpdate(
      { guildId, userId, infractionType },
      {
        count: level,
        lastInfractionAt: new Date(),
      },
      { upsert: true }
    );
  }

  /**
   * Réinitialise le compteur d'infractions d'un utilisateur
   * @param {String} guildId - ID de la guild
   * @param {String} userId - Discord ID de l'utilisateur
   * @param {String} infractionType - Type d'infraction (optionnel, sinon tous)
   */
  static async resetCounter(guildId, userId, infractionType = null) {
    const filter = { guildId, userId };
    
    if (infractionType) {
      filter.infractionType = infractionType;
    }

    await InfractionCounter.updateMany(
      filter,
      { count: 0, resetAt: new Date() }
    );
  }

  /**
   * Obtient le compteur actuel pour un utilisateur
   * @param {String} guildId - ID de la guild
   * @param {String} userId - Discord ID de l'utilisateur
   * @returns {Array} Liste des compteurs
   */
  static async getCounters(guildId, userId) {
    return await InfractionCounter.find({ guildId, userId });
  }
}

module.exports = EscalationService;
