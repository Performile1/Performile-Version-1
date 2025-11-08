-- ============================================================================
-- COMPLETE WORKING COURIER METRICS QUERIES
-- Date: November 9, 2025
-- Purpose: All queries fixed and ready to run - copy/paste any query
-- ============================================================================

-- ============================================================================
-- STEP 1: CHECK WHAT DATA YOU HAVE
-- ============================================================================
-- Run this first to see if you have enough data

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
WHERE delivered_hour IS NOT NULL
UNION ALL
SELECT 
  'Orders Last 90 Days',
  COUNT(*)
FROM orders
WHERE created_at >= NOW() - INTERVAL '90 days';

-- ============================================================================
-- STEP 2: ALL COURIERS WITH ORDER COUNTS
-- ============================================================================

SELECT 
  c.courier_name,
  COUNT(o.order_id) as total_orders,
  COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END) as delivered_orders,
  COUNT(CASE WHEN o.delivery_days IS NOT NULL THEN 1 END) as has_delivery_time_data
FROM couriers c
LEFT JOIN orders o ON c.courier_id = o.courier_id
GROUP BY c.courier_id, c.courier_name
ORDER BY total_orders DESC;

-- ============================================================================
-- STEP 3: COMPLETION RATE - ALL COURIERS
-- ============================================================================

SELECT 
  c.courier_name,
  COUNT(o.order_id) as total_orders,
  COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END) as delivered_orders,
  ROUND(
    COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(o.order_id), 0) * 100, 
    2
  ) as completion_rate_percent
FROM couriers c
LEFT JOIN orders o ON c.courier_id = o.courier_id
GROUP BY c.courier_id, c.courier_name
HAVING COUNT(o.order_id) > 0
ORDER BY completion_rate_percent DESC;

-- ============================================================================
-- STEP 4: DELIVERY TIME COMPARISON
-- ============================================================================

SELECT 
  c.courier_name,
  COUNT(o.order_id) as total_delivered,
  ROUND(AVG(o.delivery_days), 2) as avg_delivery_days,
  ROUND(MIN(o.delivery_days), 2) as min_days,
  ROUND(MAX(o.delivery_days), 2) as max_days,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o.delivery_days)::NUMERIC, 2) as median_days
FROM couriers c
JOIN orders o ON c.courier_id = o.courier_id
WHERE o.delivery_days IS NOT NULL
GROUP BY c.courier_id, c.courier_name
HAVING COUNT(o.order_id) >= 3
ORDER BY avg_delivery_days ASC;

-- ============================================================================
-- STEP 5: DELIVERY HOUR DISTRIBUTION
-- ============================================================================

SELECT 
  c.courier_name,
  o.delivered_hour,
  COUNT(*) as delivery_count,
  ROUND(
    COUNT(*)::NUMERIC / 
    SUM(COUNT(*)) OVER (PARTITION BY c.courier_id) * 100, 
    2
  ) as percentage_of_courier_deliveries
FROM couriers c
JOIN orders o ON c.courier_id = o.courier_id
WHERE o.delivered_hour IS NOT NULL
GROUP BY c.courier_id, c.courier_name, o.delivered_hour
ORDER BY c.courier_name, o.delivered_hour;

-- ============================================================================
-- STEP 6: POSTNORD DETAILED METRICS
-- ============================================================================

