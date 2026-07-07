const Order = require('../models/Order');

// @desc  Mock digital payment for an order (simulates a payment gateway callback)
// @route POST /api/payments/:orderId
const makePayment = async (req, res) => {
  try {
    const { method } = req.body; // 'Card' | 'UPI'
    const order = await Order.findById(req.params.orderId);

    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to pay for this order' });
    }
    if (order.paymentStatus === 'Paid') {
      return res.status(400).json({ message: 'This order has already been paid for' });
    }

    // In production this would verify a real gateway transaction (Razorpay/Stripe) before marking paid.
    order.paymentStatus = 'Paid';
    order.paymentMethod = method || 'Card';
    order.paidAt = new Date();
    if (order.status === 'Pending') {
      order.status = 'Confirmed';
      order.statusHistory.push({ status: 'Confirmed', note: 'Payment received', changedAt: new Date() });
    }

    await order.save();
    res.json({ message: 'Payment successful', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { makePayment };
