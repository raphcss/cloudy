const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireGuildAdmin } = require('../middleware/permissions');
const sanctionConfigController = require('../controllers/sanctionConfigController');

// Types d'infractions
router.get('/:guildId/infraction-types', requireAuth, requireGuildAdmin, sanctionConfigController.getInfractionTypes);
router.post('/:guildId/infraction-types', requireAuth, requireGuildAdmin, sanctionConfigController.createInfractionType);
router.put('/:guildId/infraction-types/:typeId', requireAuth, requireGuildAdmin, sanctionConfigController.updateInfractionType);
router.delete('/:guildId/infraction-types/:typeId', requireAuth, requireGuildAdmin, sanctionConfigController.deleteInfractionType);

// Règles d'escalation
router.get('/:guildId/escalation-rules', requireAuth, requireGuildAdmin, sanctionConfigController.getEscalationRules);
router.post('/:guildId/escalation-rules', requireAuth, requireGuildAdmin, sanctionConfigController.upsertEscalationRule);
router.delete('/:guildId/escalation-rules/:ruleId', requireAuth, requireGuildAdmin, sanctionConfigController.deleteEscalationRule);

module.exports = router;
