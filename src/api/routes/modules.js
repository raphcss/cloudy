const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const { requireAuth } = require('../middleware/auth');
const { requireMaster } = require('../middleware/permissions');

// Routes pour les modules personnalisés

// Récupérer tous les modules
router.get('/', requireAuth, moduleController.getModules);

// Récupérer les modules actuellement chargés dans le bot
router.get('/loaded', requireAuth, moduleController.getLoadedModules);

// Créer un module (Master uniquement)
router.post('/', requireAuth, requireMaster, moduleController.createModule);

// Mettre à jour un module
router.put('/:moduleId', requireAuth, requireMaster, moduleController.updateModule);

// Supprimer un module
router.delete('/:moduleId', requireAuth, requireMaster, moduleController.deleteModule);

// Déployer un module
router.post('/:moduleId/deploy', requireAuth, requireMaster, moduleController.deployModule);

// Recharger un module (hot-reload)
router.post('/:moduleId/reload', requireAuth, requireMaster, moduleController.reloadModule);

// Gérer l'accès d'un serveur à un module (Master uniquement)
router.put('/:moduleId/guild/:guildId/access', requireAuth, requireMaster, moduleController.toggleModuleAccessForGuild);

// Récupérer les serveurs ayant accès à un module
router.get('/:moduleId/access', requireAuth, requireMaster, moduleController.getModuleAccessGuilds);

// Toggle module pour un serveur spécifique
router.put('/:moduleId/guild/:guildId/toggle', requireAuth, moduleController.toggleModuleForGuild);

// Récupérer l'état des modules pour un serveur
router.get('/guild/:guildId/states', requireAuth, moduleController.getModuleStatesForGuild);

module.exports = router;
