import { z } from 'zod';

// Reusable coordinate schema
export const coordinatesSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
});

// Farmer location update
export const updateFarmerLocationSchema = coordinatesSchema.extend({
    deliveryRadius: z.number().min(0).max(100).optional()
});

// Update delivery slots
export const updateDeliverySlotsSchema = z.object({
    deliverySlots: z.array(z.string()).max(10)
});

// Consumer address save
export const saveConsumerAddressSchema = coordinatesSchema.extend({
    street: z.string().min(3),
    city: z.string().min(2),
    state: z.string().min(2),
    postalCode: z.string().min(3)
});

// Admin zone creation
export const createDeliveryZoneSchema = z.object({
    farmerId: z.string().uuid(),
    zoneName: z.string().min(2),
    zonePolygon: z.array(coordinatesSchema).min(3, "A polygon must have at least 3 points"),
    isActive: z.boolean().optional().default(true)
});

export const updateDeliveryZoneSchema = z.object({
    zoneName: z.string().min(2).optional(),
    zonePolygon: z.array(coordinatesSchema).min(3).optional(),
    isActive: z.boolean().optional()
});
