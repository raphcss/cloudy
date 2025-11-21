const mongoose = require('mongoose');

const moderationLogSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
    description: 'Discord ID de l\'utilisateur concerné',
  },
  userName: {
    type: String,
    default: null,
    description: 'Nom Discord de l\'utilisateur (tag complet)',
  },
  moderatorId: {
    type: String,
    required: true,
    description: 'Discord ID du modérateur',
  },
  moderatorName: {
    type: String,
    default: null,
    description: 'Nom Discord du modérateur (tag complet)',
  },
  action: {
    type: String,
    required: true,
    enum: ['warn', 'mute', 'kick', 'ban', 'unmute', 'unban', 'revoke_warn', 'revoke_kick', 'other'],
    description: 'Type d\'action effectuée',
  },
  reason: {
    type: String,
    required: true,
  },
  relatedSanctionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sanction',
    default: null,
    description: 'ID de la sanction associée (si révocation)',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
    description: 'Données supplémentaires',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index pour recherches courantes
moderationLogSchema.index({ guildId: 1, createdAt: -1 });
moderationLogSchema.index({ userId: 1, createdAt: -1 });
moderationLogSchema.index({ guildId: 1, userId: 1, createdAt: -1 });

module.exports = mongoose.model('ModerationLog', moderationLogSchema);
