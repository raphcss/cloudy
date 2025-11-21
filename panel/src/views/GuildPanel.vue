<template>
  <div class="guild-panel">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div v-if="guildData?.icon" class="guild-icon">
          <img :src="guildData.icon" :alt="guildData.name" />
        </div>
        <div v-else class="guild-icon-placeholder">
          {{ guildData?.name?.charAt(0).toUpperCase() || '?' }}
        </div>
        <div class="guild-info">
          <h2>{{ guildData?.name || 'Chargement...' }}</h2>
          <span v-if="guildData" :class="['status-badge', guildData.active ? 'active' : 'inactive']">
            {{ guildData.active ? 'Actif' : 'Inactif' }}
          </span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <!-- Section Modérateurs -->
        <div class="nav-section-title">👮 Modérateurs</div>
        <button
          :class="['nav-item', { active: activeTab === 'logs' }]"
          @click="activeTab = 'logs'"
        >
          <span class="nav-icon">📄</span>
          <span class="nav-label">Logs</span>
        </button>
        <button
          :class="['nav-item', { active: activeTab === 'search' }]"
          @click="activeTab = 'search'"
        >
          <span class="nav-icon">🔍</span>
          <span class="nav-label">Recherche</span>
        </button>
        <button
          :class="['nav-item', { active: activeTab === 'moderators' }]"
          @click="activeTab = 'moderators'"
        >
          <span class="nav-icon">👮</span>
          <span class="nav-label">Modérateurs</span>
        </button>
        <button
          :class="['nav-item', { active: activeTab === 'stats' }]"
          @click="activeTab = 'stats'"
        >
          <span class="nav-icon">📊</span>
          <span class="nav-label">Statistiques</span>
        </button>

        <!-- Section Administrateurs -->
        <div class="nav-section-title">👑 Administrateurs</div>
        <button
          :class="['nav-item', { active: activeTab === 'config' }]"
          @click="activeTab = 'config'"
        >
          <span class="nav-icon">⚙️</span>
          <span class="nav-label">Configuration</span>
        </button>
        <button
          :class="['nav-item', { active: activeTab === 'sanctions' }]"
          @click="activeTab = 'sanctions'"
        >
          <span class="nav-icon">🚨</span>
          <span class="nav-label">Sanctions</span>
        </button>
        <button
          :class="['nav-item', { active: activeTab === 'escalation' }]"
          @click="activeTab = 'escalation'"
        >
          <span class="nav-icon">📈</span>
          <span class="nav-label">Escalation</span>
        </button>
        <button
          :class="['nav-item', { active: activeTab === 'permissions' }]"
          @click="activeTab = 'permissions'"
        >
          <span class="nav-icon">🔐</span>
          <span class="nav-label">Permissions</span>
        </button>
        <button
          :class="['nav-item', { active: activeTab === 'modules' }]"
          @click="activeTab = 'modules'"
        >
          <span class="nav-icon">🧩</span>
          <span class="nav-label">Modules</span>
        </button>

        <!-- Section Master -->
        <div v-if="isMaster" class="nav-section-title">🔱 Master</div>
        <button
          v-if="isMaster"
          :class="['nav-item', { active: activeTab === 'master' }]"
          @click="activeTab = 'master'"
        >
          <span class="nav-icon">👑</span>
          <span class="nav-label">Master</span>
        </button>
      </nav>
    </aside>

    <!-- Main Content -->
    <div class="panel-content">

    <!-- Bot Missing Banner -->
    <div v-if="guildData?.botPresent === false" class="bot-missing-banner">
      <div class="banner-icon">🤖</div>
      <div class="banner-text">
        <h3>Bot absent du serveur</h3>
        <p>Le bot de modération n'est plus présent sur ce serveur. Ajoutez-le pour pouvoir le configurer.</p>
      </div>
      <button class="btn btn-primary" @click="inviteBot">
        ➕ Ajouter le bot
      </button>
    </div>

    <!-- Setup Mode Banner -->
    <div v-if="isSetupMode && guildData?.botPresent !== false" class="setup-banner">
      <div class="setup-icon">🚀</div>
      <div class="setup-text">
        <h3>Configuration initiale requise</h3>
        <p>Bienvenue ! Veuillez configurer les paramètres de base pour activer le bot de modération sur ce serveur.</p>
      </div>
    </div>

    <!-- Configuration -->
    <div v-if="activeTab === 'config'" class="card">
      <h2>⚙️ Configuration du Serveur</h2>
      
      <div v-if="loadingDiscordData" class="loading-indicator">
        <div class="spinner-small"></div>
        <span>Chargement des données Discord...</span>
      </div>
      
      <div class="config-section">
        <div class="config-item">
          <div class="config-label">
            <span class="config-icon">🔧</span>
            <div>
              <h3>Système de modération</h3>
              <p>Active ou désactive toutes les fonctionnalités de modération</p>
            </div>
          </div>
          <div class="config-value">
            <label class="toggle-switch">
              <input type="checkbox" v-model="config.enabled" @change="saveConfig" />
              <span class="toggle-slider"></span>
            </label>
            <span class="toggle-label">{{ config.enabled ? 'Activé' : 'Désactivé' }}</span>
          </div>
        </div>

        <div class="config-item">
          <div class="config-label">
            <span class="config-icon">🌍</span>
            <div>
              <h3>Langue par défaut</h3>
              <p>Langue utilisée pour les messages du bot</p>
            </div>
          </div>
          <div class="config-value">
            <select v-model="config.defaultLanguage" @change="saveConfig" class="config-select">
              <option value="fr">🇫🇷 Français</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </div>
        </div>

        <div class="config-item">
          <div class="config-label">
            <span class="config-icon">📝</span>
            <div>
              <h3>Canal de logs</h3>
              <p>{{ config.logChannelId ? getChannelName(config.logChannelId) : 'Aucun canal configuré' }}</p>
            </div>
          </div>
          <div class="config-value">
            <button class="btn btn-secondary" @click="showChannelModal = true">
              {{ config.logChannelId ? '✏️ Modifier' : '➕ Configurer' }}
            </button>
          </div>
        </div>

        <div class="config-item">
          <div class="config-label">
            <span class="config-icon">🔇</span>
            <div>
              <h3>Rôle Mute</h3>
              <p>{{ config.muteRoleId ? getRoleName(config.muteRoleId) : 'Aucun rôle configuré (utilise Discord timeout)' }}</p>
            </div>
          </div>
          <div class="config-value">
            <button class="btn btn-secondary" @click="showMuteRoleModal = true">
              {{ config.muteRoleId ? '✏️ Modifier' : '➕ Configurer' }}
            </button>
          </div>
        </div>

        <div class="config-item">
          <div class="config-label">
            <span class="config-icon">👮</span>
            <div>
              <h3>Rôles de modération</h3>
              <p v-if="config.moderationRoles && config.moderationRoles.length > 0">
                {{ config.moderationRoles.map(id => getRoleName(id)).join(', ') }}
              </p>
              <p v-else>Aucun rôle configuré</p>
            </div>
          </div>
          <div class="config-value">
            <button class="btn btn-secondary" @click="showModerationRolesModal = true">
              {{ config.moderationRoles?.length > 0 ? '✏️ Modifier' : '➕ Configurer' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Canal de logs -->
    <div v-if="showChannelModal" class="modal-overlay" @click="showChannelModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>📝 Configurer le canal de logs</h3>
          <button class="modal-close" @click="showChannelModal = false">×</button>
        </div>
        <div class="modal-body">
          <p class="text-muted">Sélectionnez le canal où seront envoyés les logs de modération</p>
          
          <div class="form-group">
            <label>Canal</label>
            <select v-model="tempLogChannelId" class="form-control">
              <option value="">-- Aucun canal --</option>
              <option v-for="channel in textChannels" :key="channel.id" :value="channel.id">
                # {{ channel.name }}
              </option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showChannelModal = false">Annuler</button>
          <button class="btn btn-primary" @click="saveLogChannel">Enregistrer</button>
        </div>
      </div>
    </div>

    <!-- Modal: Rôle Mute -->
    <div v-if="showMuteRoleModal" class="modal-overlay" @click="showMuteRoleModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>🔇 Configurer le rôle Mute</h3>
          <button class="modal-close" @click="showMuteRoleModal = false">×</button>
        </div>
        <div class="modal-body">
          <p class="text-muted">Sélectionnez le rôle utilisé pour mute les utilisateurs (optionnel si vous utilisez Discord timeout)</p>
          
          <div class="form-group">
            <label>Rôle</label>
            <select v-model="tempMuteRoleId" class="form-control">
              <option value="">-- Utiliser Discord timeout --</option>
              <option v-for="role in availableRoles" :key="role.id" :value="role.id">
                @{{ role.name }}
              </option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showMuteRoleModal = false">Annuler</button>
          <button class="btn btn-primary" @click="saveMuteRole">Enregistrer</button>
        </div>
      </div>
    </div>

    <!-- Modal: Rôles de modération -->
    <div v-if="showModerationRolesModal" class="modal-overlay" @click="showModerationRolesModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>👮 Configurer les rôles de modération</h3>
          <button class="modal-close" @click="showModerationRolesModal = false">×</button>
        </div>
        <div class="modal-body">
          <p class="text-muted">Sélectionnez les rôles Discord pouvant utiliser les commandes de modération</p>
          
          <div class="role-selector">
            <div v-for="role in availableRoles" :key="role.id" class="role-checkbox">
              <label>
                <input 
                  type="checkbox" 
                  :value="role.id" 
                  v-model="tempModerationRoles"
                />
                <span class="role-name">@{{ role.name }}</span>
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showModerationRolesModal = false">Annuler</button>
          <button class="btn btn-primary" @click="saveModerationRoles">Enregistrer</button>
        </div>
      </div>
    </div>

    <!-- Sanctions -->
    <div v-if="activeTab === 'sanctions'" class="card" key="sanctions-tab">
      <div class="card-header-actions">
        <h2>🚨 Types d'Infractions</h2>
        <button class="btn btn-primary" @click="editInfractionType(null)">
          + Nouveau Type
        </button>
      </div>

      <div v-if="loadingInfractionTypes" class="loading">
        <div class="spinner"></div>
        <p>Chargement des types d'infractions...</p>
      </div>

      <div v-else-if="!infractionTypes || infractionTypes.length === 0" class="empty-state">
        <div class="empty-icon">🚨</div>
        <h3>Aucun type d'infraction personnalisé</h3>
        <p class="text-muted">Les types par défaut sont : Spam, Toxicité, Publicité, NSFW, Autre</p>
        <button class="btn btn-primary" @click="editInfractionType(null)">
          Créer un type personnalisé
        </button>
      </div>

      <div v-else class="infraction-types-grid">
        <div v-for="type in infractionTypes.filter(t => t)" :key="type.key || type._id" class="infraction-type-card">
          <div class="type-header">
            <div class="type-icon">{{ type.icon || '❓' }}</div>
            <div class="type-info">
              <h3>{{ type.label }}</h3>
              <code class="type-key">{{ type.key }}</code>
            </div>
            <span :class="['status-badge', type.enabled ? 'active' : 'inactive']">
              {{ type.enabled ? 'Actif' : 'Inactif' }}
            </span>
          </div>

          <p class="type-description">{{ type.description || 'Pas de description' }}</p>

          <div class="type-details">
            <div class="detail-item">
              <span class="label">Utilisations:</span>
              <span class="value">{{ type.usageCount || 0 }}</span>
            </div>
            <div v-if="type.isDefault" class="detail-item">
              <span class="badge badge-info">Type par défaut</span>
            </div>
          </div>

          <div class="type-actions">
            <button class="btn btn-sm btn-secondary" @click="editInfractionType(type)">
              Modifier
            </button>
            <button v-if="!type.isDefault" class="btn btn-sm btn-danger" @click="deleteInfractionTypeConfirm(type._id)">
              Supprimer
            </button>
          </div>
        </div>
      </div>

      <!-- Info sur l'escalation -->
      <div class="info-box">
        <div class="info-icon">💡</div>
        <div class="info-content">
          <h4>À propos des types d'infractions</h4>
          <p>Chaque type d'infraction peut avoir ses propres règles d'escalation. Configurez-les dans l'onglet "Escalation".</p>
          <p>Les types par défaut ne peuvent pas être supprimés, mais vous pouvez les désactiver ou modifier leur libellé.</p>
        </div>
      </div>
    </div>

    <!-- Modal Ajout/Édition Type d'Infraction -->
    <div v-if="showInfractionTypeModal && infractionTypeForm" class="modal-overlay" @click.self="closeInfractionTypeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingInfractionType ? 'Modifier' : 'Nouveau' }} Type d'Infraction</h3>
          <button class="close-btn" @click="closeInfractionTypeModal">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label for="typeKey">Clé (identifiant unique) *</label>
            <input
              id="typeKey"
              v-model="infractionTypeForm.key"
              type="text"
              class="form-control"
              placeholder="ex: harassment"
              :disabled="!!editingInfractionType"
              required
            />
            <small class="text-muted">Lettres minuscules et tirets uniquement. Ne peut pas être modifié après création.</small>
          </div>

          <div class="form-group">
            <label for="typeLabel">Libellé *</label>
            <input
              id="typeLabel"
              v-model="infractionTypeForm.label"
              type="text"
              class="form-control"
              placeholder="ex: Harcèlement"
              required
            />
          </div>

          <div class="form-group">
            <label for="typeIcon">Icône (emoji)</label>
            <input
              id="typeIcon"
              v-model="infractionTypeForm.icon"
              type="text"
              class="form-control"
              placeholder="ex: ⚔️"
              maxlength="2"
            />
          </div>

          <div class="form-group">
            <label for="typeDescription">Description</label>
            <textarea
              id="typeDescription"
              v-model="infractionTypeForm.description"
              class="form-control"
              rows="3"
              placeholder="Décrivez ce type d'infraction..."
            ></textarea>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="infractionTypeForm.enabled"
              />
              <span>Type activé</span>
            </label>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="infractionTypeForm.requiresCustomReason"
              />
              <span>Requiert un commentaire personnalisé</span>
            </label>
            <small class="form-help" style="margin-left: 1.5rem; display: block; margin-top: 0.25rem;">
              Si coché, affiche un modal pour saisir une raison détaillée lors de l'utilisation de cette sanction
            </small>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeInfractionTypeModal">
            Annuler
          </button>
          <button class="btn btn-primary" @click="saveInfractionType" :disabled="savingInfractionType">
            {{ savingInfractionType ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modérateurs -->
    <div v-if="activeTab === 'moderators'" class="card">
      <h2>👮 Modérateurs du Serveur</h2>
      <p class="text-muted" style="margin-bottom: 1.5rem;">
        Liste des membres Discord possédant les rôles de modération configurés dans l'onglet Configuration.
      </p>

      <div v-if="loadingModerators" class="loading">
        <div class="spinner"></div>
        <p>Chargement des modérateurs...</p>
      </div>

      <div v-else-if="moderators.length === 0" class="empty-state">
        <div class="empty-icon">👮</div>
        <h3>Aucun modérateur trouvé</h3>
        <p class="text-muted">Configurez les rôles de modération dans l'onglet Configuration</p>
      </div>

      <div v-else class="moderators-sections">
        <!-- Section Administrateurs -->
        <div class="moderator-section">
          <h3 class="section-title">👑 Administrateurs</h3>
          <div v-if="adminModerators.length === 0" class="empty-section">
            <p class="text-muted">Aucun administrateur trouvé</p>
          </div>
          <div v-else class="moderators-grid">
            <div v-for="mod in adminModerators.filter(m => m && m.userId)" :key="mod.userId" class="moderator-card">
              <div class="moderator-header">
                <div class="moderator-avatar-wrapper">
                  <img v-if="mod.avatar" :src="mod.avatar" :alt="mod.username || 'User'" class="moderator-avatar" />
                  <div v-else class="moderator-avatar-placeholder">{{ (mod.username || '?').charAt(0).toUpperCase() }}</div>
                  <div class="online-indicator"></div>
                </div>
                <div class="moderator-main-info">
                  <div class="moderator-name">{{ mod.username || 'Utilisateur inconnu' }}</div>
                  <div class="moderator-global-name" v-if="mod.globalName">{{ mod.globalName }}</div>
                  <div class="moderator-id">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    {{ mod.userId }}
                  </div>
                </div>
              </div>
              <div class="moderator-body">
                <div class="moderator-info-row">
                  <span class="info-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    Rejoint le
                  </span>
                  <span class="info-value">{{ mod.joinedAt ? formatDate(mod.joinedAt) : '-' }}</span>
                </div>
                <div class="moderator-info-row">
                  <span class="info-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    Rôles
                  </span>
                </div>
                <div class="moderator-roles">
                  <span 
                    v-for="role in (mod.roles || [])" 
                    :key="role.id" 
                    class="role-badge"
                    :style="{ 
                      backgroundColor: role.color && role.color !== '#000000' ? `${role.color}15` : 'rgba(88, 101, 242, 0.1)',
                      borderColor: role.color && role.color !== '#000000' ? role.color : 'var(--accent)',
                      color: role.color && role.color !== '#000000' ? role.color : 'var(--accent)'
                    }"
                  >
                    {{ role.name }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section Modérateurs -->
        <div class="moderator-section">
          <h3 class="section-title">👮 Modérateurs</h3>
          <div v-if="regularModerators.length === 0" class="empty-section">
            <p class="text-muted">Aucun modérateur trouvé</p>
          </div>
          <div v-else class="moderators-grid">
            <div v-for="mod in regularModerators.filter(m => m && m.userId)" :key="mod.userId" class="moderator-card">
              <div class="moderator-header">
                <div class="moderator-avatar-wrapper">
                  <img v-if="mod.avatar" :src="mod.avatar" :alt="mod.username || 'User'" class="moderator-avatar" />
                  <div v-else class="moderator-avatar-placeholder">{{ (mod.username || '?').charAt(0).toUpperCase() }}</div>
                  <div class="online-indicator"></div>
                </div>
                <div class="moderator-main-info">
                  <div class="moderator-name">{{ mod.username || 'Utilisateur inconnu' }}</div>
                  <div class="moderator-global-name" v-if="mod.globalName">{{ mod.globalName }}</div>
                  <div class="moderator-id">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    {{ mod.userId }}
                  </div>
                </div>
              </div>
              <div class="moderator-body">
                <div class="moderator-info-row">
                  <span class="info-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    Rejoint le
                  </span>
                  <span class="info-value">{{ mod.joinedAt ? formatDate(mod.joinedAt) : '-' }}</span>
                </div>
                <div class="moderator-info-row">
                  <span class="info-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    Rôles
                  </span>
                </div>
                <div class="moderator-roles">
                  <span 
                    v-for="role in (mod.roles || [])" 
                    :key="role.id" 
                    class="role-badge"
                    :style="{ 
                      backgroundColor: role.color && role.color !== '#000000' ? `${role.color}15` : 'rgba(88, 101, 242, 0.1)',
                      borderColor: role.color && role.color !== '#000000' ? role.color : 'var(--accent)',
                      color: role.color && role.color !== '#000000' ? role.color : 'var(--accent)'
                    }"
                  >
                    {{ role.name }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Logs & Historique -->
    <div v-if="activeTab === 'logs'" class="card">
      <h2>📊 Logs & Historique de Modération</h2>
      
      <div class="filters">
        <div class="form-group">
          <label for="filterType">Type d'infraction</label>
          <select id="filterType" v-model="logFilters.type">
            <option value="">Tous</option>
            <option value="SPAM">SPAM</option>
            <option value="TOXICITY">TOXICITY</option>
            <option value="ADVERTISING">ADVERTISING</option>
            <option value="NSFW">NSFW</option>
            <option value="OTHER">OTHER</option>
          </select>
        </div>

        <div class="form-group">
          <label for="filterAction">Action</label>
          <select id="filterAction" v-model="logFilters.action">
            <option value="">Toutes</option>
            <option value="WARN">WARN</option>
            <option value="MUTE">MUTE</option>
            <option value="KICK">KICK</option>
            <option value="BAN">BAN</option>
          </select>
        </div>

        <button class="btn btn-primary" @click="loadSanctions">
          Rechercher
        </button>
      </div>

      <div v-if="loadingSanctions" class="loading">
        <div class="spinner"></div>
        <p>Chargement des sanctions...</p>
      </div>

      <div v-else-if="sanctions.length === 0" class="empty-state">
        <div class="empty-icon">📊</div>
        <h3>Aucune sanction trouvée</h3>
        <p class="text-muted">Les sanctions apparaîtront ici une fois appliquées</p>
      </div>

      <div v-else class="sanctions-list">
        <div v-for="sanction in sanctions.filter(s => s && s._id)" :key="sanction._id" class="sanction-item">
          <div class="sanction-header">
            <div class="sanction-badges">
              <span :class="['badge', `badge-${(sanction.action || 'warn').toLowerCase()}`]">
                {{ (sanction.action || 'WARN').toUpperCase() }}
              </span>
              <span v-if="sanction.active && ['mute', 'ban'].includes(sanction.action)" class="badge badge-success">
                ✓ ACTIF
              </span>
              <span v-else-if="sanction.revokedAt" class="badge badge-revoked">
                ✗ RÉVOQUÉ
              </span>
              <span v-else-if="!sanction.active && ['mute', 'ban'].includes(sanction.action)" class="badge badge-inactive">
                INACTIF
              </span>
            </div>
            <span class="sanction-date">{{ formatDate(sanction.createdAt) }}</span>
          </div>
          
          <div class="sanction-details">
            <div class="sanction-user">
              <strong>Utilisateur:</strong>
              <div class="user-info">
                <span class="username">{{ sanction.userName || 'Utilisateur' }}</span>
                <code class="user-id">{{ sanction.userId }}</code>
              </div>
            </div>
            <div class="sanction-moderator">
              <strong>Modérateur:</strong>
              <div class="user-info">
                <span class="username">{{ sanction.moderatorName || 'Modérateur' }}</span>
                <code class="user-id">{{ sanction.moderatorId }}</code>
              </div>
            </div>
            <p><strong>Raison:</strong> {{ sanction.reason }}</p>
            <p v-if="sanction.duration"><strong>Durée:</strong> {{ formatDuration(sanction.duration) }}</p>
          </div>

          <div v-if="sanction.revokedAt" class="revoked-info">
            <span class="revoked-badge">✓ Révoquée</span>
            <span class="text-muted">le {{ formatDate(sanction.revokedAt) }}</span>
            <div v-if="sanction.revokedByName" class="revoked-by">
              <span class="text-muted">par</span>
              <strong>{{ sanction.revokedByName }}</strong>
              <code class="user-id">{{ sanction.revokedBy }}</code>
            </div>
          </div>
          <div v-else-if="sanction.active && ['mute', 'ban'].includes(sanction.action)" class="sanction-actions">
            <button class="btn btn-sm btn-warning" @click="revokeSanction(sanction._id)">
              Révoquer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Recherche Utilisateur -->
    <div v-if="activeTab === 'search'" class="card">
      <h2>🔍 Recherche Utilisateur</h2>
      
      <div class="search-section">
        <div class="search-bar">
          <input
            v-model="searchUserId"
            type="text"
            placeholder="Entrez l'ID Discord de l'utilisateur..."
            class="search-input"
            @keyup.enter="searchUser"
          />
          <button class="btn btn-primary" @click="searchUser" :disabled="!searchUserId || searchLoading">
            {{ searchLoading ? 'Recherche...' : 'Rechercher' }}
          </button>
        </div>

        <div v-if="searchedUser" class="user-result">
          <div class="user-info-card">
            <div class="user-header">
              <img
                v-if="searchedUser.avatar"
                :src="`https://cdn.discordapp.com/avatars/${searchedUser.id}/${searchedUser.avatar}.png`"
                alt="Avatar"
                class="user-avatar"
              />
              <div v-else class="user-avatar-placeholder">
                {{ searchedUser.username?.charAt(0).toUpperCase() || '?' }}
              </div>
              <div class="user-details">
                <h3>{{ searchedUser.globalName || searchedUser.username }}</h3>
                <p class="user-username">@{{ searchedUser.username }}</p>
                <p class="user-id">ID: {{ searchedUser.id }}</p>
              </div>
              <button class="btn btn-danger btn-apply-sanction" @click="openApplySanctionModal">
                ⚠️ Appliquer une Sanction
              </button>
            </div>

            <div class="user-stats">
              <div class="stat-item">
                <span class="stat-label">Total Sanctions (ce serveur)</span>
                <span class="stat-value">{{ userSanctions.length }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Sanctions Actives</span>
                <span class="stat-value warning">{{ userSanctions.filter(s => s.active && ['mute', 'ban'].includes(s.action)).length }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Avertissements</span>
                <span class="stat-value">{{ userSanctions.filter(s => s.action === 'warn').length }}</span>
              </div>
            </div>

            <div v-if="userTrustFactor || userGlobalSanctions > 0" class="global-sanctions-widget">
              <!-- Trust Factor -->
              <div v-if="userTrustFactor" class="trust-factor-card">
                <div class="trust-header">
                  <span class="trust-label">Trust Factor</span>
                  <span 
                    class="trust-score" 
                    :style="{ color: userTrustFactor.color }"
                  >
                    {{ userTrustFactor.score }}/100
                  </span>
                </div>
                <div class="trust-bar">
                  <div 
                    class="trust-fill" 
                    :style="{ 
                      width: userTrustFactor.score + '%',
                      background: userTrustFactor.color 
                    }"
                  ></div>
                </div>
                <div class="trust-level" :style="{ color: userTrustFactor.color }">
                  <span class="trust-icon">{{ getTrustIcon(userTrustFactor.level) }}</span>
                  <span>Fiabilité {{ userTrustFactor.level }}</span>
                </div>
              </div>

              <!-- Global Sanctions Alert -->
              <div v-if="userGlobalSanctions > 0" class="global-sanctions-alert">
                <div class="alert-icon">⚠️</div>
                <div class="alert-content">
                  <strong>Sanctions sur d'autres serveurs</strong>
                  <p>Cet utilisateur a <strong>{{ userGlobalSanctions }}</strong> sanction(s) au total sur tous les serveurs utilisant ce système.</p>
                </div>
              </div>
            </div>
          </div>

          <div class="user-sanctions-history">
            <h3>Historique des Sanctions ({{ userSanctions.length }})</h3>
            
            <div v-if="userSanctions.length === 0" class="empty-state">
              <p>✅ Aucune sanction trouvée pour cet utilisateur</p>
            </div>

            <div v-else class="sanctions-list">
              <div v-for="sanction in userSanctions" :key="sanction._id" class="sanction-item">
                <div class="sanction-header">
                  <div class="sanction-badges">
                    <span :class="['badge', `badge-${(sanction.action || 'warn').toLowerCase()}`]">
                      {{ (sanction.action || 'WARN').toUpperCase() }}
                    </span>
                    <span :class="['badge', 'badge-secondary']">
                      {{ (sanction.infractionType || 'OTHER').toUpperCase() }}
                    </span>
                  </div>
                  <span class="sanction-date">{{ formatDate(sanction.createdAt) }}</span>
                </div>
                
                <div class="sanction-details">
                  <div class="sanction-moderator">
                    <strong>Modérateur:</strong>
                    <div class="user-info">
                      <span class="username">{{ sanction.moderatorName || 'Modérateur inconnu' }}</span>
                      <code class="user-id">{{ sanction.moderatorId }}</code>
                    </div>
                  </div>
                  <p><strong>Raison:</strong> {{ sanction.reason }}</p>
                  <p v-if="sanction.durationMs"><strong>Durée:</strong> {{ formatDuration(sanction.durationMs) }}</p>
                </div>

                <div v-if="sanction.revokedAt" class="revoked-info">
                  <span class="revoked-badge">✓ Révoquée</span>
                  <span class="text-muted">le {{ formatDate(sanction.revokedAt) }}</span>
                  <div v-if="sanction.revokedByName" class="revoked-by">
                    <span class="text-muted">par</span>
                    <strong>{{ sanction.revokedByName }}</strong>
                    <code class="user-id">{{ sanction.revokedBy }}</code>
                  </div>
                </div>
                <div v-else class="sanction-actions">
                  <button v-if="sanction.active && ['mute', 'ban'].includes(sanction.action)" class="btn btn-sm btn-warning" @click="revokeSanction(sanction._id)">
                    Révoquer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="searchAttempted && !searchLoading" class="empty-state">
          <p>Aucun utilisateur trouvé ou erreur de recherche</p>
        </div>
      </div>
    </div>

    <!-- Escalation Rules -->
    <div v-if="activeTab === 'escalation'" class="card">
      <div class="card-header-actions">
        <h2>📈 Règles d'Escalation Automatique</h2>
        <button class="btn btn-primary" @click="addEscalationRule">
          + Nouvelle Règle
        </button>
      </div>

      <p class="text-muted">Configurez les sanctions automatiques en fonction du nombre d'infractions</p>

      <div v-if="config.escalationRules && config.escalationRules.length === 0" class="empty-state">
        <div class="empty-icon">📈</div>
        <h3>Aucune règle d'escalation</h3>
        <p class="text-muted">Créez des règles pour automatiser les sanctions progressives</p>
      </div>

      <div v-else class="escalation-list">
        <div v-for="(rule, rIndex) in config.escalationRules" :key="rIndex" class="escalation-rule-card">
          <div class="rule-header">
            <div class="form-group" style="margin: 0; flex: 1; max-width: 250px;">
              <label>Type d'infraction</label>
              <select v-model="rule.infractionType" class="form-control">
                <option v-for="type in infractionTypes" :key="type.key" :value="type.key">
                  {{ type.icon }} {{ type.label }}
                </option>
              </select>
            </div>
            <button class="btn btn-danger" @click="removeEscalationRule(rIndex)">
              Supprimer
            </button>
          </div>

          <div class="escalation-levels">
            <div v-for="(level, lIndex) in rule.levels" :key="lIndex" class="level-item">
              <div class="level-number">{{ level.level }}</div>
              <div class="level-form">
                <div class="form-group">
                  <label>Action</label>
                  <select v-model="level.action" class="form-control">
                    <option value="warn">Avertissement</option>
                    <option value="mute">Mute</option>
                    <option value="kick">Expulsion</option>
                    <option value="ban">Bannissement</option>
                  </select>
                </div>
                <div v-if="level.action === 'mute' || level.action === 'ban'" class="duration-inputs">
                  <div class="form-group">
                    <label>Jours</label>
                    <input 
                      type="number" 
                      v-model.number="level.days" 
                      placeholder="0"
                      min="0"
                      class="form-control"
                    />
                  </div>
                  <div class="form-group">
                    <label>Heures</label>
                    <input 
                      type="number" 
                      v-model.number="level.hours" 
                      placeholder="0"
                      min="0"
                      max="23"
                      class="form-control"
                    />
                  </div>
                  <div class="form-group">
                    <label>Minutes</label>
                    <input 
                      type="number" 
                      v-model.number="level.minutes" 
                      placeholder="0"
                      min="0"
                      max="59"
                      class="form-control"
                    />
                  </div>
                  <small class="help-text">Laisser à 0 pour une durée permanente</small>
                </div>
                <button class="btn btn-danger btn-icon" @click="removeEscalationLevel(rIndex, lIndex)" title="Supprimer ce niveau">
                  ×
                </button>
              </div>
            </div>
          </div>

          <button class="btn btn-secondary" @click="addEscalationLevel(rIndex)">
            + Ajouter un niveau
          </button>
        </div>
      </div>

      <button v-if="config.escalationRules && config.escalationRules.length > 0" class="btn btn-primary" @click="saveEscalationRules" :disabled="savingConfig">
        {{ savingConfig ? 'Sauvegarde...' : 'Sauvegarder les règles' }}
      </button>
    </div>

    <!-- Permissions Management -->
    <div v-if="activeTab === 'permissions'" class="card">
      <div class="card-header-actions">
        <h2>🔐 Gestion des Permissions</h2>
        <button class="btn btn-primary" @click="showAddPermissionModal = true">
          + Ajouter Permission
        </button>
      </div>

      <div v-if="loadingPermissions" class="loading">
        <div class="spinner"></div>
        <p>Chargement des permissions...</p>
      </div>

      <div v-else-if="permissions.length === 0" class="empty-state">
        <div class="empty-icon">🔐</div>
        <h3>Aucune permission personnalisée</h3>
        <p class="text-muted">Attribuez des rôles spécifiques à vos utilisateurs</p>
      </div>

      <div v-else class="permissions-table">
        <table>
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Rôle</th>
              <th>Date d'ajout</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="permission in permissions.filter(p => p && p._id)" :key="permission._id">
              <td>
                <div class="user-cell">
                  <strong>{{ permission.userId?.username || 'Utilisateur' }}</strong>
                  <code class="user-id">{{ permission.userId?.discordId || permission.userId || '-' }}</code>
                </div>
              </td>
              <td>
                <span :class="['badge', permission.role === 'GUILD_ADMIN' ? 'badge-ban' : 'badge-mute']">
                  {{ permission.role === 'GUILD_ADMIN' ? 'Administrateur' : 'Modérateur' }}
                </span>
              </td>
              <td>{{ formatDate(permission.createdAt) }}</td>
              <td>
                <button class="btn btn-sm btn-danger" @click="removePermission(permission._id)">
                  Retirer
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Statistics -->
    <div v-if="activeTab === 'stats'" class="card">
      <h2>📊 Statistiques des Infractions</h2>

      <div v-if="loadingStats" class="loading">
        <div class="spinner"></div>
        <p>Chargement des statistiques...</p>
      </div>

      <div v-else>
        <div class="stats-overview">
          <div class="stat-card">
            <div class="stat-icon">⚠️</div>
            <div class="stat-content">
              <h3>{{ totalInfractions }}</h3>
              <p>Total Infractions</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">👤</div>
            <div class="stat-content">
              <h3>{{ uniqueOffenders }}</h3>
              <p>Utilisateurs Sanctionnés</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🔥</div>
            <div class="stat-content">
              <h3>{{ mostCommonInfraction }}</h3>
              <p>Infraction la Plus Commune</p>
            </div>
          </div>
        </div>

        <div class="infraction-breakdown">
          <h3>Répartition par Type d'Infraction</h3>
          <div class="infraction-bars">
            <div v-for="stat in infractionStats" :key="stat.type" class="infraction-bar-item">
              <div class="infraction-label">
                <span :class="['badge', `badge-${stat.type.toLowerCase()}`]">
                  {{ stat.type }}
                </span>
                <span class="count">{{ stat.count }}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: `${stat.percentage}%` }"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="top-offenders">
          <h3>Utilisateurs avec le Plus d'Infractions</h3>
          <table>
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Total Infractions</th>
                <th>Dernière Infraction</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="offender in topOffenders.filter(o => o && o.userId)" :key="offender.userId">
                <td>
                  <div class="user-cell">
                    <strong>{{ offender.userName || 'Utilisateur inconnu' }}</strong>
                    <code class="user-id">{{ offender.userId }}</code>
                  </div>
                </td>
                <td>
                  <span class="badge badge-warn">{{ offender.totalCount }}</span>
                </td>
                <td>{{ formatDate(offender.lastInfraction) }}</td>
                <td>
                  <button class="btn btn-sm btn-primary" @click="searchUserId = offender.userId; activeTab = 'search'; searchUser()">
                    Voir Profil
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modules Section (Admin du serveur) -->
    <div v-if="activeTab === 'modules'" class="card">
      <div class="card-header">
        <h2>🧩 Modules Personnalisés</h2>
        <p class="text-muted">Gérez les modules installés sur ce serveur</p>
      </div>

      <div v-if="loadingServerModules" class="loading">
        <div class="spinner"></div>
        <p>Chargement des modules...</p>
      </div>

      <div v-else-if="serverModules.length === 0" class="empty-state">
        <div class="empty-icon">🧩</div>
        <h4>Aucun module disponible</h4>
        <p class="text-muted">Les modules ajoutés par les Masters apparaîtront ici</p>
      </div>

      <div v-else class="modules-list">
        <div v-for="module in serverModules" :key="module.id" class="module-item">
          <div class="module-header-row">
            <div class="module-icon-large">{{ module.icon || '📦' }}</div>
            <div class="module-details">
              <h3>{{ module.name }}</h3>
              <p class="text-muted">{{ module.description }}</p>
              <div class="module-meta">
                <span class="badge badge-info">v{{ module.version || '1.0.0' }}</span>
                <span class="text-muted">• Par {{ module.author || 'Master' }}</span>
                <span v-if="module.files && module.files.length > 0" class="text-muted">• 📁 {{ module.files.length }} fichier{{ module.files.length > 1 ? 's' : '' }}</span>
              </div>
            </div>
            <div class="module-controls">
              <span class="badge" :class="module.enabledForGuild ? 'badge-success' : 'badge-inactive'">
                {{ module.enabledForGuild ? '✓ Actif' : '✗ Inactif' }}
              </span>
              <label class="switch">
                <input 
                  type="checkbox" 
                  v-model="module.enabledForGuild" 
                  @change="toggleServerModule(module)"
                >
                <span class="slider"></span>
              </label>
            </div>
          </div>
          
          <div v-if="module.files && module.files.length > 0" class="module-files-section">
            <button 
              class="files-toggle" 
              @click="module.showFiles = !module.showFiles"
            >
              {{ module.showFiles ? '▼' : '▶' }} Fichiers ({{ module.files.length }})
            </button>
            <div v-if="module.showFiles" class="files-grid">
              <div v-for="file in module.files" :key="file.name" class="file-card">
                <span class="file-icon">{{ getFileIcon(file.name) }}</span>
                <span class="file-name">{{ file.name }}</span>
                <span class="file-size">{{ formatFileSize(file.size) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Master Section -->
    <div v-if="activeTab === 'master' && isMaster" class="card">
      <div class="card-header">
        <h2>👑 Panneau Master</h2>
        <p class="text-muted">Contrôle avancé du serveur</p>
      </div>

      <div class="master-sections">
        <!-- Contrôle du Bot -->
        <div class="master-section">
          <div class="section-header">
            <h3>🤖 Contrôle du Bot</h3>
          </div>
          <div class="bot-controls">
            <div class="control-item">
              <div class="control-info">
                <h4>Statut du Bot</h4>
                <p class="text-muted">{{ config.enabled ? 'Le bot est actif sur ce serveur' : 'Le bot est désactivé sur ce serveur' }}</p>
              </div>
              <label class="switch">
                <input type="checkbox" v-model="config.enabled" @change="toggleBot">
                <span class="slider"></span>
              </label>
            </div>
            <div class="control-item">
              <div class="control-info">
                <h4>Mode Maintenance</h4>
                <p class="text-muted">{{ maintenanceMode ? 'Le bot ignore les commandes (sauf Master)' : 'Fonctionnement normal' }}</p>
              </div>
              <label class="switch">
                <input type="checkbox" v-model="maintenanceMode" @change="toggleMaintenance">
                <span class="slider"></span>
              </label>
            </div>
            <div class="control-actions">
              <button class="btn btn-primary" @click="syncGuild">
                🔄 Synchroniser le serveur
              </button>
              <button class="btn btn-outline" @click="testBot">
                ✅ Tester le bot
              </button>
            </div>
          </div>
        </div>

        <!-- Modules Personnalisés -->
        <div class="master-section">
          <div class="section-header">
            <h3>🧩 Modules Personnalisés</h3>
            <button class="btn btn-primary" @click="showModuleModal = true">
              + Nouveau Module
            </button>
          </div>

          <div v-if="loadingModules" class="loading">
            <div class="spinner"></div>
            <p>Chargement des modules...</p>
          </div>

          <div v-else-if="customModules.length === 0" class="empty-state">
            <div class="empty-icon">🧩</div>
            <h4>Aucun module personnalisé</h4>
            <p class="text-muted">Créez des modules pour étendre les fonctionnalités du bot</p>
          </div>

          <div v-else class="modules-grid">
            <div v-for="module in customModules" :key="module.id" class="module-card">
              <div class="module-header">
                <div class="module-icon">{{ module.icon || '📦' }}</div>
                <div class="module-info">
                  <h4>{{ module.name }}</h4>
                  <p class="text-muted">{{ module.description }}</p>
                  <div class="module-meta">
                    <span class="badge badge-info">v{{ module.version || '1.0.0' }}</span>
                    <span class="text-muted">• Par {{ module.author || 'Master' }}</span>
                    <span v-if="module.files && module.files.length > 0" class="text-muted">• 📁 {{ module.files.length }} fichier{{ module.files.length > 1 ? 's' : '' }}</span>
                  </div>
                </div>
                <div class="module-status">
                  <span class="badge" :class="module.enabled ? 'badge-success' : 'badge-inactive'">
                    {{ module.enabled ? 'Actif' : 'Inactif' }}
                  </span>
                  <div class="dropdown">
                    <button class="btn-dropdown" @click.stop="toggleDropdown(module.id)">
                      ⋮
                    </button>
                    <div v-if="activeDropdown === module.id" class="dropdown-menu">
                      <button @click.stop="toggleModule(module); activeDropdown = null" class="dropdown-item">
                        <span>{{ module.enabled ? '❌' : '✅' }}</span>
                        {{ module.enabled ? 'Désactiver' : 'Activer' }}
                      </button>
                      <button @click.stop="editModule(module); activeDropdown = null" class="dropdown-item">
                        <span>✏️</span>
                        Modifier
                      </button>
                      <button @click.stop="manageAccess(module); activeDropdown = null" class="dropdown-item">
                        <span>🔐</span>
                        Gérer Accès
                      </button>
                      <button @click.stop="deployModule(module); activeDropdown = null" class="dropdown-item">
                        <span>🚀</span>
                        Déployer
                      </button>
                      <div class="dropdown-divider"></div>
                      <button @click.stop="deleteModule(module.id); activeDropdown = null" class="dropdown-item danger">
                        <span>🗑️</span>
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Statistiques Système -->
        <div class="master-section">
          <div class="section-header">
            <h3>📊 Statistiques Système</h3>
          </div>
          <div class="system-stats">
            <div class="stat-item">
              <span class="stat-label">Membres Total</span>
              <span class="stat-value">{{ guildData?.memberCount || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Templates Actifs</span>
              <span class="stat-value">{{ templates.filter(t => t.active).length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Modérateurs</span>
              <span class="stat-value">{{ config.moderationRoles?.length || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Modules Actifs</span>
              <span class="stat-value warning">{{ customModules.filter(m => m.enabled).length }}</span>
            </div>
          </div>
        </div>

        <!-- Actions Avancées -->
        <div class="master-section">
          <div class="section-header">
            <h3>⚡ Actions Avancées</h3>
          </div>
          <div class="master-actions">
            <button class="btn btn-outline" @click="exportConfig">
              📥 Exporter Configuration
            </button>
            <button class="btn btn-outline" @click="showImportModal = true">
              📤 Importer Configuration
            </button>
            <button class="btn btn-outline btn-warning" @click="resetAllCounters">
              🔄 Réinitialiser Compteurs
            </button>
            <button class="btn btn-outline btn-danger" @click="dangerZone">
              ⚠️ Zone Dangereuse
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Template -->
    <div v-if="showTemplateModal" class="modal-overlay" @click="closeTemplateModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingTemplate ? 'Modifier' : 'Nouveau' }} Template de Sanction</h3>
          <button class="modal-close" @click="closeTemplateModal">&times;</button>
        </div>
        
        <form @submit.prevent="saveTemplate">
          <div class="form-group">
            <label for="templateName">Nom du template</label>
            <input
              id="templateName"
              v-model="templateForm.name"
              type="text"
              required
              placeholder="Ex: Spam léger"
            />
          </div>

          <div class="form-group">
            <label for="templateType">Type d'infraction</label>
            <select id="templateType" v-model="templateForm.infractionType" required>
              <option value="SPAM">SPAM</option>
              <option value="TOXICITY">TOXICITY</option>
              <option value="ADVERTISING">ADVERTISING</option>
              <option value="NSFW">NSFW</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>

          <div class="form-group">
            <label for="templateAction">Action</label>
            <select id="templateAction" v-model="templateForm.actionType" required>
              <option value="WARN">Avertissement</option>
              <option value="MUTE">Mute</option>
              <option value="KICK">Kick</option>
              <option value="BAN">Ban</option>
            </select>
          </div>

          <div v-if="['MUTE', 'BAN'].includes(templateForm.actionType)" class="form-group">
            <label for="templateDuration">Durée (en secondes, 0 = permanent)</label>
            <input
              id="templateDuration"
              v-model.number="templateForm.duration"
              type="number"
              min="0"
              placeholder="3600"
            />
          </div>

          <div class="form-group">
            <label for="templateReason">Raison</label>
            <textarea
              id="templateReason"
              v-model="templateForm.reason"
              required
              rows="3"
              placeholder="Description de la sanction..."
            ></textarea>
          </div>

          <div class="form-group">
            <label>
              <input type="checkbox" v-model="templateForm.active" />
              Template actif
            </label>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="closeTemplateModal">
              Annuler
            </button>
            <button type="submit" class="btn btn-primary" :disabled="savingTemplate">
              {{ savingTemplate ? 'Sauvegarde...' : 'Sauvegarder' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Apply Sanction -->
    <div v-if="showApplySanctionModal" class="modal-overlay" @click="closeApplySanctionModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>⚠️ Appliquer une Sanction</h3>
          <button class="modal-close" @click="closeApplySanctionModal">&times;</button>
        </div>
        
        <form @submit.prevent="applySanction">
          <div class="form-group">
            <label>Utilisateur</label>
            <div class="user-display">
              <strong>{{ targetUserName || searchedUser?.globalName || searchedUser?.username || 'Utilisateur' }}</strong>
              <span class="text-muted">{{ targetUserId || searchedUser?.id }}</span>
            </div>
          </div>

          <div class="form-group">
            <label for="sanctionInfractionType">Type d'infraction</label>
            <select id="sanctionInfractionType" v-model="applySanctionForm.infractionType" required>
              <option v-for="type in infractionTypes" :key="type.key" :value="type.key">
                {{ type.icon }} {{ type.label }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="sanctionAction">Action (ou laissez l'escalade automatique)</label>
            <select id="sanctionAction" v-model="applySanctionForm.action">
              <option value="">🔄 Utiliser l'escalade automatique</option>
              <option value="warn">⚠️ Avertissement</option>
              <option value="mute">🔇 Mute (silence temporaire)</option>
              <option value="kick">👢 Kick (expulsion)</option>
              <option value="ban">🔨 Ban (bannissement)</option>
            </select>
            <small class="form-help">Laissez vide pour appliquer l'escalade selon les règles configurées</small>
          </div>

          <div v-if="applySanctionForm.action && ['mute', 'ban'].includes(applySanctionForm.action)" class="form-group">
            <label>Durée</label>
            <div class="duration-inputs">
              <div class="duration-input-group">
                <input
                  v-model.number="applySanctionForm.days"
                  type="number"
                  min="0"
                  placeholder="0"
                />
                <span>jours</span>
              </div>
              <div class="duration-input-group">
                <input
                  v-model.number="applySanctionForm.hours"
                  type="number"
                  min="0"
                  max="23"
                  placeholder="0"
                />
                <span>heures</span>
              </div>
              <div class="duration-input-group">
                <input
                  v-model.number="applySanctionForm.minutes"
                  type="number"
                  min="0"
                  max="59"
                  placeholder="0"
                />
                <span>minutes</span>
              </div>
            </div>
            <small class="form-help">Laisser à 0 pour une durée permanente</small>
          </div>

          <div v-if="selectedInfractionType?.requiresCustomReason" class="form-group">
            <label for="sanctionReason">Raison personnalisée</label>
            <textarea
              id="sanctionReason"
              v-model="applySanctionForm.reason"
              required
              rows="3"
              placeholder="Raison détaillée de la sanction..."
            ></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="closeApplySanctionModal">
              Annuler
            </button>
            <button type="submit" class="btn btn-danger" :disabled="applyingSanction">
              {{ applyingSanction ? 'Application...' : 'Appliquer la Sanction' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Module -->
    <div v-if="showModuleModal" class="modal-overlay" @click="closeModuleModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingModule ? '✏️ Modifier' : '🧩 Nouveau' }} Module</h3>
          <button class="modal-close" @click="closeModuleModal">&times;</button>
        </div>
        
        <form @submit.prevent="saveModule">
          <div class="form-group">
            <label for="moduleName">Nom du module</label>
            <input
              id="moduleName"
              v-model="moduleForm.name"
              type="text"
              required
              placeholder="Mon module personnalisé"
            />
          </div>

          <div class="form-group">
            <label for="moduleDescription">Description</label>
            <textarea
              id="moduleDescription"
              v-model="moduleForm.description"
              rows="3"
              placeholder="Description du module..."
              required
            ></textarea>
          </div>

          <div class="form-group">
            <label for="moduleIcon">Icône (emoji)</label>
            <input
              id="moduleIcon"
              v-model="moduleForm.icon"
              type="text"
              maxlength="2"
              placeholder="📦"
            />
          </div>

          <div class="form-group">
            <label for="moduleVersion">Version</label>
            <input
              id="moduleVersion"
              v-model="moduleForm.version"
              type="text"
              placeholder="1.0.0"
            />
          </div>

          <div v-if="editingModule" class="form-group">
            <label>Auteur</label>
            <input
              type="text"
              :value="editingModule.author"
              disabled
              class="readonly-input"
            />
          </div>

          <div class="form-group">
            <label for="moduleFiles">Fichiers du module</label>
            <div class="file-upload-area" @click="$refs.fileInput.click()">
              <input
                ref="fileInput"
                type="file"
                multiple
                accept=".js,.json,.txt,.md"
                @change="handleFileUpload"
                style="display: none"
              />
              <div v-if="!moduleForm.files || moduleForm.files.length === 0" class="file-upload-placeholder">
                <span class="upload-icon">📁</span>
                <p>Cliquez pour ajouter des fichiers</p>
                <small class="text-muted">.js, .json, .txt, .md</small>
              </div>
              <div v-else class="uploaded-files">
                <div v-for="(file, index) in moduleForm.files" :key="index" class="uploaded-file-item">
                  <span class="file-icon">{{ getFileIcon(file.name) }}</span>
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-size">{{ formatFileSize(file.size) }}</span>
                  <button type="button" class="btn-remove-file" @click.stop="removeFile(index)">×</button>
                </div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="moduleForm.enabled">
              <span>Module activé par défaut</span>
            </label>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModuleModal">
              Annuler
            </button>
            <button type="submit" class="btn btn-primary">
              {{ editingModule ? 'Modifier' : 'Créer' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Add Permission -->
    <div v-if="showAddPermissionModal" class="modal-overlay" @click="showAddPermissionModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>🔐 Ajouter une Permission</h3>
          <button class="modal-close" @click="showAddPermissionModal = false">&times;</button>
        </div>
        
        <form @submit.prevent="addPermission">
          <div class="form-group">
            <label for="permUserId">ID Discord de l'utilisateur</label>
            <input
              id="permUserId"
              v-model="addPermissionForm.userId"
              type="text"
              required
              placeholder="123456789012345678"
              pattern="\d{17,20}"
              title="Entrez un ID Discord valide (17-20 chiffres)"
            />
            <small class="text-muted">
              L'utilisateur sera créé automatiquement s'il n'existe pas encore. 
              Il récupérera ses permissions lors de sa première connexion.
            </small>
          </div>

          <div class="form-group">
            <label for="permRole">Rôle</label>
            <select id="permRole" v-model="addPermissionForm.role" required>
              <option value="GUILD_MODERATOR">Modérateur</option>
              <option value="GUILD_ADMIN">Administrateur</option>
            </select>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="showAddPermissionModal = false">
              Annuler
            </button>
            <button type="submit" class="btn btn-primary" :disabled="addingPermission">
              {{ addingPermission ? 'Ajout...' : 'Ajouter' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Gestion Accès Module -->
    <div v-if="showAccessModal" class="modal-overlay" @click="closeAccessModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>🔐 Gérer l'Accès au Module</h3>
          <button class="modal-close" @click="closeAccessModal">&times;</button>
        </div>
        
        <div class="modal-body">
          <div v-if="selectedModuleForAccess" class="access-module-info">
            <div class="module-header-compact">
              <span class="module-icon-large">{{ selectedModuleForAccess.icon || '📦' }}</span>
              <div>
                <h4>{{ selectedModuleForAccess.name }}</h4>
                <p class="text-muted">{{ selectedModuleForAccess.description }}</p>
              </div>
            </div>
          </div>

          <div class="access-options">
            <div class="form-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  :checked="isAllAccessMode"
                  @change="toggleAllAccessMode"
                >
                <span>Tous les serveurs ont accès</span>
              </label>
              <small class="text-muted">Si décoché, seuls les serveurs sélectionnés auront accès</small>
            </div>
          </div>

          <div v-if="!isAllAccessMode" class="guilds-access-list">
            <h4>Serveurs avec Accès</h4>
            
            <div v-if="loadingGuildAccess" class="loading-compact">
              <div class="spinner-sm"></div>
              <span>Chargement...</span>
            </div>

            <div v-else-if="userGuilds.length === 0" class="empty-state-compact">
              <p class="text-muted">Aucun serveur disponible</p>
            </div>

            <div v-else class="guild-list">
              <div 
                v-for="guild in userGuilds" 
                :key="guild.id" 
                class="guild-access-item"
              >
                <div class="guild-info-compact">
                  <img 
                    v-if="guild.icon" 
                    :src="`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`" 
                    :alt="guild.name"
                    class="guild-icon-small"
                  >
                  <div v-else class="guild-icon-fallback">{{ guild.name[0] }}</div>
                  <span class="guild-name">{{ guild.name }}</span>
                </div>
                <label class="toggle-switch">
                  <input 
                    type="checkbox" 
                    :checked="moduleAllowedGuilds.includes(guild.id)"
                    @change="toggleGuildAccess(guild.id, $event.target.checked)"
                  >
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeAccessModal">
            Fermer
          </button>
        </div>
      </div>
    </div>

    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNotificationStore } from '../stores/notification';
import { useConfirmStore } from '../stores/confirm';
import { useAuthStore } from '../stores/auth';
import api from '../services/api';

export default {
  name: 'GuildPanel',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const notification = useNotificationStore();
    const confirm = useConfirmStore();
    const authStore = useAuthStore();
    const guildId = route.params.guildId;
    const isMaster = computed(() => authStore.isMaster);
    const isSetupMode = computed(() => guildData.value && !guildData.value.configured);
    
    // State
    const activeTab = ref('config');
    const guildData = ref(null);
    const config = ref({
      enabled: true,
      defaultLanguage: 'fr',
      logChannelId: '',
      muteRoleId: '',
      moderationRoles: [],
      escalationRules: [],
    });
    
    // Templates
    const templates = ref([]);
    const loadingTemplates = ref(false);
    const showTemplateModal = ref(false);
    const editingTemplate = ref(null);
    const savingTemplate = ref(false);
    const templateForm = ref({
      name: '',
      infractionType: 'SPAM',
      actionType: 'WARN',
      duration: 0,
      reason: '',
      active: true,
    });
    
    // Moderators
    const moderators = ref([]);
    const loadingModerators = ref(false);
    
    // Computed pour séparer admins et modérateurs
    const adminModerators = computed(() => {
      return moderators.value.filter(m => m.isAdmin);
    });
    
    const regularModerators = computed(() => {
      return moderators.value.filter(m => !m.isAdmin);
    });
    
    // Logs
    const sanctions = ref([]);
    const loadingSanctions = ref(false);
    const logFilters = ref({
      type: '',
      action: '',
    });
    
    // Types d'infractions
    const infractionTypes = ref([]);
    const loadingInfractionTypes = ref(false);
    const showInfractionTypeModal = ref(false);
    const editingInfractionType = ref(null);
    const savingInfractionType = ref(false);
    const infractionTypeForm = ref({
      key: '',
      label: '',
      icon: '',
      description: '',
      enabled: true,
      requiresCustomReason: false,
    });
    
    // Sanctions directes (supprimé, utiliser la commande /sanction)
    
    // Search User
    const searchUserId = ref('');
    const searchedUser = ref(null);
    const userSanctions = ref([]);
    const userGlobalSanctions = ref(0);
    const userTrustFactor = ref(null);
    const searchLoading = ref(false);
    const searchAttempted = ref(false);
    const showApplySanctionModal = ref(false);
    const targetUserId = ref(null);
    const targetUserName = ref(null);
    const applySanctionForm = ref({
      infractionType: 'spam',
      action: 'warn',
      reason: '',
      days: 0,
      hours: 0,
      minutes: 0,
    });
    const applyingSanction = ref(false);

    const selectedInfractionType = computed(() => {
      return infractionTypes.value.find(t => t.key === applySanctionForm.value.infractionType);
    });
    
    // Master - Contrôle Bot
    const maintenanceMode = ref(false);
    
    // Modules - Admin du serveur
    const serverModules = ref([]);
    const loadingServerModules = ref(false);
    
    // Master - Modules Personnalisés
    const customModules = ref([]);
    const loadingModules = ref(false);
    const showModuleModal = ref(false);
    const editingModule = ref(null);
    const activeDropdown = ref(null);
    const moduleForm = ref({
      name: '',
      description: '',
      icon: '📦',
      version: '1.0.0',
      enabled: true,
      files: [],
      config: {},
    });
    const showImportModal = ref(false);
    
    // Gestion accès modules
    const showAccessModal = ref(false);
    const selectedModuleForAccess = ref(null);
    const moduleAllowedGuilds = ref([]);
    const loadingGuildAccess = ref(false);
    const userGuilds = ref([]);
    const isAllAccessMode = computed(() => moduleAllowedGuilds.value.length === 0);
    
    // Config
    const savingConfig = ref(false);
    
    // Modals pour config
    const showChannelModal = ref(false);
    const showMuteRoleModal = ref(false);
    const showModerationRolesModal = ref(false);
    const tempLogChannelId = ref('');
    const tempMuteRoleId = ref('');
    const tempModerationRoles = ref([]);
    
    // Cache pour les noms Discord (éviter rate limit)
    const discordCache = ref({
      roles: new Map(),
      channels: new Map(),
      lastFetch: null,
    });
    const loadingDiscordData = ref(false);
    
    // Computed pour les listes de sélection
    const textChannels = computed(() => {
      if (!discordCache.value || !discordCache.value.channels || discordCache.value.channels.size === 0) {
        return [];
      }
      
      const channels = [];
      discordCache.value.channels.forEach((channel, id) => {
        if (channel && channel.type !== undefined && (channel.type === 0 || channel.type === 5)) {
          channels.push({ id, ...channel });
        }
      });
      return channels.sort((a, b) => (a.position || 0) - (b.position || 0));
    });
    
    const availableRoles = computed(() => {
      if (!discordCache.value || !discordCache.value.roles || discordCache.value.roles.size === 0) {
        return [];
      }
      
      const roles = [];
      discordCache.value.roles.forEach((name, id) => {
        if (name) {
          roles.push({ id, name });
        }
      });
      return roles;
    });

    onMounted(async () => {
      // Vérifier si un onglet est spécifié dans l'URL
      if (route.query.tab) {
        activeTab.value = route.query.tab;
      }
      
      // Vérifier si un userId est spécifié (pour l'onglet search)
      if (route.query.userId && activeTab.value === 'search') {
        searchUserId.value = route.query.userId;
        // Lancer la recherche automatiquement après un court délai
        setTimeout(() => {
          searchUser();
        }, 500);
      }
      
      await loadGuildData();
      await loadInfractionTypes();
      
      // Fermer le dropdown quand on clique ailleurs
      document.addEventListener('click', handleClickOutside);
      
      // Vérifier si le serveur est configuré
      if (guildData.value && !guildData.value.configured) {
        // Rediriger vers la page de setup
        router.push(`/guild/${guildId}/setup`);
        return;
      }
      
      await loadGuildConfig();
    });
    
    // Initialiser les valeurs temporaires quand les modals s'ouvrent
    watch(showChannelModal, (isOpen) => {
      if (isOpen) {
        tempLogChannelId.value = config.value.logChannelId || '';
      }
    });
    
    watch(showMuteRoleModal, (isOpen) => {
      if (isOpen) {
        tempMuteRoleId.value = config.value.muteRoleId || '';
      }
    });
    
    watch(showModerationRolesModal, (isOpen) => {
      if (isOpen) {
        tempModerationRoles.value = [...(config.value.moderationRoles || [])];
      }
    });

    const loadGuildData = async () => {
      try {
        const response = await api.getUserGuilds();
        const guilds = response.data.guilds || [];
        guildData.value = guilds.find(g => g.guildId === guildId);
      } catch (error) {
        console.error('Erreur chargement guild:', error);
      }
    };

    const loadGuildConfig = async () => {
      try {
        const response = await api.getGuildConfig(guildId);
        const cfg = response.data.config;
        if (cfg) {
          // Convertir les millisecondes en days/hours/minutes pour l'affichage
          const escalationRules = (cfg.escalationRules || []).map(rule => ({
            infractionType: rule.infractionType,
            levels: rule.levels.map(level => {
              const durationMs = level.durationMs || 0;
              const days = Math.floor(durationMs / (24 * 60 * 60 * 1000));
              const hours = Math.floor((durationMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
              const minutes = Math.floor((durationMs % (60 * 60 * 1000)) / (60 * 1000));
              
              return {
                level: level.level,
                action: level.action,
                days,
                hours,
                minutes
              };
            })
          }));

          config.value = {
            enabled: cfg.enabled ?? true,
            defaultLanguage: cfg.defaultLanguage || 'fr',
            logChannelId: cfg.logChannelId || '',
            muteRoleId: cfg.muteRoleId || '',
            moderationRoles: cfg.moderationRoles || [],
            escalationRules,
          };
        }
        
        // Charger les données Discord pour affichage
        await loadDiscordData();
      } catch (error) {
        console.error('Erreur chargement config:', error);
      }
    };
    
    // Charger les rôles et channels depuis Discord (avec cache)
    const loadDiscordData = async () => {
      // Vérifier le cache (valide pendant 5 minutes)
      const now = Date.now();
      if (discordCache.value.lastFetch && (now - discordCache.value.lastFetch) < 300000) {
        console.log('[loadDiscordData] Cache valide, skip fetch');
        return; // Cache encore valide
      }
      
      if (loadingDiscordData.value) {
        console.log('[loadDiscordData] Déjà en cours, skip');
        return; // Déjà en cours de chargement
      }
      
      loadingDiscordData.value = true;
      console.log('[loadDiscordData] Chargement des données Discord...');
      try {
        const response = await api.getGuildDetails(guildId);
        const guild = response.data.guild;
        
        console.log('[loadDiscordData] Réponse reçue:', guild);
        
        if (guild) {
          // Mettre en cache les rôles
          discordCache.value.roles.clear();
          if (guild.roles) {
            guild.roles.forEach(role => {
              discordCache.value.roles.set(role.id, role.name);
            });
            console.log('[loadDiscordData] Rôles chargés:', discordCache.value.roles.size);
          }
          
          // Mettre en cache les channels
          discordCache.value.channels.clear();
          if (guild.channels) {
            guild.channels.forEach(channel => {
              discordCache.value.channels.set(channel.id, {
                name: channel.name,
                type: channel.type,
              });
            });
            console.log('[loadDiscordData] Channels chargés:', discordCache.value.channels.size);
          }
          
          discordCache.value.lastFetch = now;
        }
      } catch (error) {
        console.error('Erreur chargement données Discord:', error);
      } finally {
        loadingDiscordData.value = false;
      }
    };
    
    // Helper pour obtenir le nom d'un rôle
    const getRoleName = (roleId) => {
      if (!roleId) return '';
      if (!discordCache.value || !discordCache.value.roles || discordCache.value.roles.size === 0) {
        console.log('[getRoleName] Cache non initialisé pour roleId:', roleId);
        return loadingDiscordData.value ? 'Chargement...' : `ID: ${roleId}`;
      }
      const roleName = discordCache.value.roles.get(roleId);
      console.log('[getRoleName] roleId:', roleId, '-> name:', roleName);
      return roleName || `ID: ${roleId}`;
    };
    
    // Helper pour obtenir le nom d'un channel
    const getChannelName = (channelId) => {
      if (!channelId) return '';
      if (!discordCache.value || !discordCache.value.channels || discordCache.value.channels.size === 0) {
        console.log('[getChannelName] Cache non initialisé pour channelId:', channelId);
        return loadingDiscordData.value ? 'Chargement...' : `ID: ${channelId}`;
      }
      const channel = discordCache.value.channels.get(channelId);
      console.log('[getChannelName] channelId:', channelId, '-> channel:', channel);
      return channel ? `#${channel.name}` : `ID: ${channelId}`;
    };

    const saveConfig = async () => {
      savingConfig.value = true;
      
      try {
        await api.updateGuildConfig(guildId, config.value);
        notification.success('Configuration sauvegardée avec succès !');
      } catch (error) {
        notification.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
      } finally {
        savingConfig.value = false;
      }
    };
    
    const saveLogChannel = async () => {
      config.value.logChannelId = tempLogChannelId.value;
      showChannelModal.value = false;
      await saveConfig();
    };
    
    const saveMuteRole = async () => {
      config.value.muteRoleId = tempMuteRoleId.value;
      showMuteRoleModal.value = false;
      await saveConfig();
    };
    
    const saveModerationRoles = async () => {
      config.value.moderationRoles = [...tempModerationRoles.value];
      showModerationRolesModal.value = false;
      await saveConfig();
    };

    const loadTemplates = async () => {
      loadingTemplates.value = true;
      try {
        const response = await api.getTemplates(guildId);
        templates.value = response.data.templates || [];
      } catch (error) {
        console.error('Erreur chargement templates:', error);
      } finally {
        loadingTemplates.value = false;
      }
    };

    const saveTemplate = async () => {
      savingTemplate.value = true;
      try {
        if (editingTemplate.value) {
          await api.updateTemplate(guildId, editingTemplate.value._id, templateForm.value);
          notification.success('Template modifié avec succès');
        } else {
          await api.createTemplate(guildId, templateForm.value);
          notification.success('Template créé avec succès');
        }
        await loadTemplates();
        closeTemplateModal();
      } catch (error) {
        console.error('Erreur sauvegarde template:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Erreur inconnue';
        notification.error(`Erreur: ${errorMessage}`);
      } finally {
        savingTemplate.value = false;
      }
    };

    const editTemplate = (template) => {
      editingTemplate.value = template;
      templateForm.value = {
        name: template.name,
        infractionType: template.infractionType,
        actionType: template.actionType,
        duration: template.duration || 0,
        reason: template.reason,
        active: template.active,
      };
      showTemplateModal.value = true;
    };

    const deleteTemplateConfirm = async (templateId) => {
      const confirmed = await confirm.show({
        title: 'Supprimer le template',
        message: 'Êtes-vous sûr de vouloir supprimer ce template ?',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        type: 'danger'
      });

      if (!confirmed) return;

      try {
        await api.deleteTemplate(guildId, templateId);
        await loadTemplates();
        notification.success('Template supprimé avec succès');
      } catch (error) {
        console.error('Erreur suppression template:', error);
        notification.error('Erreur lors de la suppression du template');
      }
    };

    const closeTemplateModal = () => {
      showTemplateModal.value = false;
      editingTemplate.value = null;
      templateForm.value = {
        name: '',
        infractionType: 'SPAM',
        actionType: 'WARN',
        duration: 0,
        reason: '',
        active: true,
      };
    };

    const loadModerators = async () => {
      loadingModerators.value = true;
      try {
        console.log('[loadModerators] Chargement des modérateurs pour guild:', guildId);
        const response = await api.getGuildModerators(guildId);
        console.log('[loadModerators] Réponse reçue:', response.data);
        moderators.value = response.data.moderators || [];
        console.log('[loadModerators] Modérateurs chargés:', moderators.value.length);
        console.log('[loadModerators] Premier modérateur exemple:', moderators.value[0]);
        console.log('[loadModerators] Admins:', adminModerators.value.length, adminModerators.value);
        console.log('[loadModerators] Modérateurs réguliers:', regularModerators.value.length, regularModerators.value);
        
        // Si le bot n'est pas prêt, afficher un message
        if (response.data.message) {
          notification.info(response.data.message);
        }
      } catch (error) {
        console.error('Erreur chargement modérateurs:', error);
        if (error.response?.status === 401) {
          notification.error('Vous devez être connecté pour voir les modérateurs');
        } else {
          notification.error('Erreur lors du chargement des modérateurs');
        }
      } finally {
        loadingModerators.value = false;
      }
    };

    const removeModerator = async (bindingId) => {
      const confirmed = await confirm.show({
        title: 'Retirer le modérateur',
        message: 'Êtes-vous sûr de vouloir retirer ce modérateur ?',
        confirmText: 'Retirer',
        cancelText: 'Annuler',
        type: 'warning'
      });

      if (!confirmed) return;

      try {
        await api.removeModerator(guildId, bindingId);
        await loadModerators();
        notification.success('Modérateur retiré avec succès');
      } catch (error) {
        console.error('Erreur retrait modérateur:', error);
        notification.error('Erreur lors du retrait du modérateur');
      }
    };

    const loadSanctions = async () => {
      loadingSanctions.value = true;
      try {
        const params = {};
        if (logFilters.value.type) params.infractionType = logFilters.value.type;
        if (logFilters.value.action) params.actionType = logFilters.value.action;
        
        const response = await api.getGuildSanctions(guildId, params);
        sanctions.value = response.data.sanctions || [];
      } catch (error) {
        console.error('Erreur chargement sanctions:', error);
      } finally {
        loadingSanctions.value = false;
      }
    };

    // Gestion des types d'infractions
    const loadInfractionTypes = async () => {
      loadingInfractionTypes.value = true;
      try {
        const response = await api.getInfractionTypes(guildId);
        infractionTypes.value = response.data.types || [];
      } catch (error) {
        console.error('Erreur chargement types infractions:', error);
        notification.error('Erreur lors du chargement des types d\'infractions');
      } finally {
        loadingInfractionTypes.value = false;
      }
    };

    const editInfractionType = (type) => {
      editingInfractionType.value = type;
      if (type) {
        // Modification d'un type existant
        infractionTypeForm.value = {
          key: type.key,
          label: type.label,
          icon: type.icon,
          description: type.description,
          enabled: type.enabled,
          requiresCustomReason: type.requiresCustomReason || false,
        };
      } else {
        // Création d'un nouveau type
        infractionTypeForm.value = {
          key: '',
          label: '',
          icon: '⚠️',
          description: '',
          enabled: true,
          requiresCustomReason: false,
        };
      }
      showInfractionTypeModal.value = true;
    };

    const saveInfractionType = async () => {
      if (!infractionTypeForm.value.key || !infractionTypeForm.value.label) {
        notification.error('La clé et le libellé sont obligatoires');
        return;
      }

      // Validation de la clé (seulement minuscules et tirets)
      if (!/^[a-z-]+$/.test(infractionTypeForm.value.key)) {
        notification.error('La clé ne peut contenir que des lettres minuscules et des tirets');
        return;
      }

      savingInfractionType.value = true;
      try {
        if (editingInfractionType.value) {
          // Modification d'un type existant
          await api.updateInfractionType(guildId, editingInfractionType.value._id, {
            label: infractionTypeForm.value.label,
            icon: infractionTypeForm.value.icon,
            description: infractionTypeForm.value.description,
            enabled: infractionTypeForm.value.enabled,
          });
          notification.success('Type d\'infraction modifié');
        } else {
          // Création d'un nouveau type
          await api.createInfractionType(guildId, {
            key: infractionTypeForm.value.key,
            label: infractionTypeForm.value.label,
            icon: infractionTypeForm.value.icon,
            description: infractionTypeForm.value.description,
            enabled: infractionTypeForm.value.enabled,
          });
          notification.success('Type d\'infraction créé');
        }

        // Recharger les types
        await loadInfractionTypes();
        closeInfractionTypeModal();
      } catch (error) {
        console.error('Erreur sauvegarde type:', error);
        if (error.response?.data?.message) {
          notification.error(error.response.data.message);
        } else {
          notification.error('Erreur lors de la sauvegarde');
        }
      } finally {
        savingInfractionType.value = false;
      }
    };

    const deleteInfractionTypeConfirm = async (typeId) => {
      const confirmed = await confirm.show({
        title: 'Supprimer le type',
        message: 'Êtes-vous sûr de vouloir supprimer ce type d\'infraction personnalisé ?',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        type: 'danger'
      });

      if (!confirmed) return;

      try {
        await api.deleteInfractionType(guildId, typeId);
        await loadInfractionTypes();
        notification.success('Type d\'infraction supprimé');
      } catch (error) {
        console.error('Erreur suppression type:', error);
        if (error.response?.data?.message) {
          notification.error(error.response.data.message);
        } else {
          notification.error('Erreur lors de la suppression');
        }
      }
    };

    const closeInfractionTypeModal = () => {
      showInfractionTypeModal.value = false;
      editingInfractionType.value = null;
      infractionTypeForm.value = {
        key: '',
        label: '',
        icon: '',
        description: '',
        enabled: true,
      };
    };

    const revokeSanction = async (sanctionId) => {
      const confirmed = await confirm.show({
        title: 'Révoquer la sanction',
        message: 'Êtes-vous sûr de vouloir révoquer cette sanction ?',
        confirmText: 'Révoquer',
        cancelText: 'Annuler',
        type: 'info'
      });

      if (!confirmed) return;

      try {
        // Récupérer l'utilisateur connecté
        const authStore = useAuthStore();
        const currentUser = authStore.user;
        
        if (!currentUser || !currentUser.discordId) {
          notification.error('Impossible de récupérer votre ID Discord');
          return;
        }

        await api.revokeSanction(guildId, sanctionId, currentUser.discordId);
        
        if (activeTab.value === 'logs') {
          await loadSanctions();
        } else if (activeTab.value === 'search' && searchedUser.value) {
          await searchUser();
        }
        notification.success('Sanction révoquée avec succès');
      } catch (error) {
        console.error('Erreur révocation sanction:', error);
        notification.error('Erreur lors de la révocation');
      }
    };

    const searchUser = async () => {
      if (!searchUserId.value.trim()) {
        notification.error('Veuillez entrer un ID Discord valide');
        return;
      }

      searchLoading.value = true;
      searchAttempted.value = true;
      searchedUser.value = null;
      userSanctions.value = [];
      userGlobalSanctions.value = 0;
      userTrustFactor.value = null;

      try {
        // Fetch user info from Discord
        const userResponse = await api.getGuildMember(guildId, searchUserId.value.trim());
        
        if (!userResponse.data || !userResponse.data.member) {
          throw new Error('Membre non trouvé');
        }

        searchedUser.value = userResponse.data.member;

        // Fetch user sanctions for this guild
        try {
          const sanctionsResponse = await api.getUserSanctions(guildId, searchUserId.value.trim());
          userSanctions.value = sanctionsResponse.data.sanctions || [];
        } catch (err) {
          console.warn('Erreur chargement sanctions:', err);
          userSanctions.value = [];
        }

        // Fetch global sanctions count (all guilds)
        try {
          const globalResponse = await api.getUserGlobalSanctions(searchUserId.value.trim());
          userGlobalSanctions.value = globalResponse.data.totalSanctions || 0;
          userTrustFactor.value = globalResponse.data.trustFactor || null;
        } catch (err) {
          console.warn('Erreur chargement sanctions globales:', err);
          userGlobalSanctions.value = 0;
          userTrustFactor.value = null;
        }

        notification.success('Utilisateur trouvé !');
      } catch (error) {
        console.error('Erreur recherche utilisateur:', error);
        searchedUser.value = null;
        userSanctions.value = [];
        userGlobalSanctions.value = 0;
        notification.error(error.response?.data?.message || 'Utilisateur non trouvé dans ce serveur');
      } finally {
        searchLoading.value = false;
      }
    };

    const openApplySanctionModal = () => {
      const firstType = infractionTypes.value.length > 0 ? infractionTypes.value[0].key : 'spam';
      applySanctionForm.value = {
        infractionType: firstType,
        action: '',
        reason: '',
        days: 0,
        hours: 0,
        minutes: 0,
      };
      targetUserId.value = searchedUser.value?.id || null;
      targetUserName.value = searchedUser.value?.globalName || searchedUser.value?.username || null;
      showApplySanctionModal.value = true;
    };

    const openApplySanctionModalForUser = (userId, userName = null) => {
      const firstType = infractionTypes.value.length > 0 ? infractionTypes.value[0].key : 'spam';
      applySanctionForm.value = {
        infractionType: firstType,
        action: '',
        reason: '',
        days: 0,
        hours: 0,
        minutes: 0,
      };
      targetUserId.value = userId;
      targetUserName.value = userName;
      showApplySanctionModal.value = true;
    };

    const closeApplySanctionModal = () => {
      showApplySanctionModal.value = false;
    };

    const applySanction = async () => {
      const userId = targetUserId.value || searchedUser.value?.id;
      if (!userId) {
        notification.error('Aucun utilisateur sélectionné');
        return;
      }

      applyingSanction.value = true;
      try {
        // Récupérer l'utilisateur connecté depuis le store auth
        const authStore = useAuthStore();
        const currentUser = authStore.user;
        
        if (!currentUser || !currentUser.discordId) {
          notification.error('Impossible de récupérer votre ID Discord');
          return;
        }

        const payload = {
          userId: userId,
          moderatorId: currentUser.discordId,
          infractionType: applySanctionForm.value.infractionType,
        };

        // Ajouter la raison seulement si elle est fournie
        if (applySanctionForm.value.reason && applySanctionForm.value.reason.trim()) {
          payload.reason = applySanctionForm.value.reason;
        }

        // Si une action est spécifiée, l'envoyer (sinon escalade automatique)
        if (applySanctionForm.value.action) {
          payload.overrideAction = applySanctionForm.value.action;
          
          // Calculer la durée en millisecondes depuis jours/heures/minutes
          const days = applySanctionForm.value.days || 0;
          const hours = applySanctionForm.value.hours || 0;
          const minutes = applySanctionForm.value.minutes || 0;
          const totalMs = (days * 24 * 60 * 60 * 1000) + (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);
          
          if (totalMs > 0) {
            payload.overrideDuration = totalMs;
          }
        }

        await api.applySanction(guildId, payload);

        notification.success('Sanction appliquée avec succès');
        closeApplySanctionModal();
        
        // Refresh si on est dans la recherche
        if (searchedUser.value?.id === userId) {
          await searchUser();
        }
        // Refresh si on est dans les logs
        if (activeTab.value === 'logs') {
          await loadSanctions();
        }
      } catch (error) {
        console.error('Erreur application sanction:', error);
        notification.error('Erreur lors de l\'application de la sanction');
      } finally {
        applyingSanction.value = false;
      }
    };

    const getTrustIcon = (level) => {
      const icons = {
        'excellent': '✅',
        'bon': '👍',
        'moyen': '⚠️',
        'faible': '⛔',
        'très faible': '🚫',
      };
      return icons[level] || '❓';
    };

    // Escalation Rules
    const addEscalationRule = () => {
      if (!config.value.escalationRules) {
        config.value.escalationRules = [];
      }
      const firstType = infractionTypes.value.length > 0 ? infractionTypes.value[0].key : 'spam';
      config.value.escalationRules.push({
        infractionType: firstType,
        levels: [
          { level: 1, action: 'warn', days: 0, hours: 0, minutes: 0 }
        ]
      });
    };

    const removeEscalationRule = (rIndex) => {
      config.value.escalationRules.splice(rIndex, 1);
    };

    const addEscalationLevel = (rIndex) => {
      const rule = config.value.escalationRules[rIndex];
      const nextLevel = rule.levels.length + 1;
      rule.levels.push({
        level: nextLevel,
        action: 'warn',
        days: 0,
        hours: 0,
        minutes: 0
      });
    };

    const removeEscalationLevel = (rIndex, lIndex) => {
      config.value.escalationRules[rIndex].levels.splice(lIndex, 1);
    };

    const saveEscalationRules = async () => {
      savingConfig.value = true;
      try {
        // Convertir les durées en millisecondes avant envoi
        const rulesForApi = config.value.escalationRules.map(rule => ({
          infractionType: rule.infractionType,
          levels: rule.levels.map(level => {
            let durationMs = null;
            
            // Warn et Kick n'ont pas de durée
            if (level.action !== 'warn' && level.action !== 'kick') {
              const days = level.days || 0;
              const hours = level.hours || 0;
              const minutes = level.minutes || 0;
              
              const totalMs = (days * 24 * 60 * 60 * 1000) + (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);
              durationMs = totalMs > 0 ? totalMs : null;
            }
            
            return {
              level: level.level,
              action: level.action,
              durationMs
            };
          })
        }));

        await api.updateGuildConfig(guildId, {
          escalationRules: rulesForApi
        });
        notification.success('Règles d\'escalation sauvegardées');
      } catch (error) {
        console.error('Erreur sauvegarde escalation:', error);
        notification.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
      } finally {
        savingConfig.value = false;
      }
    };

    // Permissions
    const permissions = ref([]);
    const loadingPermissions = ref(false);
    const showAddPermissionModal = ref(false);
    const addPermissionForm = ref({
      userId: '',
      role: 'GUILD_MODERATOR',
    });
    const addingPermission = ref(false);

    const loadPermissions = async () => {
      loadingPermissions.value = true;
      try {
        const response = await api.getGuildPermissions(guildId);
        permissions.value = response.data.permissions || [];
      } catch (error) {
        console.error('Erreur chargement permissions:', error);
      } finally {
        loadingPermissions.value = false;
      }
    };

    const addPermission = async () => {
      addingPermission.value = true;
      try {
        await api.addGuildPermission(guildId, addPermissionForm.value);
        notification.success('Permission ajoutée');
        showAddPermissionModal.value = false;
        addPermissionForm.value = { userId: '', role: 'GUILD_MODERATOR' };
        await loadPermissions();
      } catch (error) {
        console.error('Erreur ajout permission:', error);
        const errorMessage = error.response?.data?.message || 'Erreur lors de l\'ajout de la permission';
        notification.error(errorMessage);
      } finally {
        addingPermission.value = false;
      }
    };

    const removePermission = async (permissionId) => {
      const confirmed = await confirm.show({
        title: 'Retirer la permission',
        message: 'Êtes-vous sûr de vouloir retirer cette permission ?',
        confirmText: 'Retirer',
        cancelText: 'Annuler',
        type: 'warning'
      });
      if (!confirmed) return;

      try {
        await api.deleteGuildPermission(guildId, permissionId);
        notification.success('Permission retirée');
        await loadPermissions();
      } catch (error) {
        console.error('Erreur retrait permission:', error);
        notification.error('Erreur lors du retrait de la permission');
      }
    };

    // Statistics
    const loadingStats = ref(false);
    const totalInfractions = ref(0);
    const uniqueOffenders = ref(0);
    const mostCommonInfraction = ref('N/A');
    const infractionStats = ref([]);
    const topOffenders = ref([]);

    const loadStats = async () => {
      loadingStats.value = true;
      try {
        const response = await api.getGuildStats(guildId);
        const stats = response.data;
        
        totalInfractions.value = stats.totalInfractions || 0;
        uniqueOffenders.value = stats.uniqueOffenders || 0;
        mostCommonInfraction.value = stats.mostCommonInfraction || 'N/A';
        infractionStats.value = stats.infractionBreakdown || [];
        topOffenders.value = stats.topOffenders || [];
      } catch (error) {
        console.error('Erreur chargement stats:', error);
      } finally {
        loadingStats.value = false;
      }
    };

    const formatDuration = (seconds) => {
      if (!seconds || seconds === 0) return 'Permanent';
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      if (hours > 0) return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
      return `${minutes}m`;
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleString('fr-FR');
    };

    const inviteBot = async () => {
      try {
        const response = await api.getBotInviteUrl(guildId);
        if (response.data.success) {
          window.open(response.data.inviteUrl, '_blank');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'URL d\'invitation:', error);
      }
    };

    // Modules - Server Functions
    const loadServerModules = async () => {
      loadingServerModules.value = true;
      try {
        // Récupérer tous les modules créés
        const modulesResponse = await api.getModules();
        const allModules = modulesResponse.data;
        
        // Charger l'état d'activation pour ce serveur
        const statesResponse = await api.getModuleStatesForGuild(guildId);
        const moduleStates = statesResponse.data;
        
        // Filtrer les modules selon allowedGuilds ET le statut enabled
        const accessibleModules = allModules.filter(module => {
          // Cacher les modules désactivés
          if (!module.enabled) {
            return false;
          }
          
          // Si allowedGuilds est vide ou n'existe pas, le module est accessible à tous
          if (!module.allowedGuilds || module.allowedGuilds.length === 0) {
            return true;
          }
          // Sinon, vérifier si ce serveur est dans la liste
          return module.allowedGuilds.includes(guildId);
        });
        
        serverModules.value = accessibleModules.map(module => ({
          ...module,
          id: module._id,
          enabledForGuild: moduleStates[module._id] !== undefined ? moduleStates[module._id] : module.enabled,
          showFiles: false, // Pour l'accordeon
        }));
      } catch (error) {
        console.error('Erreur chargement modules serveur:', error);
        notification.error('Erreur lors du chargement des modules');
      } finally {
        loadingServerModules.value = false;
      }
    };

    const toggleServerModule = async (module) => {
      try {
        await api.toggleModuleForGuild(module.id, guildId, module.enabledForGuild);
        
        notification.success(
          module.enabledForGuild 
            ? `Module "${module.name}" activé` 
            : `Module "${module.name}" désactivé`
        );
      } catch (error) {
        console.error('Erreur toggle module:', error);
        notification.error('Erreur lors de la modification du module');
        module.enabledForGuild = !module.enabledForGuild; // Rollback
      }
    };

    const viewModuleDetails = (module) => {
      const details = [
        `Nom: ${module.name}`,
        `Version: ${module.version || '1.0.0'}`,
        `Auteur: ${module.author || 'Master'}`,
        `Fichiers: ${module.files?.length || 0}`,
        `Statut: ${module.enabledForGuild ? 'Actif' : 'Inactif'}`,
        `Description: ${module.description}`,
      ].join('\n');
      
      notification.info(details);
    };

    // File handling functions
    const getFileIcon = (filename) => {
      const ext = filename.split('.').pop().toLowerCase();
      const icons = {
        js: '🟨',
        json: '🟦',
        txt: '📄',
        md: '📖',
      };
      return icons[ext] || '📄';
    };

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const handleFileUpload = (event) => {
      const files = Array.from(event.target.files);
      const maxSize = 5 * 1024 * 1024; // 5MB max par fichier
      
      const validFiles = files.filter(file => {
        if (file.size > maxSize) {
          notification.error(`Fichier "${file.name}" trop volumineux (max 5MB)`);
          return false;
        }
        return true;
      });

      // Lire les fichiers et les stocker
      Promise.all(validFiles.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              name: file.name,
              size: file.size,
              content: e.target.result,
              type: file.type,
            });
          };
          reader.readAsText(file);
        });
      })).then(fileData => {
        if (!moduleForm.value.files) {
          moduleForm.value.files = [];
        }
        moduleForm.value.files.push(...fileData);
        notification.success(`${fileData.length} fichier(s) ajouté(s)`);
      });

      // Réinitialiser l'input
      event.target.value = '';
    };

    const removeFile = (index) => {
      const fileName = moduleForm.value.files[index].name;
      moduleForm.value.files.splice(index, 1);
      notification.info(`Fichier "${fileName}" supprimé`);
    };

    // Master - Bot Control Functions
    const toggleBot = async () => {
      try {
        savingConfig.value = true;
        await api.updateGuildConfig(guildId, { enabled: config.value.enabled });
        notification.success(config.value.enabled ? 'Bot activé' : 'Bot désactivé');
      } catch (error) {
        console.error('Erreur toggle bot:', error);
        notification.error('Erreur lors de la modification du statut');
        config.value.enabled = !config.value.enabled; // Rollback
      } finally {
        savingConfig.value = false;
      }
    };

    const toggleMaintenance = () => {
      notification.info(maintenanceMode.value ? 'Mode maintenance activé' : 'Mode maintenance désactivé');
    };

    const syncGuild = async () => {
      try {
        notification.info('Synchronisation du serveur...');
        await loadGuildConfig();
        await loadGuildData();
        notification.success('Serveur synchronisé');
      } catch (error) {
        notification.error('Erreur lors de la synchronisation');
      }
    };

    const testBot = () => {
      notification.info('Test du bot - Fonctionnalité à implémenter');
    };

    // Master - Modules Functions
    const loadModules = async () => {
      loadingModules.value = true;
      try {
        const response = await api.getModules();
        customModules.value = response.data.map(module => ({
          ...module,
          id: module._id, // MongoDB _id
        }));
      } catch (error) {
        console.error('Erreur chargement modules:', error);
        notification.error('Erreur lors du chargement des modules');
      } finally {
        loadingModules.value = false;
      }
    };

    const toggleModule = async (module) => {
      const newState = !module.enabled;
      try {
        await api.updateModule(module.id, { enabled: newState });
        module.enabled = newState; // Update local state
        
        if (!newState) {
          // Si le module est désactivé, le désactiver sur tous les serveurs
          notification.info(`Désactivation du module sur tous les serveurs...`);
        }
        
        notification.success(`Module ${module.name} ${newState ? 'activé' : 'désactivé'}`);
      } catch (error) {
        console.error('Erreur toggle module:', error);
        notification.error('Erreur lors de la modification');
      }
    };

    const toggleDropdown = (moduleId) => {
      if (activeDropdown.value === moduleId) {
        activeDropdown.value = null;
      } else {
        activeDropdown.value = moduleId;
      }
    };

    const editModule = (module) => {
      editingModule.value = module;
      moduleForm.value = { ...module };
      showModuleModal.value = true;
    };

    const deleteModule = async (moduleId) => {
      const confirmed = await confirm.show({
        title: 'Supprimer ce module ?',
        message: 'Cette action supprimera le module pour tous les serveurs.',
        type: 'danger',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
      });
      if (confirmed) {
        try {
          await api.deleteModule(moduleId);
          customModules.value = customModules.value.filter(m => m.id !== moduleId);
          notification.success('Module supprimé');
        } catch (error) {
          console.error('Erreur suppression module:', error);
          notification.error('Erreur lors de la suppression');
        }
      }
    };

    const deployModule = async (module) => {
      try {
        notification.info('Déploiement du module...');
        
        await api.deployModule(module.id);
        
        // Recharger le module pour obtenir deployedAt
        await loadModules();
        
        notification.success(`Module "${module.name}" déployé avec succès !`);
      } catch (error) {
        console.error('Erreur déploiement:', error);
        const errorMessage = error.response?.data?.details || error.response?.data?.error || 'Erreur lors du déploiement du module';
        notification.error(errorMessage);
      }
    };

    const manageAccess = async (module) => {
      try {
        selectedModuleForAccess.value = module;
        showAccessModal.value = true;
        loadingGuildAccess.value = true;

        // Récupérer les serveurs de l'utilisateur
        const guildsResponse = await api.getSimpleGuildsList();
        userGuilds.value = guildsResponse.data;

        // Récupérer les serveurs ayant accès au module
        const accessResponse = await api.getModuleAccess(module.id);
        moduleAllowedGuilds.value = accessResponse.data.allowedGuilds || [];

        loadingGuildAccess.value = false;
      } catch (error) {
        console.error('Erreur chargement accès:', error);
        notification.error('Erreur lors du chargement des accès');
        loadingGuildAccess.value = false;
      }
    };

    const toggleGuildAccess = async (guildId, hasAccess) => {
      try {
        await api.toggleModuleAccessForGuild(selectedModuleForAccess.value.id, guildId, hasAccess);
        
        if (hasAccess) {
          if (!moduleAllowedGuilds.value.includes(guildId)) {
            moduleAllowedGuilds.value.push(guildId);
          }
        } else {
          moduleAllowedGuilds.value = moduleAllowedGuilds.value.filter(id => id !== guildId);
        }

        notification.success(hasAccess ? 'Accès accordé' : 'Accès retiré');
      } catch (error) {
        console.error('Erreur toggle accès:', error);
        notification.error('Erreur lors de la modification de l\'accès');
      }
    };

    const toggleAllAccessMode = async () => {
      if (isAllAccessMode.value) {
        // Passer en mode restreint (vider la liste = accès total)
        // On va ajouter le serveur actuel
        if (!moduleAllowedGuilds.value.includes(guildId)) {
          await toggleGuildAccess(guildId, true);
        }
      } else {
        // Passer en mode accès total
        const confirmed = await confirm.show({
          title: 'Accès total ?',
          message: 'Tous les serveurs auront accès à ce module. Continuer ?',
          type: 'warning',
          confirmText: 'Confirmer',
          cancelText: 'Annuler',
        });

        if (confirmed) {
          // Retirer tous les serveurs (liste vide = tous ont accès)
          for (const guild of [...moduleAllowedGuilds.value]) {
            await toggleGuildAccess(guild, false);
          }
        }
      }
    };

    const closeAccessModal = () => {
      showAccessModal.value = false;
      selectedModuleForAccess.value = null;
      moduleAllowedGuilds.value = [];
      userGuilds.value = [];
    };

    const saveModule = async () => {
      try {
        if (editingModule.value) {
          // Mise à jour
          await api.updateModule(editingModule.value.id, moduleForm.value);
          const index = customModules.value.findIndex(m => m.id === editingModule.value.id);
          customModules.value[index] = { ...moduleForm.value, id: editingModule.value.id };
          notification.success('Module modifié');
        } else {
          // Création
          const response = await api.createModule(moduleForm.value);
          customModules.value.push({
            ...response.data,
            id: response.data._id,
          });
          notification.success('Module créé');
        }
        closeModuleModal();
      } catch (error) {
        console.error('Erreur sauvegarde module:', error);
        notification.error('Erreur lors de la sauvegarde');
      }
    };

    const closeModuleModal = () => {
      showModuleModal.value = false;
      editingModule.value = null;
      moduleForm.value = {
        name: '',
        description: '',
        icon: '📦',
        version: '1.0.0',
        enabled: true,
        files: [],
        config: {},
      };
    };

    const exportConfig = () => {
      const exportData = {
        config: config.value,
        templates: templates.value,
        modules: customModules.value,
        exportedAt: new Date().toISOString(),
      };
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `config_${guildId}_${Date.now()}.json`;
      link.click();
      notification.success('Configuration exportée');
    };

    const resetAllCounters = async () => {
      const confirmed = await confirm.show({
        title: 'Réinitialiser tous les compteurs ?',
        message: 'Tous les compteurs d\'infractions seront remis à zéro.',
        type: 'warning',
        confirmText: 'Réinitialiser',
        cancelText: 'Annuler',
      });
      if (confirmed) {
        notification.info('Fonctionnalité à implémenter');
      }
    };

    const dangerZone = async () => {
      notification.warning('Zone dangereuse - Fonctionnalités administratives avancées');
    };

    // Fonction pour fermer le dropdown
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown')) {
        activeDropdown.value = null;
      }
    };

    // Cleanup
    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside);
    });

    // Charger les modules au montage si onglet admin
    watch(activeTab, (newTab) => {
      if (newTab === 'templates') {
        loadTemplates();
      } else if (newTab === 'moderators') {
        loadModerators();
      } else if (newTab === 'logs') {
        loadSanctions();
      } else if (newTab === 'escalation' && !config.value.escalationRules) {
        config.value.escalationRules = [];
      } else if (newTab === 'permissions') {
        loadPermissions();
      } else if (newTab === 'stats') {
        loadStats();
      } else if (newTab === 'modules') {
        loadServerModules();
      } else if (newTab === 'master' && isMaster.value) {
        loadModules();
      }
    });

    return {
      isMaster,
      activeTab,
      guildData,
      config,
      savingConfig,
      saveConfig,
      loadingDiscordData,
      getRoleName,
      getChannelName,
      textChannels,
      availableRoles,
      showChannelModal,
      showMuteRoleModal,
      showModerationRolesModal,
      tempLogChannelId,
      tempMuteRoleId,
      tempModerationRoles,
      saveLogChannel,
      saveMuteRole,
      saveModerationRoles,
      templates,
      loadingTemplates,
      showTemplateModal,
      editingTemplate,
      savingTemplate,
      templateForm,
      saveTemplate,
      editTemplate,
      deleteTemplateConfirm,
      closeTemplateModal,
      moderators,
      adminModerators,
      regularModerators,
      loadingModerators,
      removeModerator,
      sanctions,
      loadingSanctions,
      logFilters,
      loadSanctions,
      revokeSanction,
      infractionTypes,
      loadingInfractionTypes,
      showInfractionTypeModal,
      editingInfractionType,
      savingInfractionType,
      infractionTypeForm,
      editInfractionType,
      saveInfractionType,
      deleteInfractionTypeConfirm,
      closeInfractionTypeModal,
      searchUserId,
      searchedUser,
      userSanctions,
      userGlobalSanctions,
      userTrustFactor,
      searchLoading,
      searchAttempted,
      searchUser,
      showApplySanctionModal,
      targetUserId,
      targetUserName,
      applySanctionForm,
      applyingSanction,
      selectedInfractionType,
      openApplySanctionModal,
      openApplySanctionModalForUser,
      closeApplySanctionModal,
      applySanction,
      getTrustIcon,
      formatDuration,
      formatDate,
      // Escalation
      addEscalationRule,
      removeEscalationRule,
      addEscalationLevel,
      removeEscalationLevel,
      saveEscalationRules,
      // Permissions
      permissions,
      loadingPermissions,
      showAddPermissionModal,
      addPermissionForm,
      addingPermission,
      addPermission,
      removePermission,
      // Statistics
      loadingStats,
      totalInfractions,
      uniqueOffenders,
      mostCommonInfraction,
      infractionStats,
      topOffenders,
      inviteBot,
      isSetupMode,
      // Modules - Server
      serverModules,
      loadingServerModules,
      toggleServerModule,
      viewModuleDetails,
      getFileIcon,
      formatFileSize,
      // Master - Bot Control
      maintenanceMode,
      toggleBot,
      toggleMaintenance,
      syncGuild,
      testBot,
      // Master - Modules
      customModules,
      loadingModules,
      showModuleModal,
      editingModule,
      activeDropdown,
      moduleForm,
      toggleModule,
      toggleDropdown,
      editModule,
      deleteModule,
      saveModule,
      closeModuleModal,
      handleFileUpload,
      removeFile,
      deployModule,
      manageAccess,
      showAccessModal,
      selectedModuleForAccess,
      moduleAllowedGuilds,
      loadingGuildAccess,
      userGuilds,
      isAllAccessMode,
      toggleGuildAccess,
      toggleAllAccessMode,
      closeAccessModal,
      exportConfig,
      showImportModal,
      resetAllCounters,
      dangerZone,
    };
  },
};
</script>

<style scoped lang="scss">
.guild-panel {
  display: flex;
  height: calc(100vh - 73px);
  overflow: hidden;
}

// Sidebar
.sidebar {
  width: 280px;
  background: linear-gradient(180deg, var(--bg-secondary) 0%, rgba(var(--bg-secondary-rgb, 255, 255, 255), 0.98) 100%);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex-shrink: 0;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.03);

  .dark & {
    background: linear-gradient(180deg, #2d3748 0%, rgba(45, 55, 72, 0.98) 100%);
    box-shadow: 2px 0 12px rgba(0, 0, 0, 0.2);
  }

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 3px;

    &:hover {
      background: var(--text-tertiary);
    }
  }
}

.sidebar-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.5);

  .dark & {
    background: rgba(45, 55, 72, 0.5);
  }

  .guild-icon,
  .guild-icon-placeholder {
    width: 50px;
    height: 50px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    overflow: hidden;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .guild-info {
    flex: 1;
    min-width: 0;

    h2 {
      margin: 0 0 0.4rem 0;
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      letter-spacing: -0.3px;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.65rem;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.3px;

      &.active {
        background: rgba(72, 187, 120, 0.15);
        color: var(--success);
        border: 1px solid rgba(72, 187, 120, 0.3);
        
        &::before {
          content: '●';
          animation: pulse 2s ease-in-out infinite;
        }
      }

      &.inactive {
        background: rgba(160, 160, 160, 0.1);
        color: var(--text-tertiary);
        border: 1px solid rgba(160, 160, 160, 0.2);
      }
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.sidebar-nav {
  padding: 1rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-section-title {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: var(--text-muted);
  padding: 1rem 1rem 0.5rem 1rem;
  margin-top: 1.25rem;
  margin-bottom: 0.25rem;
  position: relative;
  
  &:first-child {
    margin-top: 0;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 1rem;
    right: 1rem;
    height: 2px;
    background: linear-gradient(90deg, var(--accent) 0%, transparent 100%);
    opacity: 0.3;
  }
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  margin: 0.15rem 0;
  background: transparent;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--text-secondary);
  font-weight: 500;
  font-size: 0.925rem;
  text-align: left;
  width: 100%;
  position: relative;

  .nav-icon {
    font-size: 1.2rem;
    width: 24px;
    text-align: center;
    flex-shrink: 0;
    transition: transform 0.25s;
  }

  .nav-label {
    flex: 1;
  }

  &:hover {
    background: rgba(102, 126, 234, 0.08);
    color: var(--text-primary);
    transform: translateX(2px);
    
    .nav-icon {
      transform: scale(1.1);
    }
  }

  &.active {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.12) 100%);
    color: var(--accent);
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
    
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 60%;
      background: linear-gradient(180deg, var(--accent) 0%, #764ba2 100%);
      border-radius: 0 3px 3px 0;
    }
  }
}

// Panel Content
.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  background: var(--bg-primary);

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 4px;

    &:hover {
      background: var(--text-tertiary);
    }
  }
}

.bot-missing-banner {
  background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  box-shadow: 0 4px 12px rgba(229, 62, 62, 0.4);
  animation: slideDown 0.5s ease-out, pulse 2s infinite;

  .banner-icon {
    font-size: 3rem;
  }

  .banner-text {
    flex: 1;

    h3 {
      color: white;
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
      font-weight: 700;
    }

    p {
      color: rgba(255, 255, 255, 0.95);
      margin: 0;
      font-size: 1rem;
    }
  }

  .btn {
    background: white;
    color: #e53e3e;
    font-weight: 700;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
  }
}

.setup-banner {
  background: linear-gradient(135deg, #4CAF50 0%, #2196F3 100%);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
  animation: slideDown 0.5s ease-out;

  .setup-icon {
    font-size: 3rem;
  }

  .setup-text {
    flex: 1;

    h3 {
      color: white;
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
      font-weight: 700;
    }

    p {
      color: rgba(255, 255, 255, 0.95);
      margin: 0;
      font-size: 1rem;
    }
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h2 {
    margin: 0;
    color: var(--text-primary);
  }
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

/* Types d'infractions */
.infraction-types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.infraction-type-card {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  .type-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;

    .type-icon {
      font-size: 2rem;
      flex-shrink: 0;
    }

    .type-info {
      flex: 1;

      h3 {
        margin: 0 0 0.25rem 0;
        color: var(--text-primary);
        font-size: 1.1rem;
      }

      .type-key {
        font-size: 0.85rem;
        padding: 0.25rem 0.5rem;
        background: var(--bg-secondary);
        border-radius: 4px;
      }
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;

      &.active {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
      }

      &.inactive {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
      }
    }
  }

  .type-description {
    color: var(--text-secondary);
    margin-bottom: 1rem;
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .type-details {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: var(--bg-secondary);
    border-radius: 8px;

    .detail-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;

      .label {
        color: var(--text-tertiary);
      }

      .value {
        color: var(--text-primary);
        font-weight: 600;
      }
    }
  }

  .type-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }
}

.info-box {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(99, 102, 241, 0.05);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 12px;
  margin-top: 2rem;

  .info-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .info-content {
    flex: 1;

    h4 {
      margin: 0 0 0.5rem 0;
      color: var(--text-primary);
      font-size: 1rem;
    }

    p {
      margin: 0 0 0.5rem 0;
      color: var(--text-secondary);
      font-size: 0.9rem;
      line-height: 1.5;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

/* Sanctions directes - obsolète */
.sanctions-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: var(--bg-tertiary);
  border-radius: 12px;
  border: 1px solid var(--border-color);

  .form-group {
    margin-bottom: 1.5rem;

    label {
      display: block;
      margin-bottom: 0.5rem;
      color: var(--text-primary);
      font-weight: 600;
    }

    input, select, textarea {
      width: 100%;
      padding: 0.75rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      color: var(--text-primary);
      font-size: 1rem;
      transition: all 0.3s;

      &:focus {
        outline: none;
        border-color: var(--accent);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      }
    }

    small {
      display: block;
      margin-top: 0.5rem;
      color: var(--text-tertiary);
      font-size: 0.875rem;
    }
  }
}

.sanction-info {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 8px;
  margin-bottom: 2rem;

  .info-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .info-text {
    flex: 1;

    strong {
      display: block;
      margin-bottom: 0.5rem;
      color: var(--text-primary);
    }

    p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.9rem;
      line-height: 1.5;
    }
  }
}

.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 2rem;

  .btn-lg {
    padding: 1rem 3rem;
    font-size: 1.1rem;
  }
}

.recent-sanctions {
  margin-top: 3rem;
  padding: 2rem;
  background: var(--bg-tertiary);
  border-radius: 12px;
  border: 1px solid var(--border-color);

  h3 {
    margin: 0 0 1.5rem 0;
    color: var(--text-primary);
    font-size: 1.25rem;
  }
}

.sanctions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sanction-item-compact {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-color);

  .sanction-badges-compact {
    flex-shrink: 0;
  }

  .sanction-details-compact {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 200px;

    strong {
      color: var(--text-primary);
    }

    .text-muted {
      font-size: 0.875rem;
    }
  }

  .sanction-reason-compact {
    flex: 1;
    color: var(--text-secondary);
    font-size: 0.9rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.template-card {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  .template-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;

    h3 {
      color: var(--text-primary);
      font-size: 1.25rem;
      margin: 0;
    }
  }

  .template-description {
    color: var(--text-secondary);
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .template-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding: 1rem;
    background: var(--bg-secondary);
    border-radius: 8px;

    .detail-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;

      .label {
        color: var(--text-tertiary);
        font-weight: 500;
      }

      .value {
        color: var(--text-primary);
        font-weight: 600;
      }

      .status {
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-weight: 600;

        &.active {
          background: rgba(72, 187, 120, 0.1);
          color: var(--success);
        }

        &.inactive {
          background: rgba(160, 160, 160, 0.1);
          color: var(--text-tertiary);
        }
      }
    }
  }

  .template-actions {
    display: flex;
    gap: 0.5rem;
  }
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;

  &-spam {
    background: rgba(237, 137, 54, 0.1);
    color: var(--warning);
  }

  &-toxicity {
    background: rgba(245, 101, 101, 0.1);
    color: var(--danger);
  }

  &-advertising {
    background: rgba(66, 153, 225, 0.1);
    color: var(--info);
  }

  &-nsfw {
    background: rgba(159, 122, 234, 0.1);
    color: #9f7aea;
  }

  &-other {
    background: rgba(160, 160, 160, 0.1);
    color: var(--text-tertiary);
  }

  &-warn {
    background: rgba(237, 137, 54, 0.1);
    color: var(--warning);
  }

  &-mute {
    background: rgba(66, 153, 225, 0.1);
    color: var(--info);
  }

  &-kick {
    background: rgba(245, 101, 101, 0.1);
    color: var(--danger);
  }

  &-ban {
    background: rgba(139, 0, 0, 0.1);
    color: #8b0000;
  }

  &-admin {
    background: linear-gradient(135deg, var(--accent) 0%, #764ba2 100%);
    color: white;
  }

  &-moderator {
    background: rgba(66, 153, 225, 0.1);
    color: var(--info);
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
  }

  tbody tr {
    transition: background 0.2s;

    &:hover {
      background: var(--hover-bg);
    }
  }
}

.moderators-sections {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.moderator-section {
  .section-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 1.25rem 0;
    padding: 0.85rem 1rem;
    background: var(--bg-tertiary);
    border-radius: 10px;
    border-left: 3px solid var(--accent);
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .empty-section {
    padding: 2.5rem 2rem;
    text-align: center;
    background: var(--bg-secondary);
    border-radius: 12px;
    border: 2px dashed var(--border-color);

    p {
      margin: 0;
      font-size: 0.95rem;
      color: var(--text-secondary);
      font-weight: 500;
    }
  }
}

.moderators-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 1.5rem;
}

.moderator-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 1.75rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.15);
    border-color: var(--accent);
  }

  .moderator-header {
    display: flex;
    align-items: flex-start;
    gap: 1.25rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid var(--border-color);
  }

  .moderator-avatar-wrapper {
    position: relative;
    flex-shrink: 0;
  }

  .moderator-avatar,
  .moderator-avatar-placeholder {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid var(--bg-primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .moderator-avatar-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 700;
    font-size: 1.5rem;
  }

  .online-indicator {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 16px;
    height: 16px;
    background: var(--success);
    border: 3px solid var(--bg-secondary);
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(72, 187, 120, 0.4);
  }

  .moderator-main-info {
    flex: 1;
    min-width: 0;
  }

  .moderator-name {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 0.3rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .moderator-global-name {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 0.6rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
  }

  .moderator-id {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.75rem;
    color: var(--text-tertiary);
    font-family: 'Courier New', monospace;
    background: var(--bg-tertiary);
    padding: 0.4rem 0.7rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);

    svg {
      flex-shrink: 0;
      opacity: 0.7;
    }
  }

  .moderator-body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .moderator-info-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.875rem;
    padding: 0.65rem 0.85rem;
    background: var(--bg-tertiary);
    border-radius: 10px;

    .info-label {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      color: var(--text-secondary);
      font-weight: 600;

      svg {
        color: var(--accent);
        flex-shrink: 0;
      }
    }

    .info-value {
      color: var(--text-primary);
      font-weight: 700;
      font-size: 0.85rem;
    }
  }

  .moderator-roles {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin-top: 0.35rem;
  }

  .role-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.45rem 0.8rem;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    border: 1.5px solid;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
    }
  }
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  align-items: flex-end;

  .form-group {
    flex: 1;
    min-width: 200px;
    margin: 0;
  }
}

.sanctions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sanction-item {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;

  .sanction-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;

    .sanction-badges {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .sanction-date {
      color: var(--text-tertiary);
      font-size: 0.875rem;
    }
  }

  .sanction-details {
    margin-bottom: 1rem;

    p {
      margin: 0.25rem 0;
      color: var(--text-secondary);
      font-size: 0.9rem;

      strong {
        color: var(--text-primary);
      }
    }

    .sanction-user,
    .sanction-moderator {
      margin: 0.5rem 0;

      strong {
        display: block;
        color: var(--text-primary);
        margin-bottom: 0.25rem;
        font-size: 0.875rem;
      }

      .user-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem;
        background: var(--bg-secondary);
        border-radius: 6px;

        .username {
          color: var(--text-primary);
          font-weight: 600;
          font-size: 0.95rem;
        }

        .user-id {
          color: var(--text-tertiary);
          font-size: 0.8rem;
          font-family: 'Courier New', monospace;
          background: var(--bg-tertiary);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }
      }
    }
  }

  .sanction-actions {
    display: flex;
    gap: 0.5rem;
  }

  .revoked-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
    background: rgba(72, 187, 120, 0.05);
    border: 1px solid rgba(72, 187, 120, 0.2);
    border-radius: 6px;

    .revoked-badge {
      padding: 0.25rem 0.75rem;
      background: rgba(72, 187, 120, 0.1);
      color: var(--success);
      border-radius: 4px;
      font-size: 0.875rem;
      font-weight: 600;
      align-self: flex-start;
    }

    .text-muted {
      color: var(--text-tertiary);
      font-size: 0.875rem;
    }

    .revoked-by {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      font-size: 0.875rem;

      strong {
        color: var(--text-primary);
      }

      .user-id {
        font-size: 0.75rem;
        padding: 0.125rem 0.375rem;
      }
    }
  }
}

.badge-secondary {
  background: rgba(160, 160, 160, 0.1);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.badge-success {
  background: rgba(72, 187, 120, 0.1);
  color: #48bb78;
  border: 1px solid rgba(72, 187, 120, 0.3);
}

.badge-revoked {
  background: rgba(237, 137, 54, 0.1);
  color: #ed8936;
  border: 1px solid rgba(237, 137, 54, 0.3);
}

.badge-inactive {
  background: rgba(113, 128, 150, 0.1);
  color: #718096;
  border: 1px solid rgba(113, 128, 150, 0.3);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  animation: fadeIn 0.2s ease-out;
}

.modal-content {
  background: var(--bg-secondary);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  animation: dropdownSlide 0.2s ease-out;

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--border-color);

    h3 {
      margin: 0;
      color: var(--text-primary);
      font-size: 1.25rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 1.75rem;
      cursor: pointer;
      color: var(--text-secondary);
      line-height: 1;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: all 0.3s;

      &:hover {
        background: var(--hover-bg);
        color: var(--text-primary);
      }
    }
  }

  .modal-body {
    padding: 1.5rem;

    .text-muted {
      color: var(--text-secondary);
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
    }
  }

  .modal-footer {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    padding: 1.5rem;
    border-top: 1px solid var(--border-color);

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

      &.btn-primary {
        background: var(--accent);
        color: white;

        &:hover:not(:disabled) {
          background: var(--accent-hover);
          box-shadow: 0 4px 12px rgba(88, 101, 242, 0.3);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      &.btn-secondary {
        background: var(--bg-tertiary);
        color: var(--text-primary);

        &:hover {
          background: var(--border-color);
        }
      }
    }
  }

  .form-group {
    margin-bottom: 1.5rem;

    label {
      display: block;
      margin-bottom: 0.5rem;
      color: var(--text-primary);
      font-weight: 500;
      font-size: 0.95rem;
    }

    select,
    .form-control {
      width: 100%;
      padding: 0.75rem;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      color: var(--text-primary);
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        border-color: var(--accent);
      }

      &:focus {
        outline: none;
        border-color: var(--accent);
        box-shadow: 0 0 0 3px rgba(88, 101, 242, 0.1);
      }
    }
  }
}

.modal {
  background: var(--bg-secondary);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid var(--border-color);

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--border-color);

    h3 {
      margin: 0;
      color: var(--text-primary);
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 2rem;
      cursor: pointer;
      color: var(--text-secondary);
      line-height: 1;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.3s;

      &:hover {
        background: var(--hover-bg);
        color: var(--text-primary);
      }
    }
  }

  form {
    padding: 1.5rem;
  }

  .modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border-color);
  }

  .readonly-input {
    background: var(--bg-tertiary) !important;
    cursor: not-allowed;
    opacity: 0.7;
  }
}

