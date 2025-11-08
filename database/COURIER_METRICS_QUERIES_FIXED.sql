-- ============================================================================
-- COURIER METRICS QUERIES - CORRECTED FOR YOUR SCHEMA
-- Date: November 9, 2025
-- Purpose: Working SQL queries for courier performance metrics
-- ============================================================================

-- ============================================================================
-- SETUP: Add missing columns if needed
-- ============================================================================

-- Add delivered_at column if it doesn't exist
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- Add delivery_attempts column if it doesn't exist
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_attempts INTEGER DEFAULT 1;

-- Add failure tracking columns
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS failure_reason VARCHAR(100),
ADD COLUMN IF NOT EXISTS failure_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS responsible_party VARCHAR(50);

-- ============================================================================
-- 1. COMPLETION RATE (Successful Deliveries)
-- ============================================================================

-- Calculate completion rate for a specific courier
SELECT 
  o.courier_id,
  c.courier_name,
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE o.order_status = 'delivered') as completed_orders,
  COUNT(*) FILTER (WHERE o.order_status != 'delivered' AND o.order_status != 'pending') as failed_orders,
  ROUND(
    COUNT(*) FILTER (WHERE o.order_status = 'delivered')::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as completion_rate_percent
FROM orders o
JOIN couriers c ON o.courier_id = c.courier_id
WHERE o.created_at >= NOW() - INTERVAL '90 days'
  AND o.courier_id IS NOT NULL
GROUP BY o.courier_id, c.courier_name
ORDER BY completion_rate_percent DESC;

-- ============================================================================
-- 2. ON-TIME DELIVERY RATE
-- ============================================================================

-- Calculate on-time delivery rate
-- Note: Using estimated_delivery_date if it exists, otherwise calculate from created_at
SELECT 
  o.courier_id,
  c.courier_name,
  COUNT(*) as total_delivered,
  COUNT(*) FILTER (
    WHERE o.delivered_at <= COALESCE(
      o.estimated_delivery_date,
      o.created_at + INTERVAL '3 days'  -- Default 3 days if no estimate
    )
  ) as on_time_deliveries,
  COUNT(*) FILTER (
    WHERE o.delivered_at > COALESCE(
      o.estimated_delivery_date,
      o.created_at + INTERVAL '3 days'
    )
  ) as late_deliveries,
  ROUND(
    COUNT(*) FILTER (
      WHERE o.delivered_at <= COALESCE(
        o.estimated_delivery_date,
        o.created_at + INTERVAL '3 days'
      )
    )::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as on_time_rate_percent
FROM orders o
JOIN couriers c ON o.courier_id = c.courier_id
WHERE o.order_status = 'delivered'
  AND o.delivered_at IS NOT NULL
  AND o.created_at >= NOW() - INTERVAL '90 days'
GROUP BY o.courier_id, c.courier_name
ORDER BY on_time_rate_percent DESC;

-- ============================================================================
-- 3. FIRST-ATTEMPT SUCCESS RATE
-- ============================================================================

-- Calculate first-attempt success rate
SELECT 
  o.courier_id,
  c.courier_name,
  COUNT(*) as total_delivered,
  COUNT(*) FILTER (WHERE o.delivery_attempts = 1) as first_attempt_success,
  COUNT(*) FILTER (WHERE o.delivery_attempts > 1) as required_reattempt,
  ROUND(
    COUNT(*) FILTER (WHERE o.delivery_attempts = 1)::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as first_attempt_rate_percent
FROM orders o
JOIN couriers c ON o.courier_id = c.courier_id
WHERE o.order_status = 'delivered'
  AND o.created_at >= NOW() - INTERVAL '90 days'
GROUP BY o.courier_id, c.courier_name
ORDER BY first_attempt_rate_percent DESC;

-- ============================================================================
-- 4. FAILURE RATE BY CATEGORY
-- ============================================================================

-- Calculate failure rate by category
SELECT 
  o.courier_id,
  c.courier_name,
  COUNT(*) as total_orders,
  
  -- Courier fault failures
  COUNT(*) FILTER (WHERE o.responsible_party = 'courier') as courier_fault_failures,
  COUNT(*) FILTER (WHERE o.failure_reason = 'lost_in_transit') as lost_count,
  COUNT(*) FILTER (WHERE o.failure_reason = 'damaged_package') as damaged_count,
  COUNT(*) FILTER (WHERE o.failure_reason = 'cancelled_by_courier') as cancelled_count,
  
  -- Customer fault (not counted in TrustScore)
  COUNT(*) FILTER (WHERE o.responsible_party = 'customer') as customer_fault_failures,
  
  -- Failure rates
  ROUND(
    COUNT(*) FILTER (WHERE o.responsible_party = 'courier')::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as courier_fault_rate_percent
FROM orders o
JOIN couriers c ON o.courier_id = c.courier_id
WHERE o.created_at >= NOW() - INTERVAL '90 days'
  AND o.courier_id IS NOT NULL
GROUP BY o.courier_id, c.courier_name
ORDER BY courier_fault_rate_percent DESC;

-- ============================================================================
-- 5. DELIVERY TIME ANALYSIS (Days)
-- ============================================================================

-- Average delivery time by courier
SELECT 
  o.courier_id,
  c.courier_name,
  COUNT(*) as total_delivered,
  ROUND(AVG(o.delivery_days), 2) as avg_delivery_days,
  ROUND(MIN(o.delivery_days), 2) as min_delivery_days,
  ROUND(MAX(o.delivery_days), 2) as max_delivery_days,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o.delivery_days), 2) as median_delivery_days
FROM orders o
JOIN couriers c ON o.courier_id = c.courier_id
WHERE o.delivery_days IS NOT NULL
  AND o.created_at >= NOW() - INTERVAL '90 days'
GROUP BY o.courier_id, c.courier_name
ORDER BY avg_delivery_days ASC;

-- ============================================================================
-- 6. DELIVERY HOUR DISTRIBUTION
-- ============================================================================

-- When do deliveries typically happen?
SELECT 
  o.courier_id,
  c.courier_name,
  o.delivered_hour,
  COUNT(*) as delivery_count,
  ROUND(
    COUNT(*)::NUMERIC / 
    SUM(COUNT(*)) OVER (PARTITION BY o.courier_id) * 100, 
    2
  ) as percentage
FROM orders o
JOIN couriers c ON o.courier_id = c.courier_id
WHERE o.delivered_hour IS NOT NULL
  AND o.created_at >= NOW() - INTERVAL '30 days'
GROUP BY o.courier_id, c.courier_name, o.delivered_hour
ORDER BY o.courier_id, o.delivered_hour;

-- ============================================================================
-- 7. POSTAL CODE PERFORMANCE
-- ============================================================================

-- Performance by postal code for a specific courier
-- Replace 'YOUR-COURIER-ID-HERE' with actual UUID
SELECT 
  o.postal_code,
  COUNT(*) as total_deliveries,
  ROUND(AVG(o.delivery_days), 2) as avg_delivery_days,
  ROUND(
    COUNT(*) FILTER (WHERE o.order_status = 'delivered')::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as completion_rate_percent,
  ROUND(AVG(o.delivered_hour), 1) as avg_delivery_hour
FROM orders o
WHERE o.courier_id = (SELECT courier_id FROM couriers LIMIT 1)  -- Replace with specific courier
  AND o.created_at >= NOW() - INTERVAL '90 days'
  AND o.postal_code IS NOT NULL
GROUP BY o.postal_code
HAVING COUNT(*) >= 5  -- At least 5 deliveries
ORDER BY total_deliveries DESC
LIMIT 20;

-- ============================================================================
-- 8. COMPLETE COURIER SCORECARD
-- ============================================================================

-- Complete performance scorecard for all couriers
WITH courier_stats AS (
  SELECT 
    o.courier_id,
    c.courier_name,
    COUNT(*) as total_orders,
    COUNT(*) FILTER (WHERE o.order_status = 'delivered') as delivered_orders,
    COUNT(*) FILTER (WHERE o.responsible_party = 'courier') as courier_fault_failures,
    AVG(o.delivery_days) as avg_delivery_days,
    COUNT(*) FILTER (WHERE o.delivery_attempts = 1) as first_attempt_success,
    COUNT(*) FILTER (
      WHERE o.delivered_at <= COALESCE(
        o.estimated_delivery_date,
        o.created_at + INTERVAL '3 days'
      )
    ) as on_time_deliveries
  FROM orders o
  JOIN couriers c ON o.courier_id = c.courier_id
  WHERE o.created_at >= NOW() - INTERVAL '90 days'
    AND o.courier_id IS NOT NULL
  GROUP BY o.courier_id, c.courier_name
)
SELECT 
  courier_name,
  total_orders,
  delivered_orders,
  
  -- Completion Rate
  ROUND(delivered_orders::NUMERIC / NULLIF(total_orders, 0) * 100, 2) as completion_rate,
  
  -- On-Time Rate
  ROUND(on_time_deliveries::NUMERIC / NULLIF(delivered_orders, 0) * 100, 2) as on_time_rate,
  
  -- First-Attempt Rate
  ROUND(first_attempt_success::NUMERIC / NULLIF(delivered_orders, 0) * 100, 2) as first_attempt_rate,
  
  -- Failure Rate
  ROUND(courier_fault_failures::NUMERIC / NULLIF(total_orders, 0) * 100, 2) as failure_rate,
  
  -- Average Delivery Days
  ROUND(avg_delivery_days, 2) as avg_delivery_days,
  
  -- Simple TrustScore estimate (weighted average)
  ROUND(
    (
      (delivered_orders::NUMERIC / NULLIF(total_orders, 0) * 25) +  -- Completion: 25%
      (on_time_deliveries::NUMERIC / NULLIF(delivered_orders, 0) * 20) +  -- On-time: 20%
      (first_attempt_success::NUMERIC / NULLIF(delivered_orders, 0) * 15) +  -- First-attempt: 15%
      ((1 - courier_fault_failures::NUMERIC / NULLIF(total_orders, 0)) * 10) +  -- Low failures: 10%
      (30)  -- Placeholder for reviews: 30%
    ),
    0
  ) as estimated_trustscore
FROM courier_stats
WHERE total_orders >= 10  -- At least 10 orders
ORDER BY estimated_trustscore DESC;

-- ============================================================================
-- 9. SAMPLE DATA CHECK
-- ============================================================================

-- Check what data we have
SELECT 
  'Total Orders' as metric,
  COUNT(*) as count
FROM orders
UNION ALL
SELECT 
  'Orders with Courier',
  COUNT(*)
FROM orders
WHERE courier_id IS NOT NULL
UNION ALL
SELECT 
  'Delivered Orders',
  COUNT(*)
FROM orders
WHERE order_status = 'delivered'
UNION ALL
SELECT 
  'Orders with Delivery Days',
  COUNT(*)
FROM orders
WHERE delivery_days IS NOT NULL
UNION ALL
SELECT 
  'Orders with Delivery Hour',
  COUNT(*)
FROM orders
WHERE delivered_hour IS NOT NULL;

-- ============================================================================
-- 10. LIST ALL COURIERS WITH IDS
-- ============================================================================

-- Get actual courier IDs for use in queries
SELECT 
  courier_id,
  courier_name,
  courier_code,
  is_active,
  created_at
FROM couriers
ORDER BY courier_name;

-- ============================================================================
-- NOTES
-- ============================================================================

/*
Common Errors Fixed:

1. "invalid input value for enum order_status: 'completed'"
   - Fixed: Only use 'delivered' status (no 'completed' in your schema)

2. "column estimated_delivery_date does not exist"
   - Fixed: Use COALESCE with default 3-day estimate

3. "invalid input syntax for type uuid: 'postnord-id'"
   - Fixed: Use actual UUID from couriers table, not string

4. "column reference courier_id is ambiguous"
   - Fixed: Use table aliases (o.courier_id, c.courier_id)

Usage:
1. Run query #10 first to get actual courier UUIDs
2. Replace placeholder UUIDs in other queries
3. Adjust time intervals as needed (90 days, 30 days, etc.)
*/
