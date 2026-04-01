const asyncHandler = require('express-async-handler');
const supabase = require('../config/supabaseClient');
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
    const logger = require('../config/logger');
    logger.info(`🔔 Creating notification: userId=${userId}, title="${title}", type=${type}`);
    
    // Use the service role client to bypass RLS policies
    const { createClient } = require('@supabase/supabase-js');
    const supabaseService = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    const notificationData = {
      userid: userId,
      title,
      message,
      type,
      priority,
      data,
      actionurl: actionUrl,
      createdat: new Date().toISOString()
    };
    
    logger.info(`🔔 Notification data:`, notificationData);
    
    const { data: notification, error } = await supabaseService
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (error) {
      logger.error('❌ Notification creation error:', error);
      logger.error('❌ Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return null;
    }

    logger.info(`✅ Notification created successfully for user: ${userId}, ID: ${notification._id}`);
    return notification;
  } catch (error) {
    const logger = require('../config/logger');
    logger.error('❌ Error in createNotification:', error);
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

const notifyOrderCancelled = async (customerUserId, farmerUserId, orderId, orderNumber) => {
  // Notify customer about order cancellation
  const customerNotification = await createNotification(
    customerUserId,
    '❌ Order Cancelled',
    `Your order #${orderNumber} has been cancelled as requested.`,
    'order_cancelled',
    'high',
    { orderId, orderNumber },
    '/customer/orders'
  );

  // Notify farmer about order cancellation
  const farmerNotification = await createNotification(
    farmerUserId,
    '❌ Order Cancelled',
    `Order #${orderNumber} has been cancelled by the customer.`,
    'order_cancelled',
    'high',
    { orderId, orderNumber },
    '/farmer/orders'
  );

  return { customerNotification, farmerNotification };
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

const notifySubscriptionCreated = async (farmerUserId, subscriptionId, customerName, products) => {
  const productNames = products.map(p => p.name).join(', ');
  return await createNotification(
    farmerUserId,
    '🔄 New Subscription Created',
    `${customerName} has subscribed to: ${productNames}`,
    'subscription_created',
    'high',
    { subscriptionId, customerName, products },
    '/farmer/subscriptions'
  );
};

const notifySubscriptionCancelled = async (farmerUserId, subscriptionId, customerName, reason) => {
  return await createNotification(
    farmerUserId,
    '⚠️ Subscription Cancelled',
    `${customerName} has cancelled their subscription${reason ? `. Reason: ${reason}` : ''}`,
    'subscription_cancelled',
    'medium',
    { subscriptionId, customerName, reason },
    '/farmer/subscriptions'
  );
};

const notifySubscriptionDelivery = async (farmerUserId, subscriptionId, customerName, deliveryDate) => {
  return await createNotification(
    farmerUserId,
    '📅 Subscription Delivery Due',
    `Prepare subscription delivery for ${customerName} on ${deliveryDate}`,
    'order_update',
    'medium',
    { subscriptionId, customerName, deliveryDate },
    '/farmer/subscriptions'
  );
};

// Customer-specific notifications
const notifyOrderPlaced = async (customerUserId, orderId, orderNumber) => {
  return await createNotification(
    customerUserId,
    '📋 Order Placed',
    `Your order #${orderNumber} has been placed successfully! We'll confirm it shortly.`,
    'order_placed',
    'medium',
    { orderId, orderNumber },
    '/customer/orders'
  );
};

const notifyOrderConfirmed = async (customerUserId, orderId, orderNumber) => {
  return await createNotification(
    customerUserId,
    '✅ Order Confirmed',
    `Great news! Your order #${orderNumber} has been confirmed and is being prepared.`,
    'order_confirmed',
    'medium',
    { orderId, orderNumber },
    '/customer/orders'
  );
};

const notifyOrderPacked = async (customerUserId, orderId, orderNumber) => {
  return await createNotification(
    customerUserId,
    '📦 Order Packed',
    `Your order #${orderNumber} has been packed and is ready for shipment.`,
    'order_packed',
    'medium',
    { orderId, orderNumber },
    '/customer/orders'
  );
};

const notifyOrderShipped = async (customerUserId, orderId, orderNumber, trackingNumber = null) => {
  const message = trackingNumber 
    ? `Your order #${orderNumber} has been shipped. Tracking: ${trackingNumber}`
    : `Your order #${orderNumber} has been shipped and is on its way!`;
  
  return await createNotification(
    customerUserId,
    '🚚 Order Shipped',
    message,
    'order_shipped',
    'high',
    { orderId, orderNumber, trackingNumber },
    '/customer/orders'
  );
};

const notifyOrderOutForDelivery = async (customerUserId, orderId, orderNumber, estimatedDelivery = null) => {
  const message = estimatedDelivery
    ? `Your order #${orderNumber} is out for delivery! Expected by ${estimatedDelivery}`
    : `Your order #${orderNumber} is out for delivery today!`;
    
  return await createNotification(
    customerUserId,
    '🏃 Out for Delivery',
    message,
    'order_out_for_delivery',
    'high',
    { orderId, orderNumber, estimatedDelivery },
    '/customer/orders'
  );
};

const notifyOrderDelivered = async (customerUserId, orderId, orderNumber, deliveredAt = null) => {
  const message = deliveredAt
    ? `Your order #${orderNumber} was delivered at ${deliveredAt}. Enjoy your fresh produce!`
    : `Your order #${orderNumber} has been successfully delivered! Enjoy your fresh produce!`;
    
  return await createNotification(
    customerUserId,
    '✅ Order Delivered',
    message,
    'order_delivered',
    'high',
    { orderId, orderNumber, deliveredAt },
    '/customer/orders'
  );
};

const notifyCustomerSubscriptionCreated = async (customerUserId, subscriptionId, products, nextDelivery) => {
  const productNames = products.map(p => p.name).join(', ');
  const message = nextDelivery
    ? `You've successfully subscribed to: ${productNames}. First delivery on ${nextDelivery}`
    : `You've successfully subscribed to: ${productNames}`;
    
  return await createNotification(
    customerUserId,
    '🔄 Subscription Created',
    message,
    'subscription_created',
    'high',
    { subscriptionId, products, nextDelivery },
    '/customer/subscriptions'
  );
};

const notifySubscriptionPaymentProcessed = async (customerUserId, subscriptionId, amount, paymentDate) => {
  return await createNotification(
    customerUserId,
    '💳 Subscription Payment Processed',
    `Payment of ₹${amount} processed for your subscription on ${paymentDate}`,
    'payment_processed',
    'medium',
    { subscriptionId, amount, paymentDate },
    '/customer/subscriptions'
  );
};

const notifySubscriptionDeliveryScheduled = async (customerUserId, subscriptionId, deliveryDate, products) => {
  const productNames = products.map(p => p.name).join(', ');
  return await createNotification(
    customerUserId,
    '📅 Delivery Scheduled',
    `Your subscription delivery (${productNames}) is scheduled for ${deliveryDate}`,
    'delivery_scheduled',
    'medium',
    { subscriptionId, deliveryDate, products },
    '/customer/subscriptions'
  );
};

const notifyProductBackInStock = async (customerUserId, productId, productName, farmerName) => {
  return await createNotification(
    customerUserId,
    '🎉 Product Back in Stock',
    `${productName} from ${farmerName} is now available!`,
    'product_back_in_stock',
    'medium',
    { productId, productName, farmerName },
    `/customer/product/${productId}`
  );
};

const notifyPriceDrop = async (customerUserId, productId, productName, oldPrice, newPrice, farmerName) => {
  const discount = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
  return await createNotification(
    customerUserId,
    '💰 Price Drop Alert',
    `${productName} from ${farmerName} is now ${discount}% cheaper! ₹${newPrice} (was ₹${oldPrice})`,
    'price_drop',
    'medium',
    { productId, productName, oldPrice, newPrice, farmerName, discount },
    `/customer/product/${productId}`
  );
};

const notifyFarmersNewProduct = async (customerUserId, farmerId, farmerName, productName, productId) => {
  return await createNotification(
    customerUserId,
    '🌱 New Product Available',
    `${farmerName} added ${productName} to their farm!`,
    'new_product',
    'low',
    { farmerId, farmerName, productName, productId },
    `/customer/product/${productId}`
  );
};

const notifyPromotionalOffer = async (customerUserId, offerTitle, description, discountCode, validUntil) => {
  return await createNotification(
    customerUserId,
    '🎁 Special Offer',
    `${offerTitle}: ${description}. Use code ${discountCode}. Valid until ${validUntil}`,
    'promotional_offer',
    'medium',
    { offerTitle, description, discountCode, validUntil },
    '/customer/products'
  );
};

const notifyAccountStatusChange = async (customerUserId, status, reason = null) => {
  const statusMessages = {
    'verified': 'Your account has been verified! You can now place orders.',
    'suspended': `Your account has been suspended. ${reason || 'Please contact support.'}`,
    'reactivated': 'Your account has been reactivated. Welcome back!'
  };
  
  return await createNotification(
    customerUserId,
    status === 'verified' ? '✅ Account Verified' : status === 'suspended' ? '⚠️ Account Suspended' : '🎉 Account Reactivated',
    statusMessages[status] || 'Your account status has been updated.',
    'account_status',
    status === 'suspended' ? 'high' : 'medium',
    { status, reason },
    '/customer/profile'
  );
};

module.exports = {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  createNotification,
  // Farmer notifications
  notifyLowStock,
  notifyOrderConfirmation,
  notifyFarmerApproval,
  notifyNewOrder,
  notifyProductApproved,
  notifyProductRejected,
  notifyOrderUpdate,
  notifyPaymentReceived,
  notifyReviewReceived,
  notifySubscriptionCreated,
  notifySubscriptionCancelled,
  notifySubscriptionDelivery,
  notifyOrderCancelled,
  // Customer notifications
  notifyOrderPlaced,
  notifyOrderConfirmed,
  notifyOrderPacked,
  notifyOrderShipped,
  notifyOrderOutForDelivery,
  notifyOrderDelivered,
  notifyCustomerSubscriptionCreated,
  notifySubscriptionPaymentProcessed,
  notifySubscriptionDeliveryScheduled,
  notifyProductBackInStock,
  notifyPriceDrop,
  notifyFarmersNewProduct,
  notifyPromotionalOffer,
  notifyAccountStatusChange
};
