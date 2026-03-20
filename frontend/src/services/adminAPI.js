import api from './api'

// Admin API calls
export const adminAPI = {
  // User Management
  getUsers: (params = {}) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  
  // Farmer Management
  getFarmers: (params = {}) => api.get('/admin/farmers', { params }),
  approveFarmer: (id) => api.post(`/admin/farmers/${id}/approve`),
  rejectFarmer: (id, reason) => api.post(`/admin/farmers/${id}/reject`, { reason }),
  
  // Order Management
  getAllOrders: (params = {}) => api.get('/admin/orders', { params }),
  getOrderById: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, status) => api.put(`/admin/orders/${id}/status`, { status }),
  
  // Product Management
  getAllProducts: (params = {}) => api.get('/admin/products', { params }),
  getProductById: (id) => api.get(`/admin/products/${id}`),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  
  // Analytics
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getAnalytics: (params = {}) => api.get('/admin/analytics', { params }),
  
  // Settings
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (settings) => api.put('/admin/settings', settings),
}
