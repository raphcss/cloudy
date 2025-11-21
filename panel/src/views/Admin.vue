<template>
  <div class="page-wrapper">
    <div class="admin-panel">
      <h1>👑 Administration Globale</h1>

    <div class="tabs">
      <button
        :class="['tab', { active: activeTab === 'users' }]"
        @click="activeTab = 'users'"
      >
        Utilisateurs
      </button>
      <button
        :class="['tab', { active: activeTab === 'guilds' }]"
        @click="activeTab = 'guilds'"
      >
        Serveurs
      </button>
      <button
        :class="['tab', { active: activeTab === 'invites' }]"
        @click="activeTab = 'invites'"
      >
        🔗 Invitations Bot
      </button>
    </div>

    <!-- Onglet Utilisateurs -->
    <div v-if="activeTab === 'users'" class="card">
      <h2>👥 Gestion des Utilisateurs</h2>
      
      <table class="data-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Email</th>
            <th>Discord ID</th>
            <th>Rôle Global</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user._id">
            <td>{{ user.username }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.discordId || '-' }}</td>
            <td>
              <span :class="['badge', user.globalRole === 'MASTER' ? 'badge-master' : '']">
                {{ user.globalRole || 'User' }}
              </span>
            </td>
            <td>
              <button class="btn btn-sm btn-primary" @click="viewUser(user)">
                Voir
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Onglet Serveurs -->
    <div v-if="activeTab === 'guilds'" class="card">
      <h2>🖥️ Gestion des Serveurs</h2>
      
      <div class="guilds-list">
        <div v-for="guild in guilds" :key="guild.guildId" class="guild-item">
          <div class="guild-info">
            <h3>{{ guild.name }}</h3>
            <p class="text-muted">{{ guild.guildId }}</p>
          </div>
          <div class="guild-actions">
            <router-link
              :to="`/guild/${guild.guildId}`"
              class="btn btn-sm btn-primary"
            >
              Gérer
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Onglet Invitations Bot -->
    <div v-if="activeTab === 'invites'" class="card">
      <h2>🔗 Générer une invitation pour le bot</h2>
      <p class="description">Entrez l'ID d'un serveur Discord pour générer un lien d'invitation personnalisé pour ajouter le bot.</p>
      
      <div class="invite-generator">
        <div class="form-group">
          <label for="guildId">ID du serveur Discord</label>
          <input
            id="guildId"
            v-model="inviteGuildId"
            type="text"
            placeholder="Ex: 1182419011523326046"
            class="form-control"
            @keyup.enter="generateInvite"
          />
          <small class="help-text">
            Pour obtenir l'ID d'un serveur : clic droit sur le serveur → Copier l'identifiant du serveur
          </small>
        </div>

        <button 
          class="btn btn-primary"
          @click="generateInvite"
          :disabled="!inviteGuildId || generatingInvite"
        >
          {{ generatingInvite ? 'Génération...' : '✨ Générer le lien d\'invitation' }}
        </button>

        <div v-if="inviteLink" class="invite-result">
          <div class="success-message">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>Lien d'invitation généré avec succès !</span>
          </div>
          
          <div class="invite-link-container">
            <input
              :value="inviteLink"
              readonly
              class="invite-link-input"
              ref="inviteLinkInput"
            />
            <button class="btn btn-secondary" @click="copyInviteLink">
              {{ copied ? '✓ Copié' : '📋 Copier' }}
            </button>
          </div>

          <a :href="inviteLink" target="_blank" class="btn btn-success">
            🚀 Ouvrir le lien
          </a>
        </div>

        <div v-if="inviteError" class="error-message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{{ inviteError }}</span>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import api from '../services/api';

