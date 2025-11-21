const mongoose = require('mongoose');

const infractionCounterSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
    description: 'Discord ID de l\'utilisateur',
  },
  infractionType: {
    type: String,
    required: true,
    enum: ['spam', 'toxicity', 'insult', 'harassment', 'nsfw', 'raid', 'advertising', 'other'],
  },
  count: {
    type: Number,
    default: 0,
    description: 'Nombre d\'infractions de ce type',
  },
  lastInfractionAt: {
    type: Date,
    default: null,
  },
  resetAt: {
    type: Date,
    default: null,
    description: 'Date de réinitialisation du compteur (optionnel)',
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

// Index unique pour éviter les doublons
infractionCounterSchema.index(
  { guildId: 1, userId: 1, infractionType: 1 },
  { unique: true }
);

module.exports = mongoose.model('InfractionCounter', infractionCounterSchema);
