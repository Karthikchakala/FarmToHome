import { z } from 'zod';

export const approveFarmerSchema = z.object({
    params: z.object({
        farmerId: z.string().uuid("Invalid Farmer ID")
    })
});

export const getLogsSchema = z.object({
    query: z.object({
        limit: z.string().regex(/^\d+$/).transform(Number).optional(),
        offset: z.string().regex(/^\d+$/).transform(Number).optional()
    })
});
