const express = require('express');
const router = express.Router();
const {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartSummary
} = require('../controllers/cartController');
const { authenticate } = require('../middlewares/auth');

// All cart routes require authentication
router.use(authenticate);

// Cart CRUD operations
router.post('/add', addToCart);
router.get('/', getCart);
router.put('/update', updateCartItem);
router.delete('/remove', removeFromCart);
router.delete('/clear', clearCart);

// Cart summary for header/cart icon
router.get('/summary', getCartSummary);

module.exports = router;
