const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const { validateId } = require('../middlewares/inputValidator');
const {
  createPaymentOrder,
  verifyPayment,
  getPaymentDetails,
  getPaymentHistory,
  refundPayment
} = require('../controllers/paymentController');

// Create Razorpay order
router.post('/create-order', authenticate, authorize('consumer'), createPaymentOrder);

// Verify payment
router.post('/verify', authenticate, authorize('consumer'), verifyPayment);

// Get payment details
router.get('/:orderId/details', authenticate, authorize('consumer'), validateId, getPaymentDetails);

// Get payment history
router.get('/history', authenticate, authorize('consumer'), getPaymentHistory);

// Refund payment (admin only)
router.post('/refund', authenticate, authorize('admin'), refundPayment);

module.exports = router;
