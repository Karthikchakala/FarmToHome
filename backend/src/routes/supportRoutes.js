import express from 'express';
import { createSubscription, getSubscriptions, getWallet, topUp, postReview } from '../controllers/supportController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Subscriptions
router.post('/subscriptions', authorizeRoles('consumer'), createSubscription);
router.get('/subscriptions', authorizeRoles('consumer'), getSubscriptions);

// Wallet
router.get('/wallet', getWallet);
router.post('/wallet/topup', topUp);

// Reviews
router.post('/reviews', authorizeRoles('consumer'), postReview);

export default router;
