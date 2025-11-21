const express = require('express');
const router = express.Router();
const { getUserGlobalSanctions, getUserGuilds: getUserGuildsController } = require('../controllers/userController');
const { getUserGuilds } = require('../controllers/guildController');
const { requireAuth } = require('../middleware/auth');
const { requireGuildModerator } = require('../middleware/permissions');

/**
 * Route pour obtenir les guilds de l'utilisateur connecté
 */
router.get('/me/guilds', requireAuth, getUserGuilds);

/**
 * Route pour obtenir les guilds (simple liste)
 */
router.get('/guilds', requireAuth, getUserGuildsController);

/**
 * Route pour obtenir les sanctions globales d'un utilisateur
 * Accessible par tous les modérateurs (pour vérifier l'historique cross-serveur)
 */
router.get('/:userId/sanctions/global', requireAuth, getUserGlobalSanctions);

console.log('✅ Routes users chargées (/users/me/guilds, /users/guilds, /users/:userId/sanctions/global)');

module.exports = router;
