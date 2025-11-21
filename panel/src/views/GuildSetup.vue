<template>
  <div class="page-wrapper">
    <div class="setup-page">
      <div class="setup-header">
        <div class="guild-info">
          <div v-if="guildData?.icon" class="guild-icon">
            <img :src="guildData.icon" :alt="guildData.name" />
          </div>
          <div v-else class="guild-icon-placeholder">
            {{ guildData?.name?.charAt(0).toUpperCase() || '?' }}
          </div>
          <div>
            <h1>🚀 Configuration de {{ guildData?.name || 'Chargement...' }}</h1>
            <p>Configurez les paramètres de base pour activer le bot de modération</p>
          </div>
        </div>
      </div>

      <div class="setup-steps">
        <div 
          v-for="(step, index) in steps" 
          :key="index"
          :class="['step', { active: currentStep === index, completed: index < currentStep }]"
        >
          <div class="step-number">{{ index < currentStep ? '✓' : index + 1 }}</div>
          <div class="step-label">{{ step.label }}</div>
        </div>
      </div>

      <div class="setup-content card">
        <!-- Étape 1: Langue -->
        <div v-if="currentStep === 0" class="step-content">
          <h2>🌍 Langue du serveur</h2>
          <p class="step-description">Choisissez la langue par défaut pour les messages du bot</p>
          
          <div class="language-options">
            <div 
              :class="['language-option', { selected: config.defaultLanguage === 'fr' }]"
              @click="config.defaultLanguage = 'fr'"
            >
              <div class="flag">🇫🇷</div>
              <div class="language-name">Français</div>
            </div>
            <div 
              :class="['language-option', { selected: config.defaultLanguage === 'en' }]"
              @click="config.defaultLanguage = 'en'"
            >
              <div class="flag">🇬🇧</div>
              <div class="language-name">English</div>
            </div>
          </div>
        </div>

        <!-- Étape 2: Salon de logs -->
        <div v-if="currentStep === 1" class="step-content">
          <h2>📄 Salon de logs</h2>
          <p class="step-description">Sélectionnez le salon où seront envoyés les logs de modération</p>
          
          <div class="form-group">
            <label for="logChannel">Salon de logs *</label>
            <input 
              type="text" 
              id="logChannel"
              v-model="config.logChannelId" 
              @input="onLogChannelInput"
              placeholder="ID du salon (ex: 1234567890123456789)"
              class="input"
              :class="{ 'input-error': logChannelVerified === false, 'input-success': logChannelVerified === true }"
            />
            <div v-if="verifyingChannel" class="verify-badge loading">
              <span class="badge-icon">⏳</span>
              <span>Vérification en cours...</span>
            </div>
            <div v-if="logChannelVerified === true" class="verify-badge success">
              <span class="badge-icon">✓</span>
              <span>Salon trouvé : <strong>#{{ logChannelName }}</strong></span>
            </div>
            <div v-if="logChannelVerified === false" class="verify-badge error">
              <span class="badge-icon">✗</span>
              <span>Salon non trouvé sur ce serveur</span>
            </div>
            <small class="help-text">
              Pour obtenir l'ID : Mode développeur → Clic droit sur le salon → Copier l'identifiant
            </small>
          </div>
        </div>

        <!-- Étape 3: Rôle muet -->
        <div v-if="currentStep === 2" class="step-content">
          <h2>🔇 Rôle de mute</h2>
          <p class="step-description">Créez ou sélectionnez le rôle qui sera utilisé pour mute les utilisateurs</p>
          
          <div class="form-group">
            <label for="muteRole">Rôle de mute *</label>
            <input 
              type="text" 
              id="muteRole"
              v-model="config.muteRoleId" 
              @input="onMuteRoleInput"
              placeholder="ID du rôle (ex: 1234567890123456789)"
              class="input"
              :class="{ 'input-error': muteRoleVerified === false, 'input-success': muteRoleVerified === true }"
            />
            <div v-if="verifyingMuteRole" class="verify-badge loading">
              <span class="badge-icon">⏳</span>
              <span>Vérification en cours...</span>
            </div>
            <div v-if="muteRoleVerified === true" class="verify-badge success">
              <span class="badge-icon">✓</span>
              <span>Rôle trouvé : <strong>@{{ muteRoleName }}</strong></span>
            </div>
            <div v-if="muteRoleVerified === false" class="verify-badge error">
              <span class="badge-icon">✗</span>
              <span>Rôle non trouvé sur ce serveur</span>
            </div>
            <small class="help-text">
              Pour obtenir l'ID : Mode développeur → Paramètres serveur → Rôles → Clic droit sur le rôle → Copier l'identifiant
            </small>
          </div>
        </div>

        <!-- Étape 4: Rôles de modération -->
        <div v-if="currentStep === 3" class="step-content">
          <h2>👮 Rôles de modération</h2>
          <p class="step-description">Définissez quels rôles Discord peuvent accéder au panel de modération</p>
          
          <div class="form-group">
            <label for="modRoles">Rôles de modération *</label>
            <textarea 
              id="modRoles"
              v-model="moderationRolesInput" 
              @input="onModerationRolesInput"
              placeholder="IDs des rôles séparés par des virgules&#10;Ex: 1234567890123456789, 9876543210987654321"
              rows="4"
              class="input"
            />
            <div v-if="verifyingModRoles" class="verify-badge loading">
              <span class="badge-icon">⏳</span>
              <span>Vérification en cours...</span>
            </div>
            <div v-if="moderationRolesVerified.length > 0" class="roles-verification">
              <div 
                v-for="role in moderationRolesVerified" 
                :key="role.id"
                :class="['role-verify-item', role.valid ? 'valid' : 'invalid']"
              >
                <span v-if="role.valid">✓ @{{ role.name }}</span>
                <span v-else>✗ {{ role.id }} (non trouvé)</span>
              </div>
            </div>
            <small class="help-text">
              Séparez les IDs par des virgules. Ces rôles auront accès au panel de modération.
            </small>
          </div>
        </div>

        <!-- Étape 5: Confirmation -->
        <div v-if="currentStep === 4" class="step-content">
          <h2>✅ Récapitulatif</h2>
          <p class="step-description">Vérifiez votre configuration avant de l'enregistrer</p>
          
          <div class="summary-container">
            <div class="summary-card">
              <div class="summary-icon">🌍</div>
              <div class="summary-content">
                <div class="summary-label">Langue par défaut</div>
                <div class="summary-value">{{ config.defaultLanguage === 'fr' ? '🇫🇷 Français' : '🇬🇧 English' }}</div>
              </div>
            </div>

            <div class="summary-card">
              <div class="summary-icon">📄</div>
              <div class="summary-content">
                <div class="summary-label">Salon de logs</div>
                <div class="summary-value">#{{ logChannelName }}</div>
                <div class="summary-id">ID: {{ config.logChannelId }}</div>
              </div>
            </div>

            <div class="summary-card">
              <div class="summary-icon">🔇</div>
              <div class="summary-content">
                <div class="summary-label">Rôle de mute</div>
                <div class="summary-value">@{{ muteRoleName }}</div>
                <div class="summary-id">ID: {{ config.muteRoleId }}</div>
              </div>
            </div>

            <div class="summary-card">
              <div class="summary-icon">👮</div>
              <div class="summary-content">
                <div class="summary-label">Rôles de modération</div>
                <div class="summary-roles">
                  <div 
                    v-for="role in moderationRolesVerified" 
                    :key="role.id"
                    class="summary-role-badge"
                  >
                    @{{ role.name }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="error" class="error-message">
            ⚠️ {{ error }}
          </div>
        </div>

        <!-- Navigation -->
        <div class="setup-actions">
          <button 
            v-if="currentStep > 0" 
            @click="currentStep--" 
            class="btn btn-secondary"
            :disabled="saving"
          >
            ← Précédent
          </button>
          <div class="spacer"></div>
          <button 
            v-if="currentStep < steps.length - 1" 
            @click="nextStep" 
            class="btn btn-primary"
            :disabled="!canProceed"
          >
            Suivant →
          </button>
          <button 
            v-else 
            @click="saveConfiguration" 
            class="btn btn-success"
            :disabled="saving || !isValid"
          >
            {{ saving ? 'Enregistrement...' : '✓ Terminer la configuration' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../services/api';

export default {
  name: 'GuildSetup',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const guildId = route.params.guildId;

    const currentStep = ref(0);
    const saving = ref(false);
    const error = ref('');
    const guildData = ref(null);

    const config = ref({
      enabled: true,
      defaultLanguage: 'fr',
      logChannelId: '',
      muteRoleId: '',
      moderationRoles: [],
    });

    const moderationRolesInput = ref('');

    const logChannelVerified = ref(null);
    const logChannelName = ref('');
    const verifyingChannel = ref(false);

    const muteRoleVerified = ref(null);
    const muteRoleName = ref('');
    const verifyingMuteRole = ref(false);

    const moderationRolesVerified = ref([]);
    const verifyingModRoles = ref(false);

    let logChannelTimer = null;
    let muteRoleTimer = null;
    let modRolesTimer = null;

    const steps = [
      { label: 'Langue' },
      { label: 'Salon de logs' },
      { label: 'Rôle de mute' },
      { label: 'Rôles de modération' },
      { label: 'Confirmation' },
    ];

    const canProceed = computed(() => {
      switch (currentStep.value) {
        case 0:
          return !!config.value.defaultLanguage;
        case 1:
          return logChannelVerified.value === true;
        case 2:
          return muteRoleVerified.value === true;
        case 3:
          return moderationRolesVerified.value.length > 0 && 
                 moderationRolesVerified.value.every(r => r.valid);
        default:
          return true;
      }
    });

    const isValid = computed(() => {
      return logChannelVerified.value === true && 
             muteRoleVerified.value === true && 
             moderationRolesVerified.value.length > 0 &&
             moderationRolesVerified.value.every(r => r.valid);
    });

    const onLogChannelInput = () => {
      logChannelVerified.value = null;
      logChannelName.value = '';
      
      if (logChannelTimer) clearTimeout(logChannelTimer);
      
      if (!config.value.logChannelId || !/^\d{17,19}$/.test(config.value.logChannelId)) {
        logChannelVerified.value = false;
        return;
      }
      
      logChannelTimer = setTimeout(() => {
        verifyLogChannel();
      }, 800);
    };

    const verifyLogChannel = async () => {
      if (!config.value.logChannelId || !/^\d{17,19}$/.test(config.value.logChannelId)) {
        return;
      }

      verifyingChannel.value = true;
      logChannelVerified.value = null;

      try {
        const response = await api.verifyChannel(guildId, config.value.logChannelId);
        logChannelVerified.value = true;
        logChannelName.value = response.data.channel.name;
      } catch (err) {
        logChannelVerified.value = false;
        logChannelName.value = '';
      } finally {
        verifyingChannel.value = false;
      }
    };

    const onMuteRoleInput = () => {
      muteRoleVerified.value = null;
      muteRoleName.value = '';
      
      if (muteRoleTimer) clearTimeout(muteRoleTimer);
      
      if (!config.value.muteRoleId || !/^\d{17,19}$/.test(config.value.muteRoleId)) {
        muteRoleVerified.value = false;
        return;
      }
      
      muteRoleTimer = setTimeout(() => {
        verifyMuteRole();
      }, 800);
    };

    const verifyMuteRole = async () => {
      if (!config.value.muteRoleId || !/^\d{17,19}$/.test(config.value.muteRoleId)) {
        return;
      }

      verifyingMuteRole.value = true;
      muteRoleVerified.value = null;

      try {
        const response = await api.verifyRole(guildId, config.value.muteRoleId);
        muteRoleVerified.value = true;
        muteRoleName.value = response.data.role.name;
      } catch (err) {
        muteRoleVerified.value = false;
        muteRoleName.value = '';
      } finally {
        verifyingMuteRole.value = false;
      }
    };

    const onModerationRolesInput = () => {
      moderationRolesVerified.value = [];
      
      if (modRolesTimer) clearTimeout(modRolesTimer);
      
      const roleIds = moderationRolesInput.value
        .split(',')
        .map(r => r.trim())
        .filter(r => r.length > 0);
      
      if (roleIds.length === 0) return;
      
      modRolesTimer = setTimeout(() => {
        verifyModerationRoles();
      }, 1000);
    };

    const verifyModerationRoles = async () => {
      const roleIds = moderationRolesInput.value
        .split(',')
        .map(r => r.trim())
        .filter(r => r.length > 0);

      if (roleIds.length === 0) return;

      verifyingModRoles.value = true;
      moderationRolesVerified.value = [];

      for (const roleId of roleIds) {
        try {
          const response = await api.verifyRole(guildId, roleId);
          moderationRolesVerified.value.push({
            id: roleId,
            name: response.data.role.name,
            valid: true,
          });
        } catch (err) {
          moderationRolesVerified.value.push({
            id: roleId,
            valid: false,
          });
        }
      }

      verifyingModRoles.value = false;
    };

    const nextStep = () => {
      if (canProceed.value && currentStep.value < steps.length - 1) {
        currentStep.value++;
      }
    };

    const loadGuildData = async () => {
      try {
        const response = await api.getUserGuilds();
        const guilds = response.data.guilds || [];
        guildData.value = guilds.find(g => g.guildId === guildId);

        if (!guildData.value) {
          error.value = 'Serveur non trouvé';
          return;
        }

        // Si déjà configuré, charger la config existante
        if (guildData.value.configured) {
          config.value = {
            enabled: guildData.value.enabled ?? true,
            defaultLanguage: guildData.value.defaultLanguage || 'fr',
            logChannelId: guildData.value.logChannelId || '',
            muteRoleId: guildData.value.muteRoleId || '',
            moderationRoles: guildData.value.moderationRoles || [],
          };
          moderationRolesInput.value = config.value.moderationRoles.join(', ');
        }
      } catch (err) {
        console.error('Erreur chargement guild:', err);
        error.value = 'Erreur lors du chargement du serveur';
      }
    };

    const saveConfiguration = async () => {
      saving.value = true;
      error.value = '';

      try {
        // Parse moderation roles
        const roles = moderationRolesInput.value
          .split(',')
          .map(r => r.trim())
          .filter(r => r.length > 0);

        await api.updateGuildConfig(guildId, {
          ...config.value,
          moderationRoles: roles,
        });

        // Redirection vers le panel
        router.push(`/guild/${guildId}`);
      } catch (err) {
        console.error('Erreur sauvegarde config:', err);
        error.value = err.response?.data?.message || 'Erreur lors de la sauvegarde';
        saving.value = false;
      }
    };

    onMounted(() => {
      loadGuildData();
    });

    return {
      currentStep,
      steps,
      config,
      moderationRolesInput,
      canProceed,
      isValid,
      nextStep,
      saveConfiguration,
      saving,
      error,
      guildData,
      logChannelVerified,
      logChannelName,
      verifyingChannel,
      onLogChannelInput,
      muteRoleVerified,
      muteRoleName,
      verifyingMuteRole,
      onMuteRoleInput,
      moderationRolesVerified,
      verifyingModRoles,
      onModerationRolesInput,
    };
  },
};
</script>

<style scoped lang="scss">
.setup-page {
  max-width: 900px;
  margin: 0 auto;
  animation: fadeIn 0.5s ease-out;
}

.setup-header {
  margin-bottom: 3rem;
  text-align: center;

  .guild-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    flex-wrap: wrap;

    .guild-icon,
    .guild-icon-placeholder {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
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

    h1 {
      color: var(--text-primary);
      font-size: 2rem;
      margin: 0;
      font-weight: 700;
    }

    p {
      color: var(--text-secondary);
      margin: 0.5rem 0 0 0;
      font-size: 1.1rem;
    }
  }
}

.setup-steps {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding: 0 1rem;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 20px;
    left: 10%;
    right: 10%;
    height: 2px;
    background: var(--border-color);
    z-index: 0;
  }

  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    position: relative;
    z-index: 1;

    .step-number {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--bg-secondary);
      border: 2px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: var(--text-secondary);
      transition: all 0.3s;
    }

    .step-label {
      font-size: 0.9rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    &.active .step-number {
      background: linear-gradient(135deg, var(--accent) 0%, #764ba2 100%);
      border-color: var(--accent);
      color: white;
      transform: scale(1.1);
    }

    &.completed .step-number {
      background: var(--success);
      border-color: var(--success);
      color: white;
    }

    &.active .step-label {
      color: var(--text-primary);
      font-weight: 600;
    }
  }
}

.setup-content {
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.step-content {
  flex: 1;
  padding: 1rem 0;

  h2 {
    color: var(--text-primary);
    margin-bottom: 0.5rem;
    font-size: 1.75rem;
  }

  .step-description {
    color: var(--text-secondary);
    margin-bottom: 2rem;
    font-size: 1.05rem;
  }
}

.language-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.language-option {
  padding: 2rem;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: var(--bg-secondary);

  &:hover {
    border-color: var(--accent);
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }

  &.selected {
    border-color: var(--accent);
    background: linear-gradient(135deg, rgba(123, 31, 162, 0.1) 0%, rgba(103, 58, 183, 0.1) 100%);
    box-shadow: var(--shadow-lg);
  }

  .flag {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .language-name {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.summary-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.summary-card {
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
  border: 2px solid var(--border-color);
  border-radius: 16px;
  padding: 1.75rem;
  display: flex;
  gap: 1.25rem;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    border-color: var(--accent);
  }

  .summary-icon {
    font-size: 2.5rem;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, var(--accent), #667eea);
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(118, 75, 162, 0.3);
  }

  .summary-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    .summary-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .summary-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
      word-break: break-word;
    }

    .summary-id {
      font-size: 0.75rem;
      color: var(--text-tertiary);
      font-family: 'Courier New', monospace;
      opacity: 0.7;
    }

    .summary-roles {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;

      .summary-role-badge {
        background: linear-gradient(135deg, var(--accent), #667eea);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 600;
        box-shadow: 0 2px 8px rgba(118, 75, 162, 0.3);
      }
    }
  }
}

.setup-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);

  .spacer {
    flex: 1;
  }
}

.error-message {
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid #f44336;
  border-radius: 8px;
  padding: 1rem;
  color: #f44336;
  margin-top: 1rem;
  font-weight: 500;
}

.input-success {
  border-color: var(--success) !important;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1) !important;
}

