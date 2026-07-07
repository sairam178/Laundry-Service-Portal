const Order = require('../models/Order');
const Service = require('../models/Service');

// @desc  Create a new booking (customer)
// @route POST /api/orders
const createOrder = async (req, res) => {
  try {
    const { items, pickupAddress, deliveryAddress, pickupDate, pickupSlot, specialInstructions, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Please select at least one service' });
    }

    // Recalculate prices server-side from the Service collection so totals can't be tampered with
    let totalAmount = 0;
    const orderItems = [];
    for (const item of items) {
      const service = await Service.findById(item.serviceId);
      if (!service || !service.isActive) {
        return res.status(400).json({ message: `Service unavailable: ${item.serviceId}` });
      }
      const subtotal = service.price * item.quantity;
      totalAmount += subtotal;
      orderItems.push({
        service: service._id,
        name: service.name,
        quantity: item.quantity,
        price: service.price,
        subtotal,
      });
    }

    const order = await Order.create({
      customer: req.user._id,
      items: orderItems,
      pickupAddress,
      deliveryAddress,
      pickupDate,
      pickupSlot,
      specialInstructions,
      paymentMethod: paymentMethod || 'Cash on Delivery',
      totalAmount,
      statusHistory: [{ status: 'Pending', note: 'Booking placed by customer' }],
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get orders belonging to the logged-in customer
// @route GET /api/orders/mine
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get all orders (admin) or orders assigned to a provider
// @route GET /api/orders
const getAllOrders = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'provider') {
      // Providers see unassigned pending orders plus their own assigned orders
      filter = { $or: [{ assignedProvider: req.user._id }, { assignedProvider: null }] };
    }
    const orders = await Order.find(filter)
      .populate('customer', 'name email phone')
      .populate('assignedProvider', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get single order by ID (owner, assigned provider, or admin)
// @route GET /api/orders/:id
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone address')
      .populate('assignedProvider', 'name email');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isOwner = order.customer._id.toString() === req.user._id.toString();
    const isStaff = ['provider', 'admin'].includes(req.user.role);
    if (!isOwner && !isStaff) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Update order status (provider/admin) - also handles self-assignment
// @route PUT /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (req.user.role === 'provider' && !order.assignedProvider) {
      order.assignedProvider = req.user._id;
    }

    order.status = status;
    order.statusHistory.push({ status, note: note || '', changedAt: new Date() });

    if (status === 'Delivered' && order.paymentMethod === 'Cash on Delivery') {
      order.paymentStatus = 'Paid';
      order.paidAt = new Date();
    }

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Cancel an order (customer, only while Pending/Confirmed)
// @route PUT /api/orders/:id/cancel
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    if (!['Pending', 'Confirmed'].includes(order.status)) {
      return res.status(400).json({ message: 'This order can no longer be cancelled' });
    }

    order.status = 'Cancelled';
    order.statusHistory.push({ status: 'Cancelled', note: 'Cancelled by customer', changedAt: new Date() });
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createOrder, getMyOrders, getAllOrders, getOrderById, updateOrderStatus, cancelOrder };
