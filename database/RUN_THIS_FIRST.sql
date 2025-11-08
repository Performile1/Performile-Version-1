-- ============================================================================
-- RUN THIS FIRST - Simple Working Queries
-- Date: November 9, 2025
-- Purpose: Basic queries that definitely work
-- ============================================================================

-- ============================================================================
-- 1. CHECK WHAT DATA YOU HAVE
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
WHERE delivered_hour IS NOT NULL;

-- ============================================================================
-- 2. ALL COURIERS WITH ORDER COUNTS
-- ============================================================================

SELECT 
  c.courier_name,
  COUNT(o.order_id) as total_orders,
  COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END) as delivered_orders
FROM couriers c
LEFT JOIN orders o ON c.courier_id = o.courier_id
GROUP BY c.courier_id, c.courier_name
ORDER BY total_orders DESC;

-- ============================================================================
-- 3. POSTNORD METRICS
-- ============================================================================

SELECT 
  COUNT(*) as total_orders,
  COUNT(CASE WHEN order_status = 'delivered' THEN 1 END) as delivered,
  ROUND(AVG(delivery_days), 2) as avg_delivery_days,
  ROUND(AVG(delivered_hour), 1) as avg_delivery_hour
FROM orders
WHERE courier_id = 'bb056015-f469-4a1a-9b16-251cdc8250a4';

-- ============================================================================
-- 4. SIMPLE COMPLETION RATE - ALL COURIERS
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
-- 5. DELIVERY TIME BY COURIER
-- ============================================================================

SELECT 
  c.courier_name,
  COUNT(o.order_id) as total_delivered,
  ROUND(AVG(o.delivery_days), 2) as avg_delivery_days,
  ROUND(MIN(o.delivery_days), 2) as min_days,
  ROUND(MAX(o.delivery_days), 2) as max_days
FROM couriers c
JOIN orders o ON c.courier_id = o.courier_id
WHERE o.delivery_days IS NOT NULL
GROUP BY c.courier_id, c.courier_name
HAVING COUNT(o.order_id) >= 3
ORDER BY avg_delivery_days ASC;

-- ============================================================================
-- 6. DELIVERY HOUR DISTRIBUTION
-- ============================================================================

SELECT 
  c.courier_name,
  o.delivered_hour,
  COUNT(*) as delivery_count
FROM couriers c
JOIN orders o ON c.courier_id = o.courier_id
WHERE o.delivered_hour IS NOT NULL
GROUP BY c.courier_id, c.courier_name, o.delivered_hour
ORDER BY c.courier_name, o.delivered_hour;
