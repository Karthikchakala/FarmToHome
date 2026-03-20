const { query } = require('../db');
const logger = require('../config/logger');
const responseHelper = require('../utils/responseHelper');
const { asyncHandler, NotFoundError, ValidationError } = require('../middlewares/enhancedErrorHandler');
const { 
  calculateDistance, 
  isWithinRadius, 
  parseLocation, 
  calculateDeliveryCharge,
  getDeliveryTimeEstimate 
} = require('../utils/locationUtils');
const { sendOrderConfirmationEmails } = require('../services/emailService');
const supabase = require('../config/supabaseClient');

// Place new order with delivery validation
const placeOrder = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { deliveryAddress, paymentMethod = 'COD', notes } = req.body;

  // Validate input
  if (!deliveryAddress) {
    throw new ValidationError('Delivery address is required');
  }

  // Get customer's default address if not provided
  let customerAddress = deliveryAddress;
  if (!customerAddress.latitude || !customerAddress.longitude) {
    const customerQuery = `
      SELECT defaultaddress FROM consumers WHERE userid = $1
    `;
    const customerResult = await query(customerQuery, [userId]);
    
    if (customerResult.rows.length > 0 && customerResult.rows[0].defaultaddress) {
      const defaultAddress = JSON.parse(customerResult.rows[0].defaultaddress);
      if (defaultAddress.latitude && defaultAddress.longitude) {
        customerAddress = {
          ...customerAddress,
          latitude: defaultAddress.latitude,
          longitude: defaultAddress.longitude
        };
      }
    }
  }

  // Validate customer coordinates
  if (!customerAddress.latitude || !customerAddress.longitude) {
    throw new ValidationError('Customer location coordinates are required');
  }

  // Get cart items with stock validation
  const cartQuery = `
    SELECT 
      c._id,
      c.quantity,
      c.productid,
      p.name as product_name,
      p.priceperunit,
      p.stockquantity,
      p.isavailable,
      p.farmerid,
      f.location as farmer_location,
      f.deliveryradius,
      f.farmname
    FROM cart c
    JOIN products p ON c.productid = p._id
    JOIN farmers f ON p.farmerid = f._id
    WHERE c.userid = $1
  `;

  const cartResult = await query(cartQuery, [userId]);

  if (cartResult.rows.length === 0) {
    throw new ValidationError('Cart is empty');
  }

  // Validate stock availability and product availability
  for (const cartItem of cartResult.rows) {
    if (!cartItem.isavailable) {
      throw new ValidationError(`${cartItem.product_name} is currently not available`);
    }
    
    if (cartItem.stockquantity < cartItem.quantity) {
      throw new ValidationError(
        `Insufficient stock for ${cartItem.product_name}. Available: ${cartItem.stockquantity}, Requested: ${cartItem.quantity}`
      );
    }
  }

  // Validate delivery for each farmer
  const farmerValidationResults = [];
  for (const cartItem of cartResult.rows) {
    const farmerLocation = parseLocation(cartItem.farmer_location);
    
    if (!farmerLocation) {
      throw new ValidationError(`Farmer location not available for ${cartItem.farmname}`);
    }

    const distance = calculateDistance(
      parseFloat(customerAddress.latitude),
      parseFloat(customerAddress.longitude),
      farmerLocation.latitude,
      farmerLocation.longitude
    );

    const deliveryRadius = cartItem.deliveryradius || 8;
    const canDeliver = isWithinRadius(
      parseFloat(customerAddress.latitude),
      parseFloat(customerAddress.longitude),
      farmerLocation.latitude,
      farmerLocation.longitude,
      deliveryRadius
    );

    if (!canDeliver) {
      throw new ValidationError(
        `${cartItem.farmname} cannot deliver to your location. Distance: ${distance.toFixed(2)}km, Delivery radius: ${deliveryRadius}km`
      );
    }

    farmerValidationResults.push({
      farmerId: cartItem.farmerid,
      farmerName: cartItem.farmname,
      distance: Math.round(distance * 100) / 100,
      deliveryRadius,
      deliveryCharge: calculateDeliveryCharge(distance),
      deliveryTime: getDeliveryTimeEstimate(distance)
    });
  }

  // Group cart items by farmer
  const cartByFarmer = {};
  let totalAmount = 0;
  let totalDeliveryCharge = 0;

  for (const cartItem of cartResult.rows) {
    const farmerId = cartItem.farmerid;
    
    if (!cartByFarmer[farmerId]) {
      cartByFarmer[farmerId] = {
        farmerId,
        farmerName: cartItem.farmname,
        items: [],
        subtotal: 0,
        deliveryCharge: 0
      };
    }

    const itemTotal = cartItem.quantity * cartItem.priceperunit;
    cartByFarmer[farmerId].items.push({
      productId: cartItem.productid,
      productName: cartItem.product_name,
      quantity: cartItem.quantity,
      pricePerUnit: cartItem.priceperunit,
      total: itemTotal
    });

    cartByFarmer[farmerId].subtotal += itemTotal;
    totalAmount += itemTotal;
  }

  // Calculate delivery charges
  for (const farmerId in cartByFarmer) {
    const validation = farmerValidationResults.find(v => v.farmerId === farmerId);
    if (validation) {
      cartByFarmer[farmerId].deliveryCharge = validation.deliveryCharge;
      cartByFarmer[farmerId].distance = validation.distance;
      cartByFarmer[farmerId].deliveryTime = validation.deliveryTime;
      totalDeliveryCharge += validation.deliveryCharge;
    }
  }

  // Platform commission (5%)
  const platformCommission = Math.round(totalAmount * 0.05);
  const finalAmount = totalAmount + totalDeliveryCharge + platformCommission;

  // Start transaction
  await query('BEGIN');

  try {
    // Create orders for each farmer
    const orderIds = [];
    const orderPromises = [];

    for (const farmerId in cartByFarmer) {
      const farmerOrder = cartByFarmer[farmerId];
      const orderNumber = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;

      const orderQuery = `
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
      `;

      const orderPromise = query(orderQuery, [
        userId,
        farmerId,
        orderNumber,
        farmerOrder.subtotal + farmerOrder.deliveryCharge,
        JSON.stringify(customerAddress),
        paymentMethod,
        'pending',
        JSON.stringify(farmerOrder.items),
        farmerOrder.deliveryCharge,
        Math.round(farmerOrder.subtotal * 0.05), // 5% commission per order
        notes || null
      ]);

      orderPromises.push(orderPromise);
    }

    // Execute all order insertions
    const orderResults = await Promise.all(orderPromises);

    // Extract order IDs
    for (const result of orderResults) {
      orderIds.push(result.rows[0]._id);
    }

    // Update product stock with atomic operation
    const stockUpdatePromises = [];
    for (const cartItem of cartResult.rows) {
      const stockUpdateQuery = `
        UPDATE products 
        SET stockquantity = stockquantity - $1, 
            updatedat = CURRENT_TIMESTAMP
        WHERE _id = $2 AND stockquantity >= $1
        RETURNING stockquantity
      `;

      stockUpdatePromises.push(query(stockUpdateQuery, [cartItem.quantity, cartItem.productid]));
    }

    const stockUpdateResults = await Promise.all(stockUpdatePromises);

    // Verify all stock updates were successful
    for (let i = 0; i < stockUpdateResults.length; i++) {
      const result = stockUpdateResults[i];
      if (result.rows.length === 0) {
        throw new ValidationError(
          `Failed to update stock for ${cartResult.rows[i].product_name}. Product may have gone out of stock.`
        );
      }
    }

    // Clear cart
    await query('DELETE FROM cart WHERE userid = $1', [userId]);

    // Commit transaction
    await query('COMMIT');

    // Get created orders with details
    const ordersQuery = `
      SELECT 
        o.*,
        f.farmname,
        u.name as farmer_name
      FROM orders o
      LEFT JOIN farmers f ON o.farmerid = f._id
      LEFT JOIN users u ON f.userid = u._id
      WHERE o._id = ANY($1)
      ORDER BY o.createdat DESC
    `;

    const ordersResult = await query(ordersQuery, [orderIds]);

    const orders = ordersResult.rows.map(order => ({
      ...order,
      items: JSON.parse(order.items),
      deliveryaddress: JSON.parse(order.deliveryaddress)
    }));

    // Send email notifications
    try {
      // Get customer and farmer emails
      const customerQuery = 'SELECT email FROM users WHERE _id = $1';
      const customerResult = await query(customerQuery, [userId]);
      const customerEmail = customerResult.rows[0]?.email;

      // Send emails for each order
      for (const order of orders) {
        const orderEmailData = {
          orderNumber: order.ordernumber,
          customerName: customerResult.rows[0]?.name || 'Customer',
          customerEmail: customerEmail,
          farmerName: order.farmer_name || 'Farmer',
          farmerEmail: null, // Will be fetched if needed
          orderDate: order.createdat,
          totalAmount: order.totalamount,
          paymentMethod: order.paymentmethod,
          deliveryAddress: JSON.stringify(order.deliveryaddress),
          items: order.items.map(item => ({
            name: item.name || 'Product',
            quantity: item.quantity,
            unit: item.unit || 'unit',
            price: item.priceperunit,
            total: item.quantity * item.priceperunit
          })),
          estimatedDelivery: getDeliveryTimeEstimate(order.deliveryaddress)
        };

        // Get farmer email
        const farmerEmailQuery = `
          SELECT u.email 
          FROM users u 
          JOIN farmers f ON u._id = f.userid 
          WHERE f._id = $1
        `;
        const farmerEmailResult = await query(farmerEmailQuery, [order.farmerid]);
        orderEmailData.farmerEmail = farmerEmailResult.rows[0]?.email;

        // Send emails (non-blocking)
        sendOrderConfirmationEmails(orderEmailData).catch(emailError => {
          logger.error(`Failed to send order confirmation emails for order ${order.ordernumber}:`, emailError);
        });
      }
    } catch (emailError) {
      logger.error('Error in email notification process:', emailError);
      // Don't fail the order if email fails
    }

    logger.info(`Order placed successfully: userId=${userId}, orderCount=${orders.length}, totalAmount=${finalAmount}`);

    return responseHelper.created(res, {
      orders,
      summary: {
        totalItems: cartResult.rows.length,
        totalAmount,
        totalDeliveryCharge,
        platformCommission,
        finalAmount,
        orderCount: orders.length
      }
    }, 'Order placed successfully');

  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
});

