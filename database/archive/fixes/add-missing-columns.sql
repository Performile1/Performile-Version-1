-- ============================================================================
-- ADD MISSING COLUMNS TO ORDERS AND TRACKING_DATA TABLES
-- ============================================================================
-- This adds columns that should exist for a complete e-commerce platform
-- ============================================================================

-- Add missing columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS pickup_address TEXT,
ADD COLUMN IF NOT EXISTS package_weight NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS package_dimensions VARCHAR(50),
ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(10,2);

-- Add missing columns to tracking_data table
ALTER TABLE tracking_data
ADD COLUMN IF NOT EXISTS location TEXT;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name IN ('pickup_address', 'package_weight', 'package_dimensions', 'shipping_cost')
ORDER BY column_name;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tracking_data' 
  AND column_name = 'location'
ORDER BY column_name;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Missing columns added successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📦 Orders table now has:';
    RAISE NOTICE '   - pickup_address (TEXT)';
    RAISE NOTICE '   - package_weight (NUMERIC)';
    RAISE NOTICE '   - package_dimensions (VARCHAR)';
    RAISE NOTICE '   - shipping_cost (NUMERIC)';
    RAISE NOTICE '';
    RAISE NOTICE '📍 Tracking_data table now has:';
    RAISE NOTICE '   - location (TEXT)';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Now you can run create-sample-orders.sql!';
    RAISE NOTICE '';
END $$;
