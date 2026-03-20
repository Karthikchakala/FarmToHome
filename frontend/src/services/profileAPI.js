import api from './api'

// Profile API calls
export const profileAPI = {
  // Get user profile
  getProfile: () => {
    return api.get('/profile')
  },

  // Update customer profile
  updateCustomerProfile: (profileData) => {
    return api.put('/profile/customer', profileData)
  },

  // Update customer location
  updateCustomerLocation: (locationData) => {
    return api.put('/profile/customer/location', locationData)
  },

  // Update farmer profile
  updateFarmerProfile: (profileData) => {
    return api.put('/profile/farmer', profileData)
  },

  // Get nearby farmers
  getNearbyFarmers: (params = {}) => {
    return api.get('/profile/nearby-farmers', { params })
  },

  // Validate delivery
  validateDelivery: (deliveryData) => {
    return api.post('/profile/validate-delivery', deliveryData)
  }
}

export default profileAPI
