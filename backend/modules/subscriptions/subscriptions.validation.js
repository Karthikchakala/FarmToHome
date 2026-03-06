import { z } from 'zod';

export const createSubscriptionSchema = z.object({
    farmerId: z.string().uuid(),
    products: z.array(z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1)
    })).min(1, 'At least one product is required'),
    frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
    startDate: z.string().refine(val => !isNaN(Date.parse(val)), {
        message: 'Invalid start date'
    }),
    deliveryDay: z.string().optional()
});

export const updateSubscriptionSchema = z.object({
    status: z.enum(['active', 'paused', 'cancelled']).optional()
});
