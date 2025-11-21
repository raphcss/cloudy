<template>
  <div class="page-wrapper">
    <div class="dashboard">
      <div class="dashboard-header">
        <h1>📊 Dashboard</h1>
      </div>

    <div v-if="isMaster" class="master-banner">
      <div class="banner-content">
        <div class="banner-icon">👑</div>
        <div class="banner-text">
          <h3>Administration Globale</h3>
          <p>Vous avez accès à tous les serveurs et utilisateurs</p>
        </div>
        <router-link to="/admin" class="btn btn-primary">
          Administration
        </router-link>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">🖥️</div>
        <div class="stat-details">
          <div class="stat-value">{{ guilds.length }}</div>
          <div class="stat-label">Serveurs</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-details">
          <div class="stat-value">{{ activeGuilds }}</div>
          <div class="stat-label">Actifs</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">⚡</div>
        <div class="stat-details">
          <div class="stat-value">{{ totalMembers }}</div>
          <div class="stat-label">Membres</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🛡️</div>
        <div class="stat-details">
          <div class="stat-value">{{ totalSanctions }}</div>
          <div class="stat-label">Sanctions</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2>🖥️ Vos Serveurs</h2>
        <p class="text-muted">
          Sélectionnez un serveur pour gérer sa configuration et modération
        </p>
      </div>
      
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Chargement des serveurs...</p>
      </div>

      <div v-else-if="guilds.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>Aucun serveur disponible</h3>
        <p class="text-muted">
          Contactez un administrateur pour obtenir des permissions sur un serveur
        </p>
      </div>

      <div v-else class="guilds-grid">
        <div
          v-for="guild in guilds"
          :key="guild.guildId"
          class="guild-card"
          @click="handleGuildClick(guild)"
        >
          <div class="guild-header">
            <div v-if="guild.icon" class="guild-icon">
              <img :src="guild.icon" :alt="guild.name" />
            </div>
            <div v-else class="guild-icon-placeholder">
              {{ guild.name ? guild.name.charAt(0).toUpperCase() : '?' }}
            </div>
            <span :class="['status-dot', guild.active ? 'active' : 'inactive']"></span>
          </div>
          
          <h3>{{ guild.name || 'Serveur inconnu' }}</h3>
          
          <div v-if="guild.botPresent === false" class="bot-missing-badge">
            🤖 Bot absent
          </div>
          <div v-else-if="!guild.configured" class="not-configured-badge">
            ⚙️ Configuration
          </div>
          
          <div class="guild-stats">
            <div class="guild-stat">
              <span class="stat-icon">👥</span>
              <span>{{ guild.memberCount || 0 }} membres</span>
            </div>
          </div>

          <div class="guild-footer">
            <span class="guild-id">ID: {{ guild.guildId }}</span>
            <button
              v-if="guild.botPresent === false"
              class="btn-invite"
              @click.stop="inviteBot(guild)"
              title="Ajouter le bot à ce serveur"
            >
              ➕ Ajouter
            </button>
            <span v-else class="arrow">{{ guild.configured ? '→' : '⚙️' }}</span>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import api from '../services/api';

export default {
  name: 'Dashboard',
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    const guilds = ref([]);
    const loading = ref(true);

    const isMaster = computed(() => authStore.isMaster);
    const activeGuilds = computed(() => guilds.value.filter(g => g.active).length);
    const totalMembers = computed(() => guilds.value.reduce((sum, g) => sum + (g.memberCount || 0), 0));
    const totalSanctions = ref(0);

    const handleGuildClick = (guild) => {
      // Bloquer uniquement si le bot n'est pas présent
      if (guild.botPresent === false) {
        return;
      }
      
      // Rediriger vers setup si non configuré, sinon vers le panel
      if (guild.configured) {
        router.push(`/guild/${guild.guildId}`);
      } else {
        router.push(`/guild/${guild.guildId}/setup`);
      }
    };

    const inviteBot = async (guild) => {
      try {
        const response = await api.getBotInviteUrl(guild.guildId);
        if (response.data.success) {
          // Ouvrir l'URL d'invitation dans une nouvelle fenêtre
          window.open(response.data.inviteUrl, '_blank');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'URL d\'invitation:', error);
      }
    };

    onMounted(async () => {
      try {
        // Charger les guilds de l'utilisateur (automatiquement filtrées selon les permissions)
        console.log('[Dashboard] Chargement des guilds...');
        const response = await api.getUserGuilds();
        console.log('[Dashboard] Response complète:', response);
        console.log('[Dashboard] Response.data:', response.data);
        console.log('[Dashboard] Response.data.guilds:', response.data.guilds);
        console.log('[Dashboard] Type de response.data.guilds:', typeof response.data.guilds, Array.isArray(response.data.guilds));
        
        guilds.value = response.data.guilds || [];
        console.log('[Dashboard] Nombre de guilds assignées:', guilds.value.length);
        console.log('[Dashboard] Guilds value:', guilds.value);
      } catch (error) {
        console.error('[Dashboard] Erreur chargement guilds:', error);
        console.error('[Dashboard] Error response:', error.response);
      } finally {
        loading.value = false;
      }
    });

    return {
      isMaster,
      guilds,
      loading,
      activeGuilds,
      totalMembers,
      totalSanctions,
      handleGuildClick,
      inviteBot,
    };
  },
};
</script>

