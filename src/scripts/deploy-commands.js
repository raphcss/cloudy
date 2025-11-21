const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const connectDB = require('../config/database');
const CustomModule = require('../models/CustomModule');

const commands = [];
const commandsPath = path.join(__dirname, '../bot/commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Charger toutes les commandes standard
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  if ('data' in command) {
    commands.push(command.data.toJSON());
    console.log(`✅ Commande standard chargée: ${command.data.name}`);
  }
}

// Fonction pour charger les commandes des modules déployés
const loadCustomModuleCommands = async () => {
  try {
    await connectDB();
    
    const deployedModules = await CustomModule.find({ deployedAt: { $exists: true } });
    console.log(`\n📦 Chargement des commandes de ${deployedModules.length} module(s) déployé(s)...`);
    
    for (const module of deployedModules) {
      try {
        const modulePath = path.join(__dirname, '../bot/modules/custom', module._id.toString(), 'index.js');
        
        // Vérifier que le fichier existe
        if (!fs.existsSync(modulePath)) {
          console.warn(`⚠️ Module ${module.name}: fichier index.js introuvable`);
          continue;
        }
        
        // Supprimer du cache pour reload
        delete require.cache[require.resolve(modulePath)];
        
        const moduleCode = require(modulePath);
        
        if (moduleCode.commands && Array.isArray(moduleCode.commands)) {
          for (const cmd of moduleCode.commands) {
            if (cmd.data) {
              commands.push(cmd.data);
              console.log(`  ✅ Commande de module: /${cmd.data.name} (${module.name})`);
            }
          }
        }
      } catch (error) {
        console.error(`  ❌ Erreur chargement module ${module.name}:`, error.message);
      }
    }
  } catch (error) {
    console.error('❌ Erreur chargement modules personnalisés:', error);
  }
};

// Déployer les commandes
(async () => {
  try {
    // Charger d'abord les commandes des modules
    await loadCustomModuleCommands();
    
    console.log(`\n🚀 Déploiement de ${commands.length} commande(s) au total...`);

    // Créer le client REST
    const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN);

    // Déploiement global (peut prendre jusqu'à 1h pour se propager)
    const data = await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands },
    );

    console.log(`✅ ${data.length} commande(s) déployée(s) avec succès!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du déploiement:', error);
    process.exit(1);
  }
})();
