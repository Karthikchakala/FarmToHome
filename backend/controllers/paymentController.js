const { query, transaction } = require('../db');
const logger = require('../config/logger');
const responseHelper = require('../utils/responseHelper');
const { asyncHandler, NotFoundError, ValidationError } = require('../middlewares/enhancedErrorHandler');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { sendPaymentSuccessEmail, sendPaymentFailureEmail } = require('../services/emailService');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay order
const createPaymentOrder = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { orderId, amount } = req.body;

  // Validate input
  if (!orderId || !amount || amount <= 0) {
    throw new ValidationError('Valid order ID and positive amount are required');
  }

  // Verify order exists and belongs to user
  const orderQuery = `
    SELECT o._id, o.userid, o.totalamount, o.paymentmethod, o.status, o.ordernumber
    FROM orders o
    WHERE o._id = $1 AND o.userid = $2
  `;

  const orderResult = await query(orderQuery, [orderId, userId]);

  if (orderResult.rows.length === 0) {
    throw new NotFoundError('Order not found');
  }

  const order = orderResult.rows[0];

  // Check if order is already paid
  if (order.status === 'PAID') {
    throw new ValidationError('Order is already paid');
  }

  // Check if payment method is ONLINE
  if (order.paymentmethod !== 'ONLINE') {
    throw new ValidationError('Payment method must be ONLINE for Razorpay payment');
  }

  // Verify amount matches order total
  if (Math.abs(parseFloat(amount) - parseFloat(order.totalamount)) > 0.01) {
    throw new ValidationError('Payment amount does not match order total');
  }

  // Create Razorpay order
  const options = {
    amount: Math.round(parseFloat(amount) * 100), // Convert to paise
    currency: 'INR',
    receipt: order.ordernumber,
    notes: {
      orderId: order._id,
      userId: userId,
      orderNumber: order.ordernumber
    }
  };

  try {
    const razorpayOrder = await razorpay.orders.create(options);

    logger.info(`Razorpay order created: orderId=${orderId}, razorpayOrderId=${razorpayOrder.id}`);

    return responseHelper.success(res, {
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      receipt: razorpayOrder.receipt,
      notes: razorpayOrder.notes
    }, 'Payment order created successfully');

  } catch (error) {
    logger.error('Razorpay order creation error:', error);
    throw new Error('Failed to create payment order');
  }
});

