const logger = require('../config/logger');
const responseHelper = require('../utils/responseHelper');
const { asyncHandler, NotFoundError, ValidationError } = require('../middlewares/enhancedErrorHandler');
const supabase = require('../config/supabaseClient');
const { createNotification } = require('./notificationController');

// Get conversation for an order
const getConversation = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user._id;
  const userRole = req.user.role;

  // Get user's consumer or farmer ID
  let userRecord;
  if (userRole === 'consumer') {
    const { data: consumer, error } = await supabase
      .from('consumers')
      .select('_id')
      .eq('userid', userId)
      .single();
    if (error || !consumer) {
      throw new NotFoundError('Consumer record not found');
    }
    userRecord = { id: consumer._id, role: 'customer' };
  } else if (userRole === 'farmer') {
    const { data: farmer, error } = await supabase
      .from('farmers')
      .select('_id')
      .eq('userid', userId)
      .single();
    if (error || !farmer) {
      throw new NotFoundError('Farmer record not found');
    }
    userRecord = { id: farmer._id, role: 'farmer' };
  } else {
    throw new ValidationError('Invalid user role for chat');
  }

  // Verify order exists and user has access
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('consumerid, farmerid, status, createdat')
    .eq('_id', orderId)
    .single();

  if (orderError || !order) {
    throw new NotFoundError('Order not found');
  }

  // Check if user has access to this order
  const hasAccess = (userRole === 'consumer' && order.consumerid === userRecord.id) ||
                   (userRole === 'farmer' && order.farmerid === userRecord.id);

  if (!hasAccess) {
    throw new ValidationError('Access denied to this order');
  }

  // Get or create conversation
  let { data: conversation, error: convError } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('orderid', orderId)
    .single();

  if (convError && convError.code === 'PGRST116') {
    // Conversation doesn't exist, create it
    const { data: newConv, error: createError } = await supabase
      .from('chat_conversations')
      .insert({
        orderid: orderId,
        customer_id: order.consumerid,
        farmer_id: order.farmerid,
        is_active: order.status !== 'DELIVERED'
      })
      .select()
      .single();

    if (createError || !newConv) {
      throw new Error('Failed to create conversation');
    }
    conversation = newConv;
  } else if (convError) {
    throw new Error('Failed to fetch conversation');
  }

  // Mark messages as read
  await supabase.rpc('mark_chat_messages_as_read', {
    p_orderid: orderId,
    p_user_role: userRecord.role,
    p_user_id: userRecord.id
  });

  return responseHelper.success(res, {
    conversation,
    order: {
      _id: orderId,
      status: order.status,
      createdat: order.createdat
    },
    userRole: userRecord.role
  }, 'Conversation retrieved successfully');
});

// Get messages for a conversation
const getMessages = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const userId = req.user._id;
  const userRole = req.user.role;

  // Get user's consumer or farmer ID
  let userRecord;
  if (userRole === 'consumer') {
    const { data: consumer, error } = await supabase
      .from('consumers')
      .select('_id')
      .eq('userid', userId)
      .single();
    if (error || !consumer) {
      throw new NotFoundError('Consumer record not found');
    }
    userRecord = { id: consumer._id, role: 'customer' };
  } else if (userRole === 'farmer') {
    const { data: farmer, error } = await supabase
      .from('farmers')
      .select('_id')
      .eq('userid', userId)
      .single();
    if (error || !farmer) {
      throw new NotFoundError('Farmer record not found');
    }
    userRecord = { id: farmer._id, role: 'farmer' };
  }

  // Verify conversation exists and user has access
  const { data: conversation, error: convError } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('orderid', orderId)
    .single();

  if (convError || !conversation) {
    throw new NotFoundError('Conversation not found');
  }

  const hasAccess = (userRole === 'consumer' && conversation.customer_id === userRecord.id) ||
                   (userRole === 'farmer' && conversation.farmer_id === userRecord.id);

  if (!hasAccess) {
    throw new ValidationError('Access denied to this conversation');
  }

  // Get messages with pagination
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const { data: messages, error: msgError, count } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact' })
    .eq('orderid', orderId)
    .order('created_at', { ascending: false })
    .range(offset, offset + parseInt(limit) - 1);

  if (msgError) {
    throw new Error('Failed to fetch messages');
  }

  // Get sender names
  const senderIds = [...new Set(messages.map(m => m.senderid))];
  const { data: senders } = await supabase
    .from('users')
    .select('_id, name, email')
    .in('_id', senderIds);

  const senderMap = {};
  senders?.forEach(sender => {
    senderMap[sender._id] = sender;
  });

  // Format messages
  const formattedMessages = messages.reverse().map(msg => ({
    ...msg,
    sender_name: senderMap[msg.senderid]?.name,
    is_from_current_user: msg.senderid === userRecord.id
  }));

  return responseHelper.success(res, {
    messages: formattedMessages,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count || 0,
      pages: Math.ceil((count || 0) / parseInt(limit)),
      hasNext: offset + parseInt(limit) < (count || 0),
      hasPrev: parseInt(page) > 1
    }
  }, 'Messages retrieved successfully');
});

