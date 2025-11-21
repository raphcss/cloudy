<template>
  <button 
    @click="toggleTheme" 
    :class="['theme-toggle', { dropdown: inDropdown }]"
    :title="isDark ? 'Mode clair' : 'Mode sombre'"
  >
    <svg v-if="!isDark" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
    <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>
    <span v-if="inDropdown">{{ isDark ? 'Mode Clair' : 'Mode Sombre' }}</span>
  </button>
</template>

<script>
import { computed } from 'vue';
import { useThemeStore } from '../stores/theme';

export default {
  name: 'ThemeToggle',
  props: {
    inDropdown: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const themeStore = useThemeStore();
    
    const isDark = computed(() => themeStore.isDark);
    
    const toggleTheme = () => {
      themeStore.toggleTheme();
    };
    
    return {
      isDark,
      toggleTheme,
    };
  },
};
</script>

<style scoped lang="scss">
.theme-toggle {
  background: transparent;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  transition: all 0.3s;
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.9rem;

  &:hover {
    background: var(--hover-bg);
    transform: scale(1.05);
  }

  svg {
    transition: transform 0.3s;
    flex-shrink: 0;
    color: var(--text-secondary);
  }

  &:hover svg {
    transform: rotate(20deg);
  }

  &.dropdown {
    width: 100%;
    justify-content: flex-start;
    padding: 0.75rem 1rem;
    border: none;
    border-radius: 8px;

    &:hover {
      transform: none;
      background: var(--hover-bg);
    }
  }
}
</style>
