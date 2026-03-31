const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const supabase = require('../config/supabaseClient');

class ChatSocket {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> { socket, role, consumer/farmerId }
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware for socket connections
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user details from database
        const { data: user, error } = await supabase
          .from('users')
          .select('_id, role, email')
          .eq('_id', decoded._id)
          .single();

        if (error || !user) {
          return next(new Error('User not found'));
        }

        // Get consumer or farmer ID
        let userRecord;
        if (user.role === 'consumer') {
          const { data: consumer, error: consumerError } = await supabase
            .from('consumers')
            .select('_id')
            .eq('userid', user._id)
            .single();
          
          if (consumerError || !consumer) {
            return next(new Error('Consumer record not found'));
          }
          userRecord = { ...user, consumerId: consumer._id };
        } else if (user.role === 'farmer') {
          const { data: farmer, error: farmerError } = await supabase
            .from('farmers')
            .select('_id')
            .eq('userid', user._id)
            .single();
          
          if (farmerError || !farmer) {
            return next(new Error('Farmer record not found'));
          }
          userRecord = { ...user, farmerId: farmer._id };
        } else {
          return next(new Error('Invalid user role'));
        }

        socket.user = userRecord;
        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const user = socket.user;
      logger.info(`User connected: ${user.role}_${user._id}`);

      // Store user connection
      const roomName = `${user.role}_${user.role === 'consumer' ? user.consumerId : user.farmerId}`;
      socket.join(roomName);
      
      this.connectedUsers.set(user._id, {
        socket,
        role: user.role,
        consumerId: user.consumerId,
        farmerId: user.farmerId,
        roomName
      });

      // Join order-specific rooms for active conversations
      this.joinUserConversations(socket, user);

      // Handle joining a specific order conversation
      socket.on('join_order', async (orderId) => {
        try {
          // Verify user has access to this order
          const { data: conversation, error } = await supabase
            .from('chat_conversations')
            .select('*')
            .eq('orderid', orderId)
            .single();

          if (error || !conversation) {
            socket.emit('error', { message: 'Conversation not found' });
            return;
          }

          const hasAccess = (user.role === 'consumer' && conversation.customer_id === user.consumerId) ||
                           (user.role === 'farmer' && conversation.farmer_id === user.farmerId);

          if (!hasAccess) {
            socket.emit('error', { message: 'Access denied to this conversation' });
            return;
          }

          const orderRoom = `order_${orderId}`;
          socket.join(orderRoom);
          
          socket.emit('joined_order', { orderId, room: orderRoom });
          logger.info(`User ${user.role}_${user._id} joined order ${orderId}`);
        } catch (error) {
          logger.error('Error joining order:', error);
          socket.emit('error', { message: 'Failed to join conversation' });
        }
      });

      // Handle leaving a specific order conversation
      socket.on('leave_order', (orderId) => {
        const orderRoom = `order_${orderId}`;
        socket.leave(orderRoom);
        socket.emit('left_order', { orderId });
        logger.info(`User ${user.role}_${user._id} left order ${orderId}`);
      });

      // Handle typing indicators
      socket.on('typing_start', async (orderId) => {
        try {
          // Verify access to order
          const { data: conversation } = await supabase
            .from('chat_conversations')
            .select('customer_id, farmer_id')
            .eq('orderid', orderId)
            .single();

          if (!conversation) return;

          const hasAccess = (user.role === 'consumer' && conversation.customer_id === user.consumerId) ||
                           (user.role === 'farmer' && conversation.farmer_id === user.farmerId);

          if (!hasAccess) return;

          // Notify the other party
          const receiverRoom = user.role === 'customer' 
            ? `farmer_${conversation.farmer_id}` 
            : `customer_${conversation.customer_id}`;

          socket.to(receiverRoom).emit('user_typing', {
            orderId,
            user: {
              id: user._id,
              role: user.role,
              name: user.email // You might want to fetch actual name
            }
          });
        } catch (error) {
          logger.error('Error handling typing start:', error);
        }
      });

