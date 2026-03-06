import { z } from 'zod';

export const createOrderSchema = z.object({
    orderId: z.string().uuid("Invalid Order ID format")
});

export const verifyPaymentSchema = z.object({
    razorpay_order_id: z.string().min(1, "Razorpay Order ID is required"),
    razorpay_payment_id: z.string().min(1, "Razorpay Payment ID is required"),
    razorpay_signature: z.string().min(1, "Razorpay Signature is required"),
    internal_order_id: z.string().uuid("Invalid internal Order ID")
});
