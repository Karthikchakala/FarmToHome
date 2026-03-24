-- Check the current status constraint on orders table
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'public.orders'::regclass 
AND contype = 'c' 
AND conname = 'orders_status_check';

-- Check what statuses currently exist in the orders table
SELECT DISTINCT status FROM "public"."orders" ORDER BY status;

-- If needed, update the constraint to allow all required statuses
-- First, drop the existing constraint
ALTER TABLE "public"."orders" DROP CONSTRAINT IF EXISTS orders_status_check;

-- Then add a new constraint with all valid statuses
ALTER TABLE "public"."orders" 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'));
