import { defineStore } from 'pinia';
import api from '../services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    isLoading: false,
  }),

  getters: {
    isMaster: (state) => state.user?.globalRole === 'MASTER',
    
    isGuildAdmin: (state) => (guildId) => {
      if (state.user?.globalRole === 'MASTER') return true;
      // À implémenter: vérifier les guildRoles de l'utilisateur
      return false;
    },

    isGuildModerator: (state) => (guildId) => {
      if (state.user?.globalRole === 'MASTER') return true;
      // À implémenter: vérifier les guildRoles
      return false;
    },
  },

  actions: {
    async login(email, password) {
      try {
        const response = await api.login(email, password);
        
        if (response.data.success) {
          this.token = response.data.token;
          this.user = response.data.user;
          this.isAuthenticated = true;
          
          localStorage.setItem('token', this.token);
          
          return { success: true };
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Erreur de connexion',
        };
      }
    },

    async register(userData) {
      try {
        const response = await api.register(userData);
        
        if (response.data.success) {
          this.token = response.data.token;
          this.user = response.data.user;
          this.isAuthenticated = true;
          
          localStorage.setItem('token', this.token);
          
          return { success: true };
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Erreur d\'inscription',
        };
      }
    },

    async loginWithDiscord(code) {
      try {
        const response = await api.discordCallback(code);
        
        if (response.data.success) {
          this.token = response.data.token;
          this.user = response.data.user;
          this.isAuthenticated = true;
          
          localStorage.setItem('token', this.token);
          
          return { success: true };
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Erreur d\'authentification Discord',
        };
      }
    },

    async loadUser() {
      if (!this.token) {
        this.isAuthenticated = false;
        return;
      }

      this.isLoading = true;

      try {
        const response = await api.getMe();
        
        if (response.data.success) {
          this.user = response.data.user;
          this.isAuthenticated = true;
        }
      } catch (error) {
        this.logout();
      } finally {
        this.isLoading = false;
      }
    },

    logout() {
      this.user = null;
      this.token = null;
      this.isAuthenticated = false;
      localStorage.removeItem('token');
    },
  },
});
