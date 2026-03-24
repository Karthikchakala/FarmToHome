const express = require('express');
const router = express.Router();
const {
  placeOrder,
  getUserOrders,
  getFarmerOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus
} = require('../controllers/orderController');
const { authenticate, authorize } = require('../middlewares/auth');
const { orderLimiter } = require('../middlewares/rateLimiter');

// All order routes require authentication
router.use(authenticate);

// Order CRUD operations
router.post('/', orderLimiter, placeOrder);
router.get('/', getUserOrders);
router.get('/farmer', getFarmerOrders); // Temporarily removed authorize for testing
router.get('/:id', getOrderById);
router.delete('/:id/cancel', cancelOrder);

// Update order status (for farmers/admins only)
router.put('/:id/status', updateOrderStatus); // Temporarily removed authorize for testing

module.exports = router;
