import { query } from '../config/db.js';

export const getCartItem = async (consumerId, productId) => {
    const sql = 'SELECT * FROM cart_items WHERE consumer_id = $1 AND product_id = $2';
    const result = await query(sql, [consumerId, productId]);
    return result.rows[0];
};

export const createCartItem = async (consumerId, productId, quantity) => {
    const sql = 'INSERT INTO cart_items (consumer_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *';
    const result = await query(sql, [consumerId, productId, quantity]);
    return result.rows[0];
};

export const updateCartItemQuantity = async (cartItemId, quantity) => {
    const sql = 'UPDATE cart_items SET quantity = $1 WHERE id = $2 RETURNING *';
    const result = await query(sql, [quantity, cartItemId]);
    return result.rows[0];
};

export const removeCartItem = async (consumerId, productId) => {
    const sql = 'DELETE FROM cart_items WHERE consumer_id = $1 AND product_id = $2';
    await query(sql, [consumerId, productId]);
};

export const clearCart = async (consumerId) => {
    const sql = 'DELETE FROM cart_items WHERE consumer_id = $1';
    await query(sql, [consumerId]);
};

export const getCartItemsWithDetails = async (consumerId) => {
    const sql = `
        SELECT c.id as cart_item_id, c.quantity, p.id as product_id, p.name, p.price, p.stock_quantity, p.image_url, p.unit, p.farmer_id
        FROM cart_items c
        JOIN products p ON c.product_id = p.id
        WHERE c.consumer_id = $1
    `;
    const result = await query(sql, [consumerId]);
    return result.rows;
};
