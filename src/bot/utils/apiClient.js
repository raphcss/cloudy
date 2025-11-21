const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const BOT_API_KEY = process.env.BOT_API_KEY;

/**
 * Appelle l'API pour appliquer une sanction
 */
async function applySanction(guildId, data) {
  try {
    const response = await axios.post(
      `${API_URL}/guilds/${guildId}/moderate`,
      data,
      {
        headers: {
          'X-Bot-Api-Key': BOT_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Erreur API applySanction:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Récupère les sanctions d'un utilisateur
 */
async function getUserSanctions(guildId, userId) {
  try {
    const response = await axios.get(
      `${API_URL}/guilds/${guildId}/users/${userId}/sanctions`,
      {
        headers: {
          'X-Bot-Api-Key': BOT_API_KEY,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Erreur API getUserSanctions:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Récupère les templates de sanctions d'une guild
 */
async function getSanctionTemplates(guildId) {
  try {
    const response = await axios.get(
      `${API_URL}/guilds/${guildId}/sanction-templates?active=true`,
      {
        headers: {
          'X-Bot-Api-Key': BOT_API_KEY,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Erreur API getSanctionTemplates:', error.response?.data || error.message);
    return { success: true, templates: [] };
  }
}

/**
 * Récupère la configuration d'une guild
 */
async function getGuildConfig(guildId) {
  try {
    const response = await axios.get(
      `${API_URL}/guilds/${guildId}/config`,
      {
        headers: {
          'X-Bot-Api-Key': BOT_API_KEY,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Erreur API getGuildConfig:', error.response?.data || error.message);
    return null;
  }
}

module.exports = {
  applySanction,
  getUserSanctions,
  getSanctionTemplates,
  getGuildConfig,
};