// Get user orders with pagination and filtering
const getUserOrders = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10, status } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    // Build Supabase query - simplified without order_items join since table doesn't exist
    let supabaseQuery = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('consumerid', userId)
      .order('createdat', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    // Apply status filter if provided
    if (status) {
      supabaseQuery = supabaseQuery.eq('status', status);
    }

    const { data: orders, error, count } = await supabaseQuery;

    if (error) {
      logger.error('Get user orders error:', error);
      throw new Error('Failed to fetch orders');
    }

    // Format the response - simplified without items since order_items table doesn't exist
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      orderNumber: order.ordernumber,
      userId: order.consumerid,
      totalAmount: order.totalamount,
      status: order.status,
      paymentMethod: order.paymentmethod,
      deliveryAddress: {
        street: order.deliveryaddressstreet,
        city: order.deliveryaddresscity,
        state: order.deliveryaddressstate,
        postalCode: order.deliveryaddresspostalcode,
        location: order.deliveryaddresslocation
      },
      platformCommission: order.platformcommission,
      deliveryCharge: order.deliverycharge,
      finalAmount: order.finalamount,
      paymentStatus: order.paymentstatus,
      orderType: order.ordertype,
      deliveredAt: order.deliveredat,
      createdAt: order.createdat,
      updatedAt: order.updatedat,
      items: order.items || [] // Use items from orders table
    }));

    const response = responseHelper.custom(
      res,
      {
        success: true,
        message: 'Orders retrieved successfully',
        data: {
          orders: formattedOrders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count || 0,
            pages: Math.ceil((count || 0) / parseInt(limit)),
            hasNext: offset + parseInt(limit) < (count || 0),
            hasPrev: parseInt(page) > 1
          }
        }
      }
    );

    res.status(200).json(response);
  } catch (error) {
    logger.error('Get user orders error:', error);
    throw error;
  }
});

