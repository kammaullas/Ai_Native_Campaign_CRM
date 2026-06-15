const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  segmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Segment', required: true },
  message: { type: String, required: true },
  channel: { type: String, enum: ['WHATSAPP', 'SMS', 'EMAIL'], required: true },
  status: { type: String, enum: ['DRAFT', 'RUNNING', 'COMPLETED'], default: 'DRAFT' },
  stats: {
    total: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);
