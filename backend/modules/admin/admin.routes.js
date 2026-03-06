import express from 'express';
import * as adminController from './admin.controller.js';
// We assume we have some standard auth middlewares in the existing src/middlewares/ 
// since auth module was already implemented.
import { protect, authorizeRoles } from '../../src/middlewares/authMiddleware.js';

const router = express.Router();

// All admin routes are protected
router.use(protect);
router.use(authorizeRoles('admin'));

// Analytics
router.get('/dashboard', adminController.getDashboard);

// Farmers
router.get('/farmers', adminController.getFarmers);
router.put('/farmers/:farmerId/approve', adminController.approveFarmer);
router.put('/farmers/:farmerId/suspend', adminController.suspendFarmer);

// Consumers
router.get('/consumers', adminController.getConsumers);
router.put('/consumers/:consumerId/ban', adminController.banConsumer);

// Orders
router.get('/orders', adminController.getOrders);

// Reviews & Options
router.get('/reviews', adminController.getReviews);
router.put('/products/min-price', adminController.setMinPrice);

export default router;
