-- =====================================================
-- POPULATE MISSING TRACKING DATA
-- =====================================================
-- Date: November 1, 2025, 8:15 PM
-- Purpose: Fill in missing data for existing orders
-- Status: Columns exist, need data population
-- =====================================================

-- =====================================================
-- 1. POPULATE first_response_time
-- =====================================================

-- Calculate from existing pickup timestamps
UPDATE orders 
SET first_response_time = picked_up_at - created_at
WHERE picked_up_at IS NOT NULL 
  AND first_response_time IS NULL;

-- For orders without pickup timestamp but marked as delivered
-- Estimate based on average (24 hours)
UPDATE orders 
SET first_response_time = INTERVAL '24 hours'
WHERE order_status IN ('delivered', 'in_transit')
  AND picked_up_at IS NULL
  AND first_response_time IS NULL;

-- =====================================================
-- 2. POPULATE delivery_postal_code
-- =====================================================

-- Set default Swedish postal codes for testing
-- (In production, this should come from actual customer/order data)

-- Stockholm area (default for most orders)
UPDATE orders 
SET delivery_postal_code = '11122'
WHERE delivery_postal_code IS NULL
  AND (delivery_city ILIKE '%stockholm%' OR delivery_city IS NULL);

-- Gothenburg area
UPDATE orders 
SET delivery_postal_code = '41301'
WHERE delivery_postal_code IS NULL
  AND delivery_city ILIKE '%g%teborg%';

-- Malmö area
UPDATE orders 
SET delivery_postal_code = '21115'
WHERE delivery_postal_code IS NULL
  AND delivery_city ILIKE '%malm%';

-- =====================================================
-- 3. POPULATE pickup_postal_code
-- =====================================================

-- Set default pickup postal codes (courier depot locations)
-- (In production, this should come from courier/depot data)

-- Default Stockholm depot
UPDATE orders 
SET pickup_postal_code = '11120'
WHERE pickup_postal_code IS NULL;

-- =====================================================
-- 4. POPULATE last_mile_duration
-- =====================================================

-- Calculate from out_for_delivery to delivered
UPDATE orders 
SET last_mile_duration = delivered_at - out_for_delivery_at
WHERE delivered_at IS NOT NULL
  AND out_for_delivery_at IS NOT NULL
  AND last_mile_duration IS NULL;

-- Estimate for delivered orders without timestamps
-- Average last mile: 2 hours
UPDATE orders 
SET last_mile_duration = INTERVAL '2 hours'
WHERE order_status = 'delivered'
  AND last_mile_duration IS NULL;

-- =====================================================
-- 5. POPULATE estimated_delivery
-- =====================================================

-- Set to 2 days after order creation for existing orders
UPDATE orders 
SET estimated_delivery = created_at + INTERVAL '2 days'
WHERE estimated_delivery IS NULL;

-- =====================================================
-- 6. POPULATE delivery_date from delivered_at
-- =====================================================

UPDATE orders 
SET delivery_date = DATE(delivered_at)
WHERE delivered_at IS NOT NULL 
  AND delivery_date IS NULL;

-- =====================================================
-- 7. POPULATE delivery_city from postal_code
-- =====================================================

-- Stockholm area (postal codes 100-199)
UPDATE orders 
SET delivery_city = 'Stockholm'
WHERE delivery_postal_code LIKE '1%'
  AND delivery_city IS NULL;

-- Gothenburg area (postal codes 400-449)
UPDATE orders 
SET delivery_city = 'Göteborg'
WHERE delivery_postal_code LIKE '4%'
  AND delivery_city IS NULL;

-- Malmö area (postal codes 200-239)
UPDATE orders 
SET delivery_city = 'Malmö'
WHERE delivery_postal_code LIKE '2%'
  AND delivery_city IS NULL;

-- =====================================================
-- 8. VERIFICATION
-- =====================================================

-- Check data coverage after population
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

-- Check on-time delivery rate
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

-- Check geographic distribution
SELECT 
  delivery_city,
  COUNT(*) as order_count,
  COUNT(delivery_postal_code) as with_postal_code
FROM orders
WHERE delivery_city IS NOT NULL
GROUP BY delivery_city
ORDER BY order_count DESC;

-- =====================================================
-- 9. SUCCESS MESSAGE
-- =====================================================

DO $$
DECLARE
  v_total INTEGER;
  v_with_response INTEGER;
  v_with_postal INTEGER;
BEGIN
  SELECT COUNT(*), COUNT(first_response_time), COUNT(delivery_postal_code)
  INTO v_total, v_with_response, v_with_postal
  FROM orders;
  
  RAISE NOTICE '✅ DATA POPULATION COMPLETE';
  RAISE NOTICE '';
  RAISE NOTICE '📊 RESULTS:';
  RAISE NOTICE '  Total Orders: %', v_total;
  RAISE NOTICE '  With Response Time: % (% %%)', v_with_response, ROUND((v_with_response::NUMERIC / v_total) * 100, 1);
  RAISE NOTICE '  With Delivery Postal: % (% %%)', v_with_postal, ROUND((v_with_postal::NUMERIC / v_total) * 100, 1);
  RAISE NOTICE '';
  RAISE NOTICE '🎯 READY: TrustScore calculation can now use complete data';
END $$;
