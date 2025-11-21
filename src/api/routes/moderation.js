const express = require('express');
const router = express.Router();
const {
  moderate,
  revokeSanction,
  getGuildSanctions,
  getUserSanctions,
  resetUserCounters,
  getGuildModerationLogs,
} = require('../controllers/moderationController');
const { requireAuth, requireBotApiKey } = require('../middleware/auth');
const { requireGuildModerator, requireGuildAdmin } = require('../middleware/permissions');
const { moderationLimiter } = require('../middleware/rateLimiter');

/**
 * Middleware pour autoriser bot OU utilisateur authentifié
 */
const botOrAuth = (req, res, next) => {
  // Si header bot API key est présent
  const apiKey = req.headers['x-bot-api-key'];
  
  if (apiKey === process.env.BOT_API_KEY) {
    req.isBot = true;
    return next();
  }

  // Sinon, vérifier l'auth normale
  return requireAuth(req, res, next);
};

// Appliquer une sanction (bot OU modérateur+)
router.post(
  '/:guildId/moderate',
  moderationLimiter,
  botOrAuth,
  (req, res, next) => {
    // Si c'est le bot, on bypass le check de rôle
    if (req.isBot) return next();
    // Sinon, vérifier le rôle
    return requireGuildModerator(req, res, next);
  },
  moderate
);

// Révoquer une sanction (modérateur+)
router.post('/:guildId/sanctions/:sanctionId/revoke', requireAuth, requireGuildModerator, revokeSanction);

// Lister les sanctions d'une guild (modérateur+)
router.get('/:guildId/sanctions', requireAuth, requireGuildModerator, getGuildSanctions);

// Lister les sanctions d'un utilisateur (bot OU modérateur+)
router.get(
  '/:guildId/users/:userId/sanctions',
  botOrAuth,
  (req, res, next) => {
    // Si c'est le bot, on bypass le check de rôle
    if (req.isBot) return next();
    // Sinon, vérifier le rôle
    return requireGuildModerator(req, res, next);
  },
  getUserSanctions
);

// Réinitialiser les compteurs (admin+)
router.post('/:guildId/users/:userId/reset-counters', requireAuth, requireGuildAdmin, resetUserCounters);

// Lister les logs de modération (modérateur+)
router.get('/:guildId/moderation-logs', requireAuth, requireGuildModerator, getGuildModerationLogs);

module.exports = router;
