const express = require('express');
const router = express.Router();
const { makePayment } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/:orderId', protect, authorize('customer'), makePayment);

module.exports = router;
