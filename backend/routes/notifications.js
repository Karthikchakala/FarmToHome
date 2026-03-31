const express = require('express');
const router = express.Router();

// Import controllers
const { 
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification
} = require('../controllers/notificationController');

// Import middleware
const { authenticate } = require('../middlewares/auth');

// All notification routes require authentication
router.use(authenticate);

// Get user notifications
router.get('/', getUserNotifications);

// Mark notification as read
router.put('/:id/read', markNotificationRead);

// Mark all notifications as read
router.put('/read-all', markAllNotificationsRead);

// Delete notification
router.delete('/:id', deleteNotification);

module.exports = router;
