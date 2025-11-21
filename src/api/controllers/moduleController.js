const CustomModule = require('../../models/CustomModule');
const fs = require('fs').promises;
const path = require('path');
const { validateModuleCode, validateModuleStructure } = require('../../bot/services/moduleValidator');

// Fonction pour sauvegarder les fichiers sur disque
const saveModuleFiles = async (moduleId, files) => {
  const modulePath = path.join(__dirname, '../../bot/modules/custom', moduleId.toString());
  
  // Créer le dossier du module
  await fs.mkdir(modulePath, { recursive: true });
  
  for (const file of files) {
    const filePath = path.join(modulePath, file.name);
    
    // Sauvegarder le contenu sur disque
    await fs.writeFile(filePath, file.content, 'utf-8');
  }
  
  return files.length; // Retourner juste le nombre
};

// Récupérer tous les modules
const getModules = async (req, res) => {
  try {
    const modules = await CustomModule.find().sort({ createdAt: -1 });
    res.json(modules);
  } catch (error) {
    console.error('Erreur récupération modules:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Créer un nouveau module
const createModule = async (req, res) => {
  try {
    console.log('[createModule] req.body:', JSON.stringify(req.body, null, 2));
    console.log('[createModule] files type:', typeof req.body.files);
    console.log('[createModule] files value:', req.body.files);
    
    const { name, description, icon, version, enabled, files, config } = req.body;
    const userId = req.user.id; // ID MongoDB de l'utilisateur

    console.log('[createModule] userId:', userId, 'type:', typeof userId);
    console.log('[createModule] req.user:', req.user);
    console.log('[createModule] extracted files:', files, 'type:', typeof files);

    // Récupérer l'utilisateur pour obtenir son email/nom
    const User = require('../../models/User');
    const user = await User.findById(userId);
    
    if (!user) {
      console.error('[createModule] User not found:', userId);
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    const authorName = user.username || user.email?.split('@')[0] || 'Master';
    console.log('[createModule] Author name:', authorName);

    // Créer le module d'abord pour obtenir l'ID
    const module = new CustomModule({
      name,
      description,
      icon: icon || '📦',
      version: version || '1.0.0',
      author: authorName,
      createdBy: userId,
      enabled: enabled !== undefined ? enabled : true,
      filesCount: 0,
      config: config || {},
    });

    await module.save();
    console.log('[createModule] Module created:', module._id);

    // Sauvegarder les fichiers sur disque si présents
    if (files && files.length > 0) {
      const filesArray = Array.isArray(files) ? files : [files];
      const filesCount = await saveModuleFiles(module._id, filesArray);
      
      console.log('[createModule] Files saved on disk:', filesCount);
      
      // Mettre à jour juste le nombre
      await CustomModule.findByIdAndUpdate(
        module._id,
        { filesCount },
        { new: true }
      );
    }

    // Récupérer le module final
    const finalModule = await CustomModule.findById(module._id);
    res.status(201).json(finalModule);
  } catch (error) {
    console.error('Erreur création module:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Erreur lors de la création du module', details: error.message });
  }
};

// Mettre à jour un module
const updateModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { name, description, icon, version, enabled, files, config } = req.body;
    const userId = req.user.id;

    const module = await CustomModule.findById(moduleId);
    
    if (!module) {
      return res.status(404).json({ error: 'Module non trouvé' });
    }

    // Vérifier que l'utilisateur est le créateur
    if (module.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    // Si le module est désactivé, désactiver sur tous les serveurs
    if (enabled !== undefined && enabled === false && module.enabled === true) {
      console.log(`[updateModule] Module ${module.name} désactivé - désactivation sur tous les serveurs`);
      
      // Désactiver le module sur tous les serveurs
      const { GuildConfig } = require('../../models');
      const allGuilds = await GuildConfig.find();
      
      for (const guild of allGuilds) {
        if (guild.moduleStates && guild.moduleStates.has(moduleId.toString())) {
          guild.moduleStates.set(moduleId.toString(), false);
          await guild.save();
          console.log(`[updateModule] Module désactivé sur guild ${guild.guildId}`);
        }
      }
    }

    // Mettre à jour les champs
    if (name !== undefined) module.name = name;
    if (description !== undefined) module.description = description;
    if (icon !== undefined) module.icon = icon;
    if (version !== undefined) module.version = version;
    if (enabled !== undefined) module.enabled = enabled;
    if (config !== undefined) module.config = config;

    // Si de nouveaux fichiers sont fournis, sauvegarder sur disque
    if (files !== undefined && files.length > 0) {
      const filesArray = Array.isArray(files) ? files : [files];
      const savedFiles = await saveModuleFiles(module._id, filesArray);
      module.files = savedFiles;
    }

    await module.save();
    res.json(module);
  } catch (error) {
    console.error('Erreur mise à jour module:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
};

// Supprimer un module
const deleteModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const userId = req.user.id;

    const module = await CustomModule.findById(moduleId);
    
    if (!module) {
      return res.status(404).json({ error: 'Module non trouvé' });
    }

    // Vérifier que l'utilisateur est le créateur
    if (module.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    // Supprimer le dossier du module sur disque
    const modulePath = path.join(__dirname, '../../bot/modules/custom', moduleId.toString());
    try {
      await fs.rm(modulePath, { recursive: true, force: true });
      console.log('[deleteModule] Files deleted from disk');
    } catch (error) {
      console.warn('[deleteModule] Error deleting files:', error.message);
    }

    await CustomModule.findByIdAndDelete(moduleId);
    res.json({ message: 'Module supprimé' });
  } catch (error) {
    console.error('Erreur suppression module:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
};

// Déployer un module (charger dynamiquement dans le bot)
const deployModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const userId = req.user.id;

    const module = await CustomModule.findById(moduleId);
    
    if (!module) {
      return res.status(404).json({ error: 'Module non trouvé' });
    }

    // Vérifier que l'utilisateur est le créateur
    if (module.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    // Vérifier que les fichiers existent sur le disque
    const modulePath = path.join(__dirname, '../../bot/modules/custom', moduleId);
    const indexPath = path.join(modulePath, 'index.js');
    
    try {
      await fs.access(indexPath);
    } catch (error) {
      return res.status(400).json({ 
        error: 'Fichiers du module introuvables', 
        details: 'Veuillez uploader les fichiers du module avant de le déployer'
      });
    }

    // Valider le code du module avant déploiement
    try {
      await validateModuleCode(moduleId);
    } catch (validationError) {
      return res.status(400).json({ 
        error: 'Validation du module échouée', 
        details: validationError.message 
      });
    }

    // Charger le module via le bot Discord
    const discordClient = req.app.get('discordClient');
    
    if (!discordClient || !discordClient.moduleLoader) {
      return res.status(503).json({ error: 'Bot Discord non disponible' });
    }

    try {
      // Charger dynamiquement le module
      const loadedModule = await discordClient.moduleLoader.loadModule(moduleId);
      
      // Valider la structure du module chargé
      validateModuleStructure(loadedModule);
      
      // Marquer comme déployé
      module.deployedAt = new Date();
      await module.save();

      res.json({ 
        message: 'Module déployé avec succès', 
        module,
        moduleInfo: {
          name: loadedModule.name,
          version: loadedModule.version,
          commandsCount: loadedModule.commands?.length || 0,
          eventsCount: Object.keys(loadedModule.events || {}).length
        }
      });
    } catch (loadError) {
      console.error('Erreur chargement module:', loadError);
      res.status(500).json({ 
        error: 'Erreur lors du déploiement du module',
        details: loadError.message
      });
    }
  } catch (error) {
    console.error('Erreur déploiement module:', error);
    res.status(500).json({ error: 'Erreur lors du déploiement' });
  }
};

// Toggle module pour un serveur spécifique
const toggleModuleForGuild = async (req, res) => {
  try {
    const { guildId, moduleId } = req.params;
    const { enabled } = req.body;

    const GuildConfig = require('../../models/GuildConfig');
    
    let guildConfig = await GuildConfig.findOne({ guildId });
    
    if (!guildConfig) {
      return res.status(404).json({ error: 'Configuration du serveur non trouvée' });
    }

    // Initialiser moduleStates si nécessaire
    if (!guildConfig.moduleStates) {
      guildConfig.moduleStates = new Map();
    }

    guildConfig.moduleStates.set(moduleId, enabled);
    await guildConfig.save();

    res.json({ message: 'État du module mis à jour', enabled });
  } catch (error) {
    console.error('Erreur toggle module:', error);
    res.status(500).json({ error: 'Erreur lors de la modification' });
  }
};

// Récupérer l'état des modules pour un serveur
const getModuleStatesForGuild = async (req, res) => {
  try {
    const { guildId } = req.params;

    const GuildConfig = require('../../models/GuildConfig');
    const guildConfig = await GuildConfig.findOne({ guildId });

    const moduleStates = guildConfig?.moduleStates || {};
    res.json(moduleStates);
  } catch (error) {
    console.error('Erreur récupération états modules:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Récupérer les informations des modules actuellement chargés dans le bot
const getLoadedModules = async (req, res) => {
  try {
    const discordClient = req.app.get('discordClient');
    
    if (!discordClient || !discordClient.moduleLoader) {
      return res.status(503).json({ 
        error: 'Bot Discord non disponible',
        loadedModules: []
      });
    }

    const loadedModules = discordClient.moduleLoader.getLoadedModules();
    res.json({ loadedModules });
  } catch (error) {
    console.error('Erreur récupération modules chargés:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Recharger un module (hot-reload)
const reloadModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const userId = req.user.id;

    const module = await CustomModule.findById(moduleId);
    
    if (!module) {
      return res.status(404).json({ error: 'Module non trouvé' });
    }

    // Vérifier que l'utilisateur est le créateur
    if (module.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    const discordClient = req.app.get('discordClient');
    
    if (!discordClient || !discordClient.moduleLoader) {
      return res.status(503).json({ error: 'Bot Discord non disponible' });
    }

    try {
      await discordClient.moduleLoader.reloadModule(moduleId);
      res.json({ message: 'Module rechargé avec succès' });
    } catch (error) {
      console.error('Erreur rechargement module:', error);
      res.status(500).json({ 
        error: 'Erreur lors du rechargement',
        details: error.message
      });
    }
  } catch (error) {
    console.error('Erreur rechargement module:', error);
    res.status(500).json({ error: 'Erreur lors du rechargement' });
  }
};

// Gérer l'accès d'un serveur à un module (Master uniquement)
const toggleModuleAccessForGuild = async (req, res) => {
  try {
    const { moduleId, guildId } = req.params;
    const { hasAccess } = req.body; // true = ajouter accès, false = retirer accès
    const userId = req.user.id;

    const module = await CustomModule.findById(moduleId);
    
    if (!module) {
      return res.status(404).json({ error: 'Module non trouvé' });
    }

    // Vérifier que l'utilisateur est le créateur
    if (module.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    // Gérer l'accès
    if (hasAccess) {
      // Ajouter le serveur à allowedGuilds s'il n'y est pas
      if (!module.allowedGuilds.includes(guildId)) {
        module.allowedGuilds.push(guildId);
      }
    } else {
      // Retirer le serveur de allowedGuilds
      module.allowedGuilds = module.allowedGuilds.filter(id => id !== guildId);
    }

    await module.save();

    res.json({ 
      message: hasAccess ? 'Accès accordé' : 'Accès retiré',
      allowedGuilds: module.allowedGuilds
    });
  } catch (error) {
    console.error('Erreur toggle accès module:', error);
    res.status(500).json({ error: 'Erreur lors de la modification' });
  }
};

// Récupérer les serveurs ayant accès à un module
const getModuleAccessGuilds = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const userId = req.user.id;

    const module = await CustomModule.findById(moduleId);
    
    if (!module) {
      return res.status(404).json({ error: 'Module non trouvé' });
    }

    // Vérifier que l'utilisateur est le créateur
    if (module.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    res.json({ 
      allowedGuilds: module.allowedGuilds,
      allAccess: module.allowedGuilds.length === 0 // Si vide = tous ont accès
    });
  } catch (error) {
    console.error('Erreur récupération accès module:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  getModules,
  createModule,
  updateModule,
  deleteModule,
  deployModule,
  toggleModuleForGuild,
  getModuleStatesForGuild,
  getLoadedModules,
  reloadModule,
  toggleModuleAccessForGuild,
  getModuleAccessGuilds,
};
