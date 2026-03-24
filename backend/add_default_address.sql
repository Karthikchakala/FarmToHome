-- Check if vighnesh has a consumer record with default address
SELECT 
  u._id as user_id,
  u.name as user_name,
  u.email,
  c._id as consumer_id,
  c.defaultaddressstreet,
  c.defaultaddresscity,
  c.defaultaddressstate,
  c.defaultaddresspostalcode,
  c.latitude,
  c.longitude
FROM "public"."users" u
LEFT JOIN "public"."consumers" c ON u._id = c.userid
WHERE u.email = 'vighneshprasad12@gmail.com';

-- If no default address exists, add one
INSERT INTO "public"."consumers" (
  userid,
  defaultaddressstreet,
  defaultaddresscity,
  defaultaddressstate,
  defaultaddresspostalcode,
  latitude,
  longitude,
  createdat,
  updatedat
) VALUES (
  (SELECT _id FROM "public"."users" WHERE email = 'vighneshprasad12@gmail.com'),
  '123 Main Street',
  'Bangalore',
  'Karnataka',
  '560001',
  12.9716,
  77.5946,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT (userid) DO UPDATE SET
  defaultaddressstreet = EXCLUDED.defaultaddressstreet,
  defaultaddresscity = EXCLUDED.defaultaddresscity,
  defaultaddressstate = EXCLUDED.defaultaddressstate,
  defaultaddresspostalcode = EXCLUDED.defaultaddresspostalcode,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  updatedat = CURRENT_TIMESTAMP;

-- Verify the update
SELECT 
  u.name,
  u.email,
  c.defaultaddressstreet,
  c.defaultaddresscity,
  c.defaultaddressstate,
  c.defaultaddresspostalcode,
  c.latitude,
  c.longitude
FROM "public"."users" u
JOIN "public"."consumers" c ON u._id = c.userid
WHERE u.email = 'vighneshprasad12@gmail.com';
