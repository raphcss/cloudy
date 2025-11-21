const mongoose = require('mongoose');

const escalationRuleSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    index: true,
  },
  infractionType: {
    type: String,
    required: true,
    description: 'Type d\'infraction (spam, toxicity, etc.)',
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    description: 'Niveau d\'escalade (1, 2, 3, etc.)',
  },
  action: {
    type: String,
    required: true,
    enum: ['warn', 'mute', 'kick', 'ban'],
    description: 'Action à appliquer',
  },
  durationMs: {
    type: Number,
    default: null,
    description: 'Durée en millisecondes (null = permanent pour BAN/KICK)',
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

// Index composé pour garantir l'unicité de la règle par serveur/type/niveau
escalationRuleSchema.index({ guildId: 1, infractionType: 1, level: 1 }, { unique: true });

// Middleware pour mettre à jour updatedAt
escalationRuleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const EscalationRule = mongoose.model('EscalationRule', escalationRuleSchema);

module.exports = EscalationRule;
