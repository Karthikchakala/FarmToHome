import express from 'express';
import { createRazorpayOrder, verifyRazorpayPayment, getHistory, getRazorpayKey } from './payments.controller.js';
import { protect, authorizeRoles } from '../../src/middlewares/authMiddleware.js';

const router = express.Router();

// Get public Razorpay Key for checkout script init
router.get('/key', protect, getRazorpayKey);

// Create a Razorpay Order ID to initiate checkout
router.post('/create-order', protect, authorizeRoles('consumer'), createRazorpayOrder);

// Verify cryptographically signed payment success from Razorpay
router.post('/verify', protect, authorizeRoles('consumer'), verifyRazorpayPayment);

// Get payment history
router.get('/history', protect, getHistory);

export default router;
