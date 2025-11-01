-- =====================================================
-- ADD MISSING TRACKING COLUMNS TO ORDERS TABLE
-- =====================================================
-- Date: November 1, 2025, 8:13 PM
-- Purpose: Add critical tracking data columns for TrustScore calculation
-- Priority: CRITICAL - Required for complete data collection
-- =====================================================

-- =====================================================
-- 1. ADD DELIVERY TRACKING COLUMNS
-- =====================================================

-- Delivery attempts (how many tries to deliver)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_attempts INTEGER DEFAULT 1;

COMMENT ON COLUMN orders.delivery_attempts IS 
'Number of delivery attempts made by courier (1 = delivered on first try)';

-- First response time (how fast courier responded to order)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS first_response_time INTERVAL;

COMMENT ON COLUMN orders.first_response_time IS 
'Time between order creation and courier first response/pickup';

-- Last mile duration (final delivery time from depot to customer)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS last_mile_duration INTERVAL;

COMMENT ON COLUMN orders.last_mile_duration IS 
'Duration of final delivery leg from depot/hub to customer';

-- =====================================================
-- 2. ADD ISSUE TRACKING COLUMNS
-- =====================================================

-- Issue reported (customer or merchant flagged a problem)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS issue_reported BOOLEAN DEFAULT false;

COMMENT ON COLUMN orders.issue_reported IS 
'Whether an issue was reported for this order';

-- Issue resolved (problem was fixed)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS issue_resolved BOOLEAN DEFAULT false;

COMMENT ON COLUMN orders.issue_resolved IS 
'Whether the reported issue was resolved';

-- Issue description (what went wrong)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS issue_description TEXT;

COMMENT ON COLUMN orders.issue_description IS 
'Description of the issue reported';

-- Resolution time (how long to fix the issue)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS resolution_time INTERVAL;

COMMENT ON COLUMN orders.resolution_time IS 
'Time taken to resolve the reported issue';

-- =====================================================
-- 3. ADD ENHANCED TIMESTAMP COLUMNS
-- =====================================================

-- Pickup timestamp (when courier picked up the package)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN orders.picked_up_at IS 
'Timestamp when courier picked up the package';

-- Out for delivery timestamp
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS out_for_delivery_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN orders.out_for_delivery_at IS 
'Timestamp when package went out for delivery';

-- Delivered timestamp (actual delivery time)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN orders.delivered_at IS 
'Timestamp when package was delivered to customer';

-- =====================================================
-- 4. ADD LOCATION TRACKING COLUMNS
-- =====================================================

-- Pickup location
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS pickup_postal_code VARCHAR(20);

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS pickup_city VARCHAR(100);

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS pickup_country VARCHAR(2) DEFAULT 'SE';

-- Delivery location (if not already exists)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_postal_code VARCHAR(20);

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_city VARCHAR(100);

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_country VARCHAR(2) DEFAULT 'SE';

COMMENT ON COLUMN orders.pickup_postal_code IS 
'Postal code where package was picked up';

COMMENT ON COLUMN orders.delivery_postal_code IS 
'Postal code where package was delivered';

-- =====================================================
-- 5. ADD PERFORMANCE TRACKING COLUMNS
-- =====================================================

-- Estimated delivery (promised delivery date)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN orders.estimated_delivery IS 
'Promised delivery date/time to customer';

-- Actual delivery date (for on-time calculation)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_date DATE;

COMMENT ON COLUMN orders.delivery_date IS 
'Actual delivery date (used for on-time rate calculation)';

-- Tracking number
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);

COMMENT ON COLUMN orders.tracking_number IS 
'Courier tracking number for this order';

-- =====================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for delivery attempts queries
CREATE INDEX IF NOT EXISTS idx_orders_delivery_attempts 
ON orders(delivery_attempts) 
WHERE delivery_attempts IS NOT NULL;

-- Index for issue tracking
CREATE INDEX IF NOT EXISTS idx_orders_issues 
ON orders(issue_reported, issue_resolved) 
WHERE issue_reported = true;