.input-error {
  border-color: #f44336 !important;
  box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.1) !important;
}

.verify-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  border-radius: 12px;
  margin-top: 0.75rem;
  font-size: 0.95rem;
  font-weight: 500;
  border: 2px solid;
  backdrop-filter: blur(10px);
  transition: all 0.3s;

  .badge-icon {
    font-size: 1.25rem;
    font-weight: bold;
  }

  &.loading {
    background: linear-gradient(135deg, rgba(118, 75, 162, 0.15), rgba(118, 75, 162, 0.05));
    border-color: var(--accent);
    color: var(--accent);
    box-shadow: 0 4px 12px rgba(118, 75, 162, 0.2);
  }

  &.success {
    background: linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(76, 175, 80, 0.05));
    border-color: var(--success);
    color: var(--success);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
  }

  &.error {
    background: linear-gradient(135deg, rgba(244, 67, 54, 0.15), rgba(244, 67, 54, 0.05));
    border-color: #f44336;
    color: #f44336;
    box-shadow: 0 4px 12px rgba(244, 67, 54, 0.2);
  }
}

.input-with-verify {
  display: flex;
  gap: 0.5rem;
  align-items: center;

  .input {
    flex: 1;
  }

  .btn-verify {
    padding: 0.75rem 1rem;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1.2rem;
    transition: all 0.3s;

    &:hover:not(:disabled) {
      transform: scale(1.1);
      box-shadow: var(--shadow-lg);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.roles-verification {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .role-verify-item {
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-weight: 500;

    &.valid {
      background: rgba(76, 175, 80, 0.1);
      border: 1px solid var(--success);
      color: var(--success);
    }

    &.invalid {
      background: rgba(244, 67, 54, 0.1);
      border: 1px solid #f44336;
      color: #f44336;
    }
  }
}

.help-text {
  color: var(--text-tertiary);
  font-size: 0.85rem;
  margin-top: 0.5rem;
  display: block;
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
</style>
