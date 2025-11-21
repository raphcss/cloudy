const mongoose = require('mongoose');

const sanctionTemplateSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    description: 'Nom du template (ex: "Spam léger")',
  },
  infractionType: {
    type: String,
    required: true,
    enum: ['spam', 'toxicity', 'insult', 'harassment', 'nsfw', 'raid', 'advertising', 'other'],
  },
  actionType: {
    type: String,
    required: true,
    enum: ['WARN', 'MUTE', 'KICK', 'BAN'],
  },
  duration: {
    type: Number,
    default: 0,
    description: 'Durée en secondes (0 = permanent, pour mute/ban)',
  },
  reason: {
    type: String,
    required: true,
    description: 'Raison pré-remplie',
  },
  emoji: {
    type: String,
    default: '⚠️',
    description: 'Emoji pour identifier le template',
  },
  active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index pour recherches
sanctionTemplateSchema.index({ guildId: 1, active: 1 });
sanctionTemplateSchema.index({ guildId: 1, infractionType: 1 });

module.exports = mongoose.model('SanctionTemplate', sanctionTemplateSchema);
