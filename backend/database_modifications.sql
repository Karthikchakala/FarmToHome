-- Safe Database Modifications for Farm to Table
-- This script checks for existing objects before creating them

-- 1. Add explicit location columns to farmers table (if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'farmers' AND column_name = 'latitude') THEN
        EXECUTE 'ALTER TABLE farmers ADD COLUMN latitude DECIMAL(10, 8)';
        RAISE NOTICE 'Added latitude column to farmers table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'farmers' AND column_name = 'longitude') THEN
        EXECUTE 'ALTER TABLE farmers ADD COLUMN longitude DECIMAL(11, 8)';
        RAISE NOTICE 'Added longitude column to farmers table';
    END IF;
END $$;

-- 2. Add explicit location columns to consumers table (if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'consumers' AND column_name = 'latitude') THEN
        EXECUTE 'ALTER TABLE consumers ADD COLUMN latitude DECIMAL(10, 8)';
        RAISE NOTICE 'Added latitude column to consumers table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'consumers' AND column_name = 'longitude') THEN
        EXECUTE 'ALTER TABLE consumers ADD COLUMN longitude DECIMAL(11, 8)';
        RAISE NOTICE 'Added longitude column to consumers table';
    END IF;
END $$;

-- 3. Fix Products table - Remove UNIQUE constraint from farmerid (if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'products' 
        AND constraint_name = 'products_farmerid_fkey' 
        AND constraint_type = 'UNIQUE'
    ) THEN
        EXECUTE 'ALTER TABLE products DROP CONSTRAINT products_farmerid_fkey';
        EXECUTE 'ALTER TABLE products ADD CONSTRAINT products_farmerid_fkey FOREIGN KEY (farmerid) REFERENCES public.farmers(_id)';
        RAISE NOTICE 'Fixed products table farmerid constraint';
    END IF;
END $$;

-- 4. Create indexes (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_farmers_location ON farmers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_consumers_location ON consumers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_farmers_latlng ON farmers(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consumers_latlng ON consumers(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_location ON products(farmerid) WHERE isavailable = true;

-- 5. Add coordinate validation constraints (if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'chk_farmers_lat'
    ) THEN
        EXECUTE 'ALTER TABLE farmers ADD CONSTRAINT chk_farmers_lat CHECK (latitude >= -90 AND latitude <= 90)';
        RAISE NOTICE 'Added farmers latitude check constraint';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'chk_farmers_lng'
    ) THEN
        EXECUTE 'ALTER TABLE farmers ADD CONSTRAINT chk_farmers_lng CHECK (longitude >= -180 AND longitude <= 180)';
        RAISE NOTICE 'Added farmers longitude check constraint';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'chk_consumers_lat'
    ) THEN
        EXECUTE 'ALTER TABLE consumers ADD CONSTRAINT chk_consumers_lat CHECK (latitude >= -90 AND latitude <= 90)';
        RAISE NOTICE 'Added consumers latitude check constraint';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'chk_consumers_lng'
    ) THEN
        EXECUTE 'ALTER TABLE consumers ADD CONSTRAINT chk_consumers_lng CHECK (longitude >= -180 AND longitude <= 180)';
        RAISE NOTICE 'Added consumers longitude check constraint';
    END IF;
END $$;

-- 6. Check and fix reviews table constraint (only if there's an issue)
DO $$
BEGIN
    -- Check if the constraint name doesn't match the column name
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'reviews' 
        AND tc.constraint_name = 'reviews_order_id_fkey'
        AND kcu.column_name = 'orderid'
    ) THEN
        -- Drop the mismatched constraint
        EXECUTE 'ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_order_id_fkey';
        -- Add the correct constraint
        EXECUTE 'ALTER TABLE reviews ADD CONSTRAINT reviews_orderid_fkey FOREIGN KEY (orderid) REFERENCES public.orders(_id)';
        RAISE NOTICE 'Fixed reviews table constraint name mismatch';
    END IF;
END $$;

-- 7. Create a trigger to sync PostGIS location with explicit lat/lng (optional)
CREATE OR REPLACE FUNCTION sync_location_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- For farmers table
    IF TG_TABLE_NAME = 'farmers' THEN
        -- If PostGIS location is updated, update lat/lng
        IF NEW.location IS NOT NULL THEN
            -- This would need PostGIS functions to extract lat/lng from geometry
            -- For now, we'll skip this as it requires PostGIS-specific functions
            NULL;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS sync_location_trigger ON farmers;
CREATE TRIGGER sync_location_trigger
    BEFORE INSERT OR UPDATE ON farmers
    FOR EACH ROW
    EXECUTE FUNCTION sync_location_columns();

RAISE NOTICE 'Database modifications completed successfully!';