SELECT 
  'PostNord Performance' as report,
  COUNT(*) as total_orders,
  COUNT(CASE WHEN order_status = 'delivered' THEN 1 END) as delivered,
  ROUND(
    COUNT(CASE WHEN order_status = 'delivered' THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as completion_rate_percent,
  ROUND(AVG(delivery_days), 2) as avg_delivery_days,
  ROUND(AVG(delivered_hour), 1) as avg_delivery_hour,
  COUNT(DISTINCT postal_code) as postal_codes_served
FROM orders
WHERE courier_id = 'bb056015-f469-4a1a-9b16-251cdc8250a4';

-- ============================================================================
-- STEP 7: DHL EXPRESS DETAILED METRICS
-- ============================================================================

SELECT 
  'DHL Express Performance' as report,
  COUNT(*) as total_orders,
  COUNT(CASE WHEN order_status = 'delivered' THEN 1 END) as delivered,
  ROUND(
    COUNT(CASE WHEN order_status = 'delivered' THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as completion_rate_percent,
  ROUND(AVG(delivery_days), 2) as avg_delivery_days,
  ROUND(AVG(delivered_hour), 1) as avg_delivery_hour,
  COUNT(DISTINCT postal_code) as postal_codes_served
FROM orders
WHERE courier_id = '50130bbc-53a8-4017-a2e9-05cec6129039';

-- ============================================================================
-- STEP 8: BRING DETAILED METRICS
-- ============================================================================

SELECT 
  'Bring Performance' as report,
  COUNT(*) as total_orders,
  COUNT(CASE WHEN order_status = 'delivered' THEN 1 END) as delivered,
  ROUND(
    COUNT(CASE WHEN order_status = 'delivered' THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as completion_rate_percent,
  ROUND(AVG(delivery_days), 2) as avg_delivery_days,
  ROUND(AVG(delivered_hour), 1) as avg_delivery_hour,
  COUNT(DISTINCT postal_code) as postal_codes_served
FROM orders
WHERE courier_id = 'e00ce656-1e28-44d9-bc6c-1e0349525b14';

-- ============================================================================
-- STEP 9: BUDBEE DETAILED METRICS
-- ============================================================================

SELECT 
  'Budbee Performance' as report,
  COUNT(*) as total_orders,
  COUNT(CASE WHEN order_status = 'delivered' THEN 1 END) as delivered,
  ROUND(
    COUNT(CASE WHEN order_status = 'delivered' THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as completion_rate_percent,
  ROUND(AVG(delivery_days), 2) as avg_delivery_days,
  ROUND(AVG(delivered_hour), 1) as avg_delivery_hour,
  COUNT(DISTINCT postal_code) as postal_codes_served
FROM orders
WHERE courier_id = 'a2e7d38f-eeeb-422f-a5bb-5dc91199f242';

-- ============================================================================
-- STEP 10: POSTAL CODE PERFORMANCE - POSTNORD
-- ============================================================================

SELECT 
  postal_code,
  COUNT(*) as total_deliveries,
  ROUND(AVG(delivery_days), 2) as avg_delivery_days,
  ROUND(AVG(delivered_hour), 1) as avg_delivery_hour,
  COUNT(CASE WHEN order_status = 'delivered' THEN 1 END) as successful_deliveries,
  ROUND(
    COUNT(CASE WHEN order_status = 'delivered' THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as success_rate_percent
FROM orders
WHERE courier_id = 'bb056015-f469-4a1a-9b16-251cdc8250a4'
  AND postal_code IS NOT NULL
GROUP BY postal_code
HAVING COUNT(*) >= 2
ORDER BY total_deliveries DESC
LIMIT 20;

-- ============================================================================
-- STEP 11: POSTAL CODE PERFORMANCE - DHL EXPRESS
-- ============================================================================

SELECT 
  postal_code,
  COUNT(*) as total_deliveries,
  ROUND(AVG(delivery_days), 2) as avg_delivery_days,
  ROUND(AVG(delivered_hour), 1) as avg_delivery_hour,
  COUNT(CASE WHEN order_status = 'delivered' THEN 1 END) as successful_deliveries,
  ROUND(
    COUNT(CASE WHEN order_status = 'delivered' THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as success_rate_percent
FROM orders
WHERE courier_id = '50130bbc-53a8-4017-a2e9-05cec6129039'
  AND postal_code IS NOT NULL
GROUP BY postal_code
HAVING COUNT(*) >= 2
ORDER BY total_deliveries DESC
LIMIT 20;

-- ============================================================================
-- STEP 12: COMPLETE COURIER SCORECARD
-- ============================================================================

WITH courier_stats AS (
  SELECT 
    c.courier_id,
    c.courier_name,
    COUNT(o.order_id) as total_orders,
    COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END) as delivered_orders,
    AVG(o.delivery_days) as avg_delivery_days,
    COUNT(CASE WHEN o.delivery_attempts = 1 THEN 1 END) as first_attempt_success,
    AVG(o.delivered_hour) as avg_delivery_hour
  FROM couriers c
  LEFT JOIN orders o ON c.courier_id = o.courier_id
  GROUP BY c.courier_id, c.courier_name
  HAVING COUNT(o.order_id) >= 3
)
SELECT 
  courier_name,
  total_orders,
  delivered_orders,
  ROUND(delivered_orders::NUMERIC / NULLIF(total_orders, 0) * 100, 2) as completion_rate,
  ROUND(first_attempt_success::NUMERIC / NULLIF(delivered_orders, 0) * 100, 2) as first_attempt_rate,
  ROUND(avg_delivery_days, 2) as avg_delivery_days,
  ROUND(avg_delivery_hour, 1) as avg_delivery_hour,
  ROUND(
    (delivered_orders::NUMERIC / NULLIF(total_orders, 0) * 40) +
    (first_attempt_success::NUMERIC / NULLIF(delivered_orders, 0) * 30) +
    (30)
  , 0) as estimated_trustscore
FROM courier_stats
ORDER BY estimated_trustscore DESC, avg_delivery_days ASC;

-- ============================================================================
-- STEP 13: DELIVERY TIME BY HOUR - ALL COURIERS
-- ============================================================================

SELECT 
  delivered_hour,
  COUNT(*) as total_deliveries,
  ROUND(AVG(delivery_days), 2) as avg_delivery_days,
  COUNT(DISTINCT courier_id) as couriers_delivering_at_this_hour
FROM orders
WHERE delivered_hour IS NOT NULL
  AND delivery_days IS NOT NULL
GROUP BY delivered_hour
ORDER BY delivered_hour;

-- ============================================================================
-- STEP 14: ORDERS BY STATUS - ALL COURIERS
-- ============================================================================

SELECT 
  c.courier_name,
  o.order_status,
  COUNT(*) as order_count,
  ROUND(
    COUNT(*)::NUMERIC / 
    SUM(COUNT(*)) OVER (PARTITION BY c.courier_id) * 100, 
    2
  ) as percentage
FROM couriers c
JOIN orders o ON c.courier_id = o.courier_id
GROUP BY c.courier_id, c.courier_name, o.order_status
ORDER BY c.courier_name, order_count DESC;

-- ============================================================================
-- STEP 15: RECENT ORDERS (LAST 7 DAYS)
-- ============================================================================

SELECT 
  c.courier_name,
  COUNT(*) as orders_last_7_days,
  COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END) as delivered,
  ROUND(AVG(o.delivery_days), 2) as avg_delivery_days
FROM couriers c
JOIN orders o ON c.courier_id = o.courier_id
WHERE o.created_at >= NOW() - INTERVAL '7 days'
GROUP BY c.courier_id, c.courier_name
ORDER BY orders_last_7_days DESC;

-- ============================================================================
-- STEP 16: MONTHLY TREND (LAST 3 MONTHS)
-- ============================================================================

SELECT 
  c.courier_name,
  DATE_TRUNC('month', o.created_at) as month,
  COUNT(*) as total_orders,
  COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END) as delivered,
  ROUND(AVG(o.delivery_days), 2) as avg_delivery_days
FROM couriers c
JOIN orders o ON c.courier_id = o.courier_id
WHERE o.created_at >= NOW() - INTERVAL '3 months'
GROUP BY c.courier_id, c.courier_name, DATE_TRUNC('month', o.created_at)
ORDER BY c.courier_name, month DESC;

-- ============================================================================
-- STEP 17: FASTEST DELIVERIES (TOP 10)
-- ============================================================================

SELECT 
  c.courier_name,
  o.order_number,
  o.postal_code,
  ROUND(o.delivery_days, 2) as delivery_days,
  o.delivered_hour,
  o.created_at,
  o.delivered_at
FROM orders o
JOIN couriers c ON o.courier_id = c.courier_id
WHERE o.delivery_days IS NOT NULL
ORDER BY o.delivery_days ASC
LIMIT 10;

-- ============================================================================
-- STEP 18: SLOWEST DELIVERIES (TOP 10)
-- ============================================================================

SELECT 
  c.courier_name,
  o.order_number,
  o.postal_code,
  ROUND(o.delivery_days, 2) as delivery_days,
  o.delivered_hour,
  o.created_at,
  o.delivered_at
FROM orders o
JOIN couriers c ON o.courier_id = c.courier_id
WHERE o.delivery_days IS NOT NULL
ORDER BY o.delivery_days DESC
LIMIT 10;

-- ============================================================================
-- STEP 19: COURIER COMPARISON - SIDE BY SIDE
-- ============================================================================

SELECT 
  'PostNord' as courier,
  COUNT(*) as total_orders,
  ROUND(AVG(delivery_days), 2) as avg_days,
  ROUND(AVG(delivered_hour), 1) as avg_hour
FROM orders
WHERE courier_id = 'bb056015-f469-4a1a-9b16-251cdc8250a4'
UNION ALL
SELECT 
  'DHL Express',
  COUNT(*),
  ROUND(AVG(delivery_days), 2),
  ROUND(AVG(delivered_hour), 1)
FROM orders
WHERE courier_id = '50130bbc-53a8-4017-a2e9-05cec6129039'
UNION ALL
SELECT 
  'Bring',
  COUNT(*),
  ROUND(AVG(delivery_days), 2),
  ROUND(AVG(delivered_hour), 1)
FROM orders
WHERE courier_id = 'e00ce656-1e28-44d9-bc6c-1e0349525b14'
UNION ALL
SELECT 
  'Budbee',
  COUNT(*),
  ROUND(AVG(delivery_days), 2),
  ROUND(AVG(delivered_hour), 1)
FROM orders
WHERE courier_id = 'a2e7d38f-eeeb-422f-a5bb-5dc91199f242'
ORDER BY avg_days ASC;

-- ============================================================================
-- STEP 20: SUMMARY DASHBOARD
-- ============================================================================

SELECT 
  COUNT(DISTINCT courier_id) as total_couriers,
  COUNT(*) as total_orders,
  COUNT(CASE WHEN order_status = 'delivered' THEN 1 END) as total_delivered,
  ROUND(
    COUNT(CASE WHEN order_status = 'delivered' THEN 1 END)::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as overall_completion_rate,
  ROUND(AVG(delivery_days), 2) as avg_delivery_days,
  ROUND(AVG(delivered_hour), 1) as avg_delivery_hour,
  COUNT(DISTINCT postal_code) as postal_codes_served,
  MIN(created_at) as first_order_date,
  MAX(created_at) as latest_order_date
FROM orders
WHERE courier_id IS NOT NULL;

-- ============================================================================
-- YOUR COURIER IDS (for reference)
-- ============================================================================

/*
PostNord:      bb056015-f469-4a1a-9b16-251cdc8250a4
Bring:         e00ce656-1e28-44d9-bc6c-1e0349525b14
Budbee:        a2e7d38f-eeeb-422f-a5bb-5dc91199f242
DHL Express:   50130bbc-53a8-4017-a2e9-05cec6129039
DHL Freight:   bbdec24f-b06b-4ef0-aa4e-9e9ae876a561
DHL eCommerce: c65a9667-44fb-48be-9970-86030cbdc377
Schenker:      a17a3a63-8e86-412a-9670-0f2435d587dc
Earlybird:     03b204a4-1998-4b74-a5cf-37f948cd1571
Airmee:        d65d551d-2b68-443e-8d62-5f3483fe5ef4
Instabox:      25ac8cfb-9d22-45f4-8357-5dce3edf8932
Demo Courier:  4a700f6b-9d73-436c-8e44-00dbe426c30c
Test Courier:  c4af096a-de1e-4289-9c9c-642a2eed9a2a
*/

-- ============================================================================
-- EXECUTION NOTES
-- ============================================================================

/*
ALL QUERIES ARE FIXED AND READY TO RUN!

✅ No syntax errors
✅ No invalid enum values
✅ Proper type casting (::NUMERIC for PERCENTILE_CONT)
✅ Using actual courier UUIDs
✅ All table aliases specified

RECOMMENDED ORDER:
1. STEP 1: Data availability check
2. STEP 2: Courier list
3. STEP 3: Completion rates
4. STEP 4: Delivery time comparison
5. STEP 5: Delivery hour distribution
6-9. Individual courier deep dives
10-11. Postal code analysis
12. Complete scorecard
13-20. Additional analytics

Just copy any query and paste into Supabase SQL Editor!
*/
