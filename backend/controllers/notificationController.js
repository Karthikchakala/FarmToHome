const { query } = require('../db');
const logger = require('../config/logger');
const { asyncHandler, NotFoundError, ValidationError } = require('../middlewares/enhancedErrorHandler');

// Create notification
const createNotification = asyncHandler(async (req, res) => {
  const { userId, title, message, type = 'INFO', priority = 'MEDIUM', data } = req.body;

  // Validate input
  if (!userId || !title || !message) {
    throw new ValidationError('User ID, title, and message are required');
  }

  // Validate priority
  const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  if (!validPriorities.includes(priority)) {
    throw new ValidationError('Invalid priority. Must be LOW, MEDIUM, HIGH, or URGENT');
  }

  // Validate type
  const validTypes = ['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'ORDER', 'PRODUCT', 'SYSTEM', 'ORDER_PLACED', 'ORDER_STATUS', 'PAYMENT_SUCCESS', 'PAYMENT_FAILURE', 'SUBSCRIPTION_ORDER'];
  if (!validTypes.includes(type)) {
    throw new ValidationError('Invalid notification type');
  }

  const result = await query(`
    INSERT INTO notifications (userid, type, title, message, data, isread, createdat)
    VALUES ($1, $2, $3, $4, $5, false, CURRENT_TIMESTAMP)
    RETURNING *
  `, [userId, type, title, message, JSON.stringify(data || {})]);

  logger.info(`Notification created: userId=${userId}, type=${type}, priority=${priority}`);

  return res.status(201).json({
    success: true,
    message: 'Notification created successfully',
    data: {
      notification: result.rows[0]
    }
  });
});

// Get user notifications with pagination and filtering
const getUserNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, type, isread, priority } = req.query;
  
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Build WHERE conditions
  const whereConditions = ['userid = $1'];
  const queryParams = [userId];

  let paramIndex = 2;

  if (type) {
    whereConditions.push(`type = $${paramIndex}`);
    queryParams.push(type);
    paramIndex++;
  }

  if (isread !== undefined) {
    whereConditions.push(`isread = $${paramIndex}`);
    queryParams.push(isread === 'true');
    paramIndex++;
  }

  if (priority) {
    whereConditions.push(`priority = $${paramIndex}`);
    queryParams.push(priority);
    paramIndex++;
  }

  const whereClause = whereConditions.join(' AND ');

  // Get notifications
  const notificationsQuery = `
    SELECT 
      _id,
      type,
      title,
      message,
      data,
      isread,
      createdat,
      updatedat
    FROM notifications
    WHERE ${whereClause}
    ORDER BY createdat DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  queryParams.push(parseInt(limit), offset);

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM notifications
    WHERE ${whereClause}
  `;

  const [notificationsResult, countResult] = await Promise.all([
    query(notificationsQuery, queryParams),
    query(countQuery, queryParams.slice(0, -2))
  ]);

  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / parseInt(limit));

  // Parse JSON data for notifications
  const notifications = notificationsResult.rows.map(notification => ({
    ...notification,
    data: notification.data ? JSON.parse(notification.data) : {}
  }));

  return res.json({
    success: true,
    data: {
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      unreadCount: await getUnreadCount(userId)
    }
  });
});

// Mark notification as read
const markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { notificationId } = req.params;

  // Validate notification exists and belongs to user
  const notificationCheckQuery = `
    SELECT _id, userid, isread
    FROM notifications
    WHERE _id = $1 AND userid = $2
  `;

  const notificationResult = await query(notificationCheckQuery, [notificationId, userId]);

  if (notificationResult.rows.length === 0) {
    throw new NotFoundError('Notification not found');
  }

  // Update notification as read
  const updateQuery = `
    UPDATE notifications
    SET isread = true, updatedat = CURRENT_TIMESTAMP
    WHERE _id = $1 AND userid = $2
    RETURNING *
  `;

  const updateResult = await query(updateQuery, [notificationId, userId]);

  logger.info(`Notification marked as read: notificationId=${notificationId}, userId=${userId}`);

  return res.json({
    success: true,
    message: 'Notification marked as read',
    data: {
      notification: {
        ...updateResult.rows[0],
        data: updateResult.rows[0].data ? JSON.parse(updateResult.rows[0].data) : {}
      }
    }
  });
});

// Mark all notifications as read
const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const updateQuery = `
    UPDATE notifications
    SET isread = true, updatedat = CURRENT_TIMESTAMP
    WHERE userid = $1 AND isread = false
    RETURNING _id
  `;

  const updateResult = await query(updateQuery, [userId]);

  const updatedCount = updateResult.rows.length;

  logger.info(`All notifications marked as read: userId=${userId}, count=${updatedCount}`);

  return res.json({
    success: true,
    message: `${updatedCount} notifications marked as read`,
    data: {
      updatedCount,
      unreadCount: 0
    }
  });
});