.loading,
.empty-state {
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
  
  .spinner-small {
    width: 16px;
    height: 16px;
    border: 2px solid var(--border-color);
    border-top: 2px solid var(--accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  p {
    color: var(--text-secondary);
    font-weight: 500;
  }

  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  h3 {
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

// Config section
.config-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  transition: all 0.2s;

  &:hover {
    border-color: var(--accent);
    background: var(--bg-secondary);
  }

  .config-label {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    flex: 1;

    .config-icon {
      font-size: 1.5rem;
      min-width: 2rem;
      text-align: center;
    }

    h3 {
      margin: 0 0 0.25rem 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    p {
      margin: 0;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
  }

  .config-value {
    display: flex;
    align-items: center;
    gap: 1rem;

    .btn {
      padding: 0.625rem 1.25rem;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s;
      font-size: 0.9rem;
      white-space: nowrap;

      &:hover {
        transform: translateY(-1px);
      }

      &.btn-primary {
        background: var(--accent);
        color: white;
        box-shadow: 0 2px 4px rgba(88, 101, 242, 0.2);

        &:hover {
          background: var(--accent-hover);
          box-shadow: 0 4px 12px rgba(88, 101, 242, 0.3);
        }
      }

      &.btn-secondary {
        background: var(--accent);
        color: white;
        box-shadow: 0 2px 4px rgba(88, 101, 242, 0.2);

        &:hover {
          background: var(--accent-hover);
          box-shadow: 0 4px 12px rgba(88, 101, 242, 0.3);
        }
      }
    }
  }
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 52px;
  height: 28px;

  input {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .toggle-slider {
      background-color: var(--accent);
    }

    &:checked + .toggle-slider:before {
      transform: translateX(24px);
    }
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--border-color);
    transition: 0.3s;
    border-radius: 28px;

    &:before {
      position: absolute;
      content: "";
      height: 20px;
      width: 20px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }
  }
}

.toggle-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  min-width: 60px;
}

.config-select {
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--accent);
  }

  &:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(88, 101, 242, 0.1);
  }
}

