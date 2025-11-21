const { InfractionType, EscalationRule } = require('../../models');

/**
 * Types par défaut (créés automatiquement pour chaque serveur)
 */
const DEFAULT_INFRACTION_TYPES = [
  { key: 'spam', label: 'Spam', icon: '💬', description: 'Messages répétitifs ou non sollicités', enabled: true, requiresCustomReason: false, isDefault: true },
  { key: 'toxicity', label: 'Propos irrespectueux / Toxicité', icon: '😠', description: 'Comportement toxique ou offensant', enabled: true, requiresCustomReason: false, isDefault: true },
  { key: 'advertising', label: 'Publicité non autorisée', icon: '📢', description: 'Publicité ou autopromotion non autorisée', enabled: true, requiresCustomReason: false, isDefault: true },
  { key: 'nsfw', label: 'Contenu NSFW', icon: '🔞', description: 'Contenu inapproprié ou NSFW', enabled: true, requiresCustomReason: false, isDefault: true },
  { key: 'other', label: 'Autre', icon: '❓', description: 'Autre type d\'infraction', enabled: true, requiresCustomReason: true, isDefault: true },
];

/**
 * Règles d'escalation par défaut
 */
const DEFAULT_ESCALATION_RULES = [
  // SPAM
  { infractionType: 'spam', level: 1, action: 'warn', durationMs: null },
  { infractionType: 'spam', level: 2, action: 'mute', durationMs: 3600000 }, // 1h
  { infractionType: 'spam', level: 3, action: 'mute', durationMs: 86400000 }, // 24h
  { infractionType: 'spam', level: 4, action: 'kick', durationMs: null },
  { infractionType: 'spam', level: 5, action: 'ban', durationMs: null },
  
  // TOXICITY
  { infractionType: 'toxicity', level: 1, action: 'warn', durationMs: null },
  { infractionType: 'toxicity', level: 2, action: 'mute', durationMs: 7200000 }, // 2h
  { infractionType: 'toxicity', level: 3, action: 'mute', durationMs: 86400000 }, // 24h
  { infractionType: 'toxicity', level: 4, action: 'kick', durationMs: null },
  { infractionType: 'toxicity', level: 5, action: 'ban', durationMs: null },
  
  // ADVERTISING
  { infractionType: 'advertising', level: 1, action: 'warn', durationMs: null },
  { infractionType: 'advertising', level: 2, action: 'mute', durationMs: 86400000 }, // 24h
  { infractionType: 'advertising', level: 3, action: 'kick', durationMs: null },
  { infractionType: 'advertising', level: 4, action: 'ban', durationMs: null },
  
  // NSFW
  { infractionType: 'nsfw', level: 1, action: 'warn', durationMs: null },
  { infractionType: 'nsfw', level: 2, action: 'mute', durationMs: 86400000 }, // 24h
  { infractionType: 'nsfw', level: 3, action: 'kick', durationMs: null },
  { infractionType: 'nsfw', level: 4, action: 'ban', durationMs: null },
  
  // OTHER
  { infractionType: 'other', level: 1, action: 'warn', durationMs: null },
  { infractionType: 'other', level: 2, action: 'mute', durationMs: 3600000 }, // 1h
  { infractionType: 'other', level: 3, action: 'kick', durationMs: null },
  { infractionType: 'other', level: 4, action: 'ban', durationMs: null },
];

/**
 * Initialiser les types et règles par défaut pour un serveur
 */
const initializeDefaultsForGuild = async (guildId) => {
  try {
    // Créer les types par défaut si ils n'existent pas
    for (const type of DEFAULT_INFRACTION_TYPES) {
      await InfractionType.findOneAndUpdate(
        { guildId, key: type.key },
        { ...type, guildId },
        { upsert: true, new: true }
      );
    }

    // Créer les règles d'escalation par défaut si elles n'existent pas
    for (const rule of DEFAULT_ESCALATION_RULES) {
      await EscalationRule.findOneAndUpdate(
        { guildId, infractionType: rule.infractionType, level: rule.level },
        { ...rule, guildId },
        { upsert: true, new: true }
      );
    }

    return true;
  } catch (error) {
    console.error('Erreur initialisation defaults:', error);
    return false;
  }
};

/**
 * Obtenir tous les types d'infractions d'un serveur
 */
