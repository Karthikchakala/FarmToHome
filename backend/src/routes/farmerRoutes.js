import express from 'express';
import { getProfile, updateProfile, addDeliveryZone, getDeliveryZones, getNearbyFarmers, getFarmerDetails, getDashboard, getOrders } from '../controllers/farmerController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { updateProfileSchema, addDeliveryZoneSchema } from '../validators/farmerValidators.js';

const router = express.Router();

// Public / Consumer Routes
router.get('/nearby', getNearbyFarmers);
router.get('/:farmerId', getFarmerDetails);

// Base middleware for all farmer protected routes
router.use(protect);
router.use(authorizeRoles('farmer', 'admin'));

router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);

router.get('/delivery-zones', getDeliveryZones);
router.post('/delivery-zones', validate(addDeliveryZoneSchema), addDeliveryZone);

router.get('/dashboard', getDashboard);
router.get('/orders', getOrders);

export default router;
