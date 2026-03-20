const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const { validateId } = require('../middlewares/inputValidator');
const {
  createSubscription,
  getUserSubscriptions,
  updateSubscription,
  toggleSubscriptionStatus,
  getAllSubscriptions,
  getSubscriptionAnalytics
} = require('../controllers/subscriptionController');

// Create subscription
router.post('/', authenticate, authorize('consumer'), createSubscription);

// Get user subscriptions
router.get('/', authenticate, authorize('consumer'), getUserSubscriptions);

// Update subscription
router.put('/:id', authenticate, authorize('consumer'), validateId, updateSubscription);

// Pause/Resume/Cancel subscription
router.patch('/:id/status', authenticate, authorize('consumer'), validateId, toggleSubscriptionStatus);

// Get all subscriptions (admin only)
router.get('/admin/all', authenticate, authorize('admin'), getAllSubscriptions);

// Get subscription analytics (admin only)
router.get('/admin/analytics', authenticate, authorize('admin'), getSubscriptionAnalytics);

module.exports = router;
