const express = require('express');
const router = express.Router();
const { login, register, me, getDiscordAuthUrl, discordCallback } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Routes publiques
router.post('/login', authLimiter, login);
router.post('/register', authLimiter, register);

// Discord OAuth2
router.get('/discord', getDiscordAuthUrl);
router.post('/discord/callback', authLimiter, discordCallback);

// Routes protégées
router.get('/me', requireAuth, me);

module.exports = router;
