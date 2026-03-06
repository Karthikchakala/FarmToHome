import express from 'express';
import * as notificationController from './notifications.controller.js';
import { protect } from '../../src/middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', notificationController.getMyNotifications);
router.put('/:notificationId/read', notificationController.markNotificationRead);

export default router;
