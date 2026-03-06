import { z } from 'zod';

export const approveFarmerSchema = z.object({
  status: z.boolean().describe('Approval status (true/false)')
});

export const suspendFarmerSchema = z.object({
  status: z.boolean().describe('Suspension status (true/false) - wait, suspending is usually active=false')
});

export const setMinPriceSchema = z.object({
  category: z.string(),
  minPrice: z.number().min(0, "Minimum price cannot be negative")
});
