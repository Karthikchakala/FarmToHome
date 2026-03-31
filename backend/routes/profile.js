const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const { validateUserRegistration, validateProduct, validatePagination } = require('../middlewares/validation');
const {
  getUserProfile,
  updateCustomerProfile,
  updateCustomerLocation,
  updateFarmerProfile,
  getNearbyFarmers,
  validateDelivery
} = require('../controllers/profileController');

// Customer profile endpoints
const customerRouter = express.Router();

// All customer profile routes require authentication and consumer role
customerRouter.use(authenticate, authorize('consumer'));

// Get customer profile
customerRouter.get('/', getUserProfile);

// Update customer profile
customerRouter.put('/', updateCustomerProfile);

// Update customer location
customerRouter.put('/location', updateCustomerLocation);

// Farmer profile endpoints
const farmerRouter = express.Router();

// All farmer profile routes require authentication and farmer role
farmerRouter.use(authenticate, authorize('farmer'));

// Get farmer profile
farmerRouter.get('/', getUserProfile);

// Update farmer profile
farmerRouter.put('/', updateFarmerProfile);

// Location-based routes (public or mixed access)
const locationRouter = express.Router();

// Get nearby farmers (public)
locationRouter.get('/nearby-farmers', getNearbyFarmers);

// Validate delivery (requires authentication)
locationRouter.post('/validate-delivery', authenticate, validateDelivery);

// Mount customer and farmer routers
router.use('/customer', customerRouter);
router.use('/farmer', farmerRouter);
router.use('/location', locationRouter);

module.exports = router;
