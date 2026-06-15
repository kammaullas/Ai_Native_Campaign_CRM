const mongoose = require('mongoose');

const segmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  rules: {
    operator: { type: String, enum: ['AND', 'OR'], required: true },
    conditions: [{
      field: { type: String, required: true },
      op: { type: String, enum: ['gt', 'lt', 'eq', 'gte', 'lte', 'contains'], required: true },
      value: { type: mongoose.Schema.Types.Mixed, required: true }
    }]
  },
  audienceSize: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Segment', segmentSchema);