.role-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
  padding: 0.5rem;
  background: var(--bg-secondary);
  border-radius: 8px;

  .role-checkbox {
    label {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: var(--accent);
        background: var(--bg-primary);
      }

      input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }

      .role-name {
        font-size: 0.875rem;
        color: var(--text-primary);
      }
    }
  }
}

small {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  .user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
  }

  .user-avatar-placeholder {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--accent);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 1rem;
  }

  .username {
    font-weight: 500;
    color: var(--text-primary);
  }
}

.role-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.badge-role {
  background: var(--accent);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

code {
  background: var(--bg-tertiary);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  color: var(--text-primary);
}

// Search User Styles
.search-section {
  margin-top: 1.5rem;
}

.search-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;

  .search-input {
    flex: 1;
    padding: 0.875rem 1.25rem;
    background: var(--bg-tertiary);
    border: 2px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 1rem;
    transition: all 0.3s;

    &:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    &::placeholder {
      color: var(--text-tertiary);
    }
  }
}

.user-result {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.user-info-card {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 2rem;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  position: relative;

  .user-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 3px solid var(--accent);
    flex-shrink: 0;
  }

  .user-avatar-placeholder {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: 700;
    color: white;
    flex-shrink: 0;
  }

  .user-details {
    flex: 1;

    h3 {
      margin: 0 0 0.5rem 0;
      color: var(--text-primary);
      font-size: 1.5rem;
    }

    .user-username {
      margin: 0.25rem 0;
      color: var(--text-secondary);
      font-size: 1rem;
    }

    .user-id {
      margin: 0.25rem 0;
      color: var(--text-tertiary);
      font-size: 0.875rem;
      font-family: monospace;
    }
  }

  .btn-apply-sanction {
    margin-left: auto;
    padding: 0.875rem 1.5rem;
    font-weight: 600;
    font-size: 1rem;
    white-space: nowrap;
    flex-shrink: 0;
  }
}

