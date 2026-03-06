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

export const updateProfileSchema = z.object({
    body: z.object({
        farmName: z.string().optional(),
        address: z.string().optional(),
        deliveryRadius: z.number().optional()
    })
});

export const addDeliveryZoneSchema = z.object({
    body: z.object({
        zoneName: z.string().min(1),
        coordinates: z.array(z.array(z.number())).min(3)
    })
});
