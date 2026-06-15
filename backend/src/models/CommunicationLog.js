const mongoose = require('mongoose');

const communicationLogSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  message: { type: String, required: true },
  channel: { type: String, required: true },
  status: { type: String, enum: ['SENT', 'DELIVERED', 'FAILED', 'OPENED', 'CLICKED', 'CONVERTED'], default: 'SENT' },
  statusHistory: [{
    status: { type: String },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('CommunicationLog', communicationLogSchema);
