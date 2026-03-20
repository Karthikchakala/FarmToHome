-- Sample Data for Testing Nearby Products
-- This adds sample farmers with locations and products

-- Sample Farmers with Locations (Hyderabad area)
INSERT INTO public.farmers (userid, farmname, description, farmingtype, latitude, longitude, deliveryradius, verificationstatus, ratingaverage, totalreviews, totalsales, commissionrate, isapproved, farmerid) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Green Valley Farm', 'Organic vegetables and fruits', 'organic', 17.3850, 78.4867, 10, 'approved', 4.5, 23, 15000.00, 5.00, true, gen_random_uuid()),
('550e8400-e29b-41d4-a716-446655440002', 'Sunny Acres', 'Fresh seasonal produce', 'natural', 17.4250, 78.4350, 8, 'approved', 4.2, 18, 12000.00, 5.00, true, gen_random_uuid()),
('550e8400-e29b-41d4-a716-446655440003', 'Herb Haven', 'Medicinal herbs and spices', 'organic', 17.4500, 78.3800, 12, 'approved', 4.8, 31, 22000.00, 5.00, true, gen_random_uuid()),
('550e8400-e29b-41d4-a716-446655440004', 'Meadow Bloom Farm', 'Dairy and poultry products', 'mixed', 17.3600, 78.5200, 7, 'approved', 4.1, 15, 8000.00, 5.00, true, gen_random_uuid()),
('550e8400-e29b-41d4-a716-446655440005', 'Terrace Gardens', 'Rooftop grown vegetables', 'organic', 17.4050, 78.4750, 5, 'approved', 4.6, 27, 18000.00, 5.00, true, gen_random_uuid())
ON CONFLICT (userid) DO NOTHING;

-- Sample Products for each farmer
INSERT INTO public.products (farmerid, name, description, category, unit, priceperunit, stockquantity, minorderquantity, images, isavailable, harvestdate, expirydate, ratingaverage, ratingcount, isfeatured) VALUES
-- Green Valley Farm Products
((SELECT _id FROM public.farmers WHERE farmname = 'Green Valley Farm'), 'Fresh Tomatoes', 'Ripe organic tomatoes', 'vegetables', 'kg', 40.00, 100, 1, ARRAY['tomato1.jpg', 'tomato2.jpg'], true, CURRENT_DATE - 2, CURRENT_DATE + 5, 4.3, 12, true),
((SELECT _id FROM public.farmers WHERE farmname = 'Green Valley Farm'), 'Organic Spinach', 'Fresh green spinach leaves', 'vegetables', 'kg', 30.00, 50, 0.5, ARRAY['spinach1.jpg'], true, CURRENT_DATE - 1, CURRENT_DATE + 3, 4.5, 8, false),

-- Sunny Acres Products  
((SELECT _id FROM public.farmers WHERE farmname = 'Sunny Acres'), 'Red Chillies', 'Hot red chillies', 'vegetables', 'kg', 80.00, 30, 0.25, ARRAY['chilli1.jpg'], true, CURRENT_DATE - 3, CURRENT_DATE + 7, 4.1, 6, true),
((SELECT _id FROM public.farmers WHERE farmname = 'Sunny Acres'), 'Fresh Carrots', 'Crunchy orange carrots', 'vegetables', 'kg', 35.00, 80, 0.5, ARRAY['carrot1.jpg'], true, CURRENT_DATE - 2, CURRENT_DATE + 6, 4.2, 10, false),

-- Herb Haven Products
((SELECT _id FROM public.farmers WHERE farmname = 'Herb Haven'), 'Turmeric Powder', 'Pure organic turmeric', 'spices', 'kg', 200.00, 20, 0.1, ARRAY['turmeric1.jpg'], true, CURRENT_DATE - 10, CURRENT_DATE + 60, 4.8, 15, true),
((SELECT _id FROM public.farmers WHERE farmname = 'Herb Haven'), 'Coriander Leaves', 'Fresh coriander bunches', 'herbs', 'piece', 10.00, 100, 1, ARRAY['coriander1.jpg'], true, CURRENT_DATE - 1, CURRENT_DATE + 2, 4.7, 20, false),

-- Meadow Bloom Farm Products
((SELECT _id FROM public.farmers WHERE farmname = 'Meadow Bloom Farm'), 'Fresh Eggs', 'Free-range chicken eggs', 'dairy', 'dozen', 60.00, 40, 1, ARRAY['eggs1.jpg'], true, CURRENT_DATE - 1, CURRENT_DATE + 7, 4.3, 25, true),
((SELECT _id FROM public.farmers WHERE farmname = 'Meadow Bloom Farm'), 'Cow Milk', 'Fresh cow milk', 'dairy', 'litre', 45.00, 50, 1, ARRAY['milk1.jpg'], true, CURRENT_DATE, CURRENT_DATE + 2, 4.4, 18, false),

-- Terrace Gardens Products
((SELECT _id FROM public.farmers WHERE farmname = 'Terrace Gardens'), 'Lettuce', 'Fresh lettuce leaves', 'vegetables', 'piece', 15.00, 60, 1, ARRAY['lettuce1.jpg'], true, CURRENT_DATE - 1, CURRENT_DATE + 3, 4.6, 12, true),
((SELECT _id FROM public.farmers WHERE farmname = 'Terrace Gardens'), 'Bell Peppers', 'Colorful bell peppers', 'vegetables', 'kg', 60.00, 40, 0.5, ARRAY['pepper1.jpg'], true, CURRENT_DATE - 2, CURRENT_DATE + 5, 4.5, 9, false)
ON CONFLICT DO NOTHING;

-- Update PostGIS location fields to match the new lat/lng columns
UPDATE public.farmers SET location = ST_Point(longitude, latitude)::geography WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Verify the data
SELECT 
    f.farmname,
    f.latitude,
    f.longitude,
    p.name as product_name,
    p.priceperunit,
    ST_Distance(
        ST_Point(f.longitude, f.latitude)::geography,
        ST_Point(78.4867, 17.3850)::geography
    ) / 1000 as distance_from_hyderabad_km
FROM public.farmers f
JOIN public.products p ON f._id = p.farmerid
WHERE f.latitude IS NOT NULL AND f.longitude IS NOT NULL
ORDER BY distance_from_hyderabad_km;
