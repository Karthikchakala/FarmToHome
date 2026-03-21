-- Fix Products Table - Remove Incorrect UNIQUE Constraint
-- This script removes the incorrect UNIQUE constraint on farmerid in products table
-- A farmer should be able to have multiple products, not just one

-- 1. Drop the incorrect UNIQUE constraint on farmerid
DO $$
BEGIN
    -- Check if the constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'products' 
        AND constraint_name = 'products_farmerid_key'
        AND constraint_type = 'UNIQUE'
    ) THEN
        EXECUTE 'ALTER TABLE products DROP CONSTRAINT products_farmerid_key';
        RAISE NOTICE 'Dropped incorrect UNIQUE constraint on products.farmerid';
    END IF;
    
    -- Also check for any other farmerid unique constraints
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'products' 
        AND constraint_name LIKE '%farmerid%'
        AND constraint_type = 'UNIQUE'
    ) THEN
        -- Drop any other farmerid unique constraints
        EXECUTE 'ALTER TABLE products DROP CONSTRAINT IF EXISTS products_farmerid_unique';
        EXECUTE 'ALTER TABLE products DROP CONSTRAINT IF EXISTS unique_farmerid';
        RAISE NOTICE 'Dropped additional farmerid UNIQUE constraints';
    END IF;
END $$;

-- 2. Add proper UNIQUE constraint (if needed) - product name + farmerid should be unique
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'products' 
        AND constraint_name = 'products_farmerid_name_unique'
        AND constraint_type = 'UNIQUE'
    ) THEN
        EXECUTE 'ALTER TABLE products ADD CONSTRAINT products_farmerid_name_unique UNIQUE (farmerid, name)';
        RAISE NOTICE 'Added proper UNIQUE constraint on (farmerid, name)';
    END IF;
END $$;

-- 3. Verify the fix
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'products'
    AND tc.constraint_type = 'UNIQUE'
ORDER BY tc.constraint_name;

-- 4. Test insert (optional)
-- This is a test to verify the fix works
-- Uncomment to test:
-- INSERT INTO products (farmerid, name, description, category, priceperunit, unit, stockquantity, minorderquantity, isavailable, harvestdate)
-- VALUES ('test-farmer-id', 'test-product', 'test description', 'test-category', 100, 'kg', 10, 1, true, CURRENT_DATE)
-- ON CONFLICT (farmerid, name) DO NOTHING;

-- 5. Clean up test data (if inserted)
-- DELETE FROM products WHERE farmerid = 'test-farmer-id' AND name = 'test-product';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Products table UNIQUE constraint fix completed successfully!';
    RAISE NOTICE '✅ Farmers can now add multiple products!';
END $$;
