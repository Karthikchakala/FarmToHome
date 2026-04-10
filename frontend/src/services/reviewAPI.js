import api from './api'

// Review API calls
export const reviewAPI = {
  // Add review
  addReview: (reviewData) => {
    return api.post('/reviews/customer', reviewData)
  },

  // Get farmer reviews
  getFarmerReviews: (farmerId, params = {}) => {
    return api.get(`/reviews/farmers/${farmerId}`, { params })
  },

  // Get product reviews
  getProductReviews: (productId, params = {}) => {
    return api.get(`/reviews/product/${productId}`, { params })
  },

  // Get user's reviews
  getUserReviews: (params = {}) => {
    return api.get('/reviews/customer/my-reviews', { params })
  },

  // Get review eligibility
  getReviewEligibility: () => {
    return api.get('/reviews/customer/eligibility')
  },

  // Update review
  updateReview: (reviewId, reviewData) => {
    return api.put(`/reviews/customer/${reviewId}`, reviewData)
  },

  // Delete review
  deleteReview: (reviewId) => {
    return api.delete(`/reviews/customer/${reviewId}`)
  }
}

export default reviewAPI
