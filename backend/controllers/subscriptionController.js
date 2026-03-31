const { query, transaction } = require('../db');
const logger = require('../config/logger');
const supabase = require('../config/supabaseClient');

// Create subscription
const createSubscription = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { productId, frequency, deliveryDay, quantity, deliveryAddress, requireApproval = false } = req.body;

    // Validate input
    if (!productId || !frequency || !deliveryDay || !quantity || !deliveryAddress) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: productId, frequency, deliveryDay, quantity, deliveryAddress'
      });
    }

    // Validate frequency
    const validFrequencies = ['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'DAILY'];
    if (!validFrequencies.includes(frequency)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid frequency. Must be WEEKLY, BIWEEKLY, MONTHLY, or DAILY'
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
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('_id, name, priceperunit, isavailable, farmerid')
      .eq('_id', productId)
      .eq('isavailable', true)
      .single();

    if (productError || !product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found or not available'
      });
    }

    // Check if user already has an active subscription for this product
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('_id')
      .eq('consumerid', userId)
      .eq('productid', productId)
      .eq('status', 'ACTIVE')
      .single();

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        error: 'You already have an active subscription for this product'
      });
    }

    // Calculate subscription price
    const subscriptionPrice = product.priceperunit * quantity;

    // Get consumer ID
    const { data: consumer, error: consumerError } = await supabase
      .from('consumers')
      .select('_id')
      .eq('userid', userId)
      .single();

    if (consumerError || !consumer) {
      return res.status(404).json({
        success: false,
        error: 'Consumer profile not found'
      });
    }

    // Create subscription
    const subscriptionData = {
      consumerid: consumer._id,
      farmerid: product.farmerid,
      products: [{
        productId: productId,
        quantity: quantity,
        price: product.priceperunit
      }],
      productid: productId,
      frequency: frequency,
      deliveryday: deliveryDay,
      quantity: quantity,
      deliveryaddress: deliveryAddress,
      price: subscriptionPrice,
      status: 'ACTIVE',
      nextdeliverydate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      requireapproval: requireApproval
    };

    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single();

    if (subscriptionError) {
      logger.error('Subscription creation error:', subscriptionError);
      throw new Error(`Failed to create subscription: ${subscriptionError.message}`);
    }

    logger.info(`Subscription created: userId=${userId}, productId=${productId}, frequency=${frequency}`);

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: {
        subscription: {
          ...subscription,
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
    const { id: subscriptionId } = req.params;
    const { status } = req.body;
    const userRole = req.user.role;

    // Validate status
    const validStatuses = ['ACTIVE', 'PAUSED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be ACTIVE, PAUSED, or CANCELLED'
      });
    }

    let subscriptionData;

    // Check access based on user role
    if (userRole === 'farmer') {
      // Farmer access - check if subscription belongs to farmer's products
      const { data: farmer, error: farmerError } = await supabase
        .from('farmers')
        .select('_id')
        .eq('userid', userId)
        .single();

      if (farmerError || !farmer) {
        return res.status(404).json({
          success: false,
          error: 'Farmer not found'
        });
      }

      const { data: subscriptions, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select(`
          _id,
          consumerid,
          status,
          products!inner(
            farmerid
          )
        `)
        .eq('_id', subscriptionId)
        .eq('products.farmerid', farmer._id);

      if (subscriptionError || !subscriptions || subscriptions.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Subscription not found or access denied'
        });
      }

      subscriptionData = subscriptions[0];
    } else {
      // Consumer access - check if subscription belongs to consumer
      const { data: consumer, error: consumerError } = await supabase
        .from('consumers')
        .select('_id')
        .eq('userid', userId)
        .single();

      if (consumerError || !consumer) {
        return res.status(404).json({
          success: false,
          error: 'Consumer not found'
        });
      }

      const { data: subscriptions, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('_id, consumerid, status')
        .eq('_id', subscriptionId)
        .eq('consumerid', consumer._id);

      if (subscriptionError || !subscriptions || subscriptions.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Subscription not found or access denied'
        });
      }

      subscriptionData = subscriptions[0];
    }

    // Update subscription status
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('subscriptions')
      .update({ 
        status: status,
        updatedat: new Date().toISOString()
      })
      .eq('_id', subscriptionId)
      .select()
      .single();

    if (updateError) {
      logger.error('Error updating subscription status:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update subscription status'
      });
    }

    res.status(200).json({
      success: true,
      message: `Subscription ${status.toLowerCase()} successfully`,
      data: updatedSubscription
    });

  } catch (error) {
    logger.error('Error toggling subscription status:', error);
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

// Get farmer subscriptions
const getFarmerSubscriptions = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    console.log('Getting farmer subscriptions for userId:', userId);

    // Get farmer record
    const { data: farmer, error: farmerError } = await supabase
      .from('farmers')
      .select('_id')
      .eq('userid', userId)
      .single();

    console.log('Farmer result:', { data: farmer, error: farmerError });

    if (farmerError || !farmer) {
      return res.status(404).json({
        success: false,
        error: 'Farmer profile not found'
      });
    }

    const farmerId = farmer._id;
    console.log('Farmer ID:', farmerId);

    // Build Supabase query
    let supabaseQuery = supabase
      .from('subscriptions')
      .select('*', { count: 'exact' })
      .eq('farmerid', farmerId)
      .order('createdat', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    // Apply status filter if provided
    if (status) {
      supabaseQuery = supabaseQuery.eq('status', status);
    }

    console.log('Querying subscriptions with farmerId:', farmerId);

    const { data: subscriptions, error, count } = await supabaseQuery;

    console.log('Subscriptions result:', { data: subscriptions, error, count });

    if (error) {
      logger.error('Get farmer subscriptions error:', error);
      throw new Error('Failed to fetch subscriptions');
    }

    // Get product details for each subscription
    const formattedSubscriptions = await Promise.all(
      subscriptions.map(async (subscription) => {
        console.log('Processing subscription:', subscription._id);
        
        const { data: product } = await supabase
          .from('products')
          .select('name, images, unit, priceperunit, category')
          .eq('_id', subscription.productid)
          .single();

        const { data: consumer } = await supabase
          .from('consumers')
          .select('userid')
          .eq('_id', subscription.consumerid)
          .single();

        // Get consumer name from users table
        let consumerName = 'Unknown';
        let consumerPhone = 'Not available';
        let consumerEmail = 'Not available';
        if (consumer?.userid) {
          const { data: userData } = await supabase
            .from('users')
            .select('name, phone, email')
            .eq('_id', consumer.userid)
            .single();
          consumerName = userData?.name || 'Unknown';
          consumerPhone = userData?.phone || 'Not available';
          consumerEmail = userData?.email || 'Not available';
        }

        const formatted = {
          _id: subscription._id,
          consumerId: subscription.consumerid,
          productId: subscription.productid,
          frequency: subscription.frequency,
          deliveryDay: subscription.deliveryday,
          quantity: subscription.quantity,
          deliveryAddress: subscription.deliveryaddress,
          status: subscription.status,
          price: subscription.price,
          nextDeliveryDate: subscription.nextdeliverydate,
          lastDeliveryDate: subscription.lastdeliverydate,
          skipCount: subscription.skipcount,
          pausedUntil: subscription.pauseduntil,
          requireApproval: subscription.requireapproval,
          createdAt: subscription.createdat,
          updatedAt: subscription.updatedat,
          productName: product?.name || 'Unknown Product',
          productImages: product?.images || [],
          unit: product?.unit || 'kg',
          pricePerUnit: product?.priceperunit || 0,
          category: product?.category || 'vegetables',
          consumerName: consumerName,
          consumerPhone: consumerPhone,
          consumerEmail: consumerEmail
        };
        
        console.log('Formatted subscription:', formatted);
        return formatted;
      })
    );

    console.log('Final formattedSubscriptions array:', formattedSubscriptions);

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
    logger.error('Get farmer subscriptions error:', error);
    next(error);
  }
};

