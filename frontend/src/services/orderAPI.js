import api from './api'

// Order API calls
export const orderAPI = {
  // Place new order
  placeOrder: (orderData) => {
    return api.post('/orders', orderData)
  },

  // Get user orders
  getOrders: (params = {}) => {
    return api.get('/orders', { params })
  },

  // Get farmer orders
  getFarmerOrders: (params = {}) => {
    return api.get('/orders/farmer', { params })
  },

  // Get order by ID
  getOrderById: (orderId) => {
    return api.get(`/orders/${orderId}`)
  },

  // Cancel order
  cancelOrder: (orderId, reason) => {
    return api.delete(`/orders/${orderId}/cancel`, { data: { reason } })
  },

  // Update order status (for farmers/admins)
  updateOrderStatus: (orderId, data) => {
    return api.put(`/orders/${orderId}/status`, data)
  }
}

export default orderAPI
