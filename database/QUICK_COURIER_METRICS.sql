-- ============================================================================
-- QUICK COURIER METRICS - READY TO RUN
-- Date: November 9, 2025
-- Purpose: Quick queries using your actual courier IDs
-- ============================================================================

-- ============================================================================
-- 1. SIMPLE COMPLETION RATE - ALL COURIERS
-- ============================================================================

SELECT 
  c.courier_name,
  COUNT(o.order_id) as total_orders,
  COUNT(o.order_id) FILTER (WHERE o.order_status = 'delivered') as delivered_orders,
  ROUND(
    COUNT(o.order_id) FILTER (WHERE o.order_status = 'delivered')::NUMERIC / 
    NULLIF(COUNT(o.order_id), 0) * 100, 
    2
  ) as completion_rate_percent
FROM couriers c
LEFT JOIN orders o ON c.courier_id = o.courier_id 
  AND o.created_at >= NOW() - INTERVAL '90 days'
GROUP BY c.courier_id, c.courier_name
HAVING COUNT(o.order_id) > 0
ORDER BY completion_rate_percent DESC;

-- ============================================================================
-- 2. POSTNORD SPECIFIC METRICS
-- ============================================================================

SELECT 
  'PostNord' as courier,
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE order_status = 'delivered') as delivered,
  COUNT(*) FILTER (WHERE delivery_days IS NOT NULL) as has_delivery_time,
  ROUND(AVG(delivery_days), 2) as avg_delivery_days,
  ROUND(AVG(delivered_hour), 1) as avg_delivery_hour
FROM orders
WHERE courier_id = 'bb056015-f469-4a1a-9b16-251cdc8250a4'  -- PostNord
  AND created_at >= NOW() - INTERVAL '90 days';

-- ============================================================================
-- 3. DHL EXPRESS SPECIFIC METRICS
-- ============================================================================

SELECT 
  'DHL Express' as courier,
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE order_status = 'delivered') as delivered,
  COUNT(*) FILTER (WHERE delivery_days IS NOT NULL) as has_delivery_time,
  ROUND(AVG(delivery_days), 2) as avg_delivery_days,
  ROUND(AVG(delivered_hour), 1) as avg_delivery_hour
FROM orders
WHERE courier_id = '50130bbc-53a8-4017-a2e9-05cec6129039'  -- DHL Express
  AND created_at >= NOW() - INTERVAL '90 days';

-- ============================================================================
-- 4. BRING SPECIFIC METRICS
-- ============================================================================

SELECT 
  'Bring' as courier,
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE order_status = 'delivered') as delivered,
  COUNT(*) FILTER (WHERE delivery_days IS NOT NULL) as has_delivery_time,
  ROUND(AVG(delivery_days), 2) as avg_delivery_days,
  ROUND(AVG(delivered_hour), 1) as avg_delivery_hour
FROM orders
WHERE courier_id = 'e00ce656-1e28-44d9-bc6c-1e0349525b14'  -- Bring
  AND created_at >= NOW() - INTERVAL '90 days';

-- ============================================================================
-- 5. BUDBEE SPECIFIC METRICS
-- ============================================================================

SELECT 
  'Budbee' as courier,
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE order_status = 'delivered') as delivered,
  COUNT(*) FILTER (WHERE delivery_days IS NOT NULL) as has_delivery_time,
  ROUND(AVG(delivery_days), 2) as avg_delivery_days,
  ROUND(AVG(delivered_hour), 1) as avg_delivery_hour
FROM orders
WHERE courier_id = 'a2e7d38f-eeeb-422f-a5bb-5dc91199f242'  -- Budbee
  AND created_at >= NOW() - INTERVAL '90 days';

-- ============================================================================
-- 6. ALL COURIERS - DELIVERY TIME COMPARISON
-- ============================================================================

SELECT 
  c.courier_name,
  COUNT(o.order_id) as total_delivered,
  ROUND(AVG(o.delivery_days), 2) as avg_delivery_days,
  ROUND(MIN(o.delivery_days), 2) as min_delivery_days,
  ROUND(MAX(o.delivery_days), 2) as max_delivery_days
FROM couriers c
JOIN orders o ON c.courier_id = o.courier_id
WHERE o.delivery_days IS NOT NULL
  AND o.created_at >= NOW() - INTERVAL '90 days'
