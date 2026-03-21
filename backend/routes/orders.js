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

// All order routes require authentication
router.use(authenticate);

// Order CRUD operations
router.post('/', placeOrder);
router.get('/', getUserOrders);
router.get('/farmer', authorize(['farmer']), getFarmerOrders);
router.get('/:id', getOrderById);
router.delete('/:id/cancel', cancelOrder);

// Update order status (for farmers/admins only)
router.put('/:id/status', authorize(['farmer', 'admin']), updateOrderStatus);

module.exports = router;
