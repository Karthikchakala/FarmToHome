import { z } from 'zod';

export const dateRangeSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    period: z.enum(['7d', '30d', '90d', '1y']).optional().default('30d'),
    limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});
