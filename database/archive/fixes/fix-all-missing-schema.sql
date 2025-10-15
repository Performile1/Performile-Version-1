-- ============================================================================
-- FIX ALL MISSING SCHEMA ELEMENTS
-- ============================================================================
-- Comprehensive fix for all missing columns and enum values
-- ============================================================================

-- 1. Check what order_status enum values exist
DO $$
DECLARE
    enum_values TEXT;
BEGIN
    SELECT string_agg(enumlabel, ', ' ORDER BY enumsortorder)
    INTO enum_values
    FROM pg_enum
    WHERE enumtypid = 'order_status'::regtype;
    
    RAISE NOTICE 'Current order_status enum values: %', enum_values;
END $$;

-- 2. Add missing enum values if they don't exist
DO $$
BEGIN
    -- Add 'processing' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = 'order_status'::regtype 
        AND enumlabel = 'processing'
    ) THEN
        ALTER TYPE order_status ADD VALUE 'processing';
        RAISE NOTICE '✅ Added "processing" to order_status enum';
    ELSE
        RAISE NOTICE '⚠️  "processing" already exists in order_status enum';
    END IF;
    
    -- Add 'cancelled' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = 'order_status'::regtype 
        AND enumlabel = 'cancelled'
    ) THEN
        ALTER TYPE order_status ADD VALUE 'cancelled';
        RAISE NOTICE '✅ Added "cancelled" to order_status enum';
    ELSE
        RAISE NOTICE '⚠️  "cancelled" already exists in order_status enum';
    END IF;
    
    -- Add 'shipped' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = 'order_status'::regtype 
        AND enumlabel = 'shipped'
    ) THEN
        ALTER TYPE order_status ADD VALUE 'shipped';
        RAISE NOTICE '✅ Added "shipped" to order_status enum';
    ELSE
        RAISE NOTICE '⚠️  "shipped" already exists in order_status enum';
    END IF;
END $$;

-- 3. Add missing columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS pickup_address TEXT,
ADD COLUMN IF NOT EXISTS package_weight NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS package_dimensions VARCHAR(50),
ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(10,2);

-- 4. Add missing columns to tracking_data table
ALTER TABLE tracking_data
ADD COLUMN IF NOT EXISTS location TEXT;

-- 5. Verify all columns exist
DO $$
DECLARE
    missing_cols TEXT[];
BEGIN
    -- Check orders table
    SELECT array_agg(col)
    INTO missing_cols
    FROM unnest(ARRAY['pickup_address', 'package_weight', 'package_dimensions', 'shipping_cost', 'customer_email']) AS col
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = col
    );
    
    IF missing_cols IS NOT NULL THEN
        RAISE WARNING 'Orders table still missing columns: %', array_to_string(missing_cols, ', ');
    ELSE
        RAISE NOTICE '✅ Orders table has all required columns';
    END IF;
    
    -- Check tracking_data table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tracking_data' AND column_name = 'location'
    ) THEN
        RAISE WARNING 'Tracking_data table missing location column';
    ELSE
        RAISE NOTICE '✅ Tracking_data table has location column';
    END IF;
END $$;

-- 6. Show final schema
SELECT 
    'orders' as table_name,
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders'
ORDER BY ordinal_position;

SELECT 
    'tracking_data' as table_name,
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tracking_data'
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Schema fixes complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📦 Orders table columns added:';
    RAISE NOTICE '   - pickup_address';
    RAISE NOTICE '   - package_weight';
    RAISE NOTICE '   - package_dimensions';
    RAISE NOTICE '   - shipping_cost';
    RAISE NOTICE '';
    RAISE NOTICE '📍 Tracking_data columns added:';
    RAISE NOTICE '   - location';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Order status enum values added:';
    RAISE NOTICE '   - processing';
    RAISE NOTICE '   - cancelled';
    RAISE NOTICE '   - shipped';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Now run create-sample-orders.sql!';
    RAISE NOTICE '';
END $$;