.user-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: 8px;

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;

    .stat-label {
      color: var(--text-tertiary);
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }

    .stat-value {
      color: var(--text-primary);
      font-size: 2rem;
      font-weight: 700;

      &.warning {
        color: var(--warning);
      }
    }
  }
}

.global-sanctions-widget {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.trust-factor-card {
  padding: 1.5rem;
  background: var(--bg-tertiary);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }

  .trust-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;

    .trust-label {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 1rem;
    }

    .trust-score {
      font-size: 1.75rem;
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
  }

  .trust-bar {
    width: 100%;
    height: 12px;
    background: var(--bg-secondary);
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 1rem;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);

    .trust-fill {
      height: 100%;
      transition: width 0.8s ease-out, background 0.3s;
      border-radius: 6px;
      box-shadow: 0 0 8px currentColor;
    }
  }

  .trust-level {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;
    font-weight: 600;
    font-size: 1rem;
    text-transform: capitalize;

    .trust-icon {
      font-size: 1.25rem;
    }
  }
}

.global-sanctions-alert {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: rgba(237, 137, 54, 0.1);
  border: 2px solid var(--warning);
  border-radius: 8px;
  animation: pulse 2s ease-in-out infinite;

  .alert-icon {
    font-size: 2rem;
    flex-shrink: 0;
  }

  .alert-content {
    flex: 1;

    strong {
      color: var(--warning);
      font-size: 1rem;
      display: block;
      margin-bottom: 0.5rem;
    }

    p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.9rem;

      strong {
        display: inline;
        color: var(--warning);
        font-size: 1.1rem;
      }
    }
  }
}

