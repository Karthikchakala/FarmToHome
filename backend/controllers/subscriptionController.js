const { query, transaction } = require('../db');
const logger = require('../config/logger');
const supabase = require('../config/supabaseClient');

// Create subscription
const createSubscription = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { productId, frequency, deliveryDay, quantity, deliveryAddress } = req.body;

    // Validate input
    if (!productId || !frequency || !deliveryDay || !quantity || !deliveryAddress) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: productId, frequency, deliveryDay, quantity, deliveryAddress'
      });
    }

    // Validate frequency
    const validFrequencies = ['WEEKLY', 'BIWEEKLY', 'MONTHLY'];
    if (!validFrequencies.includes(frequency)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid frequency. Must be WEEKLY, BIWEEKLY, or MONTHLY'
      });
    }

    // Validate delivery day
    const validDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    if (!validDays.includes(deliveryDay)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid delivery day'
      });
    }

    // Check if product exists and is available
    const productResult = await query(
      'SELECT _id, name, priceperunit, isavailable FROM products WHERE _id = $1 AND isavailable = true',
      [productId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product not found or not available'
      });
    }

    const product = productResult.rows[0];

    // Check if user already has an active subscription for this product
    const existingSubscription = await query(`
      SELECT _id FROM subscriptions 
      WHERE consumerid = $1 AND productid = $2 AND status = 'ACTIVE'
    `, [userId, productId]);

    if (existingSubscription.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'You already have an active subscription for this product'
      });
    }

    // Calculate subscription price
    const subscriptionPrice = product.priceperunit * quantity;

    // Get consumer ID
    const consumerResult = await query(
      'SELECT _id FROM consumers WHERE userid = $1',
      [userId]
    );

    if (consumerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Consumer profile not found'
      });
    }

    const consumerId = consumerResult.rows[0]._id;

    // Create subscription
    const result = await query(`
      INSERT INTO subscriptions (
        consumerid, 
        productid, 
        frequency, 
        deliveryday, 
        quantity, 
        deliveryaddress, 
        price, 
        status,
        nextdeliverydate
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', CURRENT_DATE + INTERVAL '1 week')
      RETURNING *
    `, [consumerId, productId, frequency, deliveryDay, quantity, deliveryAddress, subscriptionPrice]);

    logger.info(`Subscription created: userId=${userId}, productId=${productId}, frequency=${frequency}`);

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: {
        subscription: {
          ...result.rows[0],
          product_name: product.name,
          product_price: product.priceperunit
        }
      }
    });

  } catch (error) {
    logger.error('Create subscription error:', error);
    next(error);
  }
};

