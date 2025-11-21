const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('../config/database');
const { errorHandler, notFound } = require('../utils/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const guildRoutes = require('./routes/guilds');
const templateRoutes = require('./routes/templates');
const moderationRoutes = require('./routes/moderation');
const userRoutes = require('./routes/users');
const moduleRoutes = require('./routes/modules');
const sanctionConfigRoutes = require('./routes/sanctionConfig');

const app = express();

// Rendre le client Discord disponible pour les routes (sera set par index.js)
let discordClient = null;
app.set('discordClient', null);

// Export pour permettre à index.js de set le client
app.setDiscordClient = (client) => {
  discordClient = client;
  app.set('discordClient', client);
  console.log('🔗 Client Discord connecté à l\'API');
};

// Trust proxy (pour le développement local avec Vue proxy)
app.set('trust proxy', 1);

// Connexion à la base de données
connectDB();

// Middleware de sécurité
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting global
app.use(apiLimiter);

// Routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Discord Moderation Bot API',
    version: '1.0.0',
  });
});

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/guilds', guildRoutes);
app.use('/guilds', templateRoutes);
app.use('/guilds', moderationRoutes);
app.use('/guilds', sanctionConfigRoutes);
app.use('/users', userRoutes);
app.use('/modules', moduleRoutes);

// Log toutes les routes enregistrées
console.log('\n📋 Routes enregistrées:');
app._router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(`  ${Object.keys(r.route.methods).join(', ').toUpperCase()} ${r.route.path}`);
  } else if (r.name === 'router') {
    r.handle.stack.forEach((handler) => {
      if (handler.route) {
        const path = r.regexp.toString().replace('/^', '').replace('\\/?(?=\\/|$)/i', '');
        console.log(`  ${Object.keys(handler.route.methods).join(', ').toUpperCase()} ${path}${handler.route.path}`);
      }
    });
  }
});
console.log('');

// Gestion des erreurs
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 API démarrée sur le port ${PORT}`);
});

module.exports = app;
