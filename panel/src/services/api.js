import axios from 'axios';

const API_BASE_URL = process.env.VUE_APP_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs d'auth
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    // Commenté temporairement pour déboguer
    // else if (error.response?.status === 403) {
    //   window.location.href = '/error/403';
    // } else if (error.response?.status === 404) {
    //   window.location.href = '/error/404';
    // } else if (error.response?.status >= 500) {
    //   window.location.href = '/error/500';
    // }
    return Promise.reject(error);
  }
);

export default {
  // Auth
  login(email, password) {
    return apiClient.post('/auth/login', { email, password });
  },

  register(data) {
    return apiClient.post('/auth/register', data);
  },

  getMe() {
    return apiClient.get('/auth/me');
  },

  // Discord OAuth2
  getDiscordAuthUrl() {
    return apiClient.get('/auth/discord');
  },

  discordCallback(code) {
    return apiClient.post('/auth/discord/callback', { code });
  },

  // Admin (Master only)
  getAllUsers() {
    return apiClient.get('/admin/users');
  },

  getUserById(userId) {
    return apiClient.get(`/admin/users/${userId}`);
  },

  updateGlobalRole(userId, globalRole) {
    return apiClient.patch(`/admin/users/${userId}/global-role`, { globalRole });
  },

  assignGuildRole(guildId, userId, role) {
    return apiClient.post(`/admin/guilds/${guildId}/users/${userId}/role`, { role });
  },

  removeGuildRole(guildId, userId) {
    return apiClient.delete(`/admin/guilds/${guildId}/users/${userId}/role`);
  },

  getAllGuilds() {
    return apiClient.get('/admin/guilds');
  },

  generateBotInvite(guildId) {
    return apiClient.post('/admin/generate-invite', { guildId });
  },

  getUserGuilds() {
    return apiClient.get('/users/me/guilds');
  },

  getSimpleGuildsList() {
    return apiClient.get('/users/guilds');
  },

  getGuildModerators(guildId) {
    return apiClient.get(`/guilds/${guildId}/moderators`);
  },

  getGuildMember(guildId, userId) {
    return apiClient.get(`/guilds/${guildId}/members/${userId}`);
  },

  // Verify Discord IDs
  verifyChannel(guildId, channelId) {
    return apiClient.get(`/guilds/${guildId}/verify/channel/${channelId}`);
  },

  verifyRole(guildId, roleId) {
    return apiClient.get(`/guilds/${guildId}/verify/role/${roleId}`);
  },

  removeModerator(guildId, bindingId) {
    return apiClient.delete(`/admin/guilds/${guildId}/moderators/${bindingId}`);
  },

  // Guilds
  getGuildConfig(guildId) {
    return apiClient.get(`/guilds/${guildId}/config`);
  },

  updateGuildConfig(guildId, config) {
    return apiClient.put(`/guilds/${guildId}/config`, config);
  },

  getGuildDetails(guildId) {
    return apiClient.get(`/guilds/${guildId}/details`);
  },

  getBotInviteUrl(guildId) {
    return apiClient.get(`/guilds/${guildId}/invite`);
  },

  // Templates
  getTemplates(guildId, params = {}) {
    return apiClient.get(`/guilds/${guildId}/sanction-templates`, { params });
  },

  getTemplateById(guildId, templateId) {
    return apiClient.get(`/guilds/${guildId}/sanction-templates/${templateId}`);
  },

  createTemplate(guildId, data) {
    return apiClient.post(`/guilds/${guildId}/sanction-templates`, data);
  },

  updateTemplate(guildId, templateId, data) {
    return apiClient.put(`/guilds/${guildId}/sanction-templates/${templateId}`, data);
  },

  deleteTemplate(guildId, templateId) {
    return apiClient.delete(`/guilds/${guildId}/sanction-templates/${templateId}`);
  },

  // Moderation
  applySanction(guildId, data) {
    return apiClient.post(`/guilds/${guildId}/moderate`, data);
  },

  revokeSanction(guildId, sanctionId, moderatorId) {
    return apiClient.post(`/guilds/${guildId}/sanctions/${sanctionId}/revoke`, {
      moderatorId,
    });
  },

  getGuildSanctions(guildId, params = {}) {
    return apiClient.get(`/guilds/${guildId}/sanctions`, { params });
  },

  getUserSanctions(guildId, userId, params = {}) {
    return apiClient.get(`/guilds/${guildId}/users/${userId}/sanctions`, { params });
  },

  getUserGlobalSanctions(userId) {
    return apiClient.get(`/users/${userId}/sanctions/global`);
  },

  resetUserCounters(guildId, userId, infractionType = null) {
    return apiClient.post(`/guilds/${guildId}/users/${userId}/reset-counters`, {
      infractionType,
    });
  },

  getGuildModerationLogs(guildId, params = {}) {
    return apiClient.get(`/guilds/${guildId}/moderation-logs`, { params });
  },

  // Permissions
  getGuildPermissions(guildId) {
    return apiClient.get(`/guilds/${guildId}/permissions`);
  },

  addGuildPermission(guildId, data) {
    return apiClient.post(`/guilds/${guildId}/permissions`, data);
  },

  deleteGuildPermission(guildId, permissionId) {
    return apiClient.delete(`/guilds/${guildId}/permissions/${permissionId}`);
  },

  // Statistics
  getGuildStats(guildId) {
    return apiClient.get(`/guilds/${guildId}/stats`);
  },

  // Modules
  getModules() {
    return apiClient.get('/modules');
  },

  createModule(data) {
    return apiClient.post('/modules', data);
  },

  updateModule(moduleId, data) {
    return apiClient.put(`/modules/${moduleId}`, data);
  },

  deleteModule(moduleId) {
    return apiClient.delete(`/modules/${moduleId}`);
  },

  deployModule(moduleId) {
    return apiClient.post(`/modules/${moduleId}/deploy`);
  },

  toggleModuleAccessForGuild(moduleId, guildId, hasAccess) {
    return apiClient.put(`/modules/${moduleId}/guild/${guildId}/access`, { hasAccess });
  },

  getModuleAccess(moduleId) {
    return apiClient.get(`/modules/${moduleId}/access`);
  },

  toggleModuleForGuild(moduleId, guildId, enabled) {
    return apiClient.put(`/modules/${moduleId}/guild/${guildId}/toggle`, { enabled });
  },

  getModuleStatesForGuild(guildId) {
    return apiClient.get(`/modules/guild/${guildId}/states`);
  },

  // Sanction Configuration (Types d'infractions et règles d'escalation)
  getInfractionTypes(guildId) {
    return apiClient.get(`/guilds/${guildId}/infraction-types`);
  },

  createInfractionType(guildId, data) {
    return apiClient.post(`/guilds/${guildId}/infraction-types`, data);
  },

  updateInfractionType(guildId, typeId, data) {
    return apiClient.put(`/guilds/${guildId}/infraction-types/${typeId}`, data);
  },

  deleteInfractionType(guildId, typeId) {
    return apiClient.delete(`/guilds/${guildId}/infraction-types/${typeId}`);
  },

  getEscalationRules(guildId) {
    return apiClient.get(`/guilds/${guildId}/escalation-rules`);
  },

  upsertEscalationRule(guildId, data) {
    return apiClient.post(`/guilds/${guildId}/escalation-rules`, data);
  },

  deleteEscalationRule(guildId, ruleId) {
    return apiClient.delete(`/guilds/${guildId}/escalation-rules/${ruleId}`);
  },
};
