const mongoose = require('mongoose');

const processEventSchema = new mongoose.Schema({
  caseId: {
    type: String,
    required: true,
    index: true
  },
  activity: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  resource: {
    type: String,
    default: 'System'
  },
  department: {
    type: String
  },
  cost: {
    type: Number,
    default: 0
  },
  attributes: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
processEventSchema.index({ caseId: 1, timestamp: 1 });
processEventSchema.index({ activity: 1 });

module.exports = mongoose.model('ProcessEvent', processEventSchema);
