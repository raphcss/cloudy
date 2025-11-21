const mongoose = require('mongoose');

const guildRoleBindingSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['GUILD_ADMIN', 'GUILD_MODERATOR'],
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

// Index composé pour éviter les doublons et optimiser les recherches
guildRoleBindingSchema.index({ guildId: 1, userId: 1 }, { unique: true });
guildRoleBindingSchema.index({ userId: 1, guildId: 1 });

module.exports = mongoose.model('GuildRoleBinding', guildRoleBindingSchema);
