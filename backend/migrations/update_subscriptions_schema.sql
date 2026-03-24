-- Update subscriptions table to support missing features

-- Add new columns for enhanced subscription management
ALTER TABLE "public"."subscriptions" 
ADD COLUMN IF NOT EXISTS productid UUID REFERENCES "public"."products"(_id),
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS deliveryaddress JSONB,
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS deliveryday VARCHAR(20),
ADD COLUMN IF NOT EXISTS lastdeliverydate DATE,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS skipcount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pauseduntil DATE,
ADD COLUMN IF NOT EXISTS requireapproval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS paymentmethod VARCHAR(50) DEFAULT 'COD',
ADD COLUMN IF NOT EXISTS nextapprovaldate DATE;

-- Update constraints to allow more frequencies
ALTER TABLE "public"."subscriptions" 
DROP CONSTRAINT IF EXISTS subscriptions_frequency_check;

ALTER TABLE "public"."subscriptions" 
ADD CONSTRAINT subscriptions_frequency_check 
CHECK (frequency IN ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'DAILY'));

-- Update status constraints
ALTER TABLE "public"."subscriptions" 
DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE "public"."subscriptions" 
ADD CONSTRAINT subscriptions_status_check 
CHECK (status IN ('ACTIVE', 'PAUSED', 'CANCELLED', 'PENDING_APPROVAL', 'SKIPPED'));

-- Create subscription deliveries table to track individual deliveries
CREATE TABLE IF NOT EXISTS "public"."subscription_deliveries" (
  _id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subscriptionid UUID NOT NULL REFERENCES "public"."subscriptions"(_id) ON DELETE CASCADE,
  orderid UUID REFERENCES "public"."orders"(_id),
  deliverydate DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'DELIVERED', 'SKIPPED', 'FAILED')),
  approvedat TIMESTAMP,
  deliveredat TIMESTAMP,
  notes TEXT,
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create subscription skips table for flexible skip management
CREATE TABLE IF NOT EXISTS "public"."subscription_skips" (
  _id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subscriptionid UUID NOT NULL REFERENCES "public"."subscriptions"(_id) ON DELETE CASCADE,
  skipdate DATE NOT NULL,
  reason TEXT,
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_consumerid ON "public"."subscriptions"(consumerid);
CREATE INDEX IF NOT EXISTS idx_subscriptions_productid ON "public"."subscriptions"(productid);
CREATE INDEX IF NOT EXISTS idx_subscriptions_nextdelivery ON "public"."subscriptions"(nextdeliverydate);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON "public"."subscriptions"(status);
CREATE INDEX IF NOT EXISTS idx_subscription_deliveries_subscriptionid ON "public"."subscription_deliveries"(subscriptionid);
CREATE INDEX IF NOT EXISTS idx_subscription_deliveries_deliverydate ON "public"."subscription_deliveries"(deliverydate);
CREATE INDEX IF NOT EXISTS idx_subscription_skips_subscriptionid ON "public"."subscription_skips"(subscriptionid);
CREATE INDEX IF NOT EXISTS idx_subscription_skips_skipdate ON "public"."subscription_skips"(skipdate);

-- Update existing subscriptions to have proper data
UPDATE "public"."subscriptions" 
SET 
  productid = (products -> 0 ->> 'productId')::UUID,
  quantity = COALESCE((products -> 0 ->> 'quantity')::INTEGER, 1),
  deliveryaddress = COALESCE(deliveryaddress, '{}'::JSONB),
  price = COALESCE((products -> 0 ->> 'price')::DECIMAL, 0),
  deliveryday = CASE 
    WHEN EXTRACT(ISODOW FROM nextdeliverydate) = 1 THEN 'MONDAY'
    WHEN EXTRACT(ISODOW FROM nextdeliverydate) = 2 THEN 'TUESDAY'
    WHEN EXTRACT(ISODOW FROM nextdeliverydate) = 3 THEN 'WEDNESDAY'
    WHEN EXTRACT(ISODOW FROM nextdeliverydate) = 4 THEN 'THURSDAY'
    WHEN EXTRACT(ISODOW FROM nextdeliverydate) = 5 THEN 'FRIDAY'
    WHEN EXTRACT(ISODOW FROM nextdeliverydate) = 6 THEN 'SATURDAY'
    WHEN EXTRACT(ISODOW FROM nextdeliverydate) = 7 THEN 'SUNDAY'
  END,
  requireapproval = true
WHERE productid IS NULL;
