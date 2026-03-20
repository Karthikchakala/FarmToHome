import api from './api'

// Subscription API calls
export const subscriptionAPI = {
  // Create subscription
  createSubscription: (subscriptionData) => {
    return api.post('/subscriptions', subscriptionData)
  },

  // Get user subscriptions
  getUserSubscriptions: (params = {}) => {
    return api.get('/subscriptions', { params })
  },

  // Update subscription
  updateSubscription: (subscriptionId, updateData) => {
    return api.put(`/subscriptions/${subscriptionId}`, updateData)
  },

  // Pause/Resume/Cancel subscription
  updateSubscriptionStatus: (subscriptionId, status) => {
    return api.patch(`/subscriptions/${subscriptionId}/status`, { status })
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