// Get user subscriptions
const getUserSubscriptions = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build simple Supabase query without complex joins
    let supabaseQuery = supabase
      .from('subscriptions')
      .select('*', { count: 'exact' })
      .eq('consumerid', userId)
      .order('createdat', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    // Apply status filter if provided
    if (status) {
      supabaseQuery = supabaseQuery.eq('status', status);
    }

    const { data: subscriptions, error, count } = await supabaseQuery;

    if (error) {
      logger.error('Get user subscriptions error:', error);
      throw new Error('Failed to fetch subscriptions');
    }

    // Format the response with basic subscription data
    const formattedSubscriptions = subscriptions.map(subscription => ({
      _id: subscription._id,
      consumerId: subscription.consumerid,
      productId: subscription.productid,
      frequency: subscription.frequency,
      deliveryDay: subscription.deliveryday,
      quantity: subscription.quantity,
      deliveryAddress: subscription.deliveryaddress,
      status: subscription.status,
      createdAt: subscription.createdat,
      updatedAt: subscription.updatedat,
      nextDeliveryDate: subscription.nextdeliverydate,
      productName: 'Product ' + subscription.productid, // Placeholder
      productImages: [],
      unit: 'kg', // Placeholder
      pricePerUnit: 0, // Placeholder
      category: 'vegetables', // Placeholder
      farmName: 'Farm', // Placeholder
      farmerName: 'Farmer' // Placeholder
    }));

    res.status(200).json({
      success: true,
      data: {
        subscriptions: formattedSubscriptions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          pages: Math.ceil((count || 0) / parseInt(limit)),
          hasNext: offset + parseInt(limit) < (count || 0),
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    logger.error('Get user subscriptions error:', error);
    next(error);
  }
};

// Update subscription
const updateSubscription = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { subscriptionId } = req.params;
    const { quantity, deliveryAddress, frequency, deliveryDay } = req.body;

    // Get subscription and verify ownership
    const subscriptionResult = await query(`
      SELECT s._id, s.consumerid, s.productid, s.status
      FROM subscriptions s
      LEFT JOIN consumers c ON s.consumerid = c._id
      WHERE s._id = $1 AND c.userid = $2
    `, [subscriptionId, userId]);

    if (subscriptionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    const subscription = subscriptionResult.rows[0];

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (quantity !== undefined) {
      updateFields.push(`quantity = $${paramIndex++}`);
      updateValues.push(quantity);
    }

    if (deliveryAddress !== undefined) {
      updateFields.push(`deliveryaddress = $${paramIndex++}`);
      updateValues.push(deliveryAddress);
    }

    if (frequency !== undefined) {
      updateFields.push(`frequency = $${paramIndex++}`);
      updateValues.push(frequency);
    }

    if (deliveryDay !== undefined) {
      updateFields.push(`deliveryday = $${paramIndex++}`);
      updateValues.push(deliveryDay);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    // Add updated timestamp
    updateFields.push(`updatedat = CURRENT_TIMESTAMP`);
    updateValues.push(subscriptionId);

    const updateQuery = `
      UPDATE subscriptions 
      SET ${updateFields.join(', ')}
      WHERE _id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(updateQuery, updateValues);

    logger.info(`Subscription updated: subscriptionId=${subscriptionId}, userId=${userId}`);

    res.status(200).json({
      success: true,
      message: 'Subscription updated successfully',
      data: {
        subscription: result.rows[0]
      }
    });

  } catch (error) {
    logger.error('Update subscription error:', error);
    next(error);
  }
};

// Pause/Resume subscription
const toggleSubscriptionStatus = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { subscriptionId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['ACTIVE', 'PAUSED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be ACTIVE, PAUSED, or CANCELLED'
      });
    }

    // Get subscription and verify ownership
    const subscriptionResult = await query(`
      SELECT s._id, s.consumerid, s.status
      FROM subscriptions s
      LEFT JOIN consumers c ON s.consumerid = c._id
      WHERE s._id = $1 AND c.userid = $2
    `, [subscriptionId, userId]);

    if (subscriptionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    const currentSubscription = subscriptionResult.rows[0];

    // Validate status transition
    if (currentSubscription.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify cancelled subscription'
      });
    }

    const result = await query(`
      UPDATE subscriptions 
      SET status = $1, updatedat = CURRENT_TIMESTAMP
      WHERE _id = $2
      RETURNING *
    `, [status, subscriptionId]);

    logger.info(`Subscription status updated: subscriptionId=${subscriptionId}, status=${status}`);

    res.status(200).json({
      success: true,
      message: `Subscription ${status.toLowerCase()} successfully`,
      data: {
        subscription: result.rows[0]
      }
    });

  } catch (error) {
    logger.error('Toggle subscription status error:', error);
    next(error);
  }
};

// Get all subscriptions (admin only)
const getAllSubscriptions = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = '';
    const params = [parseInt(limit), offset];

    if (status) {
      whereClause = 'WHERE s.status = $3';
      params.push(status);
    }

    const subscriptionsQuery = `
      SELECT 
        s.*,
        p.name as product_name,
        p.priceperunit,
        p.unit,
        p.category,
        c.userid as consumer_id,
        u.email as consumer_email,
        u.name as consumer_name,
        f.farmname,
        fu.name as farmer_name
      FROM subscriptions s
      LEFT JOIN products p ON s.productid = p._id
      LEFT JOIN consumers c ON s.consumerid = c._id
      LEFT JOIN users u ON c.userid = u._id
      LEFT JOIN farmers f ON p.farmerid = f._id
      LEFT JOIN users fu ON f.userid = fu._id
      ${whereClause}
      ORDER BY s.createdat DESC
      LIMIT $1 OFFSET $2
    `;

    const countQuery = `
      SELECT COUNT(*) as total FROM subscriptions s ${whereClause}
    `;

    const [subscriptionsResult, countResult] = await Promise.all([
      query(subscriptionsQuery, params),
      query(countQuery, whereClause ? [status] : [])
    ]);

    const total = parseInt(countResult.rows[0].total);

    res.status(200).json({
      success: true,
      data: {
        subscriptions: subscriptionsResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Get all subscriptions error:', error);
    next(error);
  }
};

// Get subscription analytics (admin only)
const getSubscriptionAnalytics = async (req, res, next) => {
  try {
    const [
      totalSubscriptions,
      activeSubscriptions,
      pausedSubscriptions,
      cancelledSubscriptions,
      subscriptionsByFrequency,
      revenueBySubscription,
      newSubscriptionsThisMonth
    ] = await Promise.all([
      query('SELECT COUNT(*) as count FROM subscriptions'),
      query('SELECT COUNT(*) as count FROM subscriptions WHERE status = \'ACTIVE\''),
      query('SELECT COUNT(*) as count FROM subscriptions WHERE status = \'PAUSED\''),
      query('SELECT COUNT(*) as count FROM subscriptions WHERE status = \'CANCELLED\''),
      query(`
        SELECT frequency, COUNT(*) as count
        FROM subscriptions
        WHERE status = 'ACTIVE'
        GROUP BY frequency
      `),
      query(`
        SELECT 
          SUM(price) as total_revenue,
          COUNT(*) as active_count
        FROM subscriptions 
        WHERE status = 'ACTIVE'
      `),
      query(`
        SELECT COUNT(*) as count
        FROM subscriptions 
        WHERE DATE_TRUNC('month', createdat) = DATE_TRUNC('month', CURRENT_DATE)
      `)
    ]);

    const analytics = {
      total_subscriptions: parseInt(totalSubscriptions.rows[0].count) || 0,
      active_subscriptions: parseInt(activeSubscriptions.rows[0].count) || 0,
      paused_subscriptions: parseInt(pausedSubscriptions.rows[0].count) || 0,
      cancelled_subscriptions: parseInt(cancelledSubscriptions.rows[0].count) || 0,
      subscriptions_by_frequency: subscriptionsByFrequency.rows.map(row => ({
        frequency: row.frequency,
        count: parseInt(row.count) || 0
      })),
      revenue: {
        monthly_revenue: parseFloat(revenueBySubscription.rows[0].total_revenue) || 0,
        active_count: parseInt(revenueBySubscription.rows[0].active_count) || 0
      },
      new_subscriptions_this_month: parseInt(newSubscriptionsThisMonth.rows[0].count) || 0
    };

    res.status(200).json({
      success: true,
      data: analytics
    });

  } catch (error) {
    logger.error('Get subscription analytics error:', error);
    next(error);
  }
};

module.exports = {
  createSubscription,
  getUserSubscriptions,
  updateSubscription,
  toggleSubscriptionStatus,
  getAllSubscriptions,
  getSubscriptionAnalytics
};
