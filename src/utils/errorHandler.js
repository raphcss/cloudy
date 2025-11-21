/**
 * Gestionnaire d'erreurs global pour Express
 */
const errorHandler = (err, req, res, next) => {
  console.error('Erreur:', err);

  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors,
    });
  }

  // Erreur de cast Mongoose (ID invalide)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'ID invalide',
    });
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token invalide',
    });
  }

  // Erreur par défaut
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Erreur serveur',
  });
};

/**
 * Middleware pour les routes non trouvées
 */
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
  });
};

module.exports = {
  errorHandler,
  notFound,
};
