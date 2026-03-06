import { query } from '../../src/config/db.js';
import { createOrder, verifySignature } from './razorpay.service.js';

export const createPaymentOrder = async (consumerId, orderId) => {
    // 1. Fetch Order and verify ownership
    const orderRes = await query(
        'SELECT total_amount, status, payment_status, payment_method FROM orders WHERE id = $1 AND consumer_id = $2',
        [orderId, consumerId]
    );

    if (!orderRes.rows.length) {
        throw new Error('Order not found or unauthorized');
    }

    const order = orderRes.rows[0];

    if (order.payment_status === 'SUCCESS') {
        throw new Error('Order is already paid');
    }

    if (order.payment_method !== 'ONLINE') {
        throw new Error('Order is not set to ONLINE payment. Please update the order first.');
    }

    // 2. Request Razorpay Order
    const rpOrder = await createOrder(Number(order.total_amount), orderId);

    // 3. Keep a track of this attempt in `payments` DB as PENDING
    await query(
        `INSERT INTO payments (order_id, amount, method, status, transaction_id)
     VALUES ($1, $2, 'ONLINE', 'PENDING', $3)`,
        [orderId, order.total_amount, rpOrder.id]
    );

    return rpOrder; // This has { id, amount, currency } needed for checkout.js
};

export const verifyPayment = async (consumerId, data) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, internal_order_id } = data;

    // 1. Cryptographically verify signature
    const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isValid) {
        // Optional: Log payment failure attempt in DB
        await query(
            `UPDATE payments SET status = 'FAILED' 
       WHERE transaction_id = $1 AND status = 'PENDING'`,
            [razorpay_order_id]
        );
        throw new Error('Invalid payment signature');
    }

    const client = await (await import('../../src/config/db.js')).getPool().connect();
    try {
        await client.query('BEGIN');

        // 2. Update Payment table to SUCCESS and store the actual payment ID
        // We update the row where transaction_id was the RP Order ID, replacing it with the actual Payment ID
        await client.query(
            `UPDATE payments 
       SET status = 'SUCCESS', transaction_id = $1 
       WHERE transaction_id = $2 RETURNING order_id`,
            [razorpay_payment_id, razorpay_order_id]
        );

        // 3. Update Order table
        await client.query(
            `UPDATE orders 
       SET payment_status = 'SUCCESS' 
       WHERE id = $1 AND consumer_id = $2`,
            [internal_order_id, consumerId]
        );

        await client.query('COMMIT');
        return { success: true };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

export const getPaymentHistory = async (userId, role) => {
    // Consumers see their payments, Admins can be extended to see all
    if (role === 'consumer') {
        const res = await query(
            `SELECT p.id, p.amount, p.method, p.status, p.transaction_id, p.created_at, o.order_number 
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       JOIN consumers c ON o.consumer_id = c.id
       WHERE c.user_id = $1
       ORDER BY p.created_at DESC`,
            [userId]
        );
        return res.rows;
    }

    if (role === 'farmer') {
        const res = await query(
            `SELECT p.id, p.amount, p.method, p.status, p.transaction_id, p.created_at, o.order_number 
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       JOIN farmers f ON o.farmer_id = f.id
       WHERE f.user_id = $1
       ORDER BY p.created_at DESC`,
            [userId]
        );
        return res.rows;
    }

    // Admin
    const res = await query(
        `SELECT p.id, p.amount, p.method, p.status, p.transaction_id, p.created_at, o.order_number 
     FROM payments p
     JOIN orders o ON p.order_id = o.id
     ORDER BY p.created_at DESC
     LIMIT 100`
    );
    return res.rows;
};