// Send a message
const sendMessage = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { message, messageType = 'text', fileUrl = null } = req.body;
  const userId = req.user._id;
  const userRole = req.user.role;

  if (!message || message.trim() === '') {
    throw new ValidationError('Message content is required');
  }

  // Get user's consumer or farmer ID
  let userRecord;
  if (userRole === 'consumer') {
    const { data: consumer, error } = await supabase
      .from('consumers')
      .select('_id')
      .eq('userid', userId)
      .single();
    if (error || !consumer) {
      throw new NotFoundError('Consumer record not found');
    }
    userRecord = { id: consumer._id, role: 'customer' };
  } else if (userRole === 'farmer') {
    const { data: farmer, error } = await supabase
      .from('farmers')
      .select('_id')
      .eq('userid', userId)
      .single();
    if (error || !farmer) {
      throw new NotFoundError('Farmer record not found');
    }
    userRecord = { id: farmer._id, role: 'farmer' };
  }

  // Verify conversation exists
  const { data: conversation, error: convError } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('orderid', orderId)
    .single();

  if (convError || !conversation) {
    throw new NotFoundError('Conversation not found');
  }

  const hasAccess = (userRole === 'consumer' && conversation.customer_id === userRecord.id) ||
                   (userRole === 'farmer' && conversation.farmer_id === userRecord.id);

  if (!hasAccess) {
    throw new ValidationError('Access denied to this conversation');
  }

  // Determine receiver
  const receiverRole = userRecord.role === 'customer' ? 'farmer' : 'customer';
  const receiverId = userRecord.role === 'customer' ? conversation.farmer_id : conversation.customer_id;

  // Send message
  const { data: newMessage, error: msgError } = await supabase
    .from('chat_messages')
    .insert({
      orderid: orderId,
      senderid: userRecord.id,
      receiverid: receiverId,
      sender_role: userRecord.role,
      receiver_role: receiverRole,
      message: message.trim(),
      message_type: messageType,
      file_url: fileUrl
    })
    .select()
    .single();

  if (msgError || !newMessage) {
    throw new Error('Failed to send message: ' + (msgError?.message || 'Unknown error'));
  }

  // Get sender name
  const { data: sender } = await supabase
    .from('users')
    .select('name, email')
    .eq('_id', userRecord.id)
    .single();

  // Emit socket event for real-time delivery
  const io = req.app.get('io');
  if (io) {
    // Get receiver's JWT user ID for socket room
    let receiverJwtId;
    if (receiverRole === 'customer') {
      const { data: consumer } = await supabase
        .from('consumers')
        .select('userid')
        .eq('_id', receiverId)
        .single();
      receiverJwtId = consumer?.userid;
    } else {
      const { data: farmer } = await supabase
        .from('farmers')
        .select('userid')
        .eq('_id', receiverId)
        .single();
      receiverJwtId = farmer?.userid;
    }

    if (receiverJwtId) {
      // Emit to receiver's room using JWT user ID
      const receiverRoom = `user_${receiverJwtId}`;
      io.to(receiverRoom).emit('new_message', {
        ...newMessage,
        sender_name: sender?.name,
        orderid: orderId
      });

      // Emit to sender's room for confirmation using JWT user ID
      const senderRoom = `user_${userRecord.id}`;
      io.to(senderRoom).emit('message_sent', {
        ...newMessage,
        sender_name: sender?.name,
        orderid: orderId
      });

      logger.info(`Socket rooms: sender=${senderRoom}, receiver=${receiverRoom}`);
    } else {
      logger.error(`Could not find JWT user ID for ${receiverRole}_${receiverId}`);
    }
  }

  // Create notification for receiver
  try {
    logger.info(`=== NOTIFICATION DEBUG ===`);
    logger.info(`Creating notification for receiver: ${receiverRole}, ID: ${receiverId}`);
    logger.info(`Sender info: role=${userRecord.role}, id=${userRecord.id}`);
    
    // Get receiver's JWT user ID for notification
    let receiverUserId;
    if (receiverRole === 'customer') {
      logger.info(`Looking up customer with ID: ${receiverId}`);
      const { data: consumer, error: consumerError } = await supabase
        .from('consumers')
        .select('userid, _id')
        .eq('_id', receiverId)
        .single();
      
      logger.info(`Customer query result:`, { data: consumer, error: consumerError });
      
      if (consumerError) {
        logger.error('Error finding consumer for notification:', consumerError);
      } else if (consumer) {
        receiverUserId = consumer.userid;
        logger.info(`Found customer user ID: ${receiverUserId}`);
      } else {
        logger.error(`No consumer found with ID: ${receiverId}`);
      }
    } else {
      logger.info(`Looking up farmer with ID: ${receiverId}`);
      const { data: farmer, error: farmerError } = await supabase
        .from('farmers')
        .select('userid, _id')
        .eq('_id', receiverId)
        .single();
      
      logger.info(`Farmer query result:`, { data: farmer, error: farmerError });
      
      if (farmerError) {
        logger.error('Error finding farmer for notification:', farmerError);
      } else if (farmer) {
        receiverUserId = farmer.userid;
        logger.info(`Found farmer user ID: ${receiverUserId}`);
      } else {
        logger.error(`No farmer found with ID: ${receiverId}`);
      }
    }

    if (receiverUserId) {
      const senderType = userRecord.role === 'customer' ? 'Customer' : 'Farmer';
      const notificationTitle = `New message from ${senderType}`;
      const notificationMessage = `${sender?.name || senderType}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`;
      
      logger.info(`Creating notification: title="${notificationTitle}", message="${notificationMessage}"`);
      logger.info(`Notification data: receiverUserId=${receiverUserId}, orderId=${orderId}`);
      
      const notification = await createNotification(
        receiverUserId,
        notificationTitle,
        notificationMessage,
        'chat_message', // Now using proper type after database update
        'high',
        {
          orderId,
          senderId: userRecord.id,
          senderRole: userRecord.role,
          senderName: sender?.name,
          message: message.substring(0, 100)
        },
        `/orders/${orderId}`
      );
      
      if (notification) {
        logger.info(`✅ Chat notification created successfully: ${notification._id}`);
      } else {
        logger.error('❌ Failed to create chat notification - createNotification returned null');
      }
    } else {
      logger.error(`❌ Could not find receiver user ID for ${receiverRole}_${receiverId}`);
    }
    logger.info(`=== END NOTIFICATION DEBUG ===`);
  } catch (notificationError) {
    logger.error('❌ Failed to send chat notification:', notificationError);
    // Don't fail the message sending if notification fails
  }

  logger.info(`Message sent: orderId=${orderId}, sender=${userRecord.role}_${userRecord.id}, receiver=${receiverRole}_${receiverId}`);

  return responseHelper.created(res, {
    message: {
      ...newMessage,
      sender_name: sender?.name
    }
  }, 'Message sent successfully');
});

