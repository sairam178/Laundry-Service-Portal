const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Wash & Fold', 'Dry Cleaning', 'Ironing', 'Shoe Cleaning', 'Bedding & Linen'],
      required: true,
    },
    description: { type: String, default: '' },
    unit: { type: String, enum: ['per kg', 'per item'], default: 'per kg' },
    price: { type: Number, required: true, min: 0 },
    estimatedTurnaroundHours: { type: Number, default: 24 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);
