const mongoose = require('mongoose');

const sanctionSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
    description: 'Discord ID de l\'utilisateur sanctionné',
  },
  moderatorId: {
    type: String,
    required: true,
    description: 'Discord ID du modérateur',
  },
  action: {
    type: String,
    required: true,
    enum: ['warn', 'mute', 'kick', 'ban'],
  },
  reason: {
    type: String,
    required: true,
  },
  infractionType: {
    type: String,
    required: true,
    enum: ['spam', 'toxicity', 'insult', 'harassment', 'nsfw', 'raid', 'advertising', 'other'],
  },
  infractionLevel: {
    type: Number,
    default: 1,
    description: 'Niveau d\'infraction (1ère, 2ème, 3ème...)',
  },
  durationMs: {
    type: Number,
    default: null,
    description: 'Durée de la sanction en ms (null = permanent)',
  },
  expiresAt: {
    type: Date,
    default: null,
    description: 'Date d\'expiration (pour mute/ban temporaire)',
  },
  active: {
    type: Boolean,
    default: true,
    description: 'False si annulée/expirée',
  },
  revokedAt: {
    type: Date,
    default: null,
    description: 'Date de révocation de la sanction',
  },
  revokedBy: {
    type: String,
    default: null,
    description: 'Discord ID du modérateur qui a révoqué',
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SanctionTemplate',
    default: null,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
    description: 'Données supplémentaires (messages supprimés, etc.)',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index pour recherches courantes
sanctionSchema.index({ guildId: 1, userId: 1, createdAt: -1 });
sanctionSchema.index({ guildId: 1, createdAt: -1 });
sanctionSchema.index({ userId: 1, createdAt: -1 });
sanctionSchema.index({ expiresAt: 1, active: 1 });

module.exports = mongoose.model('Sanction', sanctionSchema);
