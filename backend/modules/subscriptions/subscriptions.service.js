import { query, getClient } from '../../src/config/db.js';

/**
 * Calculate the next delivery date based on frequency
 */
export const calcNextDate = (fromDate, frequency) => {
    const d = new Date(fromDate);
    switch (frequency) {
        case 'daily': d.setDate(d.getDate() + 1); break;
        case 'weekly': d.setDate(d.getDate() + 7); break;
        case 'biweekly': d.setDate(d.getDate() + 14); break;
        case 'monthly': d.setMonth(d.getMonth() + 1); break;
    }
    return d.toISOString().split('T')[0];
};

/**
 * Create a subscription (one DB row per product)
 * Returns an array of created subscription rows
 */
export const createSubscription = async (consumerId, { farmerId, products, frequency, startDate, deliveryDay }) => {
    // Verify all products belong to this farmer
    for (const p of products) {
        const check = await query(
            'SELECT id FROM products WHERE id = $1 AND farmer_id = $2 AND is_active = true',
            [p.productId, farmerId]
        );
        if (check.rows.length === 0) {
            throw new Error(`Product ${p.productId} does not belong to farmer ${farmerId} or is inactive`);
        }
    }

    const client = await getClient();
    try {
        await client.query('BEGIN');
        const created = [];
        for (const p of products) {
            const res = await client.query(
                `INSERT INTO subscriptions
           (consumer_id, farmer_id, product_id, quantity, interval, delivery_day, next_delivery_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
         RETURNING *`,
                [consumerId, farmerId, p.productId, p.quantity, frequency, deliveryDay || null, startDate]
            );
            created.push(res.rows[0]);
        }
        await client.query('COMMIT');
        return created;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

/**
 * Get all subscriptions for a consumer (grouped display)
 */
export const getConsumerSubscriptions = async (consumerId) => {
    const result = await query(
        `SELECT s.id, s.quantity, s.interval, s.next_delivery_date, s.status, s.delivery_day,
            p.name as product_name, p.unit, p.price, p.image_url,
            f.farm_name, f.full_name as farmer_name
     FROM subscriptions s
     JOIN products p ON s.product_id = p.id
     JOIN farmers f ON s.farmer_id = f.id
     WHERE s.consumer_id = $1
     ORDER BY s.next_delivery_date ASC`,
        [consumerId]
    );
    return result.rows;
};

/**
 * Get single subscription (with ownership check)
 */
export const getSubscriptionById = async (subscriptionId, consumerId) => {
    const result = await query(
        `SELECT s.*, p.name as product_name, p.unit, p.price, p.image_url,
            f.farm_name, f.full_name as farmer_name
     FROM subscriptions s
     JOIN products p ON s.product_id = p.id
     JOIN farmers f ON s.farmer_id = f.id
     WHERE s.id = $1 AND s.consumer_id = $2`,
        [subscriptionId, consumerId]
    );
    if (result.rows.length === 0) throw new Error('Subscription not found or access denied');
    return result.rows[0];
};

/**
 * Change subscription status
 */
const setStatus = async (subscriptionId, consumerId, newStatus) => {
    const result = await query(
        `UPDATE subscriptions SET status = $1, updated_at = NOW()
     WHERE id = $2 AND consumer_id = $3
     RETURNING *`,
        [newStatus, subscriptionId, consumerId]
    );
    if (result.rows.length === 0) throw new Error('Subscription not found or access denied');
    return result.rows[0];
};

export const pauseSubscription = (id, cid) => setStatus(id, cid, 'paused');
export const resumeSubscription = (id, cid) => setStatus(id, cid, 'active');
export const cancelSubscription = (id, cid) => setStatus(id, cid, 'cancelled');

/**
 * Generate a unique order number
 */
const genOrderNumber = () => `SUB-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

/**
 * Create an order for a subscription (called by the cron job)
 */
export const generateOrderFromSubscription = async (subscription) => {
    const client = await getClient();
    try {
        await client.query('BEGIN');

        // Get consumer address for delivery
        const consumerRes = await client.query(
            'SELECT c.default_address, u.email FROM consumers c JOIN users u ON c.user_id = u.id WHERE c.id = $1',
            [subscription.consumer_id]
        );
        if (!consumerRes.rows.length) throw new Error('Consumer not found');
        const { default_address, email } = consumerRes.rows[0];

        // Get product price + check stock
        const productRes = await client.query(
            'SELECT id, price, stock_quantity, name FROM products WHERE id = $1',
            [subscription.product_id]
        );
        if (!productRes.rows.length) throw new Error('Product not found');
        const product = productRes.rows[0];

        if (product.stock_quantity < subscription.quantity) {
            // Stock insufficient — skip & return null to indicate skip
            return { skipped: true, reason: 'Insufficient stock', subscription };
        }

        const totalAmount = parseFloat(product.price) * subscription.quantity;
        const orderNumber = genOrderNumber();

        // Create order
        const orderRes = await client.query(
            `INSERT INTO orders
         (order_number, consumer_id, farmer_id, total_amount, status, delivery_address)
       VALUES ($1, $2, $3, $4, 'PLACED', $5)
       RETURNING *`,
            [orderNumber, subscription.consumer_id, subscription.farmer_id, totalAmount, default_address || 'Default Address']
        );
        const newOrder = orderRes.rows[0];

        // Create order item
        await client.query(
            `INSERT INTO order_items (order_id, product_id, quantity, price_at_time)
       VALUES ($1, $2, $3, $4)`,
            [newOrder.id, subscription.product_id, subscription.quantity, product.price]
        );

        // Deduct stock
        await client.query(
            'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
            [subscription.quantity, subscription.product_id]
        );

        // Advance next delivery date
        const nextDate = calcNextDate(subscription.next_delivery_date, subscription.interval);
        await client.query(
            'UPDATE subscriptions SET next_delivery_date = $1, updated_at = NOW() WHERE id = $2',
            [nextDate, subscription.id]
        );

        await client.query('COMMIT');
        return { skipped: false, order: newOrder, nextDate };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

/**
 * Get all active subscriptions due today or earlier (for cron)
 */
export const getDueSubscriptions = async () => {
    const result = await query(
        `SELECT * FROM subscriptions
     WHERE status = 'active'
       AND next_delivery_date <= CURRENT_DATE`
    );
    return result.rows;
};