<style scoped lang="scss">
.dashboard {
  animation: fadeIn 0.5s ease-out;
}

.dashboard-header {
  margin-bottom: 2rem;

  h1 {
    color: var(--text-primary);
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    font-weight: 700;
  }

  .subtitle {
    color: var(--text-secondary);
    font-size: 1.1rem;
  }
}

.master-banner {
  background: linear-gradient(135deg, var(--accent) 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-lg);

  .banner-content {
    display: flex;
    align-items: center;
    gap: 1.5rem;

    .banner-icon {
      font-size: 3rem;
    }

    .banner-text {
      flex: 1;

      h3 {
        color: white;
        margin-bottom: 0.25rem;
        font-size: 1.5rem;
      }

      p {
        color: rgba(255, 255, 255, 0.9);
        margin: 0;
      }
    }

    .btn {
      background: white;
      color: var(--accent);
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  .stat-icon {
    font-size: 2.5rem;
    opacity: 0.9;
  }

  .stat-details {
    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1;
    }

    .stat-label {
      color: var(--text-secondary);
      font-size: 0.9rem;
      margin-top: 0.25rem;
    }
  }
}

.card {
  .card-header {
    margin-bottom: 1.5rem;

    h2 {
      color: var(--text-primary);
      margin-bottom: 0.5rem;
      font-size: 1.75rem;
    }
  }
}

.guilds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.guild-card {
  background: var(--bg-tertiary);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--accent) 0%, #764ba2 100%);
    transform: scaleX(0);
    transition: transform 0.3s;
  }

  &:hover {
    border-color: var(--accent);
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);

    &::before {
      transform: scaleX(1);
    }

    .arrow {
      transform: translateX(4px);
    }
  }

  .guild-header {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
    position: relative;

    .guild-icon,
    .guild-icon-placeholder {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--accent) 0%, #764ba2 100%);
      color: white;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .status-dot {
      position: absolute;
      top: 0;
      right: 0;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid var(--bg-secondary);

      &.active {
        background: var(--success);
      }

      &.inactive {
        background: var(--text-tertiary);
      }
    }
  }

  h3 {
    color: var(--text-primary);
    margin-bottom: 1rem;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .not-configured-badge {
    display: inline-block;
    background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%);
    color: white;
    padding: 0.4rem 0.8rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 1rem;
    animation: pulse 2s infinite;
  }

  .bot-missing-badge {
    display: inline-block;
    background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
    color: white;
    padding: 0.4rem 0.8rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 1rem;
    animation: pulse 2s infinite;
  }

  .guild-stats {
    margin-bottom: 1rem;

    .guild-stat {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-secondary);
      font-size: 0.9rem;

      .stat-icon {
        font-size: 1rem;
      }
    }
  }

  .guild-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);

    .guild-id {
      font-size: 0.8rem;
      color: var(--text-tertiary);
      font-family: 'Courier New', monospace;
    }

    .btn-invite {
      background: linear-gradient(135deg, var(--accent) 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.5);
      }

      &:active {
        transform: translateY(0);
      }
    }

    .arrow {
      color: var(--accent);
      font-size: 1.25rem;
      font-weight: 700;
      transition: transform 0.3s;
    }
  }
}

.loading {
  text-align: center;
  padding: 4rem 2rem;

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid var(--border-color);
    border-top: 4px solid var(--accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  p {
    color: var(--text-secondary);
    font-weight: 500;
  }
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;

  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  h3 {
    color: var(--text-primary);
    margin-bottom: 0.5rem;
    font-size: 1.5rem;
  }

  .text-muted {
    max-width: 400px;
    margin: 0 auto;
  }
}

.text-muted {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
