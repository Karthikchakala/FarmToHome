import express from 'express';
import * as deliveryCtrl from './delivery.controller.js';
import { protect, authorizeRoles } from '../../src/middlewares/authMiddleware.js';

const router = express.Router();

// ─── Public/Consumer ─────────────────────────────────────────────────────────

// Search for farmers near a point
router.get('/farmers/nearby', deliveryCtrl.getNearFarmers);

// Save consumer delivery address & location
router.post('/consumer/address',
    protect,
    authorizeRoles('consumer'),
    deliveryCtrl.saveConsumerAddress
);


// ─── Farmer ──────────────────────────────────────────────────────────────────

// Update farmer's location and delivery radius
router.put('/farmer/location',
    protect,
    authorizeRoles('farmer'),
    deliveryCtrl.updateFarmerLocation
);

// Update custom time slots for delivery
router.put('/farmer/delivery-slots',
    protect,
    authorizeRoles('farmer'),
    deliveryCtrl.updateDeliverySlots
);


// ─── Admin (Delivery Zones) ──────────────────────────────────────────────────

router.get('/delivery/zones', protect, authorizeRoles('admin'), deliveryCtrl.getDeliveryZones);
router.post('/admin/delivery-zones', protect, authorizeRoles('admin'), deliveryCtrl.createDeliveryZone);
router.put('/admin/delivery-zones/:zoneId', protect, authorizeRoles('admin'), deliveryCtrl.updateDeliveryZone);
router.delete('/admin/delivery-zones/:zoneId', protect, authorizeRoles('admin'), deliveryCtrl.deleteDeliveryZone);

export default router;
