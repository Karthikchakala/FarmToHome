const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const { validateId } = require('../middlewares/inputValidator');
const {
  addReview,
  getFarmerReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  getReviewEligibility
} = require('../controllers/reviewController');

// Customer review endpoints
const customerRouter = express.Router();

// Add review (Customer only)
customerRouter.post('/', authenticate, authorize('consumer'), addReview);

// Get customer's reviews (Customer only)
customerRouter.get('/my-reviews', authenticate, authorize('consumer'), getUserReviews);

// Get review eligibility (Customer only)
customerRouter.get('/eligibility', authenticate, authorize('consumer'), getReviewEligibility);

// Update review (Customer only)
customerRouter.put('/:reviewId', authenticate, authorize('consumer'), validateId, updateReview);

// Delete review (Customer only)
customerRouter.delete('/:reviewId', authenticate, authorize('consumer'), validateId, deleteReview);

// Farmer review endpoints
const farmerRouter = express.Router();

// Get reviews for a farmer (Public - no auth required)
farmerRouter.get('/:farmerId', validateId, getFarmerReviews);

// Mount customer and farmer routers
router.use('/customer', customerRouter);
router.use('/farmers', farmerRouter);

module.exports = router;
