import api from './api';

const dealerAPI = {
  // Dealer profile management
  registerDealer: (dealerData) => api.post('/dealer/register', dealerData),
  getDealerProfile: () => api.get('/dealer/profile'),
  updateDealerProfile: (profileData) => api.put('/dealer/profile', profileData),
  
  // Market and bulk purchase functionality
  getAvailableFarmers: (params = {}) => api.get('/dealer/farmers/available', { params }),
  createBulkOrder: (orderData) => api.post('/dealer/bulk-orders', orderData),
  getDealerBulkOrders: (params = {}) => api.get('/dealer/bulk-orders', { params }),
  updateBulkOrderStatus: (orderId, statusData) => api.put(`/dealer/bulk-orders/${orderId}/status`, statusData),
  
  // Additional dealer-specific endpoints
  getFarmerProducts: (farmerId, params = {}) => api.get(`/dealer/farmers/${farmerId}/products`, { params }),
  getFarmerProfile: (farmerId) => api.get(`/dealer/farmers/${farmerId}/profile`),
  createBulkOrderQuote: (quoteData) => api.post('/dealer/quotes', quoteData),
  getDealerQuotes: (params = {}) => api.get('/dealer/quotes', { params }),
  
  // Analytics and reporting
  getDealerAnalytics: (params = {}) => api.get('/dealer/analytics', { params }),
  getDealerRevenue: (params = {}) => api.get('/dealer/revenue', { params }),
  getDealerTransactions: (params = {}) => api.get('/dealer/transactions', { params }),
  
  // Communication
  sendMessageToFarmer: (farmerId, messageData) => api.post(`/dealer/messages/${farmerId}`, messageData),
  getDealerMessages: (params = {}) => api.get('/dealer/messages', { params }),
  
  // Reviews and ratings
  getDealerReviews: (params = {}) => api.get('/dealer/reviews', { params }),
  createDealerReview: (reviewData) => api.post('/dealer/reviews', reviewData)
};

export default dealerAPI;
