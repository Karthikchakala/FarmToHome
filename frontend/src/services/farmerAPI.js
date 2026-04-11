import api from './api'

// Farmer Product API calls
export const farmerAPI = {
  // Add product
  addProduct: (productData, images) => {
    const formData = new FormData();
    
    // Add product data
    Object.keys(productData).forEach(key => {
      if (key !== 'images') {
        formData.append(key, productData[key]);
      }
    });
    
    // Add image files
    if (images && images.length > 0) {
      images.forEach(image => {
        // Handle both File objects and blob URLs
        if (image instanceof File) {
          formData.append('images', image);
        }
      });
    }
    
    return api.post('/farmer/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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
  },

  // Get farmer analytics
  getAnalytics: (timeRange = '30days') => {
    return api.get('/farmer/analytics', { params: { timeRange } })
  }
}

export default farmerAPI
