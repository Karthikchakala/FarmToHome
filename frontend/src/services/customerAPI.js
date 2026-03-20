import api from './api'

// Customer API calls
export const customerAPI = {
  // Dashboard data
  getDashboardData: () => api.get('/customer/dashboard'),
  
  // Orders
  getOrders: (params = {}) => api.get('/customer/orders', { params }),
  getOrderById: (id) => api.get(`/customer/orders/${id}`),
  
  // Subscriptions
  getSubscriptions: (params = {}) => api.get('/customer/subscriptions', { params }),
  getSubscriptionById: (id) => api.get(`/customer/subscriptions/${id}`),
  createSubscription: (subscriptionData) => api.post('/customer/subscriptions', subscriptionData),
  updateSubscription: (id, subscriptionData) => api.put(`/customer/subscriptions/${id}`, subscriptionData),
  cancelSubscription: (id) => api.delete(`/customer/subscriptions/${id}`),
  
  // Reviews
  getReviews: (params = {}) => api.get('/customer/reviews', { params }),
  createReview: (reviewData) => api.post('/customer/reviews', reviewData),
  updateReview: (id, reviewData) => api.put(`/customer/reviews/${id}`, reviewData),
  
  // Favorites
  getFavoriteFarmers: () => api.get('/customer/favorites/farmers'),
  getFavoriteProducts: () => api.get('/customer/favorites/products'),
  addFavoriteFarmer: (farmerId) => api.post(`/customer/favorites/farmers/${farmerId}`),
  removeFavoriteFarmer: (farmerId) => api.delete(`/customer/favorites/farmers/${farmerId}`),
  addFavoriteProduct: (productId) => api.post(`/customer/favorites/products/${productId}`),
  removeFavoriteProduct: (productId) => api.delete(`/customer/favorites/products/${productId}`),
  
  // Profile
  getProfile: () => api.get('/customer/profile'),
  updateProfile: (profileData) => api.put('/customer/profile', profileData),
  
  // Cart
  getCart: () => api.get('/customer/cart'),
  addToCart: (itemData) => api.post('/customer/cart', itemData),
  updateCartItem: (itemId, itemData) => api.put(`/customer/cart/${itemId}`, itemData),
  removeFromCart: (itemId) => api.delete(`/customer/cart/${itemId}`),
  clearCart: () => api.delete('/customer/cart'),
}
