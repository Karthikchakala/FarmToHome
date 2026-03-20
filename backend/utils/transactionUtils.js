const { query, transaction } = require('../db');
const logger = require('../config/logger');

// Transaction utilities for order safety
class TransactionUtils {
  // Create order with full transaction safety
  static async createOrderWithTransaction(orderData) {
    const client = await transaction();
    
    try {
      const { userId, items, deliveryAddress, paymentMethod, notes } = orderData;
      
      // 1. Validate stock availability
      const stockCheckQuery = `
        SELECT 
          p._id,
          p.name,
          p.stockquantity,
          p.priceperunit,
          p.farmerid,
          c.quantity as requested_quantity,
          (p.stockquantity >= c.quantity) as can_fulfill
        FROM cart c
        JOIN products p ON c.productid = p._id
        WHERE c.userid = $1
      `;

      const stockResult = await client.query(stockCheckQuery, [userId]);
      
      // Check if all items have sufficient stock
      const insufficientItems = stockResult.rows.filter(item => !item.can_fulfill);
      if (insufficientItems.length > 0) {
        throw new Error(`Insufficient stock for: ${insufficientItems.map(item => item.name).join(', ')}`);
      }

      // 2. Atomic stock update with concurrency control
      const stockUpdatePromises = stockResult.rows.map(item => 
        client.query(`
          UPDATE products 
          SET stockquantity = stockquantity - $1,
              updatedat = CURRENT_TIMESTAMP
          WHERE _id = $2 
            AND stockquantity >= $1
          RETURNING stockquantity
        `, [item.requested_quantity, item._id])
      );

      const stockUpdateResults = await Promise.all(stockUpdatePromises);
      
      // Verify all stock updates succeeded
      const failedUpdates = stockUpdateResults.filter(result => result.rows.length === 0);
      if (failedUpdates.length > 0) {
        throw new Error('Stock update failed - items may have gone out of stock');
      }

      // 3. Create orders (one per farmer)
      const ordersByFarmer = {};
      stockResult.rows.forEach(item => {
        if (!ordersByFarmer[item.farmerid]) {
          ordersByFarmer[item.farmerid] = {
            items: [],
            subtotal: 0
          };
        }
        ordersByFarmer[item.farmerid].items.push(item);
        ordersByFarmer[item.farmerid].subtotal += item.priceperunit * item.requested_quantity;
      });

      const orderPromises = Object.keys(ordersByFarmer).map(farmerId => {
        const farmerOrder = ordersByFarmer[farmerId];
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        return client.query(`
          INSERT INTO orders (
            userid, farmerid, ordernumber, totalamount, deliveryaddress,
            paymentmethod, status, items, deliverycharge, commission, notes, createdat, updatedat
          ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, 0, 0, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING *
        `, [
          userId, farmerId, orderNumber, farmerOrder.subtotal,
          JSON.stringify(deliveryAddress), paymentMethod,
          JSON.stringify(farmerOrder.items), notes || null
        ]);
      });

      const orderResults = await Promise.all(orderPromises);
      
      // 4. Clear cart
      await client.query('DELETE FROM cart WHERE userid = $1', [userId]);
      
      // 5. Create notifications
      const notificationPromises = orderResults.map(order => 
        client.query(`
          INSERT INTO notifications (userid, type, title, message, data, createdat)
          VALUES ($1, 'order_placed', 'Order Placed', $2, $3, CURRENT_TIMESTAMP)
        `, [
          userId,
          `Your order ${order.rows[0].ordernumber} has been placed successfully`,
          JSON.stringify({ orderId: order.rows[0]._id })
        ])
      );

      await Promise.all(notificationPromises);

      await client.query('COMMIT');
      
      return {
        success: true,
        orders: orderResults.map(result => result.rows[0]),
        stockUpdates: stockUpdateResults.map(result => result.rows[0])
      };

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction failed:', error);
      throw error;
    }
  }

