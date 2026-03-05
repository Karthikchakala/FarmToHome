import { query, getClient } from '../config/db.js';

// --- Cart Operations ---
export const addToCart = async (consumerId, productId, quantity) => {
    // Upsert pattern for cart items
    const sql = `
    INSERT INTO cart_items (consumer_id, product_id, quantity)
    VALUES ($1, $2, $3)
    ON CONFLICT (id) DO UPDATE SET quantity = cart_items.quantity + $3
    RETURNING *
  `;
    // Without a unique constraint on (consumer_id, product_id), standard upsert fails.
    // Instead, let's manual check.
    const checkSql = 'SELECT * FROM cart_items WHERE consumer_id = $1 AND product_id = $2';
    const checkRes = await query(checkSql, [consumerId, productId]);

    if (checkRes.rows.length > 0) {
        const updateSql = 'UPDATE cart_items SET quantity = quantity + $3 WHERE id = $4 RETURNING *';
        const updateRes = await query(updateSql, [consumerId, productId, quantity, checkRes.rows[0].id]);
        return updateRes.rows[0];
    } else {
        const insertSql = 'INSERT INTO cart_items (consumer_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *';
        const insertRes = await query(insertSql, [consumerId, productId, quantity]);
        return insertRes.rows[0];
    }
};

export const getCart = async (consumerId) => {
    const sql = `
    SELECT c.*, p.name, p.price, p.stock_quantity, p.farmer_id 
    FROM cart_items c
    JOIN products p ON c.product_id = p.id
    WHERE c.consumer_id = $1
  `;
    const result = await query(sql, [consumerId]);
    return result.rows;
};

export const clearCart = async (consumerId) => {
    await query('DELETE FROM cart_items WHERE consumer_id = $1', [consumerId]);
};

// --- Order Operations ---
export const createOrderTransaction = async (consumerId, farmerId, cartItems, deliveryAddress) => {
    const client = await getClient();
    try {
        await client.query('BEGIN');

        // 1. Calculate total and lock product rows to prevent overselling
        let totalAmount = 0;
        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        for (const item of cartItems) {
            // FOR UPDATE locks the row until transaction ends
            const productRes = await client.query('SELECT stock_quantity, price FROM products WHERE id = $1 FOR UPDATE', [item.product_id]);
            if (productRes.rows.length === 0) throw new Error(`Product ${item.product_id} not found`);

            const product = productRes.rows[0];
            if (product.stock_quantity < item.quantity) {
                throw new Error(`Insufficient stock for product. Available: ${product.stock_quantity}, Requested: ${item.quantity}`);
            }

            totalAmount += parseFloat(product.price) * item.quantity;

            // Deduct stock
            await client.query('UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2', [item.quantity, item.product_id]);
        }

        // 2. Create Order Record
        const orderRes = await client.query(
            `INSERT INTO orders (order_number, consumer_id, farmer_id, total_amount, delivery_address) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [orderNumber, consumerId, farmerId, totalAmount, deliveryAddress]
        );
        const newOrder = orderRes.rows[0];

        // 3. Create Order Items
        for (const item of cartItems) {
            // Re-fetch price just to be absolutely sure we log the price at the time of order
            const priceRes = await client.query('SELECT price FROM products WHERE id = $1', [item.product_id]);
            await client.query(
                `INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES ($1, $2, $3, $4)`,
                [newOrder.id, item.product_id, item.quantity, priceRes.rows[0].price]
            );
        }

        // 4. Clear the cart for these items
        await client.query('DELETE FROM cart_items WHERE consumer_id = $1', [consumerId]);

        await client.query('COMMIT');
        return newOrder;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

export const updateOrderStatus = async (orderId, status) => {
    const sql = 'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
    const result = await query(sql, [status, orderId]);
    return result.rows[0];
};

export const getConsumerOrdersList = async (consumerId) => {
    const sql = `
        SELECT o.id as order_id, o.order_number, o.total_amount, o.status, o.created_at,
               f.farm_name,
               (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as product_count
        FROM orders o
        JOIN farmers f ON o.farmer_id = f.id
        WHERE o.consumer_id = $1
        ORDER BY o.created_at DESC
    `;
    const result = await query(sql, [consumerId]);
    return result.rows;
};

export const getOrderDetailsById = async (consumerId, orderId) => {
    // 1. Fetch Order and Farmer Details
    const orderSql = `
        SELECT o.id as order_id, o.order_number, o.total_amount, o.status, 
               o.created_at, o.delivery_address, o.delivery_slot, 
               o.payment_method, o.payment_status,
               f.farm_name, f.phone as farmer_phone
        FROM orders o
        JOIN farmers f ON o.farmer_id = f.id
        WHERE o.id = $1 AND o.consumer_id = $2
    `;
    const orderRes = await query(orderSql, [orderId, consumerId]);
    if (orderRes.rows.length === 0) return null;

    const order = orderRes.rows[0];

    // 2. Fetch Order Items
    const itemsSql = `
        SELECT oi.id as order_item_id, oi.quantity, oi.price_at_time, 
               p.id as product_id, p.name, p.unit, p.image_url
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = $1
    `;
    const itemsRes = await query(itemsSql, [orderId]);

    return {
        ...order,
        items: itemsRes.rows
    };
};

export const cancelConsumerOrder = async (consumerId, orderId) => {
    const sql = `
        UPDATE orders 
        SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP 
        WHERE id = $1 AND consumer_id = $2 AND status IN ('PLACED', 'CONFIRMED')
        RETURNING *
    `;
    const result = await query(sql, [orderId, consumerId]);
    return result.rows[0];
};
