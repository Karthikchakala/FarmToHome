import api from './api'

// Notification API calls
export const notificationAPI = {
  // Get user notifications
  getNotifications: (params = {}) => {
    return api.get('/notifications', { params })
  },

  // Mark notification as read
  markAsRead: (id) => {
    return api.put(`/notifications/${id}/read`)
  },

  // Mark all notifications as read
  markAllAsRead: () => {
    return api.put('/notifications/read-all')
  },

  // Delete notification
  deleteNotification: (id) => {
    return api.delete(`/notifications/${id}`)
  }
}

export default notificationAPI
