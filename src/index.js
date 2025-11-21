const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const apiServer = require('./api/index');
const botClient = require('./bot/index');

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION:', error);
  console.error(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION at:', promise);
  console.error('Reason:', reason);
});

console.log('🚀 Démarrage de l\'application complète...');
console.log('   - API serveur sur le port ' + (process.env.PORT || 3000));
console.log('   - Bot Discord en cours de connexion...');

// Attendre que le bot soit prêt avant de partager le client
botClient.once('ready', () => {
  // Partager le client Discord avec l'API Express
  if (apiServer.setDiscordClient) {
    apiServer.setDiscordClient(botClient);
  } else {
    apiServer.set('discordClient', botClient);
  }
  console.log('   - Client Discord partagé avec l\'API');
});

