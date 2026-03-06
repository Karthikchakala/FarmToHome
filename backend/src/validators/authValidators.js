import { z } from 'zod';

export const registerSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(['consumer', 'farmer', 'admin']),
        fullName: z.string().min(2, "Full name must be at least 2 characters").optional(),
        phone: z.string().min(10, "Phone number required").optional(),
        farmName: z.string().optional()
    }).superRefine((data, ctx) => {
        if (data.role === 'consumer' || data.role === 'farmer') {
            if (!data.fullName) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "fullName is required for consumers and farmers", path: ['fullName'] });
            }
        }
        if (data.role === 'farmer') {
            if (!data.farmName) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "farmName is required for farmers", path: ['farmName'] });
            }
        }
    })
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(1, "Password is required")
    })
});
