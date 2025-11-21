import { defineStore } from 'pinia';

export const useConfirmStore = defineStore('confirm', {
  state: () => ({
    isVisible: false,
    title: '',
    message: '',
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    confirmCallback: null,
    cancelCallback: null,
    type: 'warning' // warning, danger, info
  }),

  actions: {
    show(options) {
      return new Promise((resolve) => {
        this.isVisible = true;
        this.title = options.title || 'Confirmation';
        this.message = options.message || 'Êtes-vous sûr ?';
        this.confirmText = options.confirmText || 'Confirmer';
        this.cancelText = options.cancelText || 'Annuler';
        this.type = options.type || 'warning';
        
        this.confirmCallback = () => {
          this.isVisible = false;
          resolve(true);
        };
        
        this.cancelCallback = () => {
          this.isVisible = false;
          resolve(false);
        };
      });
    },

    confirm() {
      if (this.confirmCallback) {
        this.confirmCallback();
      }
    },

    cancel() {
      if (this.cancelCallback) {
        this.cancelCallback();
      }
    },

    hide() {
      this.isVisible = false;
      if (this.cancelCallback) {
        this.cancelCallback();
      }
    }
  }
});
