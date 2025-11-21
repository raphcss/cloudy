const bcrypt = require('bcryptjs');

/**
 * Hash un mot de passe
 * @param {String} password - Mot de passe en clair
 * @returns {Promise<String>} Mot de passe hashé
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare un mot de passe avec son hash
 * @param {String} password - Mot de passe en clair
 * @param {String} hash - Hash à comparer
 * @returns {Promise<Boolean>} True si correspondance
 */
const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

module.exports = {
  hashPassword,
  comparePassword,
};