  // Subscription order with transaction safety
  static async createSubscriptionOrder(subscriptionData) {
    const client = await transaction();
    
    try {
      const { subscriptionId, userId, productId, quantity, farmerId, deliveryAddress } = subscriptionData;
      
      // 1. Check stock availability
      const stockCheckQuery = `
        SELECT stockquantity, priceperunit, name
        FROM products 
        WHERE _id = $1 AND farmerid = $2 AND isavailable = true
      `;

      const stockResult = await client.query(stockCheckQuery, [productId, farmerId]);
      
      if (stockResult.rows.length === 0) {
        throw new Error('Product not found or not available');
      }

      const product = stockResult.rows[0];
      if (product.stockquantity < quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stockquantity}, Requested: ${quantity}`);
      }

      // 2. Atomic stock update
      const stockUpdateResult = await client.query(`
        UPDATE products 
        SET stockquantity = stockquantity - $1,
            updatedat = CURRENT_TIMESTAMP
        WHERE _id = $2 
          AND stockquantity >= $1
        RETURNING stockquantity
      `, [quantity, productId]);

      if (stockUpdateResult.rows.length === 0) {
        throw new Error('Stock update failed - product may have gone out of stock');
      }

      // 3. Create order
      const orderNumber = `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const totalAmount = product.priceperunit * quantity;
      
      const orderResult = await client.query(`
        INSERT INTO orders (
          userid, farmerid, ordernumber, totalamount, deliveryaddress,
          paymentmethod, status, items, deliverycharge, commission, notes, createdat, updatedat
        ) VALUES ($1, $2, $3, $4, $5, 'SUBSCRIPTION', 'pending', $6, 0, 0, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `, [
        userId, farmerId, orderNumber, totalAmount,
        JSON.stringify(deliveryAddress),
        JSON.stringify([{
          productid: productId,
          name: product.name,
          quantity: quantity,
          priceperunit: product.priceperunit
        }]),
        'Automatic subscription order'
      ]);

      // 4. Update subscription next delivery date
      await client.query(`
        UPDATE subscriptions 
        SET lastdeliverydate = CURRENT_DATE,
            nextdeliverydate = CURRENT_DATE + INTERVAL '7 days',
            updatedat = CURRENT_TIMESTAMP
        WHERE _id = $1
      `, [subscriptionId]);

      // 5. Create notifications
      await client.query(`
        INSERT INTO notifications (userid, type, title, message, data, createdat)
        VALUES ($1, 'subscription_order', 'Subscription Order Created', $2, $3, CURRENT_TIMESTAMP)
      `, [
        userId,
        `Your subscription order ${orderNumber} has been created automatically`,
        JSON.stringify({ orderId: orderResult.rows[0]._id, subscriptionId })
      ]);

      await client.query('COMMIT');
      
      return {
        success: true,
        order: orderResult.rows[0],
        stockUpdate: stockUpdateResult.rows[0]
      };

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Subscription transaction failed:', error);
      throw error;
    }
  }

  // Update order status with notification
  static async updateOrderStatus(orderId, newStatus, message = null) {
    const client = await transaction();
    
    try {
      // 1. Update order status
      const orderResult = await client.query(`
        UPDATE orders 
        SET status = $1, updatedat = CURRENT_TIMESTAMP
        WHERE _id = $2
        RETURNING userid, farmerid, ordernumber, status
      `, [newStatus, orderId]);

      if (orderResult.rows.length === 0) {
        throw new Error('Order not found');
      }

      const order = orderResult.rows[0];

      // 2. Create notification for user
      await client.query(`
        INSERT INTO notifications (userid, type, title, message, data, createdat)
        VALUES ($1, 'order_status', 'Order Status Updated', $2, $3, CURRENT_TIMESTAMP)
      `, [
        order.userid,
        `Your order ${order.ordernumber} status has been updated to ${newStatus}`,
        JSON.stringify({ orderId, status: newStatus })
      ]);

      await client.query('COMMIT');
      
      return {
        success: true,
        order: order
      };

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Order status update failed:', error);
      throw error;
    }
  }
}

module.exports = TransactionUtils;
