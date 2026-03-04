const mongoose = require('mongoose');

const dataImportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['csv', 'xlsx', 'json'],
    required: true
  },
  recordsImported: {
    type: Number,
    default: 0
  },
  casesCreated: {
    type: Number,
    default: 0
  },
  eventsCreated: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  errorMessage: {
    type: String
  },
  columnMapping: {
    caseId: String,
    activity: String,
    timestamp: String,
    resource: String,
    department: String,
    cost: String
  },
  importedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DataImport', dataImportSchema);
