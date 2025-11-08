-- ============================================================================
-- COURIER METRICS QUERIES - IN CORRECT ORDER
-- Date: November 9, 2025
-- Purpose: Run these queries in order for best understanding of your data
-- ============================================================================

-- ============================================================================
-- STEP 1: CHECK WHAT DATA YOU HAVE (Run this first!)
-- ============================================================================
-- This tells you if you have enough data to run the other queries

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
-- STEP 2: LIST ALL COURIERS WITH ORDER COUNTS
-- ============================================================================
-- See which couriers have orders and how many

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
-- See which couriers successfully deliver their orders

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
-- See how fast each courier delivers (requires delivery_days data)

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
-- See when each courier typically delivers (requires delivered_hour data)

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
-- Deep dive into PostNord's performance

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
-- Deep dive into DHL Express's performance

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
-- Deep dive into Bring's performance

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
-- STEP 9: POSTAL CODE PERFORMANCE - POSTNORD
-- ============================================================================
-- See which postal codes PostNord serves best

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
-- STEP 10: COMPLETE COURIER SCORECARD
-- ============================================================================
-- Final summary - all couriers ranked

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
-- EXECUTION SUMMARY
-- ============================================================================

/*
RUN IN THIS ORDER:

1. STEP 1: Data Availability Check
   → See if you have enough data

2. STEP 2: Courier List with Counts
   → See which couriers have orders

3. STEP 3: Completion Rates
   → See success rates

4. STEP 4: Delivery Time Comparison
   → See speed comparison

5. STEP 5: Delivery Hour Distribution
   → See delivery time patterns

6-8. STEPS 6-8: Individual Courier Deep Dives
   → PostNord, DHL Express, Bring details

9. STEP 9: Postal Code Performance
   → Geographic analysis

10. STEP 10: Complete Scorecard
   → Final rankings with TrustScore estimate

COURIER IDS FOR REFERENCE:
PostNord:      bb056015-f469-4a1a-9b16-251cdc8250a4
DHL Express:   50130bbc-53a8-4017-a2e9-05cec6129039
Bring:         e00ce656-1e28-44d9-bc6c-1e0349525b14
Budbee:        a2e7d38f-eeeb-422f-a5bb-5dc91199f242
*/
