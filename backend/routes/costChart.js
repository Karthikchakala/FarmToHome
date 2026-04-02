const express = require('express');
const router = express.Router();
const costChartController = require('../controllers/costChartController');
const { authenticate, authorize } = require('../middlewares/auth');

// Farmer routes - read-only access to cost chart for pricing reference
// These must come before the /:id route to avoid conflicts
router.get('/reference', authenticate, authorize('farmer', 'admin'), costChartController.getCostChartForReference);
router.get('/pricing/:vegetable_name', authenticate, authorize('farmer', 'admin'), costChartController.getVegetablePricing);

// Admin routes - require admin role
router.get('/', authenticate, authorize('admin'), costChartController.getCostChart);
router.get('/:id', authenticate, authorize('admin'), costChartController.getCostChartEntry);
router.post('/', authenticate, authorize('admin'), costChartController.createCostChartEntry);
router.put('/:id', authenticate, authorize('admin'), costChartController.updateCostChartEntry);
router.delete('/:id', authenticate, authorize('admin'), costChartController.deleteCostChartEntry);

module.exports = router;
