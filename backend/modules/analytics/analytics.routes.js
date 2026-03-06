import express from 'express';
import * as analyticsController from './analytics.controller.js';
import { protect, authorizeRoles } from '../../src/middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('admin'));

router.get('/overview', analyticsController.getOverview);
router.get('/orders', analyticsController.getOrdersAnalytics);
router.get('/revenue', analyticsController.getRevenueAnalytics);
router.get('/top-farmers', analyticsController.getTopFarmers);
router.get('/top-products', analyticsController.getTopProducts);
router.get('/subscriptions', analyticsController.getSubscriptionAnalytics);

export default router;
