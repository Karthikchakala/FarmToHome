const { query } = require('../db');
const logger = require('../config/logger');

// Send message
const sendMessage = async (req, res, next) => {
  try {
    const senderId = req.user._id;
    const { receiverId, message, orderId, messageType = 'TEXT' } = req.body;

    // Validate input
    if (!receiverId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Receiver ID and message are required'
      });
    }

    // Validate message type
    const validTypes = ['TEXT', 'IMAGE', 'FILE'];
    if (!validTypes.includes(messageType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid message type'
      });
    }

    // Check if receiver exists
    const receiverResult = await query(
      'SELECT _id, role FROM users WHERE _id = $1',
      [receiverId]
    );

    if (receiverResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Receiver not found'
      });
    }

    // Validate order ID if provided
    if (orderId) {
      const orderResult = await query(
        'SELECT _id FROM orders WHERE _id = $1',
        [orderId]
      );

      if (orderResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }
    }

    // Insert message
    const result = await query(`
      INSERT INTO messages (sender_id, receiver_id, order_id, message, message_type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [senderId, receiverId, orderId, message, messageType]);

    const savedMessage = result.rows[0];

    // Get sender and receiver details for socket emission
    const [senderDetails, receiverDetails] = await Promise.all([
      query('SELECT name, role FROM users WHERE _id = $1', [senderId]),
      query('SELECT name, role FROM users WHERE _id = $1', [receiverId])
    ]);

    // Emit message to receiver via Socket.io (handled in socket handler)
    const io = req.app.get('io');
    if (io) {
      const roomName = [senderId, receiverId].sort().join('_');
      io.to(roomName).emit('newMessage', {
        ...savedMessage,
        sender_name: senderDetails.rows[0].name,
        sender_role: senderDetails.rows[0].role,
        receiver_name: receiverDetails.rows[0].name,
        receiver_role: receiverDetails.rows[0].role
      });
    }

    logger.info(`Message sent: senderId=${senderId}, receiverId=${receiverId}`);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message: savedMessage
      }
    });

  } catch (error) {
    logger.error('Send message error:', error);
    next(error);
  }
};

// Get messages between two users
const getMessages = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { userId: otherUserId, limit = 50, offset = 0 } = req.query;

    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        error: 'Other user ID is required'
      });
    }

    // Validate limit and offset
    const parsedLimit = Math.min(parseInt(limit) || 50, 100);
    const parsedOffset = Math.max(parseInt(offset) || 0, 0);

    // Get messages using the function
    const result = await query(
      'SELECT * FROM get_chat_history($1, $2, $3, $4)',
      [userId, otherUserId, parsedLimit, parsedOffset]
    );

    // Mark messages as read (where current user is receiver)
    await query(
      'SELECT mark_messages_as_read($1, $2)',
      [otherUserId, userId]
    );

    // Get user details
    const [senderDetails, receiverDetails] = await Promise.all([
      query('SELECT _id, name, role FROM users WHERE _id = $1', [userId]),
      query('SELECT _id, name, role FROM users WHERE _id = $1', [otherUserId])
    ]);

    res.status(200).json({
      success: true,
      data: {
        messages: result.rows,
        sender: senderDetails.rows[0],
        receiver: receiverDetails.rows[0],
        pagination: {
          limit: parsedLimit,
          offset: parsedOffset,
          hasMore: result.rows.length === parsedLimit
        }
      }
    });

  } catch (error) {
    logger.error('Get messages error:', error);
    next(error);
  }
};

// Get recent chat partners
const getRecentChats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const result = await query(
      'SELECT * FROM get_recent_chat_partners($1)',
      [userId]
    );

    res.status(200).json({
      success: true,
      data: {
        chat_partners: result.rows
      }
    });

  } catch (error) {
    logger.error('Get recent chats error:', error);
    next(error);
  }
};

// Get unread message count
const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const result = await query(
      'SELECT get_unread_message_count($1) as unread_count',
      [userId]
    );

    const unreadCount = parseInt(result.rows[0].unread_count) || 0;

    res.status(200).json({
      success: true,
      data: {
        unread_count: unreadCount
      }
    });

  } catch (error) {
    logger.error('Get unread count error:', error);
    next(error);
  }
};

// Mark messages as read
const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { senderId } = req.body;

    if (!senderId) {
      return res.status(400).json({
        success: false,
        error: 'Sender ID is required'
      });
    }

    const result = await query(
      'SELECT mark_messages_as_read($1, $2) as marked_count',
      [senderId, userId]
    );

    const markedCount = parseInt(result.rows[0].marked_count) || 0;

    // Emit read receipt to sender via Socket.io
    const io = req.app.get('io');
    if (io) {
      const roomName = [userId, senderId].sort().join('_');
      io.to(roomName).emit('messagesRead', {
        readerId: userId,
        senderId: senderId,
        markedCount: markedCount
      });
    }

    logger.info(`Messages marked as read: readerId=${userId}, senderId=${senderId}, count=${markedCount}`);

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
      data: {
        marked_count: markedCount
      }
    });

  } catch (error) {
    logger.error('Mark as read error:', error);
    next(error);
  }
};

// Delete message
const deleteMessage = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { messageId } = req.params;

    // Check if message exists and user is sender
    const messageResult = await query(
      'SELECT _id, sender_id FROM messages WHERE _id = $1',
      [messageId]
    );

    if (messageResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    const message = messageResult.rows[0];

    if (message.sender_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own messages'
      });
    }

    // Delete message
    await query('DELETE FROM messages WHERE _id = $1', [messageId]);

    // Emit message deletion to receiver via Socket.io
    const receiverResult = await query(
      'SELECT receiver_id FROM messages WHERE _id = $1',
      [messageId]
    );

    if (receiverResult.rows.length > 0) {
      const io = req.app.get('io');
      if (io) {
        const roomName = [userId, receiverResult.rows[0].receiver_id].sort().join('_');
        io.to(roomName).emit('messageDeleted', {
          messageId: messageId,
          deletedBy: userId
        });
      }
    }

    logger.info(`Message deleted: messageId=${messageId}, userId=${userId}`);

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    logger.error('Delete message error:', error);
    next(error);
  }
};

// Get chat history for an order
const getOrderChatHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { orderId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Validate order exists and user has access
    const orderResult = await query(
      'SELECT _id, userid FROM orders WHERE _id = $1',
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    const order = orderResult.rows[0];

    // Check if user has access to this order
    if (order.userid !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Get messages for this order
    const result = await query(`
      SELECT 
        m.*,
        u.name as sender_name,
        u.role as sender_role
      FROM messages m
      LEFT JOIN users u ON u._id = m.sender_id
      WHERE m.order_id = $1
      ORDER BY m.created_at ASC
      LIMIT $2 OFFSET $3
    `, [orderId, Math.min(parseInt(limit) || 50, 100), Math.max(parseInt(offset) || 0, 0)]);

    res.status(200).json({
      success: true,
      data: {
        messages: result.rows,
        order_id: orderId,
        pagination: {
          limit: parseInt(limit) || 50,
          offset: parseInt(offset) || 0,
          hasMore: result.rows.length === (parseInt(limit) || 50)
        }
      }
    });

  } catch (error) {
    logger.error('Get order chat history error:', error);
    next(error);
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getRecentChats,
  getUnreadCount,
  markAsRead,
  deleteMessage,
  getOrderChatHistory
};
