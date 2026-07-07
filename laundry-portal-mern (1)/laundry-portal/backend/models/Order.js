const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: '' },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    pickupAddress: { type: String, required: true },
    deliveryAddress: { type: String, required: true },
    pickupDate: { type: Date, required: true },
    pickupSlot: {
      type: String,
      enum: ['09:00 - 11:00', '11:00 - 13:00', '14:00 - 16:00', '16:00 - 18:00'],
      required: true,
    },
    specialInstructions: { type: String, default: '' },
    status: {
      type: String,
      enum: [
        'Pending',
        'Confirmed',
        'Picked Up',
        'In Progress',
        'Ready for Delivery',
        'Out for Delivery',
        'Delivered',
        'Cancelled',
      ],
      default: 'Pending',
    },
    statusHistory: [statusHistorySchema],
    assignedProvider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    totalAmount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ['Unpaid', 'Paid'], default: 'Unpaid' },
    paymentMethod: { type: String, enum: ['Cash on Delivery', 'Card', 'UPI'], default: 'Cash on Delivery' },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
