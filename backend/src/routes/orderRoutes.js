import express from 'express';
import { updateStatus, getConsumerOrders, getOrderDetails, cancelOrder } from '../controllers/orderController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { updateOrderStatusSchema } from '../validators/orderValidators.js';

const router = express.Router();

router.use(protect);

// Consumer Order Management
router.get('/', authorizeRoles('consumer'), getConsumerOrders);
router.get('/:orderId', authorizeRoles('consumer'), getOrderDetails);
router.put('/:orderId/cancel', authorizeRoles('consumer'), cancelOrder);

// Farmer/Admin Order Management
router.put('/:orderId/status', authorizeRoles('farmer', 'admin'), validate(updateOrderStatusSchema), updateStatus);

export default router;
