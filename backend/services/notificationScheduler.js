const cron = require('node-cron');
const NotificationService = require('./notificationService');
const MarketingNotificationService = require('./marketingNotificationService');
const logger = require('../config/logger');

// Notification Scheduler Service
class NotificationScheduler {
  
  static initialize() {
    logger.info('Initializing notification scheduler...');
    
    // Check for low stock alerts every hour
    cron.schedule('0 * * * *', async () => {
      logger.info('Running scheduled low stock check...');
      await NotificationService.checkLowStockAlerts();
    }, {
      scheduled: true,
      timezone: 'Asia/Kolkata'
    });
    
    // Check for upcoming subscription deliveries every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      logger.info('Running scheduled upcoming delivery check...');
      await NotificationService.checkUpcomingDeliveries();
    }, {
      scheduled: true,
      timezone: 'Asia/Kolkata'
    });
    
    // Check for upcoming subscription deliveries for customers every 4 hours
    cron.schedule('0 */4 * * *', async () => {
      logger.info('Running scheduled customer delivery reminder check...');
      await MarketingNotificationService.notifyUpcomingSubscriptionDeliveries();
    }, {
      scheduled: true,
      timezone: 'Asia/Kolkata'
    });
    
    // Send weekly promotional offers on Mondays at 9 AM
    cron.schedule('0 9 * * 1', async () => {
      logger.info('Running weekly promotional offers...');
      // This would be triggered by admin to create offers
      // await MarketingNotificationService.sendPromotionalOffer(offerData);
    }, {
      scheduled: true,
      timezone: 'Asia/Kolkata'
    });
    
    logger.info('Notification scheduler initialized successfully');
  }
  
  // Manual trigger for testing
  static async runLowStockCheck() {
    logger.info('Manually triggering low stock check...');
    await NotificationService.checkLowStockAlerts();
  }
  
  static async runUpcomingDeliveryCheck() {
    logger.info('Manually triggering upcoming delivery check...');
    await NotificationService.checkUpcomingDeliveries();
  }
}

module.exports = NotificationScheduler;
