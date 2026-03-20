const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadNotificationsCount,
  createBulkNotifications,
  clearOldNotifications
} = require('../controllers/notificationController');

// Get user notifications
router.get('/', authenticateToken, getUserNotifications);

// Get unread notification count
router.get('/unread-count', authenticateToken, getUnreadNotificationsCount);

// Create notification (admin/system use)
router.post('/', authenticateToken, createNotification);

// Create bulk notifications (admin/system use)
router.post('/bulk', authenticateToken, createBulkNotifications);

// Mark notification as read
router.patch('/:notificationId/read', authenticateToken, markAsRead);

// Mark all notifications as read
router.patch('/read-all', authenticateToken, markAllAsRead);

// Delete notification
router.delete('/:notificationId', authenticateToken, deleteNotification);

// Clear old notifications (admin/system use)
router.delete('/cleanup', authenticateToken, clearOldNotifications);

module.exports = router;