-- Index for on-time delivery calculation
CREATE INDEX IF NOT EXISTS idx_orders_on_time 
ON orders(delivery_date, estimated_delivery) 
WHERE delivery_date IS NOT NULL AND estimated_delivery IS NOT NULL;

-- Index for postal code queries
CREATE INDEX IF NOT EXISTS idx_orders_delivery_postal 
ON orders(delivery_postal_code) 
WHERE delivery_postal_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_pickup_postal 
ON orders(pickup_postal_code) 
WHERE pickup_postal_code IS NOT NULL;

-- Index for tracking number lookups
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number 
ON orders(tracking_number) 
WHERE tracking_number IS NOT NULL;

-- =====================================================
-- 7. UPDATE EXISTING ORDERS WITH DEFAULT VALUES
-- =====================================================

-- Set delivery_attempts to 1 for already delivered orders
UPDATE orders 
SET delivery_attempts = 1 
WHERE order_status = 'delivered' 
  AND delivery_attempts IS NULL;

-- Set issue_resolved to true if no issue was reported
UPDATE orders 
SET issue_resolved = false 
WHERE issue_reported = false 
  AND issue_resolved IS NULL;

-- Calculate first_response_time for existing orders with pickup data
UPDATE orders 
SET first_response_time = picked_up_at - created_at
WHERE picked_up_at IS NOT NULL 
  AND first_response_time IS NULL;

-- Set delivery_date from delivered_at for existing orders
UPDATE orders 
SET delivery_date = DATE(delivered_at)
WHERE delivered_at IS NOT NULL 
  AND delivery_date IS NULL;

-- =====================================================
-- 8. VERIFICATION
-- =====================================================

-- Verify all columns were added
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN (
    'delivery_attempts',
    'first_response_time',
    'last_mile_duration',
    'issue_reported',
    'issue_resolved',
    'issue_description',
    'resolution_time',
    'picked_up_at',
    'out_for_delivery_at',
    'delivered_at',
    'pickup_postal_code',
    'delivery_postal_code',
    'estimated_delivery',
    'delivery_date',
    'tracking_number'
  )
ORDER BY column_name;

-- Verify indexes were created
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'orders'
  AND indexname LIKE 'idx_orders_%'
ORDER BY indexname;

-- Check sample data
SELECT 
  COUNT(*) as total_orders,
  COUNT(delivery_attempts) as with_delivery_attempts,
  COUNT(first_response_time) as with_response_time,
  COUNT(issue_reported) as with_issue_tracking,
  COUNT(tracking_number) as with_tracking_number,
  COUNT(delivery_postal_code) as with_delivery_postal,
  ROUND(AVG(delivery_attempts)::NUMERIC, 2) as avg_delivery_attempts
FROM orders;

-- =====================================================
-- 9. SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ SUCCESS: All tracking columns added to orders table';
  RAISE NOTICE '✅ Indexes created for performance';
  RAISE NOTICE '✅ Existing orders updated with default values';
  RAISE NOTICE '';
  RAISE NOTICE '📊 COLUMNS ADDED:';
  RAISE NOTICE '  - delivery_attempts (INTEGER)';
  RAISE NOTICE '  - first_response_time (INTERVAL)';
  RAISE NOTICE '  - last_mile_duration (INTERVAL)';
  RAISE NOTICE '  - issue_reported (BOOLEAN)';
  RAISE NOTICE '  - issue_resolved (BOOLEAN)';
  RAISE NOTICE '  - issue_description (TEXT)';
  RAISE NOTICE '  - resolution_time (INTERVAL)';
  RAISE NOTICE '  - picked_up_at (TIMESTAMP)';
  RAISE NOTICE '  - out_for_delivery_at (TIMESTAMP)';
  RAISE NOTICE '  - delivered_at (TIMESTAMP)';
  RAISE NOTICE '  - pickup_postal_code (VARCHAR)';
  RAISE NOTICE '  - delivery_postal_code (VARCHAR)';
  RAISE NOTICE '  - estimated_delivery (TIMESTAMP)';
  RAISE NOTICE '  - delivery_date (DATE)';
  RAISE NOTICE '  - tracking_number (VARCHAR)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 READY: TrustScore calculation can now use complete tracking data';
END $$;
