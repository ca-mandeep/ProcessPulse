const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  caseId: {
    type: String,
    required: true,
    unique: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['In Progress', 'Completed', 'Cancelled', 'On Hold'],
    default: 'In Progress'
  },
  variant: {
    type: String
  },
  customer: {
    type: String
  },
  orderValue: {
    type: Number,
    default: 0
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  region: {
    type: String
  }
}, {
  timestamps: true
});

// Virtual for duration
caseSchema.virtual('duration').get(function() {
  if (this.endTime && this.startTime) {
    return this.endTime - this.startTime;
  }
  return null;
});

caseSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Case', caseSchema);