      socket.on('typing_stop', async (orderId) => {
        try {
          // Verify access to order
          const { data: conversation } = await supabase
            .from('chat_conversations')
            .select('customer_id, farmer_id')
            .eq('orderid', orderId)
            .single();

          if (!conversation) return;

          const hasAccess = (user.role === 'consumer' && conversation.customer_id === user.consumerId) ||
                           (user.role === 'farmer' && conversation.farmer_id === user.farmerId);

          if (!hasAccess) return;

          // Notify the other party
          const receiverRoom = user.role === 'customer' 
            ? `farmer_${conversation.farmer_id}` 
            : `customer_${conversation.customer_id}`;

          socket.to(receiverRoom).emit('user_stop_typing', {
            orderId,
            user: {
              id: user._id,
              role: user.role
            }
          });
        } catch (error) {
          logger.error('Error handling typing stop:', error);
        }
      });

      // Handle online status
      socket.on('get_online_status', async (orderIds) => {
        try {
          const statusMap = {};
          
          for (const orderId of orderIds) {
            const { data: conversation } = await supabase
              .from('chat_conversations')
              .select('customer_id, farmer_id')
              .eq('orderid', orderId)
              .single();

            if (!conversation) continue;

            const otherUserId = user.role === 'consumer' 
              ? conversation.farmer_id 
              : conversation.customer_id;

            // Check if other user is online
            const otherUserConnection = Array.from(this.connectedUsers.values())
              .find(conn => 
                (user.role === 'consumer' && conn.role === 'farmer' && conn.farmerId === otherUserId) ||
                (user.role === 'farmer' && conn.role === 'consumer' && conn.consumerId === otherUserId)
              );

            statusMap[orderId] = {
              is_online: !!otherUserConnection,
              last_seen: null // You could implement last seen tracking
            };
          }

          socket.emit('online_status', statusMap);
        } catch (error) {
          logger.error('Error getting online status:', error);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`User disconnected: ${user.role}_${user._id}`);
        this.connectedUsers.delete(user._id);

        // Notify other users about disconnection
        socket.broadcast.emit('user_offline', {
          userId: user._id,
          role: user.role
        });
      });

      // Send connection confirmation
      socket.emit('connected', {
        user: {
          id: user._id,
          role: user.role,
          email: user.email
        }
      });
    });
  }

  async joinUserConversations(socket, user) {
    try {
      const columnName = user.role === 'consumer' ? 'customer_id' : 'farmer_id';
      const userId = user.role === 'consumer' ? user.consumerId : user.farmerId;

      // Get user's active conversations
      const { data: conversations } = await supabase
        .from('chat_conversations')
        .select('orderid')
        .eq(columnName, userId)
        .eq('is_active', true);

      // Join each order room
      conversations?.forEach(conv => {
        const orderRoom = `order_${conv.orderid}`;
        socket.join(orderRoom);
      });

      logger.info(`User ${user.role}_${user._id} joined ${conversations?.length || 0} conversation rooms`);
    } catch (error) {
      logger.error('Error joining user conversations:', error);
    }
  }

  // Method to send notifications to specific users
  sendToUser(userId, event, data) {
    const userConnection = this.connectedUsers.get(userId);
    if (userConnection) {
      this.io.to(userConnection.roomName).emit(event, data);
    }
  }

  // Method to send to order room
  sendToOrder(orderId, event, data) {
    this.io.to(`order_${orderId}`).emit(event, data);
  }

  // Method to get online users count
  getOnlineUsersCount() {
    return this.connectedUsers.size;
  }

  // Method to get online users in a specific order
  getOnlineUsersInOrder(orderId) {
    const orderRoom = `order_${orderId}`;
    const sockets = this.io.sockets.adapter.rooms.get(orderRoom);
    return sockets ? sockets.size : 0;
  }
}

module.exports = ChatSocket;
