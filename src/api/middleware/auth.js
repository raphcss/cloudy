const { verifyToken } = require('../../utils/jwt');
const { User } = require('../../models');

/**
 * Middleware d'authentification
 * Vérifie le token JWT et ajoute req.user
 */
const requireAuth = async (req, res, next) => {
  try {
    // Récupérer le token depuis l'header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token manquant',
      });
    }

    const token = authHeader.substring(7); // Enlever "Bearer "
    
    // Vérifier et décoder le token
    const decoded = verifyToken(token);
    
    // Récupérer l'utilisateur
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    console.log('[requireAuth] User from DB:', {
      id: user._id,
      email: user.email,
      globalRole: user.globalRole,
      type: typeof user.globalRole,
    });

    // Ajouter l'utilisateur à la requête
    // TOUJOURS utiliser le globalRole de la DB pour avoir les permissions à jour
    req.user = {
      id: user._id,
      email: user.email,
      discordId: user.discordId,
      globalRole: user.globalRole, // Toujours depuis la DB
    };

    console.log('[requireAuth] req.user:', req.user);

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Authentification échouée',
    });
  }
};

/**
 * Middleware optionnel d'authentification
 * Ajoute req.user si le token est présent et valide, sinon continue
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId);
    
    if (user) {
      req.user = {
        id: user._id,
        email: user.email,
        discordId: user.discordId,
        globalRole: user.globalRole,
      };
    }

    next();
  } catch (error) {
    // En cas d'erreur, on continue sans user
    next();
  }
};

/**
 * Middleware pour vérifier l'API key du bot
 */
const requireBotApiKey = (req, res, next) => {
  const apiKey = req.headers['x-bot-api-key'];
  
  if (!apiKey || apiKey !== process.env.BOT_API_KEY) {
    return res.status(401).json({
      success: false,
      message: 'API Key invalide',
    });
  }

  req.isBot = true;
  next();
};

module.exports = {
  requireAuth,
  optionalAuth,
  requireBotApiKey,
};
