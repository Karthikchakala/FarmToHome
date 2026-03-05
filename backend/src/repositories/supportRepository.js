import { query } from '../config/db.js';

// --- Subscriptions ---
export const createSubscription = async (consumerId, farmerId, productId, frequency, quantity, nextDeliveryDate) => {
    const sql = `
    INSERT INTO subscriptions (consumer_id, farmer_id, product_id, frequency, quantity, next_delivery_date)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
    const result = await query(sql, [consumerId, farmerId, productId, frequency, quantity, nextDeliveryDate]);
    return result.rows[0];
};

export const getActiveSubscriptions = async (consumerId) => {
    const sql = `
    SELECT s.*, p.name as product_name, f.farm_name 
    FROM subscriptions s
    JOIN products p ON s.product_id = p.id
    JOIN farmers f ON s.farmer_id = f.id
    WHERE s.consumer_id = $1 AND s.is_active = true
  `;
    const result = await query(sql, [consumerId]);
    return result.rows;
};

// --- Wallet ---
export const getWalletBalance = async (userId) => {
    const sql = 'SELECT balance FROM wallets WHERE user_id = $1';
    const result = await query(sql, [userId]);
    if (result.rows.length === 0) {
        // Auto-create wallet if missing (usually done on user creation)
        const createRes = await query('INSERT INTO wallets (user_id) VALUES ($1) RETURNING balance', [userId]);
        return createRes.rows[0].balance;
    }
    return result.rows[0].balance;
};

export const addWalletTransaction = async (userId, type, amount, description) => {
    // Simple transaction wrapper (needs real BEGIN/COMMIT in prod)
    const sqlLog = `
    INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, description)
    VALUES ((SELECT id FROM wallets WHERE user_id = $1), $2, $3, $4)
    RETURNING *
  `;
    const logRes = await query(sqlLog, [userId, type, amount, description]);

    // Update Balance
    const modifier = type === 'CREDIT' ? '+' : '-';
    const sqlUpdate = `UPDATE wallets SET balance = balance ${modifier} $2 WHERE user_id = $1 RETURNING balance`;
    const updateRes = await query(sqlUpdate, [userId, amount]);

    return { transaction: logRes.rows[0], newBalance: updateRes.rows[0].balance };
};

// --- Reviews ---
export const addReview = async (consumerId, farmerId, rating, comment) => {
    const sql = `
    INSERT INTO reviews (consumer_id, farmer_id, rating, comment)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
    const result = await query(sql, [consumerId, farmerId, rating, comment]);
    return result.rows[0];
};
