const rateLimit = require('express-rate-limit');

/**
 * Rate limiter pour les routes d'authentification
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives par IP
  message: {
    success: false,
    message: 'Trop de tentatives, réessayez dans 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter général pour l'API
 */
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requêtes par minute
  message: {
    success: false,
    message: 'Trop de requêtes, réessayez plus tard',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter pour les actions de modération
 */
const moderationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 actions par minute
  message: {
    success: false,
    message: 'Trop d\'actions de modération, ralentissez',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  apiLimiter,
  moderationLimiter,
};
