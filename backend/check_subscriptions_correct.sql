-- Check subscriptions with correct joins
SELECT 
  s._id,
  s.consumerid,
  s.farmerid,
  s.productid,
  s.status,
  s.frequency,
  s.quantity,
  s.createdat,
  p.name as product_name,
  p.priceperunit,
  u.name as consumer_name,
  u.email as consumer_email
FROM "public"."subscriptions" s
LEFT JOIN "public"."products" p ON s.productid = p._id
LEFT JOIN "public"."consumers" c ON s.consumerid = c._id
LEFT JOIN "public"."users" u ON c.userid = u._id
ORDER BY s.createdat DESC
LIMIT 10;

-- Check total subscriptions count
SELECT COUNT(*) as total_subscriptions FROM "public"."subscriptions";

-- Get all farmers with their user info
SELECT 
  f._id,
  f.userid,
  u.name as user_name,
  u.email,
  f.farmname
FROM "public"."farmers" f
JOIN "public"."users" u ON f.userid = u._id;

-- Check subscriptions for a specific farmer (replace with actual farmer ID)
SELECT 
  s._id,
  s.consumerid,
  s.productid,
  s.status,
  s.createdat,
  p.name as product_name,
  u.name as consumer_name,
  u.email as consumer_email
FROM "public"."subscriptions" s
LEFT JOIN "public"."products" p ON s.productid = p._id
LEFT JOIN "public"."consumers" c ON s.consumerid = c._id
LEFT JOIN "public"."users" u ON c.userid = u._id
WHERE s.farmerid = 'YOUR_FARMER_ID_HERE'
ORDER BY s.createdat DESC;
