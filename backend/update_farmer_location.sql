-- Update farmer location to customer's actual location (Andhra Pradesh area)
-- Customer location: 15.759457, 78.03928
-- Farmer ID: 0b87233e-908a-48a8-9b97-461ef11329b2 (Test Farmer)

-- Update farmer location
UPDATE public.farmers 
SET 
  latitude = 15.759457,
  longitude = 78.03928,
  updatedat = CURRENT_TIMESTAMP
WHERE userid = '0b87233e-908a-48a8-9b97-461ef11329b2';

-- Verify the update
SELECT 
  _id, 
  farmname, 
  latitude, 
  longitude,
  verificationstatus
FROM public.farmers 
WHERE userid = '0b87233e-908a-48a8-9b97-461ef11329b2';
