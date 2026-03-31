import api from './api'

// Order API calls
export const orderAPI = {
  // Place new order
  placeOrder: (orderData) => {
    return api.post('/orders', orderData)
  },

  // Get user orders
  getUserOrders: (params = {}) => {
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

  // Cancel order (general)
  cancelOrder: (orderId) => {
    return api.delete(`/orders/${orderId}/cancel`)
  },

  // Customer cancel order (before preparing stage)
  customerCancelOrder: (orderId) => {
    return api.post(`/orders/${orderId}/customer-cancel`)
  },

  // Update order status (for farmers/admins)
  updateOrderStatus: (orderId, status) => {
    return api.put(`/orders/${orderId}/status`, { status })
  }
}

export default orderAPI
