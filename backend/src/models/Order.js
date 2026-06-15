const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  amount: { type: Number, required: true },
  items: [{
    name: { type: String },
    qty: { type: Number },
    price: { type: Number }
  }],
  channel: { type: String, enum: ['online', 'offline'], required: true },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
