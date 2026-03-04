const mongoose = require('mongoose');

const processTransitionSchema = new mongoose.Schema({
  fromActivity: {
    type: String,
    required: true
  },
  toActivity: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    default: 1
  },
  avgDuration: {
    type: Number,  // in milliseconds
    default: 0
  },
  minDuration: {
    type: Number,
    default: 0
  },
  maxDuration: {
    type: Number,
    default: 0
  },
  totalDuration: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound unique index
processTransitionSchema.index({ fromActivity: 1, toActivity: 1 }, { unique: true });

module.exports = mongoose.model('ProcessTransition', processTransitionSchema);
