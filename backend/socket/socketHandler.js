const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

// Socket.io connection handler
const socketHandler = (io) => {
  // Store connected users
  const connectedUsers = new Map();

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user details
      const { query } = require('../db');
      const userResult = await query(
        'SELECT _id, name, email, role FROM users WHERE _id = $1',
        [decoded._id]
      );

      if (userResult.rows.length === 0) {
        return next(new Error('User not found'));
      }

      socket.user = userResult.rows[0];
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Handle new connection
  io.on('connection', (socket) => {
    const user = socket.user;
    const userId = user._id;
    
    logger.info(`User connected: ${userId} (${user.name})`);

    // Store user socket connection
    connectedUsers.set(userId, {
      socketId: socket.id,
      user: user,
      connectedAt: new Date()
    });

    // Join user to their personal room for notifications
    socket.join(`user_${userId}`);

    // Broadcast user online status
    socket.broadcast.emit('userOnline', {
      userId: userId,
      name: user.name,
      role: user.role
    });

    // Send online users list to newly connected user
    const onlineUsers = Array.from(connectedUsers.entries())
      .filter(([id]) => id !== userId)
      .map(([id, data]) => ({
        userId: id,
        name: data.user.name,
        role: data.user.role,
        connectedAt: data.connectedAt
      }));

    socket.emit('onlineUsers', onlineUsers);

    // Handle joining chat room
    socket.on('joinChatRoom', ({ otherUserId }) => {
      if (!otherUserId) {
        return socket.emit('error', { message: 'Other user ID required' });
      }

      // Create room name (sorted to ensure same room for both users)
      const roomName = [userId, otherUserId].sort().join('_');
      socket.join(roomName);

      logger.info(`User ${userId} joined chat room: ${roomName}`);

      // Notify the other user if they're online
      const otherUserSocket = Array.from(connectedUsers.values())
        .find(data => data.user._id === otherUserId);

      if (otherUserSocket) {
        io.to(otherUserSocket.socketId).emit('userJoinedChat', {
          userId: userId,
          name: user.name,
          role: user.role,
          roomName: roomName
        });
      }

      socket.emit('joinedChatRoom', { roomName, otherUserId });
    });

    // Handle leaving chat room
    socket.on('leaveChatRoom', ({ otherUserId }) => {
      if (!otherUserId) return;

      const roomName = [userId, otherUserId].sort().join('_');
      socket.leave(roomName);

      logger.info(`User ${userId} left chat room: ${roomName}`);

      // Notify the other user
      const otherUserSocket = Array.from(connectedUsers.values())
        .find(data => data.user._id === otherUserId);

      if (otherUserSocket) {
        io.to(otherUserSocket.socketId).emit('userLeftChat', {
          userId: userId,
          name: user.name,
          roomName: roomName
        });
      }

      socket.emit('leftChatRoom', { roomName, otherUserId });
    });

    // Handle typing indicators
    socket.on('typing', ({ otherUserId, isTyping }) => {
      if (!otherUserId) return;

      const roomName = [userId, otherUserId].sort().join('_');
      
      // Broadcast typing status to the other user in the room
      socket.to(roomName).emit('userTyping', {
        userId: userId,
        name: user.name,
        isTyping: isTyping
      });
    });

    // Handle message seen (read receipt)
    socket.on('messageSeen', ({ messageId, otherUserId }) => {
      if (!otherUserId || !messageId) return;

      const roomName = [userId, otherUserId].sort().join('_');
      
      // Broadcast read receipt to the other user
      socket.to(roomName).emit('messageSeenReceipt', {
        messageId: messageId,
        seenBy: userId,
        seenAt: new Date()
      });
    });

    // Handle user status change
    socket.on('statusChange', ({ status }) => {
      // Update user status in connected users
      const userData = connectedUsers.get(userId);
      if (userData) {
        userData.user.status = status;
        connectedUsers.set(userId, userData);
      }

      // Broadcast status change to all connected users
      socket.broadcast.emit('userStatusChanged', {
        userId: userId,
        name: user.name,
        role: user.role,
        status: status
      });
    });

    // Handle getting unread message count
    socket.on('getUnreadCount', async () => {
      try {
        const { query } = require('../db');
        const result = await query(
          'SELECT get_unread_message_count($1) as unread_count',
          [userId]
        );

        const unreadCount = parseInt(result.rows[0].unread_count) || 0;
        
        socket.emit('unreadCount', { count: unreadCount });
      } catch (error) {
        logger.error('Get unread count error:', error);
        socket.emit('error', { message: 'Failed to get unread count' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${userId} (${user.name})`);

      // Remove user from connected users
      connectedUsers.delete(userId);

      // Broadcast user offline status
      socket.broadcast.emit('userOffline', {
        userId: userId,
        name: user.name,
        role: user.role
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${userId}:`, error);
    });
  });

  // Helper function to send notification to specific user
  const sendNotificationToUser = (userId, notification) => {
    const userSocket = connectedUsers.get(userId);
    if (userSocket) {
      io.to(userSocket.socketId).emit('notification', notification);
    }
  };

  // Helper function to get online users count
  const getOnlineUsersCount = () => {
    return connectedUsers.size;
  };

  // Helper function to check if user is online
  const isUserOnline = (userId) => {
    return connectedUsers.has(userId);
  };

  // Make helper functions available globally
  io.sendNotificationToUser = sendNotificationToUser;
  io.getOnlineUsersCount = getOnlineUsersCount;
  io.isUserOnline = isUserOnline;

  logger.info('Socket.io server initialized');
};

module.exports = socketHandler;
