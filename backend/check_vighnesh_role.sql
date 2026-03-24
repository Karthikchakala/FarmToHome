-- Check vighneshprasad12@gmail.com user role
SELECT _id, name, email, role FROM "public"."users" 
WHERE email = 'vighneshprasad12@gmail.com';

-- Check if farmer record exists for vighnesh
SELECT _id, userid, farmname, createdat FROM "public"."farmers" 
WHERE userid = (SELECT _id FROM "public"."users" WHERE email = 'vighneshprasad12@gmail.com');

-- If role is not 'farmer', update it
UPDATE "public"."users" 
SET role = 'farmer' 
WHERE email = 'vighneshprasad12@gmail.com';

-- Create farmer record if missing
INSERT INTO "public"."farmers" (
  _id, 
  userid, 
  farmname, 
  createdat, 
  updatedat
) VALUES (
  gen_random_uuid(),
  (SELECT _id FROM "public"."users" WHERE email = 'vighneshprasad12@gmail.com'),
  'Vighnesh Farm',
  NOW(),
  NOW()
) ON CONFLICT (userid) DO UPDATE 
SET farmname = 'Vighnesh Farm', updatedat = NOW();

-- Verify the updates
SELECT u._id, u.name, u.email, u.role, f.farmname 
FROM "public"."users" u
LEFT JOIN "public"."farmers" f ON u._id = f.userid
WHERE u.email = 'vighneshprasad12@gmail.com';