// Get order by ID
const getOrderById = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const sql = `
      SELECT 
        o._id,
        o.totalamount,
        o.status,
        o.deliveryaddress,
        o.paymentmethod,
        o.deliverycharge,
        o.platformcommission,
        o.notes,
        o.createdat,
        o.updatedat,
        o.items,
        o.ordernumber,
        CASE 
          WHEN o.status = 'PLACED' THEN 'Order placed successfully'
          WHEN o.status = 'CONFIRMED' THEN 'Order confirmed by farmer'
          WHEN o.status = 'PREPARING' THEN 'Order is being prepared'
          WHEN o.status = 'OUT_FOR_DELIVERY' THEN 'Order is out for delivery'
          WHEN o.status = 'DELIVERED' THEN 'Order delivered successfully'
          WHEN o.status = 'CANCELLED' THEN 'Order was cancelled'
          ELSE 'Order status updated'
        END as status_message
      FROM orders o
      WHERE o._id = $1 AND o.userid = $2
    `;

    const result = await query(sql, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    const order = result.rows[0];
    order.items = order.items ? JSON.parse(order.items) : [];

    res.status(200).json({
      success: true,
      data: {
        order
      }
    });

  } catch (error) {
    logger.error('Get order by ID error:', error);
    next(error);
  }
};