// Mark messages as read
const markAsRead = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user._id;
  const userRole = req.user.role;

  // Get user's consumer or farmer ID
  let userRecord;
  if (userRole === 'consumer') {
    const { data: consumer, error } = await supabase
      .from('consumers')
      .select('_id')
      .eq('userid', userId)
      .single();
    if (error || !consumer) {
      throw new NotFoundError('Consumer record not found');
    }
    userRecord = { id: consumer._id, role: 'customer' };
  } else if (userRole === 'farmer') {
    const { data: farmer, error } = await supabase
      .from('farmers')
      .select('_id')
      .eq('userid', userId)
      .single();
    if (error || !farmer) {
      throw new NotFoundError('Farmer record not found');
    }
    userRecord = { id: farmer._id, role: 'farmer' };
  }

  // Mark messages as read
  const { data, error } = await supabase.rpc('mark_chat_messages_as_read', {
    p_orderid: orderId,
    p_user_role: userRecord.role,
    p_user_id: userRecord.id
  });

  if (error) {
    throw new Error('Failed to mark messages as read');
  }

  // Emit socket event for read receipts
  const io = req.app.get('io');
  if (io) {
    const senderRoom = userRecord.role === 'customer' ? `farmer_${userRecord.id}` : `customer_${userRecord.id}`;
    io.to(senderRoom).emit('messages_read', {
      orderid: orderId,
      reader_role: userRecord.role,
      reader_id: userRecord.id,
      marked_count: data
    });
  }

  return responseHelper.success(res, {
    marked_count: data
  }, 'Messages marked as read');
});

