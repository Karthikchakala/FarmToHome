const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const { validateId } = require('../middlewares/inputValidator');
const {
  addProduct,
  updateProduct,
  updateStock,
  toggleAvailability,
  getFarmerProducts,
  getLowStockAlerts,
  getStockStatistics,
  checkTableSchema,
  getFarmerAnalytics,
  getFarmerBulkOrders,
  updateBulkOrderStatus
} = require('../controllers/farmerProductController');

// Add product (Farmer only)
router.post('/products', authenticate, authorize('farmer'), addProduct);

// Update product (Farmer only)
router.put('/products/:id', authenticate, authorize('farmer'), validateId, updateProduct);

// Update stock quantity (Farmer only)
router.patch('/products/:id/stock', authenticate, authorize('farmer'), validateId, updateStock);

// Toggle product availability (Farmer only)
router.patch('/products/:id/availability', authenticate, authorize('farmer'), validateId, toggleAvailability);

// Get farmer products with stock info
router.get('/products', authenticate, authorize('farmer'), getFarmerProducts);

// Get low stock alerts for farmer
router.get('/products/low-stock', authenticate, authorize('farmer'), getLowStockAlerts);

// Get stock statistics for farmer
router.get('/products/statistics', authenticate, authorize('farmer'), getStockStatistics);

// Get farmer analytics
router.get('/analytics', authenticate, authorize('farmer'), getFarmerAnalytics);

// Get farmer bulk orders
router.get('/bulk-orders', authenticate, authorize('farmer'), getFarmerBulkOrders);

// Update bulk order status
router.put('/bulk-orders/:id/status', authenticate, authorize('farmer'), validateId, updateBulkOrderStatus);

// Check table schema (for debugging)
router.get('/schema', checkTableSchema);

module.exports = router;
