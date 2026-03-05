import { z } from 'zod';

export const updateOrderStatusSchema = z.object({
    body: z.object({
        status: z.enum(['CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED'])
    })
});

export const updateStockSchema = z.object({
    body: z.object({
        stockQuantity: z.number().int().nonnegative("Stock cannot be negative")
    })
});
