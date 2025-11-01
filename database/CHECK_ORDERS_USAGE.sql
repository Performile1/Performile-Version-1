-- =====================================================
-- CHECK IF EXISTING ORDERS ARE BEING USED
-- =====================================================
-- Date: November 1, 2025, 8:24 PM
-- Purpose: Verify that existing orders are feeding into TrustScore and analytics
-- =====================================================

-- =====================================================
-- 1. CHECK ORDERS TABLE DATA
-- =====================================================

-- Basic order statistics
SELECT 
  COUNT(*) as total_orders,
  COUNT(DISTINCT courier_id) as couriers_with_orders,
  COUNT(DISTINCT store_id) as stores_with_orders,
  MIN(created_at) as oldest_order,
  MAX(created_at) as newest_order,
  COUNT(*) FILTER (WHERE order_status = 'delivered') as delivered_orders,
  COUNT(*) FILTER (WHERE order_status = 'pending') as pending_orders,
  COUNT(*) FILTER (WHERE order_status = 'in_transit') as in_transit_orders
FROM orders;

-- =====================================================
-- 2. CHECK IF ORDERS ARE LINKED TO REVIEWS
-- =====================================================

-- Orders with reviews
SELECT 
  COUNT(DISTINCT o.order_id) as total_orders,
  COUNT(DISTINCT r.review_id) as total_reviews,
  COUNT(DISTINCT o.order_id) FILTER (WHERE r.review_id IS NOT NULL) as orders_with_reviews,
  ROUND(
    (COUNT(DISTINCT o.order_id) FILTER (WHERE r.review_id IS NOT NULL)::NUMERIC / 
     NULLIF(COUNT(DISTINCT o.order_id), 0)) * 100, 
    2
  ) as review_percentage
FROM orders o
LEFT JOIN reviews r ON o.order_id = r.order_id;

-- =====================================================
-- 3. CHECK IF ORDERS ARE FEEDING INTO COURIER_ANALYTICS
-- =====================================================

-- Compare orders vs courier_analytics
SELECT 
  'Orders Table' as source,
  COUNT(DISTINCT courier_id) as couriers_with_data,
  COUNT(*) as total_records
FROM orders
WHERE courier_id IS NOT NULL

UNION ALL

SELECT 
  'Courier Analytics Table',
  COUNT(DISTINCT courier_id),
  COUNT(*)
FROM courier_analytics;

-- =====================================================
-- 4. CHECK TRUSTSCORE CALCULATION USAGE
-- =====================================================

-- Check if TrustScore function uses order data
SELECT 
  c.courier_id,
  c.courier_name,
  COUNT(o.order_id) as total_orders,
  COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END) as delivered_orders,
  COUNT(r.review_id) as total_reviews,
  ca.trust_score as current_trust_score,
  ca.on_time_rate,
  ca.completion_rate,
  ca.avg_delivery_days
FROM couriers c
LEFT JOIN orders o ON c.courier_id = o.courier_id
LEFT JOIN reviews r ON o.order_id = r.order_id
LEFT JOIN courier_analytics ca ON c.courier_id = ca.courier_id
WHERE c.is_active = true
GROUP BY c.courier_id, c.courier_name, ca.trust_score, ca.on_time_rate, ca.completion_rate, ca.avg_delivery_days
ORDER BY total_orders DESC
LIMIT 10;

-- =====================================================
-- 5. CHECK ON-TIME DELIVERY CALCULATION
-- =====================================================

-- Can we calculate on-time rate from existing orders?
SELECT 
  courier_id,
  COUNT(*) as total_delivered,
  COUNT(*) FILTER (WHERE delivery_date <= DATE(estimated_delivery)) as on_time_deliveries,
  ROUND(
    (COUNT(*) FILTER (WHERE delivery_date <= DATE(estimated_delivery))::NUMERIC / 
     NULLIF(COUNT(*), 0)) * 100, 
    2
  ) as calculated_on_time_rate
FROM orders
WHERE order_status = 'delivered'
  AND delivery_date IS NOT NULL
  AND estimated_delivery IS NOT NULL
  AND courier_id IS NOT NULL
GROUP BY courier_id
ORDER BY total_delivered DESC;

-- =====================================================
-- 6. CHECK COMPLETION RATE CALCULATION
-- =====================================================

-- Can we calculate completion rate from existing orders?
SELECT 
  courier_id,
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE order_status = 'delivered') as delivered,
  COUNT(*) FILTER (WHERE order_status = 'cancelled') as cancelled,
  ROUND(
    (COUNT(*) FILTER (WHERE order_status = 'delivered')::NUMERIC / 
     NULLIF(COUNT(*), 0)) * 100, 
    2
  ) as calculated_completion_rate
