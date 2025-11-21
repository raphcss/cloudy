const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  discordId: {
    type: String,
    required: false,
    unique: true,
    sparse: true, // Permet null/undefined en unique
    index: true,
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    lowercase: true,
    validate: [validator.isEmail, 'Email invalide'],
  },
  passwordHash: {
    type: String,
    required: false,
    select: false, // Ne pas inclure par défaut dans les queries
  },
  globalRole: {
    type: String,
    enum: ['MASTER', null],
    default: null,
  },
  username: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default: null,
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

// Index pour les recherches
userSchema.index({ email: 1 });
userSchema.index({ discordId: 1 });

module.exports = mongoose.model('User', userSchema);
