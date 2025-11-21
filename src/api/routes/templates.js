const express = require('express');
const router = express.Router();
const {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} = require('../controllers/templateController');
const { requireAuth } = require('../middleware/auth');
const { requireGuildAdmin, requireGuildModerator } = require('../middleware/permissions');

// Lister les templates (modérateur+)
router.get('/:guildId/sanction-templates', requireAuth, requireGuildModerator, getTemplates);

// Obtenir un template (modérateur+)
router.get('/:guildId/sanction-templates/:templateId', requireAuth, requireGuildModerator, getTemplateById);

// Créer un template (admin+)
router.post('/:guildId/sanction-templates', requireAuth, requireGuildAdmin, createTemplate);

// Modifier un template (admin+)
router.put('/:guildId/sanction-templates/:templateId', requireAuth, requireGuildAdmin, updateTemplate);

// Supprimer un template (admin+)
router.delete('/:guildId/sanction-templates/:templateId', requireAuth, requireGuildAdmin, deleteTemplate);

module.exports = router;