GROUP BY c.courier_id, c.courier_name
HAVING COUNT(o.order_id) >= 5
ORDER BY avg_delivery_days ASC;

-- ============================================================================
-- 7. DELIVERY HOUR DISTRIBUTION - ALL COURIERS
-- ============================================================================

SELECT 
  c.courier_name,
  o.delivered_hour,
  COUNT(*) as delivery_count,
  ROUND(
    COUNT(*)::NUMERIC / 
    SUM(COUNT(*)) OVER (PARTITION BY c.courier_id) * 100, 
    2
  ) as percentage
FROM couriers c
JOIN orders o ON c.courier_id = o.courier_id
WHERE o.delivered_hour IS NOT NULL
  AND o.created_at >= NOW() - INTERVAL '30 days'
GROUP BY c.courier_id, c.courier_name, o.delivered_hour
ORDER BY c.courier_name, o.delivered_hour;

-- ============================================================================
-- 8. POSTAL CODE PERFORMANCE - POSTNORD
-- ============================================================================

SELECT 
  postal_code,
  COUNT(*) as total_deliveries,
  ROUND(AVG(delivery_days), 2) as avg_delivery_days,
  ROUND(AVG(delivered_hour), 1) as avg_delivery_hour,
  COUNT(*) FILTER (WHERE order_status = 'delivered') as successful_deliveries,
  ROUND(
    COUNT(*) FILTER (WHERE order_status = 'delivered')::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as success_rate_percent
FROM orders
WHERE courier_id = 'bb056015-f469-4a1a-9b16-251cdc8250a4'  -- PostNord
  AND created_at >= NOW() - INTERVAL '90 days'
  AND postal_code IS NOT NULL
GROUP BY postal_code
HAVING COUNT(*) >= 3
ORDER BY total_deliveries DESC
LIMIT 20;

-- ============================================================================
-- 9. COMPLETE SCORECARD - TOP 5 COURIERS
-- ============================================================================

WITH courier_stats AS (
  SELECT 
    c.courier_id,
    c.courier_name,
    COUNT(o.order_id) as total_orders,
    COUNT(o.order_id) FILTER (WHERE o.order_status = 'delivered') as delivered_orders,
    AVG(o.delivery_days) as avg_delivery_days,
    COUNT(o.order_id) FILTER (WHERE o.delivery_attempts = 1) as first_attempt_success
  FROM couriers c
  LEFT JOIN orders o ON c.courier_id = o.courier_id 
    AND o.created_at >= NOW() - INTERVAL '90 days'
  GROUP BY c.courier_id, c.courier_name
  HAVING COUNT(o.order_id) >= 5
)
SELECT 
  courier_name,
  total_orders,
  delivered_orders,
  ROUND(delivered_orders::NUMERIC / NULLIF(total_orders, 0) * 100, 2) as completion_rate,
  ROUND(first_attempt_success::NUMERIC / NULLIF(delivered_orders, 0) * 100, 2) as first_attempt_rate,
  ROUND(avg_delivery_days, 2) as avg_delivery_days
FROM courier_stats
ORDER BY completion_rate DESC, avg_delivery_days ASC
LIMIT 5;

-- ============================================================================
-- 10. DATA AVAILABILITY CHECK
-- ============================================================================

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
-- YOUR COURIER IDS (for reference)
-- ============================================================================

/*
PostNord:     bb056015-f469-4a1a-9b16-251cdc8250a4
Bring:        e00ce656-1e28-44d9-bc6c-1e0349525b14
Budbee:       a2e7d38f-eeeb-422f-a5bb-5dc91199f242
DHL Express:  50130bbc-53a8-4017-a2e9-05cec6129039
DHL Freight:  bbdec24f-b06b-4ef0-aa4e-9e9ae876a561
DHL eCommerce: c65a9667-44fb-48be-9970-86030cbdc377
Schenker:     a17a3a63-8e86-412a-9670-0f2435d587dc
Earlybird:    03b204a4-1998-4b74-a5cf-37f948cd1571
Airmee:       d65d551d-2b68-443e-8d62-5f3483fe5ef4
Instabox:     25ac8cfb-9d22-45f4-8357-5dce3edf8932
*/
