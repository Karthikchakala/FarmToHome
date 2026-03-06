import Razorpay from 'razorpay';
import crypto from 'crypto';

let razorpayInstance = null;

const getRazorpayInstance = () => {
    if (!razorpayInstance) {
        const key_id = process.env.RAZORPAY_KEY_ID;
        const key_secret = process.env.RAZORPAY_KEY_SECRET;

        if (!key_id || !key_secret) {
            console.warn("⚠️ Razorpay keys not found in .env. Payment module disabled.");
            return null;
        }

        razorpayInstance = new Razorpay({
            key_id,
            key_secret
        });
    }
    return razorpayInstance;
};

/**
 * Creates an order on Razorpay servers
 * @param {number} amountInRupees - The total amount in INR
 * @param {string} receiptId - Our internal order ID (uuid)
 * @returns {Promise<Object>} Razorpay Order Object
 */
export const createOrder = async (amountInRupees, receiptId) => {
    const instance = getRazorpayInstance();
    if (!instance) throw new Error("Razorpay not configured on the server.");

    const options = {
        amount: Math.round(amountInRupees * 100), // convert to paise
        currency: "INR",
        receipt: receiptId.toString()
    };

    try {
        const order = await instance.orders.create(options);
        return order;
    } catch (error) {
        console.error("Razorpay Create Order Error:", error);
        throw new Error(error.error?.description || "Failed to create Razorpay order");
    }
};

/**
 * Verifies the cryptographic signature from Razorpay
 * @param {string} orderId - Razorpay Order ID
 * @param {string} paymentId - Razorpay Payment ID
 * @param {string} signature - Razorpay Signature from frontend
 * @returns {boolean} true if valid
 */
export const verifySignature = (orderId, paymentId, signature) => {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error("Razorpay secret not configured");

    const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(orderId + "|" + paymentId)
        .digest('hex');

    return generatedSignature === signature;
};
