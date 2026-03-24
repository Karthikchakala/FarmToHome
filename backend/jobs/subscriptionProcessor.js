const cron = require('node-cron');
const { query, transaction } = require('../db');
const logger = require('../config/logger');
const { 
  calculateDistance, 
  isWithinRadius, 
  parseLocation, 
  calculateDeliveryCharge 
} = require('../utils/locationUtils');
const { sendSubscriptionTriggeredEmail } = require('../services/emailService');

class SubscriptionProcessor {
  constructor() {
    this.isProcessing = false;
    this.processedCount = 0;
    this.failedCount = 0;
  }

  // Main cron job - runs daily at 9 AM
  start() {
    // Run every day at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
      logger.info('Starting daily subscription processing...');
      await this.processSubscriptions();
    });

    // Also run at midnight for backup processing
    cron.schedule('0 0 * * *', async () => {
      logger.info('Running backup subscription processing...');
      await this.processSubscriptions();
    });

    logger.info('Subscription processor cron jobs scheduled');
  }

  // Process all due subscriptions
  async processSubscriptions() {
    if (this.isProcessing) {
      logger.warn('Subscription processing already in progress, skipping...');
      return;
    }

    this.isProcessing = true;
    this.processedCount = 0;
    this.failedCount = 0;

    try {
      // Get all active subscriptions due today
      const dueSubscriptions = await this.getDueSubscriptions();
      
      logger.info(`Found ${dueSubscriptions.length} subscriptions due for processing`);

      for (const subscription of dueSubscriptions) {
        try {
          await this.processSubscription(subscription);
          this.processedCount++;
        } catch (error) {
          logger.error(`Failed to process subscription ${subscription._id}:`, error);
          this.failedCount++;
        }
      }

      logger.info(`Subscription processing completed. Processed: ${this.processedCount}, Failed: ${this.failedCount}`);

    } catch (error) {
      logger.error('Subscription processing error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Get subscriptions due today
  async getDueSubscriptions() {
    const result = await query(`
      SELECT 
        s._id,
        s.consumerid,
        s.productid,
        s.quantity,
        s.deliveryaddress,
        s.price,
        s.frequency,
        s.deliveryday,
        s.nextdeliverydate,
        c.userid as consumer_userid,
        c.defaultaddress,
        p.name as product_name,
        p.priceperunit,
        p.stockquantity,
        p.unit,
        p.farmerid,
        f.userid as farmer_userid,
        f.farmname,
        f.location as farmer_location,
        f.deliveryradius
      FROM subscriptions s
      LEFT JOIN consumers c ON s.consumerid = c._id
      LEFT JOIN products p ON s.productid = p._id
      LEFT JOIN farmers f ON p.farmerid = f._id
      WHERE s.status = 'ACTIVE'
        AND s.nextdeliverydate <= CURRENT_DATE
        AND p.isavailable = true
        AND p.stockquantity >= s.quantity
      ORDER BY s.nextdeliverydate ASC
    `);

    return result.rows;
  }

  // Process individual subscription
  async processSubscription(subscription) {
    const client = await transaction();
    
    try {
      // Check if subscription requires approval
      if (subscription.requireapproval) {
        await this.createPendingApproval(client, subscription);
        await client.query('COMMIT');
        logger.info(`Created pending approval for subscription ${subscription._id}`);
        return;
      }

      // Check if delivery is skipped
      const isSkipped = await this.isDeliverySkipped(subscription._id, subscription.nextdeliverydate);
      if (isSkipped) {
        await this.skipDeliveryAndUpdateNext(client, subscription);
        await client.query('COMMIT');
        logger.info(`Skipped delivery for subscription ${subscription._id}`);
        return;
      }

      // Validate delivery distance
      const deliveryValidation = await this.validateDelivery(subscription);
      if (!deliveryValidation.canDeliver) {
        logger.warn(`Delivery validation failed for subscription ${subscription._id}: ${deliveryValidation.reason}`);
        await this.skipSubscription(client, subscription._id, deliveryValidation.reason);
        return;
      }

      // Create automatic order
      const order = await this.createAutomaticOrder(client, subscription, deliveryValidation);
      
      // Update product stock
      await this.updateProductStock(client, subscription);
      
      // Update next delivery date
      await this.updateNextDeliveryDate(client, subscription);
      
      // Create delivery record
      await this.createDeliveryRecord(client, subscription, order._id, 'DELIVERED');
      
      // Create notifications
      await this.createNotifications(subscription, order, deliveryValidation);
      
      await client.query('COMMIT');
      
      logger.info(`Successfully processed subscription ${subscription._id}, created order ${order._id}`);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Create pending approval
  async createPendingApproval(client, subscription) {
    await client.query(`
      INSERT INTO subscription_deliveries (subscriptionid, deliverydate, status)
      VALUES ($1, $2, 'PENDING')
      ON CONFLICT (subscriptionid, deliverydate) DO NOTHING
    `, [subscription._id, subscription.nextdeliverydate]);

    // Send approval request notification
    await this.sendApprovalRequest(subscription);
  }

  // Check if delivery is skipped
  async isDeliverySkipped(subscriptionId, deliveryDate) {
    const result = await query(`
      SELECT 1 FROM subscription_skips 
      WHERE subscriptionid = $1 AND skipdate = $2
    `, [subscriptionId, deliveryDate]);
    
    return result.rows.length > 0;
  }

  // Skip delivery and update next date
  async skipDeliveryAndUpdateNext(client, subscription) {
    await this.createDeliveryRecord(client, subscription, null, 'SKIPPED');
    await this.updateNextDeliveryDate(client, subscription);
  }

  // Create delivery record
  async createDeliveryRecord(client, subscription, orderId, status) {
    await client.query(`
      INSERT INTO subscription_deliveries (subscriptionid, orderid, deliverydate, status)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (subscriptionid, deliverydate) 
      DO UPDATE SET orderid = $2, status = $4, updatedat = CURRENT_TIMESTAMP
    `, [subscription._id, orderId, subscription.nextdeliverydate, status]);
  }

  // Send approval request
  async sendApprovalRequest(subscription) {
    try {
      // Get consumer details
      const consumerResult = await query(`
        SELECT c.userid, c.name, c.email 
        FROM consumers c 
        WHERE c._id = $1
      `, [subscription.consumerid]);

      if (consumerResult.rows.length > 0) {
        const consumer = consumerResult.rows[0];
        
        // Send email notification
        await sendSubscriptionTriggeredEmail({
          to: consumer.email,
          subject: 'Action Required: Approve Your Upcoming Delivery',
          template: 'subscription-approval',
          data: {
            customerName: consumer.name,
            productName: subscription.product_name,
            deliveryDate: subscription.nextdeliverydate,
            quantity: subscription.quantity,
            approvalLink: `${process.env.FRONTEND_URL}/customer/subscriptions/${subscription._id}/approve`
          }
        });
      }
    } catch (error) {
      logger.error('Failed to send approval request:', error);
    }
  }

  // Validate delivery distance and availability
  async validateDelivery(subscription) {
    // Parse delivery address
    let deliveryAddress;
    try {
      deliveryAddress = typeof subscription.deliveryaddress === 'string' 
        ? JSON.parse(subscription.deliveryaddress)
        : subscription.deliveryaddress;
    } catch (error) {
      return { canDeliver: false, reason: 'Invalid delivery address format' };
    }

    // Check if coordinates are available
    if (!deliveryAddress.latitude || !deliveryAddress.longitude) {
      // Try to use consumer's default address
      if (subscription.defaultaddress) {
        try {
          const defaultAddress = JSON.parse(subscription.defaultaddress);
          if (defaultAddress.latitude && defaultAddress.longitude) {
            deliveryAddress = { ...deliveryAddress, ...defaultAddress };
          }
        } catch (error) {
          return { canDeliver: false, reason: 'No valid delivery coordinates available' };
        }
      } else {
        return { canDeliver: false, reason: 'No delivery coordinates available' };
      }
    }

    // Parse farmer location
    const farmerLocation = parseLocation(subscription.farmer_location);
    if (!farmerLocation) {
      return { canDeliver: false, reason: 'Farmer location not available' };
    }

    // Calculate distance
    const distance = calculateDistance(
      parseFloat(deliveryAddress.latitude),
      parseFloat(deliveryAddress.longitude),
      farmerLocation.latitude,
      farmerLocation.longitude
    );

    const deliveryRadius = subscription.deliveryradius || 8;
    const canDeliver = isWithinRadius(
      parseFloat(deliveryAddress.latitude),
      parseFloat(deliveryAddress.longitude),
      farmerLocation.latitude,
      farmerLocation.longitude,
      deliveryRadius
    );

    return {
      canDeliver,
      reason: canDeliver ? null : `Distance ${distance.toFixed(2)}km exceeds delivery radius ${deliveryRadius}km`,
      distance: Math.round(distance * 100) / 100,
      deliveryCharge: calculateDeliveryCharge(distance),
      deliveryTime: getDeliveryTimeEstimate(distance)
    };
  }

  // Create automatic order
  async createAutomaticOrder(client, subscription, deliveryValidation) {
    const orderNumber = `SUB${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    // Prepare order items
    const orderItems = [{
      productId: subscription.productid,
      productName: subscription.product_name,
      quantity: subscription.quantity,
      pricePerUnit: subscription.priceperunit,
      total: subscription.price
    }];

    // Prepare delivery address
    const deliveryAddress = typeof subscription.deliveryaddress === 'string' 
      ? JSON.parse(subscription.deliveryaddress)
      : subscription.deliveryaddress;

    // Calculate totals
    const subtotal = subscription.price;
    const deliveryCharge = deliveryValidation.deliveryCharge;
    const platformCommission = Math.round(subtotal * 0.05);
    const totalAmount = subtotal + deliveryCharge + platformCommission;

    // Insert order
    const orderResult = await client.query(`
      INSERT INTO orders (
        userid, 
        farmerid, 
        ordernumber, 
        totalamount, 
        deliveryaddress, 
        paymentmethod, 
        status, 
        items, 
        deliverycharge,
        platformcommission,
        notes,
        createdat,
        updatedat
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      subscription.consumer_userid,
      subscription.farmer_userid,
      orderNumber,
      totalAmount,
      JSON.stringify(deliveryAddress),
      'SUBSCRIPTION_AUTO',
      'confirmed',
      JSON.stringify(orderItems),
      deliveryCharge,
      platformCommission,
      `Automatic order from subscription. Distance: ${deliveryValidation.distance}km, Delivery time: ${deliveryValidation.deliveryTime}`
    ]);

    return orderResult.rows[0];
  }

  // Update product stock
  async updateProductStock(client, subscription) {
    await client.query(`
      UPDATE products 
      SET stockquantity = stockquantity - $1, 
          updatedat = CURRENT_TIMESTAMP
      WHERE _id = $2 AND stockquantity >= $1
    `, [subscription.quantity, subscription.productid]);
  }

  // Update next delivery date
  async updateNextDeliveryDate(client, subscription) {
    let nextDate;
    const currentDate = new Date(subscription.nextdeliverydate);

    switch (subscription.frequency) {
      case 'WEEKLY':
        nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'BIWEEKLY':
        nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'MONTHLY':
        nextDate = new Date(currentDate);
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      default:
        nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + 7);
    }

    await client.query(`
      UPDATE subscriptions 
      SET nextdeliverydate = $1, 
          updatedat = CURRENT_TIMESTAMP,
          lastdeliverydate = CURRENT_DATE
      WHERE _id = $2
    `, [nextDate, subscription._id]);
  }

  // Skip subscription (when delivery not possible)
  async skipSubscription(client, subscriptionId, reason) {
    await client.query(`
      UPDATE subscriptions 
      SET status = 'PAUSED',
          updatedat = CURRENT_TIMESTAMP,
          notes = COALESCE(notes, '') || ' Skipped: ' || $1
      WHERE _id = $2
    `, [reason, subscriptionId]);
  }

  // Create notifications for user and farmer
  async createNotifications(subscription, order, deliveryValidation) {
    const notifications = [];

    // Consumer notification
    notifications.push({
      userid: subscription.consumer_userid,
      type: 'subscription_order',
      title: 'Subscription Order Created',
      message: `Your subscription order for ${subscription.product_name} has been automatically placed. Order #${order.ordernumber}. Delivery time: ${deliveryValidation.deliveryTime}`,
      data: JSON.stringify({ orderId: order._id, subscriptionId: subscription._id })
    });

    // Farmer notification
    notifications.push({
      userid: subscription.farmer_userid,
      type: 'new_subscription_order',
      title: 'New Subscription Order',
      message: `New subscription order received: ${subscription.product_name} (${subscription.quantity} ${subscription.unit}). Order #${order.ordernumber}`,
      data: JSON.stringify({ orderId: order._id, subscriptionId: subscription._id })
    });

    // Insert notifications
    for (const notification of notifications) {
      await query(`
        INSERT INTO notifications (userid, type, title, message, data, createdat)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      `, [
        notification.userid,
        notification.type,
        notification.title,
        notification.message,
        notification.data
      ]);
    }

    // Send email notification for subscription order
    try {
      // Get customer email
      const customerQuery = 'SELECT name, email FROM users WHERE _id = $1';
      const customerResult = await query(customerQuery, [subscription.consumer_userid]);
      
      if (customerResult.rows.length > 0) {
        const subscriptionEmailData = {
          orderNumber: order.ordernumber,
          customerName: customerResult.rows[0].name || 'Customer',
          customerEmail: customerResult.rows[0].email,
          frequency: subscription.frequency,
          productName: subscription.product_name,
          quantity: subscription.quantity,
          unit: subscription.unit,
          amount: order.totalamount,
          nextDelivery: subscription.nextdeliverydate,
          farmerName: subscription.farmer_name || 'Farmer'
        };

        // Send email (non-blocking)
        sendSubscriptionTriggeredEmail(subscriptionEmailData).catch(emailError => {
          logger.error(`Failed to send subscription email for order ${order.ordernumber}:`, emailError);
        });
      }
    } catch (emailError) {
      logger.error('Error in subscription email process:', emailError);
      // Don't fail the subscription if email fails
    }
  }

  // Get processing status
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      processedCount: this.processedCount,
      failedCount: this.failedCount
    };
  }

  // Manual trigger for testing
  async manualTrigger() {
    logger.info('Manual subscription processing triggered');
    await this.processSubscriptions();
  }
}

// Create and export singleton instance
const subscriptionProcessor = new SubscriptionProcessor();

module.exports = subscriptionProcessor;
