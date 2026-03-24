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

// Place new order with delivery validation - CONVERTED TO SUPABASE
const placeOrder = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { deliveryAddress, paymentMethod = 'COD', notes } = req.body;

  console.log('DEBUG: Received order request:', { deliveryAddress, paymentMethod, notes, userId });

  // Validate input
  if (!deliveryAddress) {
    throw new ValidationError('Delivery address is required');
  }

  // Get consumer record (needed for consumerid foreign key)
  const { data: consumerRecord, error: consumerRecordError } = await supabase
    .from('consumers')
    .select('_id, latitude, longitude, defaultaddressstreet, defaultaddresscity, defaultaddressstate, defaultaddresspostalcode')
    .eq('userid', userId)
    .single();
  
  if (consumerRecordError) {
    throw new Error('Consumer profile not found. Please update your profile.');
  }
  
  const consumerId = consumerRecord._id;

  // Get customer's default address if not provided
  let customerAddress = deliveryAddress;
  if (typeof deliveryAddress === 'string' || !deliveryAddress.latitude || !deliveryAddress.longitude) {
    if (consumerRecord?.latitude && consumerRecord?.longitude) {
      customerAddress = {
        street: consumerRecord.defaultaddressstreet || deliveryAddress,
        city: consumerRecord.defaultaddresscity,
        state: consumerRecord.defaultaddressstate,
        pincode: consumerRecord.defaultaddresspostalcode,
        latitude: consumerRecord.latitude,
        longitude: consumerRecord.longitude
      };
    }
  }

  // Validate customer coordinates
  if (!customerAddress.latitude || !customerAddress.longitude) {
    throw new ValidationError('Customer location coordinates are required');
  }

  // Get cart items with product and farmer details using Supabase
  const { data: cartItems, error: cartError } = await supabase
    .from('cart')
    .select(`
      _id,
      quantity,
      productid,
      products!inner(
        name,
        priceperunit,
        stockquantity,
        isavailable,
        farmerid,
        farmers!inner(
          farmname,
          deliveryradius,
          latitude,
          longitude
        )
      )
    `)
    .eq('userid', userId);

  if (cartError) {
    logger.error('Error fetching cart:', cartError);
    throw new Error('Failed to fetch cart');
  }

  if (!cartItems || cartItems.length === 0) {
    throw new ValidationError('Cart is empty');
  }

  // Validate stock availability and product availability
  for (const cartItem of cartItems) {
    const product = cartItem.products;
    if (!product.isavailable) {
      throw new ValidationError(`${product.name} is currently not available`);
    }
    
    if (product.stockquantity < cartItem.quantity) {
      throw new ValidationError(
        `Insufficient stock for ${product.name}. Available: ${product.stockquantity}, Requested: ${cartItem.quantity}`
      );
    }
  }

  // Validate delivery for each farmer
  const farmerValidationResults = [];
  for (const cartItem of cartItems) {
    const farmer = cartItem.products.farmers;
    
    if (!farmer.latitude || !farmer.longitude) {
      throw new ValidationError(`Farmer location not available for ${farmer.farmname}`);
    }

    const distance = calculateDistance(
      parseFloat(customerAddress.latitude),
      parseFloat(customerAddress.longitude),
      farmer.latitude,
      farmer.longitude
    );

    const deliveryRadius = farmer.deliveryradius || 8;
    const canDeliver = isWithinRadius(
      parseFloat(customerAddress.latitude),
      parseFloat(customerAddress.longitude),
      farmer.latitude,
      farmer.longitude,
      deliveryRadius
    );

    if (!canDeliver) {
      throw new ValidationError(
        `${farmer.farmname} cannot deliver to your location. Distance: ${distance.toFixed(2)}km, Delivery radius: ${deliveryRadius}km`
      );
    }

    farmerValidationResults.push({
      farmerId: cartItem.products.farmerid,
      farmerName: farmer.farmname,
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

  for (const cartItem of cartItems) {
    const farmerId = cartItem.products.farmerid;
    const farmer = cartItem.products.farmers;
    
    if (!cartByFarmer[farmerId]) {
      cartByFarmer[farmerId] = {
        farmerId,
        farmerName: farmer.farmname,
        items: [],
        subtotal: 0,
        deliveryCharge: 0
      };
    }

    const itemTotal = cartItem.quantity * cartItem.products.priceperunit;
    cartByFarmer[farmerId].items.push({
      productId: cartItem.productid,
      productName: cartItem.products.name,
      quantity: cartItem.quantity,
      pricePerUnit: cartItem.products.priceperunit,
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

  // Create orders for each farmer using Supabase
  const orderIds = [];
  const createdOrders = [];

  try {
    for (const farmerId in cartByFarmer) {
      const farmerOrder = cartByFarmer[farmerId];
      const orderNumber = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const orderTotal = farmerOrder.subtotal + farmerOrder.deliveryCharge;
      const orderPlatformCommission = Math.round(farmerOrder.subtotal * 0.05);

      const { data: newOrder, error: insertError } = await supabase
        .from('orders')
        .insert({
          consumerid: consumerId,
          farmerid: farmerId,
          ordernumber: orderNumber,
          totalamount: orderTotal,
          finalamount: orderTotal,
          deliveryaddressstreet: customerAddress.street || customerAddress,
          deliveryaddresscity: customerAddress.city || null,
          deliveryaddressstate: customerAddress.state || null,
          deliveryaddresspostalcode: customerAddress.pincode || null,
          paymentmethod: paymentMethod,
          status: 'PLACED',
          items: farmerOrder.items,
          deliverycharge: farmerOrder.deliveryCharge,
          platformcommission: orderPlatformCommission,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        logger.error('Error creating order:', insertError);
        throw new Error(`Failed to create order: ${insertError.message}`);
      }

      orderIds.push(newOrder._id);
      createdOrders.push(newOrder);
    }

    // Update product stock
    for (const cartItem of cartItems) {
      const newStock = cartItem.products.stockquantity - cartItem.quantity;
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          stockquantity: newStock,
          updatedat: new Date().toISOString()
        })
        .eq('_id', cartItem.productid);

      if (updateError) {
        logger.error('Error updating stock:', updateError);
        throw new ValidationError(`Failed to update stock for ${cartItem.products.name}`);
      }
    }

    // Clear cart
    const { error: deleteError } = await supabase
      .from('cart')
      .delete()
      .eq('userid', userId);

    if (deleteError) {
      logger.error('Error clearing cart:', deleteError);
    }

    // Format orders for response
    const orders = createdOrders.map(order => ({
      ...order,
      items: order.items || [],
      deliveryaddress: {
        street: order.deliveryaddressstreet,
        city: order.deliveryaddresscity,
        state: order.deliveryaddressstate,
        postalCode: order.deliveryaddresspostalcode
      }
    }));

    // Send email notifications (non-blocking)
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('email, name')
        .eq('_id', userId)
        .single();

      for (const order of orders) {
        const { data: farmerUser } = await supabase
          .from('farmers')
          .select('users(email, name)')
          .eq('_id', order.farmerid)
          .single();

        const orderEmailData = {
          orderNumber: order.ordernumber,
          customerName: userData?.name || 'Customer',
          customerEmail: userData?.email,
          farmerName: farmerUser?.users?.name || 'Farmer',
          farmerEmail: farmerUser?.users?.email,
          orderDate: order.createdat,
          totalAmount: order.totalamount,
          paymentMethod: order.paymentmethod,
          deliveryAddress: JSON.stringify(order.deliveryaddress),
          items: order.items.map(item => ({
            name: item.productName || 'Product',
            quantity: item.quantity,
            unit: 'unit',
            price: item.pricePerUnit,
            total: item.total
          })),
          estimatedDelivery: getDeliveryTimeEstimate(order.deliveryaddress)
        };

        sendOrderConfirmationEmails(orderEmailData).catch(emailError => {
          logger.error(`Failed to send order confirmation emails for order ${order.ordernumber}:`, emailError);
        });
      }
    } catch (emailError) {
      logger.error('Error in email notification process:', emailError);
    }

    logger.info(`Order placed successfully: userId=${userId}, orderCount=${orders.length}, totalAmount=${finalAmount}`);

    return responseHelper.created(res, {
      orders,
      summary: {
        totalItems: cartItems.length,
        totalAmount,
        totalDeliveryCharge,
        platformCommission,
        finalAmount,
        orderCount: orders.length
      }
    }, 'Order placed successfully');

  } catch (error) {
    logger.error('Place order error:', error);
    console.error('Place Order 500 Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
});

// Get user orders with pagination and filtering
const getUserOrders = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10, status } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    // First, get the consumer record for this user
    const { data: consumer, error: consumerError } = await supabase
      .from('consumers')
      .select('_id')
      .eq('userid', userId)
      .single();

    if (consumerError || !consumer) {
      // Return empty if no consumer record found
      return responseHelper.success(res, {
        orders: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false
        }
      }, 'Orders retrieved successfully');
    }

    const consumerId = consumer._id;

    // Build Supabase query using consumerid
    let supabaseQuery = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('consumerid', consumerId)
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

    return responseHelper.success(res, {
      orders: formattedOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / parseInt(limit)),
        hasNext: offset + parseInt(limit) < (count || 0),
        hasPrev: parseInt(page) > 1
      }
    }, 'Orders retrieved successfully');
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
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  console.log('DEBUG: Update order status request:', { id, status, notes, user: req.user });

  // Validate status
  const validStatuses = ['PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid status'
    });
  }

  try {
    const { data: order, error } = await supabase
      .from('orders')
      .update({
        status: status,
        updatedat: new Date().toISOString()
      })
      .eq('_id', id)
      .select()
      .single();

    if (error) {
      console.error('DEBUG: Supabase update error:', error);
      logger.error('Error updating order status:', error);
      throw new Error(`Failed to update order status: ${error.message}`);
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    console.log('DEBUG: Order updated successfully:', order);
    return responseHelper.success(res, {
      order: order
    }, 'Order status updated successfully');

  } catch (error) {
    console.error('DEBUG: Update order status error:', error);
    logger.error('Update order status error:', error);
    throw error;
  }
});

