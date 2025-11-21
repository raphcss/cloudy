<template>
  <div id="app">
    <NotificationContainer />
    <ConfirmDialog />
    <div v-if="!isAuthenticated" class="auth-container">
      <router-view />
    </div>
    <div v-else class="app-container">
      <nav class="navbar">
        <div class="navbar-brand">
          <h1>🛡️ Claude</h1>
        </div>
        <div class="navbar-menu">
          <router-link to="/dashboard">Dashboard</router-link>
          <router-link v-if="isMaster" to="/admin">Administration</router-link>
          <div class="navbar-user" @click="toggleUserMenu" ref="userMenuTrigger">
            <div class="user-avatar">
              <img v-if="user?.discordId && user?.avatar" :src="`https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png?size=128`" :alt="user.username" />
              <div v-else class="avatar-placeholder">
                {{ (user?.username || user?.email || 'U').charAt(0).toUpperCase() }}
              </div>
            </div>
            <span class="user-name">{{ user?.username || user?.email }}</span>
            <svg class="dropdown-icon" :class="{ open: showUserMenu }" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            
            <div v-if="showUserMenu" class="user-dropdown" @click.stop>
              <div class="dropdown-header">
                <div class="user-info">
                  <strong>{{ user?.username || user?.email }}</strong>
                  <span v-if="user?.email" class="user-email">{{ user.email }}</span>
                </div>
              </div>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item" @click="viewProfile">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 8C10.21 8 12 6.21 12 4C12 1.79 10.21 0 8 0C5.79 0 4 1.79 4 4C4 6.21 5.79 8 8 8ZM8 10C5.33 10 0 11.34 0 14V16H16V14C16 11.34 10.67 10 8 10Z" fill="currentColor"/>
                </svg>
                Mon Profil
              </button>
              <ThemeToggle :inDropdown="true" />
              <div class="dropdown-divider"></div>
              <button class="dropdown-item logout" @click="logout">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 14H3C2.73478 14 2.48043 13.8946 2.29289 13.7071C2.10536 13.5196 2 13.2652 2 13V3C2 2.73478 2.10536 2.48043 2.29289 2.29289C2.48043 2.10536 2.73478 2 3 2H6M11 11L14 8M14 8L11 5M14 8H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      <router-view />
    </div>
  </div>
</template>

<script>
import { computed, onMounted, ref, onUnmounted } from 'vue';
import { useAuthStore } from './stores/auth';
import { useThemeStore } from './stores/theme';
import { useRouter } from 'vue-router';
import ThemeToggle from './components/ThemeToggle.vue';
import NotificationContainer from './components/NotificationContainer.vue';
import ConfirmDialog from './components/ConfirmDialog.vue';

export default {
  name: 'App',
  components: {
    ThemeToggle,
    NotificationContainer,
    ConfirmDialog,
  },
  setup() {
    const authStore = useAuthStore();
    const themeStore = useThemeStore();
    const router = useRouter();

    const isAuthenticated = computed(() => authStore.isAuthenticated);
    const user = computed(() => authStore.user);
    const isMaster = computed(() => authStore.isMaster);
    
    const showUserMenu = ref(false);
    const userMenuTrigger = ref(null);

    onMounted(async () => {
      await authStore.loadUser();
      themeStore.initTheme();
      document.addEventListener('click', handleClickOutside);
    });

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside);
    });

    const handleClickOutside = (event) => {
      if (userMenuTrigger.value && !userMenuTrigger.value.contains(event.target)) {
        showUserMenu.value = false;
      }
    };

    const toggleUserMenu = () => {
      showUserMenu.value = !showUserMenu.value;
    };

    const viewProfile = () => {
      showUserMenu.value = false;
      router.push('/profile');
    };

    const logout = () => {
      showUserMenu.value = false;
      authStore.logout();
      router.push('/login');
    };

    return {
      isAuthenticated,
      user,
      isMaster,
      showUserMenu,
      userMenuTrigger,
      toggleUserMenu,
      viewProfile,
      logout,
    };
  },
};
</script>

<style lang="scss">
:root {
  // Light theme (default)
  --bg-primary: #f5f7fa;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f9fafb;
  --text-primary: #1a202c;
  --text-secondary: #4a5568;
  --text-tertiary: #718096;
  --border-color: #e2e8f0;
  --hover-bg: #f7fafc;
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 10px 40px rgba(0, 0, 0, 0.12);
  --accent: #5865F2;
  --accent-hover: #4752c4;
  --success: #48bb78;
  --warning: #ed8936;
  --danger: #f56565;
  --info: #4299e1;
}

.dark {
  // Dark theme
  --bg-primary: #1a202c;
  --bg-secondary: #2d3748;
  --bg-tertiary: #4a5568;
  --text-primary: #f7fafc;
  --text-secondary: #e2e8f0;
  --text-tertiary: #cbd5e0;
  --border-color: #4a5568;
  --hover-bg: #2d3748;
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 40px rgba(0, 0, 0, 0.5);
  --accent: #667eea;
  --accent-hover: #5a67d8;
  --success: #48bb78;
  --warning: #ed8936;
  --danger: #fc8181;
  --info: #63b3ed;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: background 0.3s, color 0.3s;
}

