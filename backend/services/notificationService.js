const { 
  notifyLowStock,
  notifyOrderConfirmation,
  notifyFarmerApproval,
  notifyNewOrder,
  notifyProductApproved,
  notifyProductRejected,
  notifyOrderUpdate,
  notifyPaymentReceived,
  notifyReviewReceived
} = require('../controllers/notificationController');

const supabase = require('../config/supabase');

// Service to trigger notifications based on business events
class NotificationService {
  
  // Check for low stock and send notifications
  static async checkLowStockAlerts() {
    try {
      console.log('Checking for low stock alerts...');
      
      // Get all products with low stock (less than 10 units)
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          *,
          farmers!inner(userid, farmname)
        `)
        .lt('stockquantity', 10);

      if (error) {
        console.error('Error checking low stock:', error);
        return;
      }

      // Send notifications for each low stock product
      for (const product of products || []) {
        await notifyLowStock(
          product.farmers.userid,
          product.name,
          product.stockquantity,
          10
        );
      }

      console.log(`Processed ${products?.length || 0} low stock alerts`);
    } catch (error) {
      console.error('Error in checkLowStockAlerts:', error);
    }
  }

  // Send order confirmation to customer
  static async sendOrderConfirmation(orderId, customerUserId, orderNumber) {
    try {
      await notifyOrderConfirmation(customerUserId, orderId, orderNumber);
      console.log(`Order confirmation sent for order ${orderNumber}`);
    } catch (error) {
      console.error('Error sending order confirmation:', error);
    }
  }

  // Send new order notification to farmer
  static async sendNewOrderNotification(orderId, farmerUserId, orderNumber, customerName) {
    try {
      await notifyNewOrder(farmerUserId, orderId, orderNumber, customerName);
      console.log(`New order notification sent to farmer for order ${orderNumber}`);
    } catch (error) {
      console.error('Error sending new order notification:', error);
    }
  }

  // Send farmer approval notification
  static async sendFarmerApprovalNotification(farmerUserId, farmName) {
    try {
      await notifyFarmerApproval(farmerUserId, farmName);
      console.log(`Farmer approval notification sent for ${farmName}`);
    } catch (error) {
      console.error('Error sending farmer approval notification:', error);
    }
  }

  // Send product approval notification
  static async sendProductApprovalNotification(farmerUserId, productName) {
    try {
      await notifyProductApproved(farmerUserId, productName);
      console.log(`Product approval notification sent for ${productName}`);
    } catch (error) {
      console.error('Error sending product approval notification:', error);
    }
  }

  // Send product rejection notification
  static async sendProductRejectionNotification(farmerUserId, productName, reason) {
    try {
      await notifyProductRejected(farmerUserId, productName, reason);
      console.log(`Product rejection notification sent for ${productName}`);
    } catch (error) {
      console.error('Error sending product rejection notification:', error);
    }
  }

  // Send order status update notification
  static async sendOrderUpdateNotification(orderId, orderNumber, status, customerUserId) {
    try {
      await notifyOrderUpdate(customerUserId, orderId, orderNumber, status);
      console.log(`Order update notification sent for order ${orderNumber} - ${status}`);
    } catch (error) {
      console.error('Error sending order update notification:', error);
    }
  }

  // Send payment received notification to farmer
  static async sendPaymentReceivedNotification(farmerUserId, orderId, orderNumber, amount) {
    try {
      await notifyPaymentReceived(farmerUserId, orderId, orderNumber, amount);
      console.log(`Payment received notification sent for order ${orderNumber}`);
    } catch (error) {
      console.error('Error sending payment received notification:', error);
    }
  }

  // Send review received notification to farmer
  static async sendReviewReceivedNotification(farmerUserId, productName, rating, customerName) {
    try {
      await notifyReviewReceived(farmerUserId, productName, rating, customerName);
      console.log(`Review received notification sent for ${productName}`);
    } catch (error) {
      console.error('Error sending review received notification:', error);
    }
  }

  // Send bulk notifications (e.g., system updates)
  static async sendBulkNotification(userIds, title, message, type = 'system_update', priority = 'medium') {
    try {
      const { createNotification } = require('../controllers/notificationController');
      
      for (const userId of userIds) {
        await createNotification(userId, title, message, type, priority);
      }
      
      console.log(`Bulk notification sent to ${userIds.length} users`);
    } catch (error) {
      console.error('Error sending bulk notification:', error);
    }
  }

  // Get notification statistics
  static async getNotificationStats() {
    try {
      const { data: stats, error } = await supabase
        .from('notifications')
        .select('type, priority, isread', { count: 'exact' });

      if (error) throw error;

      const totalNotifications = stats?.length || 0;
      const unreadNotifications = stats?.filter(n => !n.isread).length || 0;
      
      const typeStats = {};
      const priorityStats = {};
      
      stats?.forEach(notification => {
        typeStats[notification.type] = (typeStats[notification.type] || 0) + 1;
        priorityStats[notification.priority] = (priorityStats[notification.priority] || 0) + 1;
      });

      return {
        total: totalNotifications,
        unread: unreadNotifications,
        read: totalNotifications - unreadNotifications,
        byType: typeStats,
        byPriority: priorityStats
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {
        total: 0,
        unread: 0,
        read: 0,
        byType: {},
        byPriority: {}
      };
    }
  }
}

module.exports = NotificationService;
