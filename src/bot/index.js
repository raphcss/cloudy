const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const connectDB = require('../config/database');
const SanctionSchedulerService = require('../services/sanctionSchedulerService');
const ModuleLoader = require('./services/moduleLoader');
const CustomModule = require('../models/CustomModule');

// Créer le client Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
  ],
});

// Collection pour stocker les commandes
client.commands = new Collection();
client.customCommands = new Collection(); // Commandes des modules personnalisés

// Charger les commandes
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    console.log(`✅ Commande chargée: ${command.data.name}`);
  } else {
    console.log(`⚠️ Commande invalide dans ${file}`);
  }
}

// Charger les events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
  
  console.log(`✅ Event chargé: ${event.name}`);
}

// Connexion à MongoDB
connectDB();

// Connexion du bot et démarrage du scheduler
client.login(process.env.DISCORD_BOT_TOKEN);

// Démarrer le scheduler après connexion
client.once('ready', async () => {
  const sanctionScheduler = new SanctionSchedulerService(client);
  sanctionScheduler.start();
  
  // Rendre le scheduler accessible globalement
  client.sanctionScheduler = sanctionScheduler;
  
  // Initialiser le ModuleLoader
  client.moduleLoader = new ModuleLoader(client);
  console.log('🔌 ModuleLoader initialisé');
  
  // Charger tous les modules déployés
  try {
    const deployedModules = await CustomModule.find({ deployedAt: { $exists: true } });
    console.log(`📦 Chargement de ${deployedModules.length} module(s) déployé(s)...`);
    
    for (const module of deployedModules) {
      try {
        await client.moduleLoader.loadModule(module._id.toString());
      } catch (error) {
        console.error(`❌ Erreur chargement module ${module.name}:`, error.message);
      }
    }
    
    console.log('✅ Tous les modules ont été traités');
  } catch (error) {
    console.error('❌ Erreur lors du chargement des modules:', error);
  }
});

// Gestion arrêt gracieux
process.on('SIGINT', () => {
  console.log('\n📴 Arrêt du bot...');
  if (client.sanctionScheduler) {
    client.sanctionScheduler.stop();
  }
  client.destroy();
  process.exit(0);
});

module.exports = client;
