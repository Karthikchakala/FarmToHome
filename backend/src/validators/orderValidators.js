import { z } from 'zod';

export const addToCartSchema = z.object({
    body: z.object({
        productId: z.string().uuid("Invalid Product ID"),
        quantity: z.number().int().positive("Quantity must be at least 1")
    })
});

export const placeOrderSchema = z.object({
    body: z.object({
        farmerId: z.string().uuid("Invalid Farmer ID"),
        deliveryAddress: z.string().min(5, "Delivery address is required")
    })
});

export const updateOrderStatusSchema = z.object({
    body: z.object({
        status: z.enum(['PLACED', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'FAILED', 'DISPUTED'])
    })
});