const getInfractionTypes = async (req, res) => {
  try {
    const { guildId } = req.params;

    // Initialiser les types par défaut si nécessaire
    const count = await InfractionType.countDocuments({ guildId });
    if (count === 0) {
      await initializeDefaultsForGuild(guildId);
    }

    const types = await InfractionType.find({ guildId }).sort({ isDefault: -1, key: 1 });

    res.json({
      success: true,
      types,
    });
  } catch (error) {
    console.error('Erreur getInfractionTypes:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Créer un nouveau type d'infraction
 */
const createInfractionType = async (req, res) => {
  try {
    const { guildId } = req.params;
    const { key, label, icon, description, enabled } = req.body;

    if (!key || !label) {
      return res.status(400).json({
        success: false,
        message: 'La clé et le libellé sont obligatoires',
      });
    }

    // Vérifier que la clé est valide
    if (!/^[a-z-]+$/.test(key)) {
      return res.status(400).json({
        success: false,
        message: 'La clé ne peut contenir que des lettres minuscules et des tirets',
      });
    }

    const type = await InfractionType.create({
      guildId,
      key,
      label,
      icon: icon || '⚠️',
      description: description || '',
      enabled: enabled !== undefined ? enabled : true,
      isDefault: false,
    });

    res.json({
      success: true,
      type,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Cette clé existe déjà pour ce serveur',
      });
    }
    
    console.error('Erreur createInfractionType:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Mettre à jour un type d'infraction
 */
const updateInfractionType = async (req, res) => {
  try {
    const { guildId, typeId } = req.params;
    const { label, icon, description, enabled } = req.body;

    const type = await InfractionType.findOne({ _id: typeId, guildId });

    if (!type) {
      return res.status(404).json({
        success: false,
        message: 'Type d\'infraction non trouvé',
      });
    }

    // Mettre à jour les champs autorisés
    if (label !== undefined) type.label = label;
    if (icon !== undefined) type.icon = icon;
    if (description !== undefined) type.description = description;
    if (enabled !== undefined) type.enabled = enabled;

    await type.save();

    res.json({
      success: true,
      type,
    });
  } catch (error) {
    console.error('Erreur updateInfractionType:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Supprimer un type d'infraction personnalisé
 */
const deleteInfractionType = async (req, res) => {
  try {
    const { guildId, typeId } = req.params;

    const type = await InfractionType.findOne({ _id: typeId, guildId });

    if (!type) {
      return res.status(404).json({
        success: false,
        message: 'Type d\'infraction non trouvé',
      });
    }

    if (type.isDefault) {
      return res.status(400).json({
        success: false,
        message: 'Les types par défaut ne peuvent pas être supprimés',
      });
    }

    await type.deleteOne();

    res.json({
      success: true,
      message: 'Type d\'infraction supprimé',
    });
  } catch (error) {
    console.error('Erreur deleteInfractionType:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Obtenir toutes les règles d'escalation d'un serveur
 */
const getEscalationRules = async (req, res) => {
  try {
    const { guildId } = req.params;

    // Initialiser les règles par défaut si nécessaire
    const count = await EscalationRule.countDocuments({ guildId });
    if (count === 0) {
      await initializeDefaultsForGuild(guildId);
    }

    const rules = await EscalationRule.find({ guildId }).sort({ infractionType: 1, level: 1 });

    res.json({
      success: true,
      rules,
    });
  } catch (error) {
    console.error('Erreur getEscalationRules:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Créer ou mettre à jour une règle d'escalation
 */
const upsertEscalationRule = async (req, res) => {
  try {
    const { guildId } = req.params;
    const { infractionType, level, action, durationMs } = req.body;

    if (!infractionType || !level || !action) {
      return res.status(400).json({
        success: false,
        message: 'Type d\'infraction, niveau et action sont obligatoires',
      });
    }

    const rule = await EscalationRule.findOneAndUpdate(
      { guildId, infractionType, level },
      { guildId, infractionType, level, action, durationMs: durationMs || null },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      rule,
    });
  } catch (error) {
    console.error('Erreur upsertEscalationRule:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Supprimer une règle d'escalation
 */
const deleteEscalationRule = async (req, res) => {
  try {
    const { guildId, ruleId } = req.params;

    const rule = await EscalationRule.findOneAndDelete({ _id: ruleId, guildId });

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Règle d\'escalation non trouvée',
      });
    }

    res.json({
      success: true,
      message: 'Règle d\'escalation supprimée',
    });
  } catch (error) {
    console.error('Erreur deleteEscalationRule:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getInfractionTypes,
  createInfractionType,
  updateInfractionType,
  deleteInfractionType,
  getEscalationRules,
  upsertEscalationRule,
  deleteEscalationRule,
  initializeDefaultsForGuild,
};
