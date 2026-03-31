const express = require('express');
const router = express.Router();

// Import controllers
const { 
  // New feedback system functions
  createFeedback,
  getUserFeedback,
  getAllFeedback,
  addFeedbackNote,
  getCustomerOrders,
  getCustomerProducts,
  getCustomerFarmers,
  getFeedbackStatistics,
  // Existing order-based feedback functions
  createCustomerFeedback,
  createFarmerFeedback,
  getAllFeedbacks,
  getFeedbackById,
  updateFeedbackStatus,
  deleteFeedback
} = require('../controllers/feedbackController');

// Import middleware
const { authenticate } = require('../middlewares/auth');
const { roleAuth } = require('../middlewares/roleAuth');

// ===== NEW FEEDBACK SYSTEM ROUTES =====

// General feedback submission
router.post('/', authenticate, createFeedback);

// User feedback management
router.get('/user', authenticate, getUserFeedback);

// Admin feedback management
router.get('/admin', authenticate, roleAuth(['admin']), getAllFeedback);
router.get('/admin/statistics', authenticate, roleAuth(['admin']), getFeedbackStatistics);

// Feedback notes
router.post('/:id/notes', authenticate, addFeedbackNote);

// Customer context data (for feedback form)
router.get('/customer/orders', authenticate, getCustomerOrders);
router.get('/customer/products', authenticate, getCustomerProducts);
router.get('/customer/farmers', authenticate, getCustomerFarmers);

// ===== LEGACY ORDER-BASED FEEDBACK ROUTES =====

// Customer feedback routes
router.post('/customer', authenticate, roleAuth(['customer']), createCustomerFeedback);

// Farmer feedback routes  
router.post('/farmer', authenticate, roleAuth(['farmer']), createFarmerFeedback);

// Admin feedback routes (legacy)
router.get('/admin/legacy', authenticate, roleAuth(['admin']), getAllFeedbacks);
router.get('/admin/legacy/:id', authenticate, roleAuth(['admin']), getFeedbackById);
router.put('/admin/legacy/:id/status', authenticate, roleAuth(['admin']), updateFeedbackStatus);
router.delete('/admin/legacy/:id', authenticate, roleAuth(['admin']), deleteFeedback);

module.exports = router;