// Modify subscription
const modifySubscription = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { subscriptionId } = req.params;
    const { quantity, deliveryAddress, frequency, deliveryDay, requireApproval } = req.body;

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
        error: 'Subscription not found or access denied'
      });
    }

    const subscription = subscriptionResult.rows[0];

    if (subscription.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify cancelled subscription'
      });
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (quantity !== undefined) {
      updates.push(`quantity = $${paramCount++}`);
      values.push(quantity);
    }

    if (deliveryAddress !== undefined) {
      updates.push(`deliveryaddress = $${paramCount++}`);
      values.push(JSON.stringify(deliveryAddress));
    }

    if (frequency !== undefined) {
      const validFrequencies = ['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'DAILY'];
      if (!validFrequencies.includes(frequency)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid frequency. Must be WEEKLY, BIWEEKLY, MONTHLY, or DAILY'
        });
      }
      updates.push(`frequency = $${paramCount++}`);
      values.push(frequency);
    }

    if (deliveryDay !== undefined) {
      const validDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
      if (!validDays.includes(deliveryDay)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid delivery day'
        });
      }
      updates.push(`deliveryday = $${paramCount++}`);
      values.push(deliveryDay);
    }

    if (requireApproval !== undefined) {
      updates.push(`requireapproval = $${paramCount++}`);
      values.push(requireApproval);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    updates.push(`updatedat = CURRENT_TIMESTAMP`);
    values.push(subscriptionId);

    const result = await query(`
      UPDATE subscriptions 
      SET ${updates.join(', ')}
      WHERE _id = $${paramCount}
      RETURNING *
    `, values);

    logger.info(`Subscription modified: userId=${userId}, subscriptionId=${subscriptionId}`);

    res.status(200).json({
      success: true,
      message: 'Subscription modified successfully',
      data: {
        subscription: result.rows[0]
      }
    });

  } catch (error) {
    logger.error('Modify subscription error:', error);
    next(error);
  }
};

