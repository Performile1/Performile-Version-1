-- ============================================================================
-- ADD DELIVERY TRACKING COLUMNS
-- Date: November 8, 2025
-- Purpose: Add columns for delivery time predictions and review tracking
-- ============================================================================

-- ============================================================================
-- 1. ADD DELIVERY TIME TRACKING
-- ============================================================================

-- Add delivery_days column (calculated from timestamps)
-- Note: Using function instead of GENERATED column to avoid immutability issues
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_days DECIMAL(4,2);

-- Add delivered_hour column (hour of day when delivered)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivered_hour INTEGER;

-- Create function to calculate delivery days
CREATE OR REPLACE FUNCTION calculate_delivery_days(
  created_ts TIMESTAMP WITH TIME ZONE,
  delivered_ts TIMESTAMP WITH TIME ZONE
) RETURNS DECIMAL(4,2) AS $$
BEGIN
  IF delivered_ts IS NULL OR created_ts IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN EXTRACT(EPOCH FROM (delivered_ts - created_ts)) / 86400;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to extract hour from timestamp
CREATE OR REPLACE FUNCTION extract_hour_immutable(
  ts TIMESTAMP WITH TIME ZONE
) RETURNS INTEGER AS $$
BEGIN
  IF ts IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN EXTRACT(HOUR FROM ts)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to automatically update delivery_days and delivered_hour
CREATE OR REPLACE FUNCTION update_delivery_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate delivery days
  NEW.delivery_days := calculate_delivery_days(NEW.created_at, NEW.delivered_at);
  
  -- Extract delivery hour
  NEW.delivered_hour := extract_hour_immutable(NEW.delivered_at);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_update_delivery_metrics ON orders;

-- Create trigger
CREATE TRIGGER trigger_update_delivery_metrics
  BEFORE INSERT OR UPDATE OF created_at, delivered_at ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_delivery_metrics();

-- Backfill existing data
UPDATE orders
SET 
  delivery_days = calculate_delivery_days(created_at, delivered_at),
  delivered_hour = extract_hour_immutable(delivered_at)
WHERE delivered_at IS NOT NULL;

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_orders_delivery_days 
ON orders(delivery_days) 
WHERE delivery_days IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_delivered_hour 
ON orders(delivered_hour) 
WHERE delivered_hour IS NOT NULL;

-- ============================================================================
-- 2. VERIFY RESULTS
-- ============================================================================

-- Check sample data
SELECT 
  order_id,
  created_at,
  delivered_at,
  delivery_days,
  delivered_hour,
  CASE 
    WHEN delivery_days IS NOT NULL THEN 'Calculated'
    ELSE 'Pending'
  END as status
FROM orders
WHERE delivered_at IS NOT NULL
LIMIT 10;

-- Summary statistics
SELECT 
  COUNT(*) as total_orders,
  COUNT(delivered_at) as delivered_orders,
  COUNT(delivery_days) as orders_with_delivery_days,
  ROUND(AVG(delivery_days), 2) as avg_delivery_days,
  MIN(delivery_days) as min_delivery_days,
  MAX(delivery_days) as max_delivery_days
FROM orders;

-- Delivery hour distribution
SELECT 
  delivered_hour,
  COUNT(*) as delivery_count,
  ROUND(COUNT(*)::NUMERIC / SUM(COUNT(*)) OVER () * 100, 2) as percentage
FROM orders
WHERE delivered_hour IS NOT NULL
GROUP BY delivered_hour
ORDER BY delivered_hour;

-- ============================================================================
-- NOTES
-- ============================================================================

-- Why not use GENERATED ALWAYS AS?
-- PostgreSQL requires generated columns to use IMMUTABLE functions.
-- EXTRACT() is marked as STABLE (not IMMUTABLE) because it depends on timezone.
-- Solution: Use triggers instead to automatically calculate values.

-- Benefits of this approach:
-- 1. Values are calculated automatically on INSERT/UPDATE
-- 2. Can be indexed for fast queries
-- 3. No timezone issues
-- 4. Works with existing data (backfill)

-- To manually recalculate (if needed):
-- UPDATE orders SET delivery_days = calculate_delivery_days(created_at, delivered_at);