// Verify payment
const verifyPayment = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    orderId
  } = req.body;

  // Validate input
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !orderId) {
    throw new ValidationError('All payment verification fields are required');
  }

  // Get order details
  const orderQuery = `
    SELECT o._id, o.userid, o.totalamount, o.paymentmethod, o.status, o.ordernumber
    FROM orders o
    WHERE o._id = $1 AND o.userid = $2
  `;

  const orderResult = await query(orderQuery, [orderId, userId]);

  if (orderResult.rows.length === 0) {
    throw new NotFoundError('Order not found');
  }

  const order = orderResult.rows[0];

  // Check if order is already paid
  if (order.status === 'PAID') {
    throw new ValidationError('Order is already paid');
  }

  // Verify Razorpay signature
  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    logger.warn(`Invalid payment signature: orderId=${orderId}, razorpayOrderId=${razorpayOrderId}`);
    throw new ValidationError('Invalid payment signature');
  }

  // Start transaction
  const client = await transaction();

  try {
    // Update order status to PAID
    const updateOrderQuery = `
      UPDATE orders 
      SET status = 'PAID', 
          paymentstatus = 'COMPLETED',
          paymentid = $1,
          updatedat = CURRENT_TIMESTAMP
      WHERE _id = $2
      RETURNING *
    `;

    const updatedOrderResult = await client.query(updateOrderQuery, [razorpayPaymentId, orderId]);
    const updatedOrder = updatedOrderResult.rows[0];

    // Insert payment record
    const paymentQuery = `
      INSERT INTO payments (
        orderid, 
        userid, 
        paymentmethod, 
        amount, 
        currency, 
        status, 
        transactionid, 
        gatewayorderid, 
        gatewaysignature,
        createdat
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const paymentResult = await client.query(paymentQuery, [
      orderId,
      userId,
      'RAZORPAY',
      order.totalamount,
      'INR',
      'COMPLETED',
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature
    ]);

    const payment = paymentResult.rows[0];

    // Update product stock (if not already updated)
    const stockUpdateQuery = `
      UPDATE products 
      SET stockquantity = stockquantity - ci.quantity,
          updatedat = CURRENT_TIMESTAMP
      FROM cart_items ci
      WHERE ci.orderid = $1
        AND products._id = ci.productid
        AND products.stockquantity >= ci.quantity
    `;

    await client.query(stockUpdateQuery, [orderId]);

    // Clear user's cart
    await client.query('DELETE FROM cart WHERE userid = $1', [userId]);

    // Create notification for user
    const notificationQuery = `
      INSERT INTO notifications (userid, type, title, message, data, createdat)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
    `;

    await client.query(notificationQuery, [
      userId,
      'payment_success',
      'Payment Successful',
      `Payment of ₹${order.totalamount} for order ${order.ordernumber} was successful.`,
      JSON.stringify({ orderId: order._id, paymentId: payment._id })
    ]);

    // Get farmer ID for notification
    const farmerQuery = `
      SELECT farmerid FROM orders WHERE _id = $1
    `;
    const farmerResult = await client.query(farmerQuery, [orderId]);
    
    if (farmerResult.rows.length > 0) {
      const farmerId = farmerResult.rows[0].farmerid;
      
      // Get farmer user ID
      const farmerUserQuery = `
        SELECT userid FROM farmers WHERE _id = $1
      `;
      const farmerUserResult = await client.query(farmerUserQuery, [farmerId]);
      
      if (farmerUserResult.rows.length > 0) {
        const farmerUserId = farmerUserResult.rows[0].userid;
        
        // Create notification for farmer
        await client.query(notificationQuery, [
          farmerUserId,
          'new_order_paid',
          'New Order Received',
          `New paid order ${order.ordernumber} received. Amount: ₹${order.totalamount}`,
          JSON.stringify({ orderId: order._id, paymentId: payment._id })
        ]);
      }
    }

    await client.query('COMMIT');

    // Send payment success email
    try {
      // Get customer email
      const customerQuery = 'SELECT name, email FROM users WHERE _id = $1';
      const customerResult = await query(customerQuery, [userId]);
      
      if (customerResult.rows.length > 0) {
        const paymentEmailData = {
          orderNumber: order.ordernumber,
          customerName: customerResult.rows[0].name || 'Customer',
          customerEmail: customerResult.rows[0].email,
          amount: order.totalamount,
          transactionId: razorpayPaymentId,
          paymentDate: new Date().toISOString()
        };

        // Send email (non-blocking)
        sendPaymentSuccessEmail(paymentEmailData).catch(emailError => {
          logger.error(`Failed to send payment success email for order ${order.ordernumber}:`, emailError);
        });
      }
    } catch (emailError) {
      logger.error('Error in payment success email process:', emailError);
      // Don't fail the payment if email fails
    }

    logger.info(`Payment verified successfully: orderId=${orderId}, paymentId=${razorpayPaymentId}`);

    return responseHelper.success(res, {
      order: updatedOrder,
      payment: {
        id: payment._id,
        transactionId: payment.transactionid,
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdat
      }
    }, 'Payment verified successfully');

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Payment verification error:', error);
    
    // Send payment failure email
    try {
      // Get customer email
      const customerQuery = 'SELECT name, email FROM users WHERE _id = $1';
      const customerResult = await query(customerQuery, [userId]);
      
      if (customerResult.rows.length > 0) {
        const paymentEmailData = {
          orderNumber: order?.ordernumber || 'Unknown',
          customerName: customerResult.rows[0].name || 'Customer',
          customerEmail: customerResult.rows[0].email,
          amount: order?.totalamount || 'Unknown',
          failureDate: new Date().toISOString()
        };

        // Send email (non-blocking)
        sendPaymentFailureEmail(paymentEmailData).catch(emailError => {
          logger.error(`Failed to send payment failure email:`, emailError);
        });
      }
    } catch (emailError) {
      logger.error('Error in payment failure email process:', emailError);
      // Don't fail the error handling if email fails
    }
    
    throw error;
  }
});

// Get payment details
const getPaymentDetails = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { orderId } = req.params;

  // Validate order ID
  if (!orderId) {
    throw new ValidationError('Order ID is required');
  }

  // Get payment details
  const paymentQuery = `
    SELECT 
      p.*,
      o.ordernumber,
      o.totalamount as orderamount,
      o.status as orderstatus,
      o.createdat as ordercreatedat
    FROM payments p
    LEFT JOIN orders o ON p.orderid = o._id
    WHERE p.orderid = $1 AND p.userid = $2
  `;

  const paymentResult = await query(paymentQuery, [orderId, userId]);

  if (paymentResult.rows.length === 0) {
    throw new NotFoundError('Payment not found');
  }

  const payment = paymentResult.rows[0];

  return responseHelper.success(res, payment, 'Payment details retrieved successfully');
});

// Get user payment history
const getPaymentHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, status } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let whereClause = 'WHERE p.userid = $1';
  const params = [userId, parseInt(limit), offset];

  if (status) {
    whereClause += ' AND p.status = $4';
    params.push(status);
  }

  const paymentsQuery = `
    SELECT 
      p.*,
      o.ordernumber,
      o.totalamount as orderamount,
      o.status as orderstatus,
      o.createdat as ordercreatedat
    FROM payments p
    LEFT JOIN orders o ON p.orderid = o._id
    ${whereClause}
    ORDER BY p.createdat DESC
    LIMIT $2 OFFSET $3
  `;

  const countQuery = `
    SELECT COUNT(*) as total
    FROM payments p
    ${whereClause.replace('ORDER BY p.createdat DESC', '')}
  `;

  const [paymentsResult, countResult] = await Promise.all([
    query(paymentsQuery, params),
    query(countQuery, params.slice(0, -2))
  ]);

  const total = parseInt(countResult.rows[0].total);

  return responseHelper.success(res, {
    payments: paymentsResult.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  }, 'Payment history retrieved successfully');
});

// Refund payment (admin only)
const refundPayment = asyncHandler(async (req, res) => {
  const { paymentId, amount, reason } = req.body;

  // Validate input
  if (!paymentId || !amount || amount <= 0) {
    throw new ValidationError('Payment ID and positive refund amount are required');
  }

  // Get payment details
  const paymentQuery = `
    SELECT p.*, o.ordernumber, o.userid
    FROM payments p
    LEFT JOIN orders o ON p.orderid = o._id
    WHERE p._id = $1
  `;

  const paymentResult = await query(paymentQuery, [paymentId]);

  if (paymentResult.rows.length === 0) {
    throw new NotFoundError('Payment not found');
  }

  const payment = paymentResult.rows[0];

  // Check if payment is completed
  if (payment.status !== 'COMPLETED') {
    throw new ValidationError('Only completed payments can be refunded');
  }

  // Check if refund amount is valid
  if (parseFloat(amount) > parseFloat(payment.amount)) {
    throw new ValidationError('Refund amount cannot exceed payment amount');
  }

  try {
    // Create Razorpay refund
    const refundOptions = {
      amount: Math.round(parseFloat(amount) * 100), // Convert to paise
      receipt: `REFUND_${payment.ordernumber}`,
      notes: {
        paymentId: paymentId,
        orderId: payment.orderid,
        reason: reason || 'Customer requested refund'
      }
    };

    const refund = await razorpay.payments.refund(payment.transactionid, refundOptions);

    // Update payment status
    const updatePaymentQuery = `
      UPDATE payments 
      SET status = 'REFUNDED',
          refundamount = $1,
          refundid = $2,
          refundreason = $3,
          updatedat = CURRENT_TIMESTAMP
      WHERE _id = $4
      RETURNING *
    `;

    const updatedPaymentResult = await query(updatePaymentQuery, [
      amount,
      refund.id,
      reason || 'Customer requested refund',
      paymentId
    ]);

    // Update order status if full refund
    if (parseFloat(amount) === parseFloat(payment.amount)) {
      await query(
        'UPDATE orders SET status = "REFUNDED", updatedat = CURRENT_TIMESTAMP WHERE _id = $1',
        [payment.orderid]
      );
    }

    // Create notification for user
    await query(
      `INSERT INTO notifications (userid, type, title, message, data, createdat)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
      [
        payment.userid,
        'payment_refunded',
        'Payment Refunded',
        `Refund of ₹${amount} for order ${payment.ordernumber} has been processed.`,
        JSON.stringify({ paymentId: paymentId, refundId: refund.id, amount })
      ]
    );

    logger.info(`Payment refunded: paymentId=${paymentId}, refundId=${refund.id}, amount=${amount}`);

    return responseHelper.success(res, {
      refund: {
        id: refund.id,
        amount: refund.amount / 100, // Convert back to rupees
        status: refund.status,
        created_at: refund.created_at
      },
      payment: updatedPaymentResult.rows[0]
    }, 'Payment refunded successfully');

  } catch (error) {
    logger.error('Payment refund error:', error);
    throw new Error('Failed to process refund');
  }
});

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getPaymentDetails,
  getPaymentHistory,
  refundPayment
};
