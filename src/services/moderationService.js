const { Sanction, SanctionTemplate, ModerationLog } = require('../models');
const EscalationService = require('./escalationService');

/**
 * Service de modération
 * Gère l'application des sanctions
 */
class ModerationService {
  /**
   * Applique une sanction avec escalade automatique
   * @param {Object} params - Paramètres de la sanction
   * @returns {Object} Sanction créée
   */
  static async applySanction(params) {
    const {
      guildId,
      userId,
      moderatorId,
      infractionType,
      reason,
      templateId = null,
      userName = null,
      moderatorName = null,
    } = params;

    try {
      // Calculer la sanction selon l'escalade
      const escalation = await EscalationService.calculateSanction(
        guildId,
        userId,
        infractionType
      );

      // Utiliser l'action et la durée déterminées par l'escalation
      const action = escalation.action;
      const durationMs = escalation.durationMs;

      // Calculer la date d'expiration si durée définie
      let expiresAt = null;
      if (durationMs && (action === 'mute' || action === 'ban')) {
        expiresAt = new Date(Date.now() + durationMs);
      }

      // Déterminer si la sanction est active
      // Mute et Ban sont actifs jusqu'à expiration ou révocation
      // Warn et Kick sont des actions instantanées, donc inactives
      const isActive = (action === 'mute' || action === 'ban');

      // Créer la sanction
      const sanction = await Sanction.create({
        guildId,
        userId,
        moderatorId,
        action,
        reason,
        infractionType,
        infractionLevel: escalation.level,
        durationMs,
        expiresAt,
        templateId,
        active: isActive,
      });

      // Créer un log de modération
      await ModerationLog.create({
        guildId,
        userId,
        userName,
        moderatorId,
        moderatorName,
        action,
        reason,
        relatedSanctionId: sanction._id,
        metadata: {
          infractionType,
          infractionLevel: escalation.level,
          durationMs,
          expiresAt,
        },
      });

      console.log(`[ModerationService] Sanction créée: ${sanction._id} (${action}) - Log enregistré`);

      // Mettre à jour le compteur
      await EscalationService.updateCounter(
        guildId,
        userId,
        infractionType,
        escalation.level
      );

      // Populer le template si présent
      if (templateId) {
        await sanction.populate('templateId');
      }

      return sanction;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Applique une sanction depuis un template
   * @param {String} guildId - ID de la guild
   * @param {String} userId - Discord ID de l'utilisateur
   * @param {String} moderatorId - Discord ID du modérateur
   * @param {String} templateId - ID du template
   * @returns {Object} Sanction créée
   */
  static async applySanctionFromTemplate(guildId, userId, moderatorId, templateId) {
    try {
      const template = await SanctionTemplate.findOne({
        _id: templateId,
        guildId,
        active: true,
      });

      if (!template) {
        throw new Error('Template non trouvé ou inactif');
      }

      return await this.applySanction({
        guildId,
        userId,
        moderatorId,
        infractionType: template.infractionType,
        reason: template.reason,
        templateId: template._id,
        overrideAction: template.suggestedAction,
        overrideDuration: template.suggestedDurationMs,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Révoque une sanction (unmute/unban)
   * @param {String} sanctionId - ID de la sanction
   * @param {String} moderatorId - Discord ID du modérateur
   * @returns {Object} Sanction mise à jour
   */
  static async revokeSanction(sanctionId, moderatorId) {
    try {
      const sanction = await Sanction.findById(sanctionId);

      if (!sanction) {
        throw new Error('Sanction non trouvée');
      }

      // Vérifier si la sanction a déjà été révoquée
      if (sanction.revokedAt) {
        throw new Error('Sanction déjà révoquée');
      }

      // Déterminer le type d'action pour le log
      let logAction = 'other';
      if (sanction.action === 'mute') {
        logAction = 'unmute';
      } else if (sanction.action === 'ban') {
        logAction = 'unban';
      } else if (sanction.action === 'warn') {
        logAction = 'revoke_warn';
      } else if (sanction.action === 'kick') {
        logAction = 'revoke_kick';
      }

      // Marquer la sanction comme inactive et ajouter la date de révocation
      sanction.active = false;
      sanction.revokedAt = new Date();
      sanction.revokedBy = moderatorId;
      await sanction.save();

      // Créer un log de modération au lieu d'une nouvelle sanction
      const log = await ModerationLog.create({
        guildId: sanction.guildId,
        userId: sanction.userId,
        moderatorId,
        action: logAction,
        reason: `Révocation de la sanction ${sanction.action} #${sanctionId}`,
        relatedSanctionId: sanctionId,
        metadata: {
          originalAction: sanction.action,
          originalReason: sanction.reason,
          revokedAt: new Date(),
        },
      });

      console.log(`[ModerationService] Sanction ${sanctionId} révoquée. Log créé: ${log._id}`);

      return sanction;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Récupère l'historique des sanctions d'un utilisateur
   * @param {String} guildId - ID de la guild
   * @param {String} userId - Discord ID de l'utilisateur
   * @param {Object} options - Options de pagination
   * @returns {Object} Sanctions et pagination
   */
  static async getUserSanctions(guildId, userId, options = {}) {
    const { page = 1, limit = 50, activeOnly = false } = options;

    const filter = { guildId, userId };
    if (activeOnly) {
      filter.active = true;
    }

    const sanctions = await Sanction.find(filter)
      .populate('templateId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Sanction.countDocuments(filter);

    return {
      sanctions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Récupère toutes les sanctions d'une guild
   * @param {String} guildId - ID de la guild
   * @param {Object} options - Options de filtrage et pagination
   * @returns {Object} Sanctions et pagination
   */
  static async getGuildSanctions(guildId, options = {}) {
    const {
      page = 1,
      limit = 50,
      action = null,
      activeOnly = false,
      userId = null,
    } = options;

    const filter = { guildId };
    
    if (action) {
      filter.action = action;
    }
    
    if (activeOnly) {
      filter.active = true;
    }
    
    if (userId) {
      filter.userId = userId;
    }

    const sanctions = await Sanction.find(filter)
      .populate('templateId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Sanction.countDocuments(filter);

    return {
      sanctions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Expire les sanctions temporaires
   * À appeler régulièrement (cron job)
   */
  static async expireSanctions() {
    const now = new Date();

    const result = await Sanction.updateMany(
      {
        active: true,
        expiresAt: { $lte: now },
      },
      {
        active: false,
      }
    );

    return result.modifiedCount;
  }
}

module.exports = ModerationService;
