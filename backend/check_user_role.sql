-- Check current user role
SELECT _id, name, email, role FROM "public"."users" WHERE email = 'karthikc11105@gmail.com';

-- If role is not 'farmer', update it to 'farmer'
UPDATE "public"."users" 
SET role = 'farmer' 
WHERE email = 'karthikc11105@gmail.com' AND role != 'farmer';

-- Verify the update
SELECT _id, name, email, role FROM "public"."users" WHERE email = 'karthikc11105@gmail.com';

-- Check if farmer record exists
SELECT _id, userid, farmname FROM "public"."farmers" WHERE userid = '0a7b48ff-a9a1-451f-b6a0-43c1a50d77cf';

-- If no farmer record exists, create one
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
) ON CONFLICT (userid) DO NOTHING;
