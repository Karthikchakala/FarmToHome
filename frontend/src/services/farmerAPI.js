import api from './api'

// Farmer Product API calls
export const farmerAPI = {
  // Add product
  addProduct: (productData) => {
    return api.post('/farmer/products', productData)
  },

  // Update product
  updateProduct: (productId, productData) => {
    return api.put(`/farmer/products/${productId}`, productData)
  },

  // Delete product
  deleteProduct: (productId) => {
    return api.delete(`/farmer/products/${productId}`)
  },

  // Update stock quantity
  updateStock: (productId, stockData) => {
    return api.patch(`/farmer/products/${productId}/stock`, stockData)
  },

  // Toggle product availability
  toggleAvailability: (productId, availabilityData) => {
    return api.patch(`/farmer/products/${productId}/availability`, availabilityData)
  },

  // Get farmer products
  getFarmerProducts: (params = {}) => {
    return api.get('/farmer/products', { params })
  },

  // Get low stock alerts
  getLowStockAlerts: (params = {}) => {
    return api.get('/farmer/products/low-stock', { params })
  },

  // Get stock statistics
  getStockStatistics: () => {
    return api.get('/farmer/products/statistics')
  }
}

export default farmerAPI
