import api from './api'

// Payment API calls
export const paymentAPI = {
  // Create Razorpay order
  createPaymentOrder: (orderData) => {
    return api.post('/payments/create-order', orderData)
  },

  // Verify payment
  verifyPayment: (paymentData) => {
    return api.post('/payments/verify', paymentData)
  },

  // Get payment details
  getPaymentDetails: (orderId) => {
    return api.get(`/payments/${orderId}/details`)
  },

  // Get payment history
  getPaymentHistory: (params = {}) => {
    return api.get('/payments/history', { params })
  },

  // Refund payment (admin only)
  refundPayment: (refundData) => {
    return api.post('/payments/refund', refundData)
  }
}

export default paymentAPI