@keyframes pulse {
  0%, 100% {
    border-color: var(--warning);
    background: rgba(237, 137, 54, 0.1);
  }
  50% {
    border-color: rgba(237, 137, 54, 0.7);
    background: rgba(237, 137, 54, 0.15);
  }
}

.user-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.user-sanctions-history {
  h3 {
    color: var(--text-primary);
    margin-bottom: 1.5rem;
  }
}

.user-display {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-tertiary);
  border-radius: 8px;

  strong {
    color: var(--text-primary);
  }

  .text-muted {
    color: var(--text-tertiary);
    font-size: 0.875rem;
    font-family: monospace;
  }
}

.form-help {
  display: block;
  margin-top: 0.5rem;
  color: var(--text-tertiary);
  font-size: 0.875rem;
}

// Escalation Rules
.escalation-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.escalation-rule-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
  transition: all 0.3s;

  &:hover {
    box-shadow: var(--shadow-lg);
  }

  .rule-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 1.5rem;
    gap: 1rem;

    .form-group {
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--text-primary);
        font-size: 0.95rem;
      }

      select {
        width: 100%;
        padding: 0.75rem;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        color: var(--text-primary);
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.3s;

        &:hover {
          border-color: var(--accent);
        }

        &:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(88, 101, 242, 0.1);
        }
      }
    }
  }
}

