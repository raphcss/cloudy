const fs = require('fs').promises;
const path = require('path');
const { GuildConfig } = require('../../models');
const CustomModule = require('../../models/CustomModule');

class ModuleLoader {
  constructor(client) {
    this.client = client;
    this.loadedModules = new Map(); // moduleId => module instance
  }

  async loadModule(moduleId) {
    const modulePath = path.join(__dirname, '../modules/custom', moduleId, 'index.js');
    
    try {
      // Vérifier que le fichier existe
      await fs.access(modulePath);
      
      // Supprimer du cache Node.js pour reload à chaud
      delete require.cache[require.resolve(modulePath)];
      
      // Charger le module
      const moduleCode = require(modulePath);
      
      // Valider la structure
      if (!moduleCode.name || !moduleCode.version) {
        throw new Error('Module invalide : name et version requis');
      }
      
      // Stocker l'ID du module pour référence
      moduleCode.moduleId = moduleId;
      
      // Initialiser si méthode init présente
      if (typeof moduleCode.init === 'function') {
        await moduleCode.init(this.client);
      }
      
      // Enregistrer les commandes
      if (moduleCode.commands && Array.isArray(moduleCode.commands)) {
        for (const cmd of moduleCode.commands) {
          // Ajouter moduleId à chaque commande
          cmd.moduleId = moduleId;
          this.client.customCommands.set(cmd.data.name, cmd);
          console.log(`[ModuleLoader] Commande /${cmd.data.name} enregistrée pour module ${moduleCode.name}`);
        }
      }
      
      // Enregistrer les event handlers
      if (moduleCode.events && typeof moduleCode.events === 'object') {
        for (const [eventName, handler] of Object.entries(moduleCode.events)) {
          if (typeof handler === 'function') {
            // Wrapper pour passer le client
            const wrappedHandler = async (...args) => {
              try {
                await handler(...args, this.client);
              } catch (error) {
                console.error(`[ModuleLoader] Erreur event ${eventName} du module ${moduleCode.name}:`, error);
              }
            };
            
            this.client.on(eventName, wrappedHandler);
            
            // Stocker pour cleanup
            if (!moduleCode._eventHandlers) {
              moduleCode._eventHandlers = [];
            }
            moduleCode._eventHandlers.push({ eventName, handler: wrappedHandler });
            
            console.log(`[ModuleLoader] Event handler ${eventName} enregistré pour module ${moduleCode.name}`);
          }
        }
      }
      
      this.loadedModules.set(moduleId, moduleCode);
      console.log(`[ModuleLoader] Module ${moduleCode.name} v${moduleCode.version} chargé (ID: ${moduleId})`);
      
      return moduleCode;
    } catch (error) {
      console.error(`[ModuleLoader] Erreur chargement module ${moduleId}:`, error);
      throw error;
    }
  }

  async unloadModule(moduleId) {
    const module = this.loadedModules.get(moduleId);
    if (!module) return;
    
    // Cleanup
    if (typeof module.cleanup === 'function') {
      try {
        await module.cleanup(this.client);
      } catch (error) {
        console.error(`[ModuleLoader] Erreur cleanup module ${module.name}:`, error);
      }
    }
    
    // Supprimer les event handlers
    if (module._eventHandlers) {
      for (const { eventName, handler } of module._eventHandlers) {
        this.client.removeListener(eventName, handler);
      }
    }
    
    // Supprimer les commandes
    if (module.commands) {
      for (const cmd of module.commands) {
        this.client.customCommands.delete(cmd.data.name);
      }
    }
    
    this.loadedModules.delete(moduleId);
    console.log(`[ModuleLoader] Module ${module.name} déchargé`);
  }

  async reloadModule(moduleId) {
    console.log(`[ModuleLoader] Rechargement du module ${moduleId}...`);
    await this.unloadModule(moduleId);
    await this.loadModule(moduleId);
  }

  async isModuleEnabledForGuild(moduleId, guildId) {
    try {
      // 1. Vérifier si le serveur a accès au module (allowedGuilds)
      const module = await CustomModule.findById(moduleId);
      if (!module) {
        return false;
      }

      // Si allowedGuilds est vide, tous les serveurs ont accès
      // Sinon, vérifier si ce serveur est dans la liste
      if (module.allowedGuilds.length > 0 && !module.allowedGuilds.includes(guildId)) {
        console.log(`[ModuleLoader] Serveur ${guildId} n'a pas accès au module ${moduleId}`);
        return false;
      }

      // 2. Vérifier si le module est activé pour ce serveur (moduleStates)
      const guildConfig = await GuildConfig.findOne({ guildId });
      if (!guildConfig || !guildConfig.moduleStates) {
        return false;
      }
      
      const isEnabled = guildConfig.moduleStates.get(moduleId) === true;
      
      if (!isEnabled) {
        console.log(`[ModuleLoader] Module ${moduleId} désactivé pour le serveur ${guildId}`);
      }
      
      return isEnabled;
    } catch (error) {
      console.error('[ModuleLoader] Erreur vérification module pour guild:', error);
      return false;
    }
  }

  getLoadedModules() {
    return Array.from(this.loadedModules.entries()).map(([id, module]) => ({
      id,
      name: module.name,
      version: module.version,
      description: module.description,
      commandsCount: module.commands?.length || 0,
      eventsCount: Object.keys(module.events || {}).length,
    }));
  }
}

module.exports = ModuleLoader;
