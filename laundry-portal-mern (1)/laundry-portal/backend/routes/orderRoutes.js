const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('customer'), createOrder);
router.get('/mine', protect, authorize('customer'), getMyOrders);
router.get('/', protect, authorize('provider', 'admin'), getAllOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, authorize('provider', 'admin'), updateOrderStatus);
router.put('/:id/cancel', protect, authorize('customer'), cancelOrder);

module.exports = router;
