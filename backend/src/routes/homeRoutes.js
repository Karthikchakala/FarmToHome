import express from 'express';
import { getFeaturedProducts, getFeaturedFarmers, getReviews, getHomeConfig } from '../controllers/homeController.js';

const router = express.Router();

// All home routes are public (no auth required)
router.get('/featured-products', getFeaturedProducts);
router.get('/featured-farmers', getFeaturedFarmers);
router.get('/reviews', getReviews);
router.get('/config', getHomeConfig);

export default router;
