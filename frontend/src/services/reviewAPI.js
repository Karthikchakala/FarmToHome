import api from './api'

// Review API calls
export const reviewAPI = {
  // Add review
  addReview: (reviewData) => {
    return api.post('/reviews', reviewData)
  },

  // Get farmer reviews
  getFarmerReviews: (farmerId, params = {}) => {
    return api.get(`/reviews/${farmerId}`, { params })
  },

  // Get user's reviews
  getUserReviews: (params = {}) => {
    return api.get('/reviews/user/my-reviews', { params })
  },

  // Get review eligibility
  getReviewEligibility: () => {
    return api.get('/reviews/user/eligibility')
  },

  // Update review
  updateReview: (reviewId, reviewData) => {
    return api.put(`/reviews/${reviewId}`, reviewData)
  },

  // Delete review
  deleteReview: (reviewId) => {
    return api.delete(`/reviews/${reviewId}`)
  }
}

export default reviewAPI
