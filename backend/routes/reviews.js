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

// Add review (Consumer only)
router.post('/', authenticate, authorize('consumer'), addReview);

// Get reviews for a farmer (Public)
router.get('/:farmerId', validateId, getFarmerReviews);

// Get user's reviews (Consumer only)
router.get('/user/my-reviews', authenticate, authorize('consumer'), getUserReviews);

// Get review eligibility (Consumer only)
router.get('/user/eligibility', authenticate, authorize('consumer'), getReviewEligibility);

// Update review (Consumer only)
router.put('/:reviewId', authenticate, authorize('consumer'), validateId, updateReview);

// Delete review (Consumer only)
router.delete('/:reviewId', authenticate, authorize('consumer'), validateId, deleteReview);

module.exports = router;
