import * as supportRepository from '../repositories/supportRepository.js';

export const subscribeToProduct = async (consumerUserId, farmerId, productId, frequency, quantity) => {
    // Resolve consumer ID
    const { getClient } = await import('../config/db.js');
    const client = await getClient();
    const consumerRes = await client.query('SELECT id FROM consumers WHERE user_id = $1', [consumerUserId]);
    client.release();

    if (consumerRes.rows.length === 0) throw new Error('Not a consumer');

    // Calculate next delivery date based on frequency
    const nextDate = new Date();
    if (frequency === 'daily') nextDate.setDate(nextDate.getDate() + 1);
    else if (frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
    else if (frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);

    return await supportRepository.createSubscription(consumerRes.rows[0].id, farmerId, productId, frequency, quantity, nextDate);
};

export const getConsumerSubscriptions = async (consumerUserId) => {
    const { getClient } = await import('../config/db.js');
    const client = await getClient();
    const consumerRes = await client.query('SELECT id FROM consumers WHERE user_id = $1', [consumerUserId]);
    client.release();

    if (consumerRes.rows.length === 0) return [];

    return await supportRepository.getActiveSubscriptions(consumerRes.rows[0].id);
};

export const checkWallet = async (userId) => {
    return await supportRepository.getWalletBalance(userId);
};

export const topUpWallet = async (userId, amount) => {
    // E.g. successful Razorpay payment webhook logic goes here before this call
    return await supportRepository.addWalletTransaction(userId, 'CREDIT', amount, 'Wallet Top-up');
};

export const writeReview = async (consumerUserId, farmerId, rating, comment) => {
    const { getClient } = await import('../config/db.js');
    const client = await getClient();
    const consumerRes = await client.query('SELECT id FROM consumers WHERE user_id = $1', [consumerUserId]);
    client.release();

    if (consumerRes.rows.length === 0) throw new Error('Not a consumer');
    return await supportRepository.addReview(consumerRes.rows[0].id, farmerId, rating, comment);
};