// Get all conversations for a user
const getUserConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;
  const { page = 1, limit = 20 } = req.query;

  // Get user's consumer or farmer ID
  let userRecord;
  if (userRole === 'consumer') {
    const { data: consumer, error } = await supabase
      .from('consumers')
      .select('_id')
      .eq('userid', userId)
      .single();
    if (error || !consumer) {
      throw new NotFoundError('Consumer record not found');
    }
    userRecord = { id: consumer._id, role: 'customer' };
  } else if (userRole === 'farmer') {
    const { data: farmer, error } = await supabase
      .from('farmers')
      .select('_id')
      .eq('userid', userId)
      .single();
    if (error || !farmer) {
      throw new NotFoundError('Farmer record not found');
    }
    userRecord = { id: farmer._id, role: 'farmer' };
  }

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const columnName = userRecord.role === 'customer' ? 'customer_id' : 'farmer_id';

  // Get conversations with order details
  const { data: conversations, error, count } = await supabase
    .from('chat_conversations')
    .select(`
      *,
      orders!inner (
        ordernumber,
        status,
        createdat,
        totalamount
      )
    `, { count: 'exact' })
    .eq(columnName, userRecord.id)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .range(offset, offset + parseInt(limit) - 1);

  if (error) {
    throw new Error('Failed to fetch conversations');
  }

  // Get other party's information
  const otherPartyIds = conversations.map(conv => 
    userRecord.role === 'customer' ? conv.farmer_id : conv.customer_id
  );
  
  const { data: otherParties } = await supabase
    .from('users')
    .select('_id, name, email')
    .in('_id', otherPartyIds);

  const partyMap = {};
  otherParties?.forEach(party => {
    partyMap[party._id] = party;
  });

  // Format conversations
  const formattedConversations = conversations.map(conv => {
    const otherPartyId = userRecord.role === 'customer' ? conv.farmer_id : conv.customer_id;
    const otherParty = partyMap[otherPartyId];
    
    return {
      ...conv,
      other_party: otherParty,
      unread_count: userRecord.role === 'customer' ? conv.customer_unread_count : conv.farmer_unread_count
    };
  });

  return responseHelper.success(res, {
    conversations: formattedConversations,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count || 0,
      pages: Math.ceil((count || 0) / parseInt(limit)),
      hasNext: offset + parseInt(limit) < (count || 0),
      hasPrev: parseInt(page) > 1
    }
  }, 'Conversations retrieved successfully');
});

module.exports = {
  getConversation,
  getMessages,
  sendMessage,
  markAsRead,
  getUserConversations
};
