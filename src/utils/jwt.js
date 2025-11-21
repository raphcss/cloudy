const jwt = require('jsonwebtoken');

/**
 * Génère un token JWT
 * @param {Object} payload - Données à encoder (userId, globalRole, etc.)
 * @returns {String} Token JWT
 */
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Vérifie et décode un token JWT
 * @param {String} token - Token à vérifier
 * @returns {Object} Payload décodé
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Token invalide ou expiré');
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
