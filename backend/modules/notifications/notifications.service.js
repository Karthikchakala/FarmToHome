import { query } from '../../src/config/db.js';
import { sendEmail } from '../../utils/emailService.js';
import logger from '../../src/config/logger.js';

/**
 * Helper to store in-app notification
 */
const saveNotification = async (userId, type, title, message) => {
    try {
        await query(
            `INSERT INTO notifications (user_id, type, title, message) VALUES ($1, $2, $3, $4)`,
            [userId, type, title, message]
        );
    } catch (error) {
        logger.error('Failed to save in-app notification', error);
    }
};

/**
 * Triggers Order Confirmation
 */
export const sendOrderConfirmation = async ({ userId, consumerName, email, orderId, orderTotal, deliveryDetails, productList }) => {
    // Fire and forget email
    sendEmail({
        to: email,
        subject: 'Your Farm to Table Order has been placed',
        templateName: 'orderConfirmation',
        data: { consumerName, orderId, orderTotal, deliveryDetails, productList }
    });

    // Save DB notification
    saveNotification(userId, 'email', 'Order Placed', `Your order ${orderId} has been successfully placed.`);
};

/**
 * Triggers Order Status Update
 */
export const sendOrderStatusUpdate = async ({ userId, consumerName, email, orderId, currentStatus, estimatedDelivery }) => {
    sendEmail({
        to: email,
        subject: 'Your order status has been updated',
        templateName: 'orderStatusUpdate',
        data: { consumerName, orderId, currentStatus, estimatedDelivery }
    });

    saveNotification(userId, 'system', 'Order Status Update', `Your order ${orderId} is now ${currentStatus}.`);
};

/**
 * Triggers Farmer New Order Alert
 */
export const sendFarmerNewOrder = async ({ farmerUserId, farmerName, email, orderId, productsOrdered, consumerDetails }) => {
    sendEmail({
        to: email,
        subject: 'New Order Received',
        templateName: 'farmerNewOrder',
        data: { farmerName, orderId, productsOrdered, consumerDetails }
    });

    saveNotification(farmerUserId, 'system', 'New Order', `You received a new order ${orderId}.`);
};

/**
 * Triggers Low Stock Alert
 */
export const sendLowStockAlert = async ({ farmerUserId, farmerName, email, productName, currentStock, recommendedRestock }) => {
    sendEmail({
        to: email,
        subject: 'Low Stock Alert',
        templateName: 'lowStockAlert',
        data: { farmerName, productName, currentStock, recommendedRestock }
    });

    saveNotification(farmerUserId, 'system', 'Low Stock', `Product ${productName} is running low on stock (${currentStock}).`);
};

/**
 * GET user notifications
 */
export const getUserNotifications = async (userId) => {
    const result = await query(
        'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
        [userId]
    );
    return result.rows;
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId, userId) => {
    const result = await query(
        'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
        [notificationId, userId]
    );
    return result.rows[0];
};
