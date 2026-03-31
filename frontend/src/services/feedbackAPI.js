import api from './api'

// Feedback API calls
export const feedbackAPI = {
  // Customer feedback endpoints
  createCustomerFeedback: (feedbackData) => {
    return api.post('/feedback/customer', feedbackData)
  },

  // Farmer feedback endpoints
  createFarmerFeedback: (feedbackData) => {
    return api.post('/feedback/farmer', feedbackData)
  },

  // Admin feedback endpoints
  getAllFeedbacks: (params = {}) => {
    return api.get('/feedback/admin', { params })
  },

  getFeedbackById: (id) => {
    return api.get(`/feedback/admin/${id}`)
  },

  updateFeedbackStatus: (id, status) => {
    return api.put(`/feedback/admin/${id}/status`, { status })
  },

  deleteFeedback: (id) => {
    return api.delete(`/feedback/admin/${id}`)
  }
}

export default feedbackAPI
