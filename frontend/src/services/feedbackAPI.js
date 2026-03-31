import api from './api'

// Feedback API calls
export const feedbackAPI = {
  // Submit feedback/complaint
  submitFeedback: (formData) => {
    return api.post('/feedback', formData)
  },

  // Customer feedback endpoints
  createCustomerFeedback: (feedbackData) => {
    return api.post('/feedback/customer', feedbackData)
  },

  // Farmer feedback endpoints
  createFarmerFeedback: (feedbackData) => {
    return api.post('/feedback/farmer', feedbackData)
  },

  // Get user's feedback
  getUserFeedback: (params = {}) => {
    return api.get('/feedback/user', { params })
  },

  // Get all feedback (admin)
  getAllFeedbacks: (params = {}) => {
    return api.get('/feedback/admin', { params })
  },

  // Get all feedback (alias for consistency)
  getAllFeedback: (params = {}) => {
    return api.get('/feedback/admin', { params })
  },

  // Get feedback by ID
  getFeedbackById: (id) => {
    return api.get(`/feedback/admin/${id}`)
  },

  // Update feedback status (admin)
  updateFeedbackStatus: (id, data) => {
    return api.put(`/feedback/admin/${id}/status`, data)
  },

  // Add note to feedback
  addFeedbackNote: (id, data) => {
    return api.post(`/feedback/admin/${id}/notes`, data)
  },

  // Get feedback notes
  getFeedbackNotes: (id) => {
    return api.get(`/feedback/admin/${id}/notes`)
  },

  // Delete feedback (admin)
  deleteFeedback: (id) => {
    return api.delete(`/feedback/admin/${id}`)
  },

  // Get customer's orders (for feedback context)
  getCustomerOrders: () => {
    return api.get('/feedback/customer/orders')
  },

  // Get customer's products (for feedback context)
  getCustomerProducts: () => {
    return api.get('/feedback/customer/products')
  },

  // Get customer's farmers (for feedback context)
  getCustomerFarmers: () => {
    return api.get('/feedback/customer/farmers')
  },

  // Get feedback statistics (admin)
  getFeedbackStatistics: () => {
    return api.get('/feedback/admin/statistics')
  },

  // Export feedback data (admin)
  exportFeedback: (params = {}) => {
    return api.get('/feedback/admin/export', { 
      params,
      responseType: 'blob'
    })
  },

  // Get feedback categories
  getFeedbackCategories: () => {
    return api.get('/feedback/categories')
  },

  // Search feedback (admin)
  searchFeedback: (query, params = {}) => {
    return api.get('/feedback/admin/search', { 
      params: { q: query, ...params }
    })
  }
}

export default feedbackAPI
