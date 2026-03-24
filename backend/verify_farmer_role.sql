-- Check if user role was updated
SELECT _id, name, email, role FROM "public"."users" 
WHERE email = 'karthikc11105@gmail.com';

-- Check if farmer record exists
SELECT _id, userid, farmname, createdat FROM "public"."farmers" 
WHERE userid = '0a7b48ff-a9a1-451f-b6a0-43c1a50d77cf';

-- If user role is still not 'farmer', force update it
UPDATE "public"."users" 
SET role = 'farmer' 
WHERE email = 'karthikc11105@gmail.com';

-- Create farmer record if missing
INSERT INTO "public"."farmers" (
  _id, 
  userid, 
  farmname, 
  createdat, 
  updatedat
) VALUES (
  gen_random_uuid(),
  '0a7b48ff-a9a1-451f-b6a0-43c1a50d77cf',
  'Test Farm',
  NOW(),
  NOW()
) ON CONFLICT (userid) DO UPDATE 
SET farmname = 'Test Farm', updatedat = NOW();
