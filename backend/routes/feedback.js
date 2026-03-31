const express = require('express');
const router = express.Router();

// Import controllers
const { 
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

// Customer feedback routes
router.post('/customer', authenticate, roleAuth(['customer']), createCustomerFeedback);

// Farmer feedback routes  
router.post('/farmer', authenticate, roleAuth(['farmer']), createFarmerFeedback);

// Admin feedback routes
router.get('/admin', authenticate, roleAuth(['admin']), getAllFeedbacks);
router.get('/admin/:id', authenticate, roleAuth(['admin']), getFeedbackById);
router.put('/admin/:id/status', authenticate, roleAuth(['admin']), updateFeedbackStatus);
router.delete('/admin/:id', authenticate, roleAuth(['admin']), deleteFeedback);

module.exports = router;
