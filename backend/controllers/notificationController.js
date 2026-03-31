const asyncHandler = require('express-async-handler');
const supabase = require('../config/supabase');
const responseHelper = require('../utils/responseHelper');
const logger = require('../config/logger');

// Get user notifications
const getUserNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, unreadOnly = false } = req.query;

  console.log('Getting notifications for user:', userId);

  try {
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('userid', userId)
      .order('createdat', { ascending: false });

    // Apply filters
    if (unreadOnly === 'true') {
      query = query.eq('isread', false);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: notifications, error, count } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return responseHelper.error(res, 'Failed to fetch notifications', 500);
    }

    const response = {
      notifications: notifications || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      },
      unreadCount: await getUnreadCount(userId)
    };

    return responseHelper.success(res, response, 'Notifications retrieved successfully');

  } catch (error) {
    console.error('Error in getUserNotifications:', error);
    return responseHelper.error(res, 'Internal server error', 500);
  }
});

// Get unread count
const getUnreadCount = async (userId) => {
  try {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('userid', userId)
      .eq('isread', false);
    
    return count || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

// Mark notification as read
const markNotificationRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        isread: true,
        readat: new Date().toISOString()
      })
      .eq('_id', id)
      .eq('userid', userId);

    if (error) {
      return responseHelper.error(res, 'Failed to mark notification as read', 500);
    }

    return responseHelper.success(res, null, 'Notification marked as read');

  } catch (error) {
    console.error('Error in markNotificationRead:', error);
    return responseHelper.error(res, 'Internal server error', 500);
  }
});

// Mark all notifications as read
const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        isread: true,
        readat: new Date().toISOString()
      })
      .eq('userid', userId)
      .eq('isread', false);

    if (error) {
      return responseHelper.error(res, 'Failed to mark all notifications as read', 500);
    }

    return responseHelper.success(res, null, 'All notifications marked as read');

  } catch (error) {
    console.error('Error in markAllNotificationsRead:', error);
    return responseHelper.error(res, 'Internal server error', 500);
  }
});

// Delete notification
const deleteNotification = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('_id', id)
      .eq('userid', userId);

    if (error) {
      return responseHelper.error(res, 'Failed to delete notification', 500);
    }

    return responseHelper.success(res, null, 'Notification deleted successfully');

  } catch (error) {
    console.error('Error in deleteNotification:', error);
    return responseHelper.error(res, 'Internal server error', 500);
  }
});

// Create notification (internal function)
const createNotification = async (userId, title, message, type, priority = 'medium', data = {}, actionUrl = null) => {
  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        userid: userId,
        title,
        message,
        type,
        priority,
        data,
        actionurl: actionUrl,
        createdat: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    // Emit real-time notification via Socket.io if available
    try {
      const io = require('../socket').getIO();
      if (io) {
        io.to(`user_${userId}`).emit('new_notification', notification);
      }
    } catch (socketError) {
      console.log('Socket.io not available for real-time notifications');
    }

    return notification;
  } catch (error) {
    console.error('Error in createNotification:', error);
    return null;
  }
};

// Notification helper functions for different types
const notifyLowStock = async (farmerUserId, productName, currentStock, minStock) => {
  return await createNotification(
    farmerUserId,
    '⚠️ Low Stock Alert',
    `Your product "${productName}" is running low on stock. Current: ${currentStock}, Minimum: ${minStock}`,
    'low_stock',
    'high',
    { productName, currentStock, minStock },
    '/farmer/stock'
  );
};

const notifyOrderConfirmation = async (customerUserId, orderId, orderNumber) => {
  return await createNotification(
    customerUserId,
    '✅ Order Confirmed',
    `Your order #${orderNumber} has been confirmed and is being processed.`,
    'order_confirmation',
    'medium',
    { orderId, orderNumber },
    '/customer/orders'
  );
};

const notifyFarmerApproval = async (farmerUserId, farmName) => {
  return await createNotification(
    farmerUserId,
    '🎉 Farm Approved',
    `Congratulations! Your farm "${farmName}" has been approved and is now live.`,
    'farmer_approval',
    'high',
    { farmName },
    '/farmer/dashboard'
  );
};

const notifyNewOrder = async (farmerUserId, orderId, orderNumber, customerName) => {
  return await createNotification(
    farmerUserId,
    '📦 New Order Received',
    `You have a new order #${orderNumber} from ${customerName}.`,
    'new_order',
    'high',
    { orderId, orderNumber, customerName },
    '/farmer/orders'
  );
};

const notifyProductApproved = async (farmerUserId, productName) => {
  return await createNotification(
    farmerUserId,
    '✅ Product Approved',
    `Your product "${productName}" has been approved and is now live.`,
    'product_approved',
    'medium',
    { productName },
    '/farmer/products'
  );
};

const notifyProductRejected = async (farmerUserId, productName, reason) => {
  return await createNotification(
    farmerUserId,
    '❌ Product Rejected',
    `Your product "${productName}" has been rejected. Reason: ${reason}`,
    'product_rejected',
    'high',
    { productName, reason },
    '/farmer/products'
  );
};

const notifyOrderUpdate = async (userId, orderId, orderNumber, status) => {
  const statusMessages = {
    'processing': 'Your order is being prepared',
    'shipped': 'Your order has been shipped',
    'delivered': 'Your order has been delivered',
    'cancelled': 'Your order has been cancelled'
  };

  return await createNotification(
    userId,
    `📋 Order Update`,
    `Order #${orderNumber}: ${statusMessages[status] || `Status updated to ${status}`}`,
    'order_update',
    'medium',
    { orderId, orderNumber, status },
    '/customer/orders'
  );
};

const notifyPaymentReceived = async (farmerUserId, orderId, orderNumber, amount) => {
  return await createNotification(
    farmerUserId,
    '💰 Payment Received',
    `Payment of ₹${amount} received for order #${orderNumber}.`,
    'payment_received',
    'high',
    { orderId, orderNumber, amount },
    '/farmer/orders'
  );
};

const notifyReviewReceived = async (farmerUserId, productName, rating, customerName) => {
  return await createNotification(
    farmerUserId,
    '⭐ New Review Received',
    `${customerName} rated your product "${productName}" ${rating} stars.`,
    'review_received',
    'medium',
    { productName, rating, customerName },
    '/farmer/reviews'
  );
};

module.exports = {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  createNotification,
  notifyLowStock,
  notifyOrderConfirmation,
  notifyFarmerApproval,
  notifyNewOrder,
  notifyProductApproved,
  notifyProductRejected,
  notifyOrderUpdate,
  notifyPaymentReceived,
  notifyReviewReceived
};
