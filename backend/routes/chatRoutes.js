const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const { validateId } = require('../middlewares/inputValidator');
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
router.get('/orders/:orderId/conversation', validateId, getConversation);

// Get messages for a specific order
router.get('/orders/:orderId/messages', validateId, getMessages);

// Send a message to a specific order
router.post('/orders/:orderId/messages', validateId, sendMessage);

// Mark messages as read for a specific order
router.put('/orders/:orderId/read', validateId, markAsRead);

module.exports = router;
