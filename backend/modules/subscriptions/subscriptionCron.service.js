import cron from 'node-cron';
import { getDueSubscriptions, generateOrderFromSubscription } from './subscriptions.service.js';
import { sendOrderConfirmation, sendFarmerNewOrder, sendLowStockAlert } from '../notifications/notifications.service.js';
import { query } from '../../src/config/db.js';
import logger from '../../src/config/logger.js';

/**
 * Runs every day at 06:00 AM.
 * Processes all active subscriptions whose next_delivery_date is today or past.
 */
export const startSubscriptionCron = () => {
    cron.schedule('0 6 * * *', async () => {
        logger.info('[SubscriptionCron] Running daily subscription order generation...');

        let dueSubscriptions;
        try {
            dueSubscriptions = await getDueSubscriptions();
        } catch (err) {
            logger.error('[SubscriptionCron] Failed to fetch due subscriptions:', err);
            return;
        }

        logger.info(`[SubscriptionCron] Found ${dueSubscriptions.length} due subscriptions`);

        for (const sub of dueSubscriptions) {
            try {
                const result = await generateOrderFromSubscription(sub);

                if (result.skipped) {
                    logger.warn(`[SubscriptionCron] Skipped subscription ${sub.id}: ${result.reason}`);

                    // Notify farmer about low stock
                    const farmerRes = await query(
                        `SELECT f.full_name, u.email, p.name as product_name, p.stock_quantity
             FROM farmers f
             JOIN users u ON f.user_id = u.id
             JOIN products p ON p.id = $1
             WHERE f.id = $2`,
                        [sub.product_id, sub.farmer_id]
                    );
                    if (farmerRes.rows.length) {
                        const { full_name, email, product_name, stock_quantity } = farmerRes.rows[0];
                        // Non-blocking — fire and forget
                        sendLowStockAlert({
                            farmerUserId: sub.farmer_id,
                            farmerName: full_name,
                            email,
                            productName: product_name,
                            currentStock: stock_quantity,
                            recommendedRestock: `Please restock at least ${sub.quantity} units of ${product_name}`
                        });
                    }

                    // Also notify consumer
                    const consumerRes = await query(
                        `SELECT c.full_name, u.email, u.id as user_id
             FROM consumers c JOIN users u ON c.user_id = u.id
             WHERE c.id = $1`,
                        [sub.consumer_id]
                    );
                    if (consumerRes.rows.length) {
                        const { full_name, email, user_id } = consumerRes.rows[0];
                        const productRes = await query('SELECT name FROM products WHERE id = $1', [sub.product_id]);
                        const productName = productRes.rows[0]?.name || 'Product';
                        sendFarmerNewOrder({
                            farmerUserId: user_id,
                            farmerName: full_name,
                            email,
                            orderId: `SUB-${sub.id.slice(0, 8)}`,
                            productsOrdered: `${productName} x${sub.quantity} (Out of Stock – Skipped)`,
                            consumerDetails: 'Subscription delivery skipped due to low stock'
                        });
                    }
                    continue;
                }

                logger.info(`[SubscriptionCron] Created order ${result.order.order_number} for subscription ${sub.id}`);

                // Notify consumer and farmer
                const [consumerRes, farmerRes] = await Promise.all([
                    query(
                        `SELECT c.full_name, u.email, u.id as user_id FROM consumers c JOIN users u ON c.user_id = u.id WHERE c.id = $1`,
                        [sub.consumer_id]
                    ),
                    query(
                        `SELECT f.full_name, f.farm_name, u.email FROM farmers f JOIN users u ON f.user_id = u.id WHERE f.id = $1`,
                        [sub.farmer_id]
                    )
                ]);
                const productRes = await query('SELECT name FROM products WHERE id = $1', [sub.product_id]);
                const productName = productRes.rows[0]?.name || 'Product';

                if (consumerRes.rows.length) {
                    const c = consumerRes.rows[0];
                    sendOrderConfirmation({
                        userId: c.user_id,
                        consumerName: c.full_name,
                        email: c.email,
                        orderId: result.order.order_number,
                        orderTotal: result.order.total_amount,
                        deliveryDetails: result.order.delivery_address,
                        productList: `${productName} x${sub.quantity}`
                    });
                }

                if (farmerRes.rows.length) {
                    const f = farmerRes.rows[0];
                    sendFarmerNewOrder({
                        farmerUserId: sub.farmer_id,
                        farmerName: f.full_name,
                        email: f.email,
                        orderId: result.order.order_number,
                        productsOrdered: `${productName} x${sub.quantity} (Subscription)`,
                        consumerDetails: consumerRes.rows[0]?.full_name || 'Subscriber'
                    });
                }
            } catch (err) {
                logger.error(`[SubscriptionCron] Error processing subscription ${sub.id}:`, err);
            }
        }

        logger.info('[SubscriptionCron] Daily run complete.');
    });

    logger.info('[SubscriptionCron] Scheduled: daily at 06:00 AM');
};
