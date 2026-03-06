import express from 'express';
import { getDashboardMetrics, getPendingFarmers, approveFarmer, getLogs } from '../controllers/adminController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { approveFarmerSchema, getLogsSchema } from '../validators/adminValidators.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('admin'));

router.get('/dashboard', getDashboardMetrics);
router.get('/farmers/pending', getPendingFarmers);
router.put('/farmers/:farmerId/approve', validate(approveFarmerSchema), approveFarmer);
router.get('/audit-logs', validate(getLogsSchema), getLogs);

export default router;
