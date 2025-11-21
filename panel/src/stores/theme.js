import { defineStore } from 'pinia';

export const useThemeStore = defineStore('theme', {
  state: () => ({
    theme: localStorage.getItem('theme') || 'light', // 'light' ou 'dark'
  }),
  
  getters: {
    isDark: (state) => state.theme === 'dark',
  },
  
  actions: {
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', this.theme);
      this.applyTheme();
    },
    
    setTheme(theme) {
      this.theme = theme;
      localStorage.setItem('theme', theme);
      this.applyTheme();
    },
    
    applyTheme() {
      if (this.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    
    initTheme() {
      this.applyTheme();
    },
  },
});
