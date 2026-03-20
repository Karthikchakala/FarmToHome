const express = require('express');
const router = express.Router();
const {
  getProducts,
  getFeaturedProducts,
  getProductById,
  getProductsByFarmer,
  getCategories,
  searchProducts,
  getNearbyProducts
} = require('../controllers/productControllerSupabase');
const { optionalAuth } = require('../middlewares/auth');

// Public routes
router.get('/', optionalAuth, getProducts);
router.get('/nearby', optionalAuth, getNearbyProducts);
router.get('/featured', optionalAuth, getFeaturedProducts);
router.get('/search', optionalAuth, searchProducts);
router.get('/categories', optionalAuth, getCategories);
router.get('/farmer/:farmerId', optionalAuth, getProductsByFarmer);
router.get('/:id', optionalAuth, getProductById);

module.exports = router;
