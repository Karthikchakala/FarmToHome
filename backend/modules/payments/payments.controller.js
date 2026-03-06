import * as paymentService from './payments.service.js';
import * as validation from './payments.validation.js';
import { query } from '../../src/config/db.js';

// Helper to get consumer ID from user ID
const getConsumerId = async (userId) => {
    const result = await query('SELECT id FROM consumers WHERE user_id = $1', [userId]);
    if (!result.rows.length) throw new Error('Consumer profile not found');
    return result.rows[0].id;
};

export const createRazorpayOrder = async (req, res, next) => {
    try {
        const { orderId } = validation.createOrderSchema.parse(req.body);
        const consumerId = await getConsumerId(req.user.id);

        // Create the order via Razorpay service
        const rpOrder = await paymentService.createPaymentOrder(consumerId, orderId);

        // The frontend only needs specific keys from Razorpay
        res.status(200).json({
            success: true,
            data: {
                orderId: rpOrder.id,
                amount: rpOrder.amount,
                currency: rpOrder.currency,
                receipt: rpOrder.receipt
            }
        });
    } catch (error) {
        next(error);
    }
};

export const verifyRazorpayPayment = async (req, res, next) => {
    try {
        const parsedData = validation.verifyPaymentSchema.parse(req.body);
        const consumerId = await getConsumerId(req.user.id);

        await paymentService.verifyPayment(consumerId, parsedData);

        res.status(200).json({
            success: true,
            message: 'Payment verified successfully.'
        });
    } catch (error) {
        next(error);
    }
};

export const getHistory = async (req, res, next) => {
    try {
        const payments = await paymentService.getPaymentHistory(req.user.id, req.user.role);
        res.status(200).json({
            success: true,
            data: payments
        });
    } catch (error) {
        next(error);
    }
};

// Expose public key strictly to configuring the frontend checkout script (no secret keys involved here)
export const getRazorpayKey = async (req, res, next) => {
    res.status(200).json({
        success: true,
        data: { key: process.env.RAZORPAY_KEY_ID }
    });
};