// Cancel order
const cancelOrder = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { reason } = req.body;

    // Check if order exists and belongs to user
    const orderResult = await query(
      'SELECT _id, status, items, createdat FROM orders WHERE _id = $1 AND userid = $2',
      [id, userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    const order = orderResult.rows[0];

    // Check if order can be cancelled (only if status is PLACED or CONFIRMED)
    if (!['PLACED', 'CONFIRMED'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: 'Order cannot be cancelled at this stage'
      });
    }

    // Start transaction
    const client = await transaction();
    
    try {
      await client.query('BEGIN');

      // Update order status
      await client.query(`
        UPDATE orders 
        SET status = 'CANCELLED', notes = COALESCE(notes, '') || ' | Cancelled: ' || $2, updatedat = CURRENT_TIMESTAMP
        WHERE _id = $1
      `, [id, reason || 'User requested cancellation']);

      // Restore product stock
      const items = order.items ? JSON.parse(order.items) : [];
      for (const item of items) {
        await client.query(`
          UPDATE products 
          SET stockquantity = stockquantity + $1 
          WHERE _id = $2
        `, [item.quantity, item.productId]);
      }

      await client.query('COMMIT');

      logger.info(`Order cancelled: orderId=${id}, userId=${userId}`);

      res.status(200).json({
        success: true,
        message: 'Order cancelled successfully',
        data: {
          orderId: id,
          status: 'CANCELLED'
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    logger.error('Cancel order error:', error);
    next(error);
  }
};

// Update order status (for farmers/admins)
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Validate status
    const validStatuses = ['PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const result = await query(`
      UPDATE orders 
      SET status = $1, notes = COALESCE(notes, '') || ' | ' || COALESCE($2, ''), updatedat = CURRENT_TIMESTAMP
      WHERE _id = $3
      RETURNING *
    `, [status, notes, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    logger.info(`Order status updated: orderId=${id}, status=${status}`);

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        order: result.rows[0]
      }
    });

  } catch (error) {
    logger.error('Update order status error:', error);
    next(error);
  }
};

module.exports = {
  placeOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus
};
