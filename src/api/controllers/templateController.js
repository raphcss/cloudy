const { SanctionTemplate } = require('../../models');

/**
 * Lister les templates de sanctions d'une guild
 */
const getTemplates = async (req, res) => {
  try {
    const { guildId } = req.params;
    const { active, infractionType } = req.query;

    const filter = { guildId };
    
    if (active !== undefined) {
      filter.active = active === 'true';
    }
    
    if (infractionType) {
      filter.infractionType = infractionType;
    }

    const templates = await SanctionTemplate.find(filter).sort({ name: 1 });

    res.json({
      success: true,
      templates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Obtenir un template par ID
 */
const getTemplateById = async (req, res) => {
  try {
    const { guildId, templateId } = req.params;

    const template = await SanctionTemplate.findOne({
      _id: templateId,
      guildId,
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template non trouvé',
      });
    }

    res.json({
      success: true,
      template,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Créer un template (Admin only)
 */
const createTemplate = async (req, res) => {
  try {
    const { guildId } = req.params;
    const templateData = { ...req.body, guildId };

    const template = await SanctionTemplate.create(templateData);

    res.status(201).json({
      success: true,
      template,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Mettre à jour un template (Admin only)
 */
const updateTemplate = async (req, res) => {
  try {
    const { guildId, templateId } = req.params;
    const updateData = req.body;

    // Ne pas permettre de modifier le guildId
    delete updateData.guildId;

    const template = await SanctionTemplate.findOneAndUpdate(
      { _id: templateId, guildId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template non trouvé',
      });
    }

    res.json({
      success: true,
      template,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Supprimer un template (Admin only)
 */
const deleteTemplate = async (req, res) => {
  try {
    const { guildId, templateId } = req.params;

    const template = await SanctionTemplate.findOneAndDelete({
      _id: templateId,
      guildId,
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template non trouvé',
      });
    }

    res.json({
      success: true,
      message: 'Template supprimé avec succès',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};
