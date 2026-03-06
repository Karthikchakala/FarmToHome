import express from 'express';
import * as subController from './subscriptions.controller.js';
import { protect, authorizeRoles } from '../../src/middlewares/authMiddleware.js';

const router = express.Router();

// All subscription routes require authentication and consumer role
router.use(protect);
router.use(authorizeRoles('consumer'));

router.post('/', subController.createSubscription);
router.get('/', subController.getMySubscriptions);
router.get('/:subscriptionId', subController.getSubscriptionDetails);
router.put('/:subscriptionId/pause', subController.pauseSubscription);
router.put('/:subscriptionId/resume', subController.resumeSubscription);
router.delete('/:subscriptionId', subController.cancelSubscription);

export default router;
