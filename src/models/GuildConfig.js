const mongoose = require('mongoose');

const escalationLevelSchema = new mongoose.Schema({
  level: {
    type: Number,
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: ['warn', 'mute', 'kick', 'ban'],
  },
  durationMs: {
    type: Number,
    default: null, // null = permanent
  },
}, { _id: false });

const escalationRuleSchema = new mongoose.Schema({
  infractionType: {
    type: String,
    required: true,
    enum: ['spam', 'insult', 'harassment', 'nsfw', 'raid', 'advertising', 'other'],
  },
  levels: [escalationLevelSchema],
}, { _id: false });

const guildConfigSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  moderationRoles: {
    type: [String],
    default: [],
    description: 'IDs des rôles Discord autorisés à modérer',
  },
  logChannelId: {
    type: String,
    default: null,
    description: 'ID du canal pour les logs de modération',
  },
  muteRoleId: {
    type: String,
    default: null,
    description: 'ID du rôle utilisé pour mute les utilisateurs',
  },
  defaultLanguage: {
    type: String,
    default: 'fr',
    enum: ['fr', 'en'],
  },
  escalationRules: {
    type: [escalationRuleSchema],
    default: [],
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  moduleStates: {
    type: Map,
    of: Boolean,
    default: new Map(),
    description: 'État des modules personnalisés pour ce serveur',
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

module.exports = mongoose.model('GuildConfig', guildConfigSchema);
