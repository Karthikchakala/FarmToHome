import api from './api'

// Chat API calls
export const chatAPI = {
  // Get conversation for an order
  getConversation: (orderId) => {
    return api.get(`/chat/orders/${orderId}/conversation`)
  },

  // Get messages for a conversation
  getMessages: (orderId, params = {}) => {
    return api.get(`/chat/orders/${orderId}/messages`, { params })
  },

  // Send a message
  sendMessage: (orderId, messageData) => {
    return api.post(`/chat/orders/${orderId}/messages`, messageData)
  },

  // Mark messages as read
  markAsRead: (orderId) => {
    return api.put(`/chat/orders/${orderId}/read`)
  },

  // Get all conversations for the current user
  getUserConversations: (params = {}) => {
    return api.get('/chat/conversations', { params })
  }
}

export default chatAPI
