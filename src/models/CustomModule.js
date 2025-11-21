const mongoose = require('mongoose');

const customModuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: '📦',
  },
  version: {
    type: String,
    default: '1.0.0',
  },
  author: {
    type: String,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  filesCount: {
    type: Number,
    default: 0,
  },
  config: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  allowedGuilds: {
    type: [String], // Array de guild IDs ayant accès au module
    default: [], // Vide = tous les serveurs ont accès
  },
  deployedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Index pour recherche rapide
customModuleSchema.index({ createdBy: 1 });
customModuleSchema.index({ name: 1 });

const CustomModule = mongoose.model('CustomModule', customModuleSchema);

module.exports = CustomModule;