#app {
  min-height: 100vh;
}

.auth-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

// Wrapper pour les pages avec padding
.page-wrapper {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.navbar {
  background: var(--bg-secondary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  padding: 0.875rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.98);
  height: 65px;

  .dark & {
    background: rgba(45, 55, 72, 0.98);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  &-brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    
    h1 {
      font-size: 1.35rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.5px;
    }
  }

  &-menu {
    display: flex;
    align-items: center;
    gap: 2rem;

    a {
      color: var(--text-secondary);
      text-decoration: none;
      font-weight: 500;
      transition: all 0.3s;
      position: relative;
      padding: 0.5rem 1rem;
      border-radius: 8px;

      &:hover {
        color: var(--accent);
        background: var(--hover-bg);
      }

      &.router-link-active {
        color: var(--accent);
        background: rgba(88, 101, 242, 0.1);
        font-weight: 600;
      }
    }
  }

  &-user {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    transition: all 0.3s;
    position: relative;

    &:hover {
      background: var(--hover-bg);
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
      border: 2px solid var(--border-color);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .avatar-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, var(--accent) 0%, #764ba2 100%);
        color: white;
        font-weight: 700;
        font-size: 1rem;
      }
    }

    .user-name {
      color: var(--text-primary);
      font-weight: 500;
      font-size: 0.95rem;
    }

    .dropdown-icon {
      color: var(--text-secondary);
      transition: transform 0.3s;

      &.open {
        transform: rotate(180deg);
      }
    }

    .user-dropdown {
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      box-shadow: var(--shadow-lg);
      min-width: 240px;
      padding: 0.5rem;
      z-index: 1000;
      animation: dropdownSlide 0.2s ease-out;

      .dropdown-header {
        padding: 0.75rem 1rem;

        .user-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;

          strong {
            color: var(--text-primary);
            font-size: 0.95rem;
          }

          .user-email {
            color: var(--text-tertiary);
            font-size: 0.8rem;
          }
        }
      }

      .dropdown-divider {
        height: 1px;
        background: var(--border-color);
        margin: 0.5rem 0;
      }

      .dropdown-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        padding: 0.75rem 1rem;
        background: transparent;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        color: var(--text-primary);
        font-weight: 500;
        font-size: 0.9rem;
        transition: all 0.2s;
        text-align: left;

        svg {
          color: var(--text-secondary);
          flex-shrink: 0;
        }

        &:hover {
          background: var(--hover-bg);
        }

        &.logout {
          color: var(--danger);

          svg {
            color: var(--danger);
          }

          &:hover {
            background: rgba(245, 101, 101, 0.1);
          }
        }
      }

      .dropdown-theme {
        margin: 0.5rem 0;
      }
    }

    .btn-logout {
      padding: 0.5rem 1rem;
      background: var(--danger);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(245, 101, 101, 0.3);
      }
    }
  }
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.95rem;

  &:hover {
    transform: translateY(-1px);
  }

  &-primary {
    background: var(--accent);
    color: white;

    &:hover {
      background: var(--accent-hover);
      box-shadow: 0 4px 12px rgba(88, 101, 242, 0.3);
    }
  }

  &-success {
    background: var(--success);
    color: white;

    &:hover {
      box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
    }
  }

  &-danger {
    background: var(--danger);
    color: white;

    &:hover {
      box-shadow: 0 4px 12px rgba(245, 101, 101, 0.3);
    }
  }

  &-secondary {
    background: var(--bg-tertiary);
    color: var(--text-primary);

    &:hover {
      background: var(--border-color);
    }
  }
}

.card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
  margin-bottom: 1rem;
  border: 1px solid var(--border-color);
  transition: all 0.3s;

  &:hover {
    box-shadow: var(--shadow-lg);
  }
}

.form-group {
  margin-bottom: 1rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  input,
  select,
  textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 1rem;
    background: var(--bg-tertiary);
    color: var(--text-primary);
    transition: all 0.3s;

    &:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(88, 101, 242, 0.1);
    }

    &::placeholder {
      color: var(--text-tertiary);
    }
  }
}

.alert {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-weight: 500;

  &-success {
    background: rgba(72, 187, 120, 0.1);
    color: var(--success);
    border: 1px solid var(--success);
  }

  &-error {
    background: rgba(245, 101, 101, 0.1);
    color: var(--danger);
    border: 1px solid var(--danger);
  }

  &-warning {
    background: rgba(237, 137, 54, 0.1);
    color: var(--warning);
    border: 1px solid var(--warning);
  }

  &-info {
    background: rgba(66, 153, 225, 0.1);
    color: var(--info);
    border: 1px solid var(--info);
  }
}

@keyframes dropdownSlide {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Animations
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
