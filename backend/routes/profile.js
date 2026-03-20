const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateCustomerProfile,
  updateCustomerLocation,
  updateFarmerProfile,
  getNearbyFarmers,
  validateDelivery
} = require('../controllers/profileController');
const { authenticate } = require('../middlewares/auth');
const { validateUserRegistration, validateProduct, validatePagination } = require('../middlewares/validation');

// All profile routes require authentication
router.use(authenticate);

// Get user profile (works for all roles)
router.get('/', getUserProfile);

// Customer profile routes
router.put('/customer', updateCustomerProfile);
router.put('/customer/location', updateCustomerLocation);

// Farmer profile routes
router.put('/farmer', updateFarmerProfile);

// Location-based routes
router.get('/nearby-farmers', getNearbyFarmers);
router.post('/validate-delivery', validateDelivery);

module.exports = router;
