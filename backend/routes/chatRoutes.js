const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const { validateOrderId } = require('../middlewares/inputValidator');
const {
  getConversation,
  getMessages,
  sendMessage,
  markAsRead,
  getUserConversations
} = require('../controllers/chatController');

// All chat routes require authentication
router.use(authenticate);

// Get all conversations for the current user
router.get('/conversations', getUserConversations);

// Get conversation details for a specific order
router.get('/orders/:orderId/conversation', validateOrderId, getConversation);

// Get messages for a specific order
router.get('/orders/:orderId/messages', validateOrderId, getMessages);

// Send a message to a specific order
router.post('/orders/:orderId/messages', validateOrderId, sendMessage);

// Mark messages as read for a specific order
router.put('/orders/:orderId/read', validateOrderId, markAsRead);

module.exports = router;
