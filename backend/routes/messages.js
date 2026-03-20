const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getMessages,
  getRecentChats,
  getUnreadCount,
  markAsRead,
  deleteMessage,
  getOrderChatHistory
} = require('../controllers/messageController');
const { authenticate } = require('../middlewares/auth');

// All message routes require authentication
router.use(authenticate);

// Message CRUD operations
router.post('/send', sendMessage);
router.get('/', getMessages);
router.get('/recent', getRecentChats);
router.get('/unread-count', getUnreadCount);
router.put('/mark-read', markAsRead);
router.delete('/:messageId', deleteMessage);

// Order-specific chat
router.get('/order/:orderId', getOrderChatHistory);

module.exports = router;
