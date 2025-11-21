const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
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
  icon: {
    type: String,
    default: null,
  },
  ownerId: {
    type: String,
    required: true,
  },
  memberCount: {
    type: Number,
    default: 0,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Guild', guildSchema);