export default {
  name: 'Admin',
  setup() {
    const activeTab = ref('users');
    const users = ref([]);
    const guilds = ref([]);
    const inviteGuildId = ref('');
    const inviteLink = ref('');
    const inviteError = ref('');
    const generatingInvite = ref(false);
    const copied = ref(false);
    const inviteLinkInput = ref(null);

    onMounted(async () => {
      await loadData();
    });

    const loadData = async () => {
      try {
        const [usersRes, guildsRes] = await Promise.all([
          api.getAllUsers(),
          api.getAllGuilds(),
        ]);

        users.value = usersRes.data.users || [];
        guilds.value = guildsRes.data.guilds || [];
      } catch (error) {
        console.error('Erreur chargement données:', error);
      }
    };

    const viewUser = (user) => {
      // TODO: Ouvrir un modal ou une page de détails
      console.log('View user:', user);
    };

    const generateInvite = async () => {
      if (!inviteGuildId.value.trim()) {
        inviteError.value = 'Veuillez entrer un ID de serveur';
        return;
      }

      generatingInvite.value = true;
      inviteError.value = '';
      inviteLink.value = '';
      copied.value = false;

      try {
        const response = await api.generateBotInvite(inviteGuildId.value);
        inviteLink.value = response.data.inviteUrl;
      } catch (error) {
        console.error('Erreur génération invitation:', error);
        inviteError.value = error.response?.data?.message || 'Erreur lors de la génération du lien';
      } finally {
        generatingInvite.value = false;
      }
    };

    const copyInviteLink = () => {
      if (inviteLinkInput.value) {
        inviteLinkInput.value.select();
        document.execCommand('copy');
        copied.value = true;
        setTimeout(() => {
          copied.value = false;
        }, 2000);
      }
    };

    return {
      activeTab,
      users,
      guilds,
      viewUser,
      inviteGuildId,
      inviteLink,
      inviteError,
      generatingInvite,
      copied,
      inviteLinkInput,
      generateInvite,
      copyInviteLink,
    };
  },
};
</script>

<style scoped lang="scss">
.admin-panel {
  animation: fadeIn 0.5s ease-out;

  h1 {
    color: var(--text-primary);
    font-size: 2.5rem;
    margin-bottom: 2rem;
    font-weight: 700;
  }
}

.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;

  .tab {
    padding: 0.75rem 1.5rem;
    background: var(--bg-secondary);
    border: 2px solid var(--border-color);
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s;
    color: var(--text-primary);

    &:hover {
      border-color: var(--accent);
      background: var(--hover-bg);
    }

    &.active {
      background: var(--accent);
      color: white;
      border-color: var(--accent);
    }
  }
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--bg-secondary);

  th,
  td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
    color: var(--text-primary);
  }

  th {
    background: var(--bg-tertiary);
    font-weight: 600;
    color: var(--text-primary);
  }

  tbody tr {
    transition: background 0.2s;

    &:hover {
      background: var(--hover-bg);
    }
  }
}

.badge-master {
  background: linear-gradient(135deg, var(--accent) 0%, #764ba2 100%);
  color: white;
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.875rem;
}

.guilds-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.guild-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: var(--bg-tertiary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  h3 {
    margin-bottom: 0.25rem;
    color: var(--text-primary);
  }

  .text-muted {
    color: var(--text-secondary);
    font-size: 0.875rem;
  }
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

.description {
  color: var(--text-secondary);
  margin-bottom: 2rem;
  font-size: 0.95rem;
}

.invite-generator {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 700px;

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    label {
      font-weight: 600;
      color: var(--text-primary);
    }

    .form-control {
      padding: 0.875rem 1rem;
      border: 2px solid var(--border-color);
      border-radius: 10px;
      font-size: 1rem;
      background: var(--bg-tertiary);
      color: var(--text-primary);
      transition: all 0.3s;

      &:focus {
        outline: none;
        border-color: var(--accent);
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }
    }

    .help-text {
      color: var(--text-tertiary);
      font-size: 0.85rem;
    }
  }

  .btn {
    align-self: flex-start;
  }
}

.invite-result {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--bg-tertiary);
  border-radius: 12px;
  border: 2px solid var(--success);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.success-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--success);
  font-weight: 600;

  svg {
    flex-shrink: 0;
  }
}

.invite-link-container {
  display: flex;
  gap: 0.75rem;

  .invite-link-input {
    flex: 1;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background: var(--bg-primary);
    color: var(--text-primary);
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
  }
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: rgba(245, 101, 101, 0.1);
  color: var(--danger);
  border-radius: 10px;
  border: 1px solid var(--danger);
  font-weight: 500;

  svg {
    flex-shrink: 0;
  }
}
</style>
