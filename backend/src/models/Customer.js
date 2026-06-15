const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  city: { type: String },
  totalSpend: { type: Number, default: 0 },
  orderCount: { type: Number, default: 0 },
  lastOrderDate: { type: Date },
  tags: [{ type: String }],
}, { timestamps: true }); // Mongoose handles createdAt and updatedAt automatically

module.exports = mongoose.model('Customer', customerSchema);