.escalation-levels {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.level-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-tertiary);
  border-radius: 8px;
  border: 1px solid var(--border-color);

  .level-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: var(--accent);
    color: white;
    border-radius: 50%;
    font-weight: 600;
    font-size: 0.95rem;
    flex-shrink: 0;
  }

  .level-form {
    flex: 1;
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    flex-wrap: wrap;

    .duration-inputs {
      display: flex;
      gap: 0.75rem;
      flex: 1;
      flex-wrap: wrap;
      align-items: flex-start;

      .help-text {
        flex-basis: 100%;
        color: var(--text-secondary);
        font-size: 0.8rem;
        margin-top: 0.25rem;
      }
    }

    .form-group {
      flex: 1;
      min-width: 100px;
      margin: 0;

      label {
        display: block;
        margin-bottom: 0.5rem;
        color: var(--text-primary);
        font-weight: 500;
        font-size: 0.875rem;
      }

      select,
      input {
        width: 100%;
        padding: 0.75rem;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        color: var(--text-primary);
        font-size: 0.95rem;
        transition: all 0.3s;

        &:hover {
          border-color: var(--accent);
        }

        &:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(88, 101, 242, 0.1);
        }
      }

      input[type="number"] {
        cursor: text;
      }
    }

    .btn-icon {
      padding: 0.75rem;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      line-height: 1;
      border-radius: 6px;

      &:hover {
        transform: translateY(0);
      }
    }
  }
}

