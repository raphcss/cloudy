const express = require('express');
const router = express.Router();
const {
  getGuildConfig,
  updateGuildConfig,
  getGuildModerators,
  getGuildMember,
  getGuildDetails,
  getBotInviteUrl,
} = require('../controllers/guildController');
const {
  getGuildPermissions,
  addGuildPermission,
  deleteGuildPermission,
} = require('../controllers/permissionController');
const {
  getGuildStats,
} = require('../controllers/statsController');
const {
  verifyChannel,
  verifyRole,
} = require('../controllers/verifyController');
const { requireAuth } = require('../middleware/auth');
const { requireGuildAdmin, requireGuildModerator } = require('../middleware/permissions');

// Configuration de guild (lecture: modérateur+, écriture: admin+)
router.get('/:guildId/config', requireAuth, requireGuildModerator, getGuildConfig);
router.put('/:guildId/config', requireAuth, requireGuildAdmin, updateGuildConfig);

// Détails Discord (roles + channels) - admin uniquement (pour setup initial)
router.get('/:guildId/details', requireAuth, requireGuildAdmin, getGuildDetails);

// Vérification Discord IDs - admin uniquement (pour setup initial)
router.get('/:guildId/verify/channel/:channelId', requireAuth, requireGuildAdmin, verifyChannel);
router.get('/:guildId/verify/role/:roleId', requireAuth, requireGuildAdmin, verifyRole);

// Modérateurs (lecture: modérateur+)
router.get('/:guildId/moderators', requireAuth, requireGuildModerator, getGuildModerators);

// Membres Discord (lecture: modérateur+)
router.get('/:guildId/members/:userId', requireAuth, requireGuildModerator, getGuildMember);

// Permissions (admin uniquement)
router.get('/:guildId/permissions', requireAuth, requireGuildAdmin, getGuildPermissions);
router.post('/:guildId/permissions', requireAuth, requireGuildAdmin, addGuildPermission);
router.delete('/:guildId/permissions/:permissionId', requireAuth, requireGuildAdmin, deleteGuildPermission);

// Statistiques (lecture: modérateur+)
router.get('/:guildId/stats', requireAuth, requireGuildModerator, getGuildStats);

// URL d'invitation du bot
router.get('/:guildId/invite', requireAuth, getBotInviteUrl);

console.log('✅ Routes guilds chargées (/guilds/:guildId/config, moderators, members, permissions, stats)');

module.exports = router;
