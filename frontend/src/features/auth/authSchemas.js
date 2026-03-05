import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['consumer', 'farmer', 'admin']),
    fullName: z.string().optional(),
    phone: z.string().optional(),
    farmName: z.string().optional()
}).superRefine((data, ctx) => {
    if (data.role === 'consumer' || data.role === 'farmer') {
        if (!data.fullName) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Full name is required", path: ['fullName'] });
        }
    }
    if (data.role === 'farmer') {
        if (!data.farmName) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Farm name is required", path: ['farmName'] });
        }
    }
});
