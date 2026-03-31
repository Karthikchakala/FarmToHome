import api from './api'

// Subscription API calls
export const subscriptionAPI = {
  // Create subscription
  createSubscription: (subscriptionData) => {
    return api.post('/subscriptions/consumer', subscriptionData)
  },

  // Get user subscriptions
  getUserSubscriptions: (params = {}) => {
    return api.get('/subscriptions', { params })
  },

  // Update subscription
  updateSubscription: (subscriptionId, updateData) => {
    return api.put(`/subscriptions/${subscriptionId}`, updateData)
  },

  // Modify subscription (quantity, frequency, etc.)
  modifySubscription: (subscriptionId, modifyData) => {
    return api.put(`/subscriptions/${subscriptionId}/modify`, modifyData)
  },

  // Pause/Resume/Cancel subscription
  updateSubscriptionStatus: (subscriptionId, status) => {
    // Check if user is farmer and use farmer-specific endpoint
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const endpoint = user.role === 'farmer' 
      ? `/subscriptions/${subscriptionId}/farmer-status`
      : `/subscriptions/${subscriptionId}/status`;
    
    return api.patch(endpoint, { status })
  },

  // Skip specific delivery
  skipDelivery: (subscriptionId, skipData) => {
    return api.post(`/subscriptions/${subscriptionId}/skip`, skipData)
  },

  // Approve/Skip upcoming delivery
  approveDelivery: (subscriptionId, approveData) => {
    return api.post(`/subscriptions/${subscriptionId}/approve`, approveData)
  },

  // Get farmer subscriptions (for farmers)
  getFarmerSubscriptions: (params = {}) => {
    return api.get('/subscriptions/farmer', { params })
  },

  // Get all subscriptions (admin only)
  getAllSubscriptions: (params = {}) => {
    return api.get('/subscriptions/admin/all', { params })
  },

  // Get subscription analytics (admin only)
  getSubscriptionAnalytics: () => {
    return api.get('/subscriptions/admin/analytics')
  }
}

export default subscriptionAPI
