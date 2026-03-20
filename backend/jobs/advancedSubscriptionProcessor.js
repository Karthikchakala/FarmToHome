const cron = require('node-cron');
const { query, transaction } = require('../db');
const logger = require('../config/logger');
const { 
  calculateDistance, 
  isWithinRadius, 
  parseLocation, 
  calculateDeliveryCharge 
} = require('../utils/locationUtils');
const { createEventNotification } = require('../controllers/notificationController');
const { sendSubscriptionTriggeredEmail } = require('../services/emailService');

class AdvancedSubscriptionProcessor {
  constructor() {
    this.isProcessing = false;
    this.processedCount = 0;
    this.failedCount = 0;
    this.skippedCount = 0;
  }

  // Main cron job - runs daily at 9 AM
  start() {
    // Run every day at 9:00 AM
    cron.schedule('0 9 * * *', () => {
      this.processDueSubscriptions();
    });

    // Also run every hour to catch any missed subscriptions
    cron.schedule('0 * * * *', () => {
      this.processDueSubscriptions();
    });

    logger.info('Advanced subscription processor started - Daily at 9:00 AM and hourly checks');
  }

  // Process all due subscriptions
  async processDueSubscriptions() {
    if (this.isProcessing) {
      logger.warn('Subscription processor already running, skipping this run');
      return;
    }

    this.isProcessing = true;
    this.processedCount = 0;
    this.failedCount = 0;
    this.skippedCount = 0;

    try {
      logger.info('Starting subscription processing...');

      // Get all subscriptions due today
      const dueSubscriptionsQuery = `
        SELECT 
          s._id,
          s.userid as consumer_userid,
          s.productid,
          s.farmerid,
          s.quantity,
          s.frequency,
          s.status,
          s.nextdeliverydate,
          s.deliveryaddress,
          s.notes,
          p.name as product_name,
          p.priceperunit,
          p.unit,
          p.stockquantity as available_stock,
          p.isavailable as product_available,
          f.userid as farmer_userid,
          f.farmname,
          f.location as farmer_location,
          f.deliveryradius,
          u.name as consumer_name,
          u.email as consumer_email
        FROM subscriptions s
        JOIN products p ON s.productid = p._id
        JOIN farmers f ON s.farmerid = f._id
        JOIN users u ON s.userid = u._id
        WHERE s.nextdeliverydate <= CURRENT_DATE
          AND s.status = 'ACTIVE'
          AND f.isapproved = true
        ORDER BY s.nextdeliverydate ASC
      `;

      const dueSubscriptions = await query(dueSubscriptionsQuery);

      logger.info(`Found ${dueSubscriptions.rows.length} due subscriptions`);

      // Process each subscription
      for (const subscription of dueSubscriptions.rows) {
        try {
          await this.processSubscription(subscription);
          this.processedCount++;
        } catch (error) {
          logger.error(`Failed to process subscription ${subscription._id}:`, error);
          this.failedCount++;
          
          // Skip this subscription and update next delivery date
          await this.skipSubscription(subscription._id, error.message);
        }
      }

      logger.info(`Subscription processing completed: ${this.processedCount} processed, ${this.failedCount} failed, ${this.skippedCount} skipped`);

    } catch (error) {
      logger.error('Subscription processing error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Process individual subscription
  async processSubscription(subscription) {
    const client = await transaction();

    try {
      // 1. Validate product availability and stock
      if (!subscription.product_available) {
        throw new Error(`Product ${subscription.product_name} is not available`);
      }

      if (subscription.available_stock < subscription.quantity) {
        throw new Error(`Insufficient stock for ${subscription.product_name}. Available: ${subscription.available_stock}, Required: ${subscription.quantity}`);
      }

      // 2. Validate delivery location
      const deliveryValidation = await this.validateDeliveryLocation(
        subscription.farmer_location,
        subscription.deliveryaddress,
        subscription.deliveryradius
      );

      if (!deliveryValidation.canDeliver) {
        throw new Error(`Delivery location is outside farmer's delivery radius. Distance: ${deliveryValidation.distance}km, Radius: ${subscription.deliveryradius}km`);
      }

      // 3. Atomic stock update with concurrency control
      const stockUpdateResult = await client.query(`
        UPDATE products 
        SET stockquantity = stockquantity - $1,
            updatedat = CURRENT_TIMESTAMP
        WHERE _id = $2 
          AND stockquantity >= $1
        RETURNING stockquantity
      `, [subscription.quantity, subscription.productid]);

      if (stockUpdateResult.rows.length === 0) {
        throw new Error('Stock update failed - product may have gone out of stock during processing');
      }

      // 4. Create order
      const orderNumber = `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const totalAmount = subscription.priceperunit * subscription.quantity;
      
      const orderResult = await client.query(`
        INSERT INTO orders (
          userid, farmerid, ordernumber, totalamount, deliveryaddress,
          paymentmethod, status, items, deliverycharge, commission, notes, createdat, updatedat
        ) VALUES ($1, $2, $3, $4, $5, 'SUBSCRIPTION', 'pending', $6, 0, 0, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `, [
        subscription.consumer_userid,
        subscription.farmerid,
        orderNumber,
        totalAmount,
        subscription.deliveryaddress,
        JSON.stringify([{
          productid: subscription.productid,
          name: subscription.product_name,
          quantity: subscription.quantity,
          unit: subscription.unit,
          priceperunit: subscription.priceperunit
        }]),
        `Automatic subscription order - ${subscription.notes || ''}`
      ]);

      const order = orderResult.rows[0];

      // 5. Update subscription next delivery date
      const nextDeliveryDate = this.calculateNextDeliveryDate(subscription.frequency);
      await client.query(`
        UPDATE subscriptions 
        SET lastdeliverydate = CURRENT_DATE,
            nextdeliverydate = $1,
            updatedat = CURRENT_TIMESTAMP
        WHERE _id = $2
      `, [nextDeliveryDate, subscription._id]);

      // 6. Create notifications
      await this.createNotifications(subscription, order, deliveryValidation);

      // 7. Send email notification
      await this.sendEmailNotification(subscription, order);

      await client.query('COMMIT');

      logger.info(`Subscription processed successfully: subscriptionId=${subscription._id}, orderId=${order._id}`);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }

  // Validate delivery location
  async validateDeliveryLocation(farmerLocation, deliveryAddress, deliveryRadius) {
    try {
      const customerLocation = typeof deliveryAddress === 'string' 
        ? JSON.parse(deliveryAddress)
        : deliveryAddress;

      if (!customerLocation.latitude || !customerLocation.longitude) {
        throw new Error('Invalid customer location coordinates');
      }

      const farmerCoords = parseLocation(farmerLocation);
      if (!farmerCoords) {
        throw new Error('Invalid farmer location');
      }

      const distance = calculateDistance(
        parseFloat(customerLocation.latitude),
        parseFloat(customerLocation.longitude),
        farmerCoords.latitude,
        farmerCoords.longitude
      );

      const canDeliver = isWithinRadius(
        parseFloat(customerLocation.latitude),
        parseFloat(customerLocation.longitude),
        farmerCoords.latitude,
        farmerCoords.longitude,
        deliveryRadius
      );

      const deliveryCharge = calculateDeliveryCharge(distance, deliveryRadius);

      return {
        canDeliver,
        distance: Math.round(distance * 100) / 100,
        deliveryCharge,
        deliveryTime: this.getDeliveryTimeEstimate(distance)
      };

    } catch (error) {
      logger.error('Delivery validation error:', error);
      return {
        canDeliver: false,
        distance: 0,
        deliveryCharge: 0,
        deliveryTime: 'Unknown'
      };
    }
  }

  // Get delivery time estimate
  getDeliveryTimeEstimate(distance) {
    if (distance <= 3) return 'Same Day';
    if (distance <= 7) return 'Next Day';
    return '2-3 Days';
  }

  // Calculate next delivery date based on frequency
  calculateNextDeliveryDate(frequency) {
    const today = new Date();
    let nextDate = new Date(today);

    switch (frequency.toLowerCase()) {
      case 'weekly':
        nextDate.setDate(today.getDate() + 7);
        break;
      case 'biweekly':
        nextDate.setDate(today.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(today.getMonth() + 1);
        break;
      case 'daily':
        nextDate.setDate(today.getDate() + 1);
        break;
      default:
        nextDate.setDate(today.getDate() + 7); // Default to weekly
    }

    return nextDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  }

  // Create notifications for user and farmer
  async createNotifications(subscription, order, deliveryValidation) {
    // Consumer notification
    await createEventNotification(
      subscription.consumer_userid,
      'SUBSCRIPTION_ORDER',
      'Subscription Order Created',
      `Your subscription order for ${subscription.product_name} has been automatically placed. Order #${order.ordernumber}. Delivery time: ${deliveryValidation.deliveryTime}`,
      {
        orderId: order._id,
        subscriptionId: subscription._id,
        productName: subscription.product_name,
        quantity: subscription.quantity,
        nextDelivery: subscription.nextdeliverydate
      }
    );

    // Farmer notification
    await createEventNotification(
      subscription.farmer_userid,
      'NEW_SUBSCRIPTION_ORDER',
      'New Subscription Order',
      `New subscription order received: ${subscription.product_name} (${subscription.quantity} ${subscription.unit}). Order #${order.ordernumber}`,
      {
        orderId: order._id,
        subscriptionId: subscription._id,
        consumerName: subscription.consumer_name,
        productName: subscription.product_name,
        quantity: subscription.quantity
      }
    );
  }

  // Send email notification
  async sendEmailNotification(subscription, order) {
    try {
      const subscriptionEmailData = {
        orderNumber: order.ordernumber,
        customerName: subscription.consumer_name,
        customerEmail: subscription.consumer_email,
        frequency: subscription.frequency,
        productName: subscription.product_name,
        quantity: subscription.quantity,
        unit: subscription.unit,
        amount: order.totalamount,
        nextDelivery: subscription.nextdeliverydate,
        farmerName: subscription.farmname
      };

      // Send email (non-blocking)
      sendSubscriptionTriggeredEmail(subscriptionEmailData).catch(emailError => {
        logger.error(`Failed to send subscription email for order ${order.ordernumber}:`, emailError);
      });

    } catch (error) {
      logger.error('Error in subscription email process:', error);
      // Don't fail the subscription if email fails
    }
  }

  // Skip subscription (when delivery not possible)
  async skipSubscription(subscriptionId, reason) {
    try {
      await query(`
        UPDATE subscriptions 
        SET status = 'PAUSED',
            updatedat = CURRENT_TIMESTAMP,
            notes = COALESCE(notes, '') || ' Skipped: ' || $1
        WHERE _id = $2
      `, [reason, subscriptionId]);

      this.skippedCount++;
      logger.info(`Subscription skipped: subscriptionId=${subscriptionId}, reason=${reason}`);

    } catch (error) {
      logger.error('Error skipping subscription:', error);
    }
  }

  // Get processing status
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      processedCount: this.processedCount,
      failedCount: this.failedCount,
      skippedCount: this.skippedCount
    };
  }

  // Manual trigger for testing
  async manualTrigger() {
    logger.info('Manual subscription processing triggered');
    await this.processDueSubscriptions();
  }
}

// Create and export singleton instance
const subscriptionProcessor = new AdvancedSubscriptionProcessor();

module.exports = subscriptionProcessor;
