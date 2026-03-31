import api from './api'

// Profile API calls
export const profileAPI = {
  // Get user profile (determines endpoint based on user role)
  getProfile: () => {
    // Check if user is farmer or customer from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const endpoint = user.role === 'farmer' 
      ? '/profile/farmer' 
      : '/profile/customer';
    
    return api.get(endpoint)
  },

  // Customer profile endpoints
  getCustomerProfile: () => {
    return api.get('/profile/customer')
  },

  updateCustomerProfile: (profileData) => {
    return api.put('/profile/customer', profileData)
  },

  updateCustomerLocation: (locationData) => {
    return api.put('/profile/customer/location', locationData)
  },

  // Farmer profile endpoints
  getFarmerProfile: () => {
    return api.get('/profile/farmer')
  },

  updateFarmerProfile: (profileData) => {
    return api.put('/profile/farmer', profileData)
  },

  // Location-based endpoints
  getNearbyFarmers: (params = {}) => {
    return api.get('/profile/location/nearby-farmers', { params })
  },

  validateDelivery: (deliveryData) => {
    return api.post('/profile/location/validate-delivery', deliveryData)
  }
}

export default profileAPI
