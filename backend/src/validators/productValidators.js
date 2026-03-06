import { z } from 'zod';

export const createProductSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Product name is required"),
        description: z.string().optional(),
        category: z.string().min(2, "Category is required"),
        price: z.number().positive("Price must be greater than 0"),
        stockQuantity: z.number().int().nonnegative("Stock cannot be negative"),
        unit: z.string().min(1, "Unit of measurement is required (e.g., kg, bunch)"),
        imageUrl: z.string().url("Must be a valid URL").optional()
    })
});

export const updateProductSchema = z.object({
    body: z.object({
        name: z.string().min(2).optional(),
        description: z.string().optional(),
        category: z.string().min(2).optional(),
        price: z.number().positive().optional(),
        stockQuantity: z.number().int().nonnegative().optional(),
        unit: z.string().min(1).optional(),
        imageUrl: z.string().url().optional(),
        isActive: z.boolean().optional()
    })
});

export const searchProductsSchema = z.object({
    query: z.object({
        latitude: z.string().regex(/^-?([1-8]?[1-9]|[1-9]0)\.{1}\d{1,6}/, "Invalid latitude format").or(z.number()),
        longitude: z.string().regex(/^-?([1]?[1-7][1-9]|[1]?[1-8][0]|[1-9]?[0-9])\.{1}\d{1,6}/, "Invalid longitude format").or(z.number())
    })
});
