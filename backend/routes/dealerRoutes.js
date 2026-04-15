const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const {
  registerDealer,
  getDealerProfile,
  updateDealerProfile,
  getAvailableFarmers,
  createBulkOrder,
  getDealerBulkOrders,
  updateBulkOrderStatus,
  getDealerAnalytics,
  getDealerMessages
} = require('../controllers/dealerController');

// Dealer registration (protected route)
router.post('/register', authenticate, authorize('dealer'), registerDealer);

// Dealer profile management
router.get('/profile', authenticate, authorize('dealer'), getDealerProfile);
router.put('/profile', authenticate, authorize('dealer'), updateDealerProfile);

// Market and bulk purchase functionality
router.get('/farmers/available', authenticate, authorize('dealer'), getAvailableFarmers);
router.post('/bulk-orders', authenticate, authorize('dealer'), createBulkOrder);
router.get('/bulk-orders', authenticate, authorize('dealer'), getDealerBulkOrders);
router.put('/bulk-orders/:orderId/status', authenticate, authorize('dealer'), updateBulkOrderStatus);

// Analytics and reporting
router.get('/analytics', authenticate, authorize('dealer'), getDealerAnalytics);

// Messaging
router.get('/messages', authenticate, authorize('dealer'), getDealerMessages);

module.exports = router;
