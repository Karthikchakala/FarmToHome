-- Check subscriptions for a specific farmer
-- First, let's see the structure of the tables
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('subscriptions', 'consumers', 'products', 'farmers') 
ORDER BY table_name, ordinal_position;

-- Now let's check if there are any subscriptions at all
SELECT COUNT(*) as total_subscriptions FROM "public"."subscriptions";

-- Check subscriptions with farmer and product info
SELECT 
  s._id,
  s.consumerid,
  s.farmerid,
  s.productid,
  s.status,
  s.createdat,
  p.name as product_name,
  p.priceperunit
FROM "public"."subscriptions" s
LEFT JOIN "public"."products" p ON s.productid = p._id
ORDER BY s.createdat DESC
LIMIT 10;

-- Get all farmers to see their IDs
SELECT 
  f._id,
  f.userid,
  u.name as user_name,
  u.email,
  f.farmname
FROM "public"."farmers" f
JOIN "public"."users" u ON f.userid = u._id;
