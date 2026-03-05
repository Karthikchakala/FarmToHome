import { z } from 'zod';

export const addToCartSchema = z.object({
    body: z.object({
        productId: z.string().uuid("Invalid product ID format"),
        quantity: z.number().int().positive("Quantity must be greater than 0")
    })
});

export const updateCartSchema = z.object({
    body: z.object({
        productId: z.string().uuid("Invalid product ID format"),
        quantity: z.number().int().min(0, "Quantity cannot be negative")
    })
});

export const checkoutSchema = z.object({
    body: z.object({
        deliveryAddress: z.string().min(5, "Delivery address is required"),
        deliverySlot: z.string().min(2, "Delivery slot is required").optional(),
        paymentMethod: z.enum(['COD', 'ONLINE', 'WALLET']).default('COD')
    })
});