// Permissions Table
.permissions-table {
  overflow-x: auto;

  table {
    width: 100%;
    border-collapse: collapse;

    thead {
      background: var(--bg-tertiary);

      th {
        padding: 1rem;
        text-align: left;
        color: var(--text-primary);
        font-weight: 600;
        border-bottom: 2px solid var(--border-color);
      }
    }

    tbody {
      tr {
        border-bottom: 1px solid var(--border-color);
        transition: background 0.3s;

        &:hover {
          background: var(--bg-tertiary);
        }

        td {
          padding: 1rem;
          color: var(--text-secondary);

          .user-cell {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;

            strong {
              color: var(--text-primary);
            }

            .user-id {
              font-family: monospace;
              font-size: 0.8rem;
              color: var(--text-tertiary);
            }
          }
        }
      }
    }
  }
}

// Statistics
.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  transition: transform 0.3s, box-shadow 0.3s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }

  .stat-icon {
    font-size: 2.5rem;
    flex-shrink: 0;
  }

  .stat-content {
    flex: 1;

    h3 {
      margin: 0 0 0.5rem 0;
      color: var(--text-primary);
      font-size: 2rem;
      font-weight: 700;
    }

    p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }
  }
}

.infraction-breakdown {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;

  h3 {
    margin: 0 0 1.5rem 0;
    color: var(--text-primary);
  }
}