// Delete notification
const deleteNotification = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { notificationId } = req.params;

  // Validate notification exists and belongs to user
  const notificationCheckQuery = `
    SELECT _id, userid
    FROM notifications
    WHERE _id = $1 AND userid = $2
  `;

  const notificationResult = await query(notificationCheckQuery, [notificationId, userId]);

  if (notificationResult.rows.length === 0) {
    throw new NotFoundError('Notification not found');
  }

  // Delete notification
  const deleteQuery = `
    DELETE FROM notifications
    WHERE _id = $1 AND userid = $2
    RETURNING *
  `;

  const deleteResult = await query(deleteQuery, [notificationId, userId]);

  logger.info(`Notification deleted: notificationId=${notificationId}, userId=${userId}`);

  return res.json({
    success: true,
    message: 'Notification deleted successfully',
    data: {
      notification: deleteResult.rows[0]
    }
  });
});

// Get unread notification count
const getUnreadCount = async (userId) => {
  try {
    const countQuery = `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE userid = $1 AND isread = false
    `;

    const result = await query(countQuery, [userId]);
    return parseInt(result.rows[0].count);
  } catch (error) {
    logger.error('Error getting unread count:', error);
    return 0;
  }
};

// Get unread notification count (API endpoint)
const getUnreadNotificationsCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const unreadCount = await getUnreadCount(userId);

  return res.json({
    success: true,
    data: {
      unreadCount
    }
  });
});

// Create bulk notifications (for system events)
const createBulkNotifications = asyncHandler(async (req, res) => {
  const { notifications } = req.body;

  if (!Array.isArray(notifications) || notifications.length === 0) {
    throw new ValidationError('Notifications array is required');
  }

  // Validate each notification
  const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  const validTypes = ['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'ORDER', 'PRODUCT', 'SYSTEM', 'ORDER_PLACED', 'ORDER_STATUS', 'PAYMENT_SUCCESS', 'PAYMENT_FAILURE', 'SUBSCRIPTION_ORDER'];

  for (const notification of notifications) {
    if (!notification.userId || !notification.title || !notification.message) {
      throw new ValidationError('Each notification must have userId, title, and message');
    }

    if (!validPriorities.includes(notification.priority || 'MEDIUM')) {
      throw new ValidationError('Invalid priority in notification');
    }

    if (!validTypes.includes(notification.type || 'INFO')) {
      throw new ValidationError('Invalid type in notification');
    }
  }

  // Insert notifications in bulk
  const insertPromises = notifications.map(notification =>
    query(`
      INSERT INTO notifications (userid, type, title, message, data, isread, createdat)
      VALUES ($1, $2, $3, $4, $5, false, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      notification.userId,
      notification.type || 'INFO',
      notification.title,
      notification.message,
      JSON.stringify(notification.data || {})
    ])
  );

  const results = await Promise.all(insertPromises);
  const insertedNotifications = results.map(result => result.rows[0]);

  logger.info(`Bulk notifications created: count=${insertedNotifications.length}`);

  return res.status(201).json({
    success: true,
    message: `${insertedNotifications.length} notifications created successfully`,
    data: {
      notifications: insertedNotifications.map(notification => ({
        ...notification,
        data: notification.data ? JSON.parse(notification.data) : {}
      }))
    }
  });
});

// Clear old notifications (cleanup job)
const clearOldNotifications = asyncHandler(async (req, res) => {
  const { daysOld = 30 } = req.query;

  const deleteQuery = `
    DELETE FROM notifications
    WHERE createdat < CURRENT_DATE - INTERVAL '${daysOld} days'
    RETURNING _id
  `;

  const deleteResult = await query(deleteQuery);
  const deletedCount = deleteResult.rows.length;

  logger.info(`Old notifications cleared: count=${deletedCount}, daysOld=${daysOld}`);

  return res.json({
    success: true,
    message: `${deletedCount} old notifications cleared`,
    data: {
      deletedCount,
      daysOld: parseInt(daysOld)
    }
  });
});

// Helper function to create notification for events
const createEventNotification = async (userId, type, title, message, data = {}) => {
  try {
    const result = await query(`
      INSERT INTO notifications (userid, type, title, message, data, isread, createdat)
      VALUES ($1, $2, $3, $4, $5, false, CURRENT_TIMESTAMP)
      RETURNING *
    `, [userId, type, title, message, JSON.stringify(data)]);

    logger.info(`Event notification created: userId=${userId}, type=${type}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating event notification:', error);
    return null;
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadNotificationsCount,
  createBulkNotifications,
  clearOldNotifications,
  createEventNotification,
  getUnreadCount
};
