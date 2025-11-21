const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateGlobalRole,
  assignGuildRole,
  removeGuildRole,
  getAllGuilds,
  getGuildModerators,
  removeModeratorByBinding,
  generateBotInvite,
} = require('../controllers/adminController');
const { requireAuth } = require('../middleware/auth');
const { requireMaster } = require('../middleware/permissions');

// Toutes les routes nécessitent Master
router.use(requireAuth, requireMaster);

// Gestion des utilisateurs
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserById);
router.patch('/users/:userId/global-role', updateGlobalRole);

// Gestion des rôles sur les guilds
router.post('/guilds/:guildId/users/:userId/role', assignGuildRole);
router.delete('/guilds/:guildId/users/:userId/role', removeGuildRole);

// Gestion des guilds
router.get('/guilds', getAllGuilds);
router.get('/guilds/:guildId/moderators', getGuildModerators);
router.delete('/guilds/:guildId/moderators/:bindingId', removeModeratorByBinding);

// Génération d'invitations bot
router.post('/generate-invite', generateBotInvite);

module.exports = router;