.infraction-bars {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.infraction-bar-item {
  .infraction-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;

    .count {
      color: var(--text-primary);
      font-weight: 600;
    }
  }

  .progress-bar {
    width: 100%;
    height: 24px;
    background: var(--bg-secondary);
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--border-color);

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--accent) 0%, #667eea 100%);
      transition: width 0.5s ease-out;
      border-radius: 12px;
    }
  }
}

.top-offenders {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;

  h3 {
    margin: 0 0 1.5rem 0;
    color: var(--text-primary);
  }

  table {
    width: 100%;
    border-collapse: collapse;

    thead {
      th {
        padding: 0.75rem;
        text-align: left;
        color: var(--text-primary);
        font-weight: 600;
        border-bottom: 2px solid var(--border-color);
      }
    }

    tbody {
      tr {
        border-bottom: 1px solid var(--border-color);
        transition: background 0.3s;

        &:hover {
          background: var(--bg-secondary);
        }

        td {
          padding: 0.75rem;
          color: var(--text-secondary);

          .user-cell {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;

            strong {
              color: var(--text-primary);
            }

            .user-id {
              font-family: monospace;
              font-size: 0.8rem;
              color: var(--text-tertiary);
            }
          }
        }
      }
    }
  }
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

// Master Section
.master-sections {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.master-section {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid var(--border-color);

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);

    h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
    }

    p {
      margin: 0.25rem 0 0 0;
      font-size: 0.875rem;
      opacity: 0.7;
    }
  }
}

.bot-controls {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  .control-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    background: var(--bg-tertiary);
    border-radius: 8px;
    border: 1px solid var(--border-color);

    .control-info {
      flex: 1;

      h4 {
        margin: 0 0 0.5rem 0;
        font-size: 1rem;
        font-weight: 500;
      }

      p {
        margin: 0;
        font-size: 0.875rem;
      }
    }
  }

  .control-actions {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: var(--bg-tertiary);
    border-radius: 8px;
    border: 1px solid var(--border-color);
  }
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1rem;
}

.module-card {
  background: var(--bg-tertiary);
  border-radius: 12px;
  padding: 1.25rem;
  border: 1px solid var(--border-color);
  transition: all 0.2s;

  &:hover {
    border-color: var(--accent);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .module-header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;

    .module-icon {
      font-size: 2.5rem;
      line-height: 1;
      flex-shrink: 0;
    }

    .module-info {
      flex: 1;
      min-width: 0; // Pour l'ellipsis

      h4 {
        margin: 0 0 0.5rem 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      p {
        margin: 0 0 0.75rem 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
        line-height: 1.4;
      }

      .module-meta {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        font-size: 0.8rem;
        flex-wrap: wrap;
        color: var(--text-tertiary);
      }
    }

    .module-status {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.5rem;
      flex-shrink: 0;
    }
  }
}

// Dropdown Menu
.dropdown {
  position: relative;

  .btn-dropdown {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-primary);
    cursor: pointer;
    font-size: 1.25rem;
    transition: all 0.2s;

    &:hover {
      background: var(--bg-secondary);
      border-color: var(--accent);
    }
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 0.25rem;
    min-width: 180px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    overflow: hidden;

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.75rem 1rem;
      background: transparent;
      border: none;
      color: var(--text-primary);
      font-size: 0.9rem;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s;

      span {
        font-size: 1rem;
      }

      &:hover {
        background: var(--bg-tertiary);
      }

      &.danger {
        color: #e53e3e;

        &:hover {
          background: rgba(229, 62, 62, 0.1);
        }
      }
    }

    .dropdown-divider {
      height: 1px;
      background: var(--border-color);
      margin: 0.25rem 0;
    }
  }
}

// Toggle Switch
.switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
  flex-shrink: 0;

  input {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .slider {
      background: var(--accent-color);
    }

    &:checked + .slider:before {
      transform: translateX(24px);
    }
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--bg-tertiary);
    border-radius: 24px;
    transition: 0.3s;

    &:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background: white;
      border-radius: 50%;
      transition: 0.3s;
    }
  }
}

.system-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;

  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    background: var(--bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--border-color);

    .stat-label {
      font-size: 0.875rem;
      opacity: 0.7;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 600;

      &.warning {
        color: var(--accent-color);
      }
    }
  }
}

.master-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--border-color);

  &:hover {
    background: var(--bg-tertiary);
    border-color: var(--accent-color);
  }

  &.btn-warning {
    border-color: #ed8936;
    color: #ed8936;

    &:hover {
      background: rgba(237, 137, 54, 0.1);
    }
  }

  &.btn-danger {
    border-color: #e53e3e;
    color: #e53e3e;

    &:hover {
      background: rgba(229, 62, 62, 0.1);
    }
  }
}

// Modules Section (inspired by search section)
.modules-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.module-item {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s;

  &:hover {
    border-color: var(--accent);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .module-header-row {
    display: flex;
    align-items: flex-start;
    gap: 1.5rem;

    .module-icon-large {
      font-size: 3rem;
      line-height: 1;
      flex-shrink: 0;
    }

    .module-details {
      flex: 1;

      h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      p {
        margin: 0 0 0.75rem 0;
        color: var(--text-secondary);
      }

      .module-meta {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        font-size: 0.875rem;
        flex-wrap: wrap;
      }
    }

    .module-controls {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.75rem;
      flex-shrink: 0;
    }
  }

  .module-files-section {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border-color);

    .files-toggle {
      background: transparent;
      border: none;
      color: var(--text-primary);
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      padding: 0.5rem 0;
      transition: color 0.2s;

      &:hover {
        color: var(--accent);
      }
    }

    .files-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 0.75rem;
      margin-top: 1rem;

      .file-card {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        background: var(--bg-secondary);
        border-radius: 6px;
        border: 1px solid var(--border-color);

        .file-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .file-name {
          flex: 1;
          font-family: monospace;
          font-size: 0.9rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-size {
          font-size: 0.75rem;
          opacity: 0.6;
          flex-shrink: 0;
        }
      }
    }
  }
}

// Modules Admin Container (old style - keep for compatibility)
.modules-admin-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.server-modules-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.server-module-card {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s;

  &:hover {
    border-color: var(--accent);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .module-main {
    display: flex;
    align-items: flex-start;
    gap: 1.5rem;

    .module-icon-large {
      font-size: 3rem;
      line-height: 1;
      flex-shrink: 0;
    }

    .module-details {
      flex: 1;

      h4 {
        margin: 0 0 0.5rem 0;
        font-size: 1.25rem;
        font-weight: 600;
      }

      p {
        margin: 0 0 1rem 0;
        opacity: 0.7;
      }

      .module-meta {
        display: flex;
        gap: 1rem;
        align-items: center;
        font-size: 0.875rem;
      }
    }

    .module-toggle {
      flex-shrink: 0;
    }
  }

  .module-files {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border-color);

    h5 {
      margin: 0 0 1rem 0;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.7;
    }

    .files-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .file-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        background: var(--bg-secondary);
        border-radius: 6px;
        border: 1px solid var(--border-color);

        .file-icon {
          font-size: 1.25rem;
        }

        .file-name {
          flex: 1;
          font-family: monospace;
          font-size: 0.9rem;
        }

        .file-size {
          font-size: 0.75rem;
          opacity: 0.6;
        }
      }
    }
  }

  .module-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border-color);
  }
}

// File Upload Area
.file-upload-area {
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: var(--accent);
    background: var(--bg-tertiary);
  }

  .file-upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;

    .upload-icon {
      font-size: 3rem;
    }

    p {
      margin: 0;
      font-weight: 500;
    }

    small {
      opacity: 0.6;
    }
  }

  .uploaded-files {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    .uploaded-file-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: var(--bg-tertiary);
      border-radius: 6px;
      border: 1px solid var(--border-color);

      .file-icon {
        font-size: 1.25rem;
      }

      .file-name {
        flex: 1;
        font-family: monospace;
        font-size: 0.9rem;
      }

      .file-size {
        font-size: 0.75rem;
        opacity: 0.6;
      }

      .btn-remove-file {
        background: transparent;
        border: none;
        color: #e53e3e;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s;

        &:hover {
          background: rgba(229, 62, 62, 0.1);
        }
      }
    }
  }
}

// Modal Gestion Accès
.access-module-info {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);

  .module-header-compact {
    display: flex;
    align-items: center;
    gap: 1rem;

    .module-icon-large {
      font-size: 2.5rem;
    }

    h4 {
      margin: 0 0 0.25rem 0;
      font-size: 1.25rem;
    }

    .text-muted {
      margin: 0;
      font-size: 0.9rem;
    }
  }
}

.access-options {
  margin-bottom: 1.5rem;
}

.guilds-access-list {
  h4 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 600;
  }

  .loading-compact {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1.5rem;
    justify-content: center;
    color: var(--text-muted);

    .spinner-sm {
      width: 20px;
      height: 20px;
      border: 2px solid var(--border-color);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
  }

  .empty-state-compact {
    text-align: center;
    padding: 2rem;
    color: var(--text-muted);
  }

  .guild-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 400px;
    overflow-y: auto;

    .guild-access-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: var(--bg-secondary);
      border-radius: 8px;
      border: 1px solid var(--border-color);
      transition: all 0.2s;

      &:hover {
        border-color: var(--accent);
        background: var(--bg-tertiary);
      }

      .guild-info-compact {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .guild-icon-small {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }

        .guild-icon-fallback {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--accent);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 1rem;
        }

        .guild-name {
          font-weight: 500;
        }
      }

      .toggle-switch {
        position: relative;
        display: inline-block;
        width: 48px;
        height: 24px;
        margin: 0;

        input {
          opacity: 0;
          width: 0;
          height: 0;

          &:checked + .toggle-slider {
            background-color: var(--success);
          }

          &:checked + .toggle-slider:before {
            transform: translateX(24px);
          }
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          transition: 0.3s;
          border-radius: 24px;

          &:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 3px;
            bottom: 2px;
            background-color: white;
            transition: 0.3s;
            border-radius: 50%;
          }
        }
      }
    }
  }
}

</style>

