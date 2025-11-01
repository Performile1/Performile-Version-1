-- =====================================================
-- VERIFY POPULATED TRACKING DATA
-- =====================================================
-- Date: November 1, 2025, 8:23 PM
-- Purpose: Check that missing data was successfully populated
-- =====================================================

-- Check overall data coverage
SELECT 
  COUNT(*) as total_orders,
  COUNT(delivery_attempts) as with_delivery_attempts,
  COUNT(first_response_time) as with_response_time,
  COUNT(last_mile_duration) as with_last_mile,
  COUNT(issue_reported) as with_issue_tracking,
  COUNT(tracking_number) as with_tracking_number,
  COUNT(delivery_postal_code) as with_delivery_postal,
  COUNT(pickup_postal_code) as with_pickup_postal,
  COUNT(estimated_delivery) as with_estimated_delivery,
  COUNT(delivery_date) as with_delivery_date,
  ROUND(AVG(delivery_attempts)::NUMERIC, 2) as avg_delivery_attempts,
  ROUND(AVG(EXTRACT(EPOCH FROM first_response_time) / 3600)::NUMERIC, 2) as avg_response_hours,
  ROUND(AVG(EXTRACT(EPOCH FROM last_mile_duration) / 3600)::NUMERIC, 2) as avg_last_mile_hours
FROM orders;

-- Check percentage coverage
SELECT 
  'delivery_attempts' as metric,
  ROUND((COUNT(delivery_attempts)::NUMERIC / COUNT(*)) * 100, 1) as coverage_percentage
FROM orders
UNION ALL
SELECT 
  'first_response_time',
  ROUND((COUNT(first_response_time)::NUMERIC / COUNT(*)) * 100, 1)
FROM orders
UNION ALL
SELECT 
  'delivery_postal_code',
  ROUND((COUNT(delivery_postal_code)::NUMERIC / COUNT(*)) * 100, 1)
FROM orders
UNION ALL
SELECT 
  'pickup_postal_code',
  ROUND((COUNT(pickup_postal_code)::NUMERIC / COUNT(*)) * 100, 1)
FROM orders
UNION ALL
SELECT 
  'estimated_delivery',
  ROUND((COUNT(estimated_delivery)::NUMERIC / COUNT(*)) * 100, 1)
FROM orders
ORDER BY coverage_percentage DESC;

-- Check on-time delivery calculation
SELECT 
  COUNT(*) FILTER (WHERE order_status = 'delivered') as delivered_orders,
  COUNT(*) FILTER (WHERE delivery_date <= DATE(estimated_delivery)) as on_time_deliveries,
  ROUND(
    (COUNT(*) FILTER (WHERE delivery_date <= DATE(estimated_delivery))::NUMERIC / 
     NULLIF(COUNT(*) FILTER (WHERE order_status = 'delivered'), 0)) * 100, 
    2
  ) as on_time_percentage
FROM orders
WHERE delivery_date IS NOT NULL 
  AND estimated_delivery IS NOT NULL;

-- Check postal code distribution
SELECT 
  delivery_postal_code,
  COUNT(*) as order_count
FROM orders
WHERE delivery_postal_code IS NOT NULL
GROUP BY delivery_postal_code
ORDER BY order_count DESC;

-- Sample of populated data
SELECT 
  order_id,
  order_status,
  delivery_attempts,
  first_response_time,
  delivery_postal_code,
  pickup_postal_code,
  estimated_delivery,
  delivery_date
FROM orders
LIMIT 5;
