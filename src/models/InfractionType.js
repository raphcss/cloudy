const mongoose = require('mongoose');

const infractionTypeSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    index: true,
  },
  key: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: '⚠️',
  },
  description: {
    type: String,
    default: '',
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  requiresCustomReason: {
    type: Boolean,
    default: false,
    description: 'Si true, affiche un modal pour saisir une raison personnalisée',
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index composé pour garantir l'unicité de la clé par serveur
infractionTypeSchema.index({ guildId: 1, key: 1 }, { unique: true });

// Middleware pour mettre à jour updatedAt
infractionTypeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const InfractionType = mongoose.model('InfractionType', infractionTypeSchema);

module.exports = InfractionType;
