-- Direct SQL test to verify products and farmer locations
-- Run this in Supabase SQL Editor

-- 1. Check if products exist with farmer info
SELECT 
    p._id as product_id,
    p.name as product_name,
    p.farmerid,
    f.farmname,
    f.latitude as farmer_lat,
    f.longitude as farmer_lng
FROM products p
JOIN farmers f ON p.farmerid = f._id
WHERE p.name IN ('apple', 'Tomato');

-- 2. Check farmer location for the products
SELECT 
    _id,
    farmname,
    latitude,
    longitude,
    userid
FROM farmers
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 3. Update farmer location if needed
-- UPDATE farmers 
-- SET latitude = 19.0760, longitude = 72.8777
-- WHERE farmname = 'Test Farm';

-- 4. Check customer location
SELECT 
    userid,
    defaultaddressstreet,
    defaultaddresscity,
    latitude,
    longitude
FROM consumers
WHERE userid = '0a7b48ff-a9a1-451f-b6a0-43c1a50d77cf';

-- 5. Update customer location if needed
-- UPDATE consumers 
-- SET latitude = 19.0760, longitude = 72.8777
-- WHERE userid = '0a7b48ff-a9a1-451f-b6a0-43c1a50d77cf';