FROM orders
WHERE courier_id IS NOT NULL
GROUP BY courier_id
ORDER BY total_orders DESC;

-- =====================================================
-- 7. CHECK AVERAGE DELIVERY TIME CALCULATION
-- =====================================================

-- Can we calculate avg delivery time from existing orders?
SELECT 
  courier_id,
  COUNT(*) as delivered_orders,
  ROUND(AVG(EXTRACT(EPOCH FROM (delivered_at - created_at)) / 86400)::NUMERIC, 2) as avg_delivery_days
FROM orders
WHERE order_status = 'delivered'
  AND delivered_at IS NOT NULL
  AND created_at IS NOT NULL
  AND courier_id IS NOT NULL
GROUP BY courier_id
ORDER BY delivered_orders DESC;

-- =====================================================
-- 8. CHECK IF ORDERS ARE USED IN CHECKOUT ANALYTICS
-- =====================================================

-- Check if checkout analytics table exists
SELECT 
  'Checkout Analytics Table' as status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'checkout_courier_analytics')
    THEN 'EXISTS (not deployed yet in this session)'
    ELSE 'NOT DEPLOYED YET'
  END as table_status;

-- =====================================================
-- 9. IDENTIFY UNUSED ORDERS
-- =====================================================

-- Orders without courier assignment
SELECT 
  'Orders without courier' as issue,
  COUNT(*) as count
FROM orders
WHERE courier_id IS NULL

UNION ALL

-- Orders without reviews (delivered but not reviewed)
SELECT 
  'Delivered orders without reviews',
  COUNT(*)
FROM orders o
LEFT JOIN reviews r ON o.order_id = r.order_id
WHERE o.order_status = 'delivered'
  AND r.review_id IS NULL

UNION ALL

-- Orders without tracking data
SELECT 
  'Orders without delivery_date',
  COUNT(*)
FROM orders
WHERE order_status = 'delivered'
  AND delivery_date IS NULL;

-- =====================================================
-- 10. SUMMARY: ARE ORDERS BEING USED?
-- =====================================================

DO $$
DECLARE
  v_total_orders INTEGER;
  v_orders_with_courier INTEGER;
  v_orders_with_reviews INTEGER;
  v_couriers_in_analytics INTEGER;
  v_usage_percentage NUMERIC;
BEGIN
  -- Get counts
  SELECT COUNT(*) INTO v_total_orders FROM orders;
  SELECT COUNT(*) INTO v_orders_with_courier FROM orders WHERE courier_id IS NOT NULL;
  SELECT COUNT(DISTINCT o.order_id) INTO v_orders_with_reviews 
  FROM orders o 
  JOIN reviews r ON o.order_id = r.order_id;
  SELECT COUNT(DISTINCT courier_id) INTO v_couriers_in_analytics FROM courier_analytics;
  
  v_usage_percentage := ROUND((v_orders_with_courier::NUMERIC / NULLIF(v_total_orders, 0)) * 100, 1);
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ORDERS USAGE SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total Orders: %', v_total_orders;
  RAISE NOTICE 'Orders with Courier: % (% %%)', v_orders_with_courier, v_usage_percentage;
  RAISE NOTICE 'Orders with Reviews: %', v_orders_with_reviews;
  RAISE NOTICE 'Couriers in Analytics: %', v_couriers_in_analytics;
  RAISE NOTICE '';
  
  IF v_orders_with_courier = 0 THEN
    RAISE NOTICE '❌ WARNING: No orders have courier assignments!';
    RAISE NOTICE '   Orders are NOT being used for TrustScore calculation.';
  ELSIF v_usage_percentage < 50 THEN
    RAISE NOTICE '⚠️  WARNING: Only % %% of orders have courier assignments.', v_usage_percentage;
    RAISE NOTICE '   Most orders are NOT being used for TrustScore calculation.';
  ELSE
    RAISE NOTICE '✅ GOOD: % %% of orders have courier assignments.', v_usage_percentage;
    RAISE NOTICE '   Orders ARE being used for TrustScore calculation.';
  END IF;
  
  RAISE NOTICE '';
  
  IF v_couriers_in_analytics = 0 THEN
    RAISE NOTICE '❌ WARNING: No data in courier_analytics table!';
    RAISE NOTICE '   TrustScore may not be calculated yet.';
  ELSE
    RAISE NOTICE '✅ GOOD: % couriers have analytics data.', v_couriers_in_analytics;
  END IF;
  
  RAISE NOTICE '========================================';
END $$;
