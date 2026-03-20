import api from './api'

// Message API calls
export const messageAPI = {
  // Send message
  sendMessage: (messageData) => {
    return api.post('/messages/send', messageData)
  },

  // Get messages between two users
  getMessages: (userId, otherUserId, params = {}) => {
    return api.get('/messages', { 
      params: { 
        userId, 
        receiverId: otherUserId, 
        ...params 
      } 
    })
  },

  // Get recent chat partners
  getRecentChats: () => {
    return api.get('/messages/recent')
  },

  // Get unread message count
  getUnreadCount: () => {
    return api.get('/messages/unread-count')
  },

  // Mark messages as read
  markAsRead: (senderId) => {
    return api.put('/messages/mark-read', { senderId })
  },

  // Delete message
  deleteMessage: (messageId) => {
    return api.delete(`/messages/${messageId}`)
  },

  // Get order chat history
  getOrderChatHistory: (orderId, params = {}) => {
    return api.get(`/messages/order/${orderId}`, { params })
  }
}

export default messageAPI
