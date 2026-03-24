-- Check if vighnesh's farmer record exists
SELECT _id, userid, farmname FROM "public"."farmers" 
WHERE userid = '0b87233e-908a-48a8-9b97-461ef11329b2';

-- Check all orders in the database
SELECT _id, ordernumber, farmerid, consumerid, status, createdat 
FROM "public"."orders" 
ORDER BY createdat DESC;

-- Check orders specifically for vighnesh's farmer ID
SELECT o._id, o.ordernumber, o.farmerid, o.consumerid, o.status, o.createdat,
       f.userid as farmer_userid, f.farmname
FROM "public"."orders" o
LEFT JOIN "public"."farmers" f ON o.farmerid = f._id
WHERE f.userid = '0b87233e-908a-48a8-9b97-461ef11329b2'
ORDER BY o.createdat DESC;