// Skip subscription delivery
const skipSubscriptionDelivery = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { subscriptionId } = req.params;
    const { skipDate, reason } = req.body;

    // Verify subscription ownership
    const subscriptionResult = await query(`
      SELECT s._id, s.consumerid, s.status, s.nextdeliverydate
      FROM subscriptions s
      LEFT JOIN consumers c ON s.consumerid = c._id
      WHERE s._id = $1 AND c.userid = $2
    `, [subscriptionId, userId]);

    if (subscriptionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found or access denied'
      });
    }

    const subscription = subscriptionResult.rows[0];

    if (subscription.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: 'Can only skip deliveries for active subscriptions'
      });
    }

    // Add skip record
    await query(`
      INSERT INTO subscription_skips (subscriptionid, skipdate, reason)
      VALUES ($1, $2, $3)
    `, [subscriptionId, skipDate || subscription.nextdeliverydate, reason]);

    // Update skip count
    await query(`
      UPDATE subscriptions 
      SET skipcount = skipcount + 1,
          updatedat = CURRENT_TIMESTAMP
      WHERE _id = $1
    `, [subscriptionId]);

    logger.info(`Subscription delivery skipped: userId=${userId}, subscriptionId=${subscriptionId}, skipDate=${skipDate}`);

    res.status(200).json({
      success: true,
      message: 'Delivery skipped successfully'
    });

  } catch (error) {
    logger.error('Skip subscription delivery error:', error);
    next(error);
  }
};

// Approve subscription delivery
const approveSubscriptionDelivery = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { subscriptionId } = req.params;
    const { approve, notes } = req.body;

    // Verify subscription ownership
    const subscriptionResult = await query(`
      SELECT s._id, s.consumerid, s.status, s.nextdeliverydate
      FROM subscriptions s
      LEFT JOIN consumers c ON s.consumerid = c._id
      WHERE s._id = $1 AND c.userid = $2
    `, [subscriptionId, userId]);

    if (subscriptionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found or access denied'
      });
    }

    const subscription = subscriptionResult.rows[0];

    // Create or update delivery record
    if (approve) {
      await query(`
        INSERT INTO subscription_deliveries (subscriptionid, deliverydate, status, approvedat, notes)
        VALUES ($1, $2, 'APPROVED', CURRENT_TIMESTAMP, $3)
        ON CONFLICT (subscriptionid, deliverydate) 
        DO UPDATE SET status = 'APPROVED', approvedat = CURRENT_TIMESTAMP, notes = $3
      `, [subscriptionId, subscription.nextdeliverydate, notes]);

      res.status(200).json({
        success: true,
        message: 'Delivery approved successfully'
      });
    } else {
      await query(`
        INSERT INTO subscription_deliveries (subscriptionid, deliverydate, status, notes)
        VALUES ($1, $2, 'SKIPPED', $3)
        ON CONFLICT (subscriptionid, deliverydate) 
        DO UPDATE SET status = 'SKIPPED', notes = $3
      `, [subscriptionId, subscription.nextdeliverydate, notes]);

      // Update next delivery date
      const nextDate = new Date(subscription.nextdeliverydate);
      nextDate.setDate(nextDate.getDate() + 7); // Default to weekly

      await query(`
        UPDATE subscriptions 
        SET nextdeliverydate = $1, updatedat = CURRENT_TIMESTAMP
        WHERE _id = $2
      `, [nextDate, subscriptionId]);

      res.status(200).json({
        success: true,
        message: 'Delivery skipped successfully'
      });
    }

  } catch (error) {
    logger.error('Approve subscription delivery error:', error);
    next(error);
  }
};

module.exports = {
  createSubscription,
  getUserSubscriptions,
  updateSubscription,
  toggleSubscriptionStatus,
  getAllSubscriptions,
  getSubscriptionAnalytics,
  getFarmerSubscriptions,
  modifySubscription,
  skipSubscriptionDelivery,
  approveSubscriptionDelivery
};