// Get farmer orders with pagination and filtering
const getFarmerOrders = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10, status } = req.query;

  console.log('DEBUG: Get farmer orders request:', { userId, page, limit, status });

  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    // First, get the farmer record for this user
    const { data: farmer, error: farmerError } = await supabase
      .from('farmers')
      .select('_id')
      .eq('userid', userId)
      .single();

    console.log('DEBUG: Farmer record:', { farmer, farmerError });

    if (farmerError || !farmer) {
      console.log('DEBUG: No farmer record found, returning empty orders');
      return responseHelper.success(res, {
        orders: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: false
        }
      }, 'Orders retrieved successfully');
    }

    const farmerId = farmer._id;
    console.log('DEBUG: Using farmerId:', farmerId);

    // Build Supabase query using farmerid
    let supabaseQuery = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('farmerid', farmerId)
      .order('createdat', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    // Apply status filter if provided
    if (status) {
      supabaseQuery = supabaseQuery.eq('status', status);
      console.log('DEBUG: Applied status filter:', status);
    }

    const { data: orders, error, count } = await supabaseQuery;

    console.log('DEBUG: Orders query result:', { orders: orders?.length || 0, count, error });

    if (error) {
      logger.error('Error fetching farmer orders:', error);
      throw new Error('Failed to fetch orders');
    }

    // Format orders for response
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      ordernumber: order.ordernumber,
      consumerid: order.consumerid,
      farmerid: order.farmerid,
      items: order.items || [],
      totalamount: order.totalamount,
      platformcommission: order.platformcommission,
      deliverycharge: order.deliverycharge,
      finalamount: order.finalamount,
      deliveryaddress: {
        street: order.deliveryaddressstreet,
        city: order.deliveryaddresscity,
        state: order.deliveryaddressstate,
        postalCode: order.deliveryaddresspostalcode
      },
      status: order.status,
      paymentstatus: order.paymentstatus,
      paymentmethod: order.paymentmethod,
      ordertype: order.ordertype,
      deliveredat: order.deliveredat,
      createdat: order.createdat,
      updatedat: order.updatedat
    }));

    return responseHelper.success(res, {
      orders: formattedOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / parseInt(limit)),
        hasNext: offset + parseInt(limit) < (count || 0),
        hasPrev: parseInt(page) > 1
      }
    }, 'Orders retrieved successfully');

  } catch (error) {
    logger.error('Get farmer orders error:', error);
    throw error;
  }
});

module.exports = {
  placeOrder,
  getUserOrders,
  getFarmerOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus
};
