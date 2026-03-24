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
  getSubscriptionAnalytics,
  getFarmerSubscriptions,
  modifySubscription,
  skipSubscriptionDelivery,
  approveSubscriptionDelivery
} = require('../controllers/subscriptionController');

// Create subscription
router.post('/', authenticate, authorize('consumer'), createSubscription);

// Create subscription (consumer-specific endpoint)
router.post('/consumer', authenticate, authorize('consumer'), createSubscription);

// Get user subscriptions
router.get('/', authenticate, authorize('consumer'), getUserSubscriptions);

// Update subscription
router.put('/:id', authenticate, authorize('consumer'), validateId, updateSubscription);

// Pause/Resume/Cancel subscription
router.patch('/:id/status', authenticate, authorize('consumer'), validateId, toggleSubscriptionStatus);

// Modify subscription (quantity, frequency, delivery day, etc.)
router.put('/:id/modify', authenticate, authorize('consumer'), validateId, modifySubscription);

// Skip specific delivery
router.post('/:id/skip', authenticate, authorize('consumer'), validateId, skipSubscriptionDelivery);

// Approve/Skip upcoming delivery
router.post('/:id/approve', authenticate, authorize('consumer'), validateId, approveSubscriptionDelivery);

// Get farmer subscriptions (for farmers)
router.get('/farmer', authenticate, authorize('farmer'), getFarmerSubscriptions);

// Get all subscriptions (admin only)
router.get('/admin/all', authenticate, authorize('admin'), getAllSubscriptions);

// Get subscription analytics (admin only)
router.get('/admin/analytics', authenticate, authorize('admin'), getSubscriptionAnalytics);

module.exports = router;
