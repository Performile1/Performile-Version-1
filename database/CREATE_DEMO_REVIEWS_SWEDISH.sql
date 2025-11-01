-- =====================================================
-- CREATE DEMO REVIEWS WITH SWEDISH COMMENTS
-- =====================================================
-- Date: November 1, 2025, 8:30 PM
-- Purpose: Add realistic demo reviews to existing orders
-- Language: Swedish comments
-- =====================================================

-- =====================================================
-- 1. UPDATE DELIVERY DATES FOR ALL DELIVERED ORDERS
-- =====================================================

-- Set delivery_date for all delivered orders
UPDATE orders 
SET 
  delivery_date = DATE(created_at + INTERVAL '2 days'),
  delivered_at = created_at + INTERVAL '2 days' + INTERVAL '14 hours'
WHERE order_status = 'delivered'
  AND delivery_date IS NULL;

-- Set estimated_delivery (1 day before actual delivery for some, on-time for others)
UPDATE orders 
SET estimated_delivery = created_at + INTERVAL '3 days'
WHERE order_status = 'delivered'
  AND estimated_delivery IS NULL;

-- =====================================================
-- 2. CREATE DEMO REVIEWS WITH SWEDISH COMMENTS
-- =====================================================

-- Insert reviews for delivered orders (mix of ratings)
-- We'll create reviews for the 8 orders that don't have them yet

-- Excellent reviews (5 stars) - 3 reviews
INSERT INTO reviews (
  order_id,
  courier_id,
  store_id,
  rating,
  review_text,
  delivery_speed_rating,
  communication_rating,
  package_condition_rating
)
SELECT 
  o.order_id,
  o.courier_id,
  o.store_id,
  5,
  CASE (ROW_NUMBER() OVER (ORDER BY o.created_at)) % 3
    WHEN 0 THEN 'Fantastisk service! Paketet kom i perfekt skick och chauffören var mycket professionell. Snabb leverans och bra kommunikation hela vägen. Rekommenderar starkt!'
    WHEN 1 THEN 'Jättebra! Leveransen gick smidigt och paketet kom precis i tid. Chauffören var trevlig och hjälpsam. Kommer definitivt att använda denna tjänst igen.'
    ELSE 'Utmärkt leverans! Allt fungerade perfekt från början till slut. Bra spårning och paketet kom välpaketerat. Mycket nöjd med servicen.'
  END,
  5, -- delivery_speed_rating
  5, -- communication_rating
  5 -- package_condition_rating
FROM orders o
LEFT JOIN reviews r ON o.order_id = r.order_id
WHERE o.order_status = 'delivered'
  AND r.review_id IS NULL
  AND o.courier_id IS NOT NULL
ORDER BY o.created_at
LIMIT 3;

-- Good reviews (4 stars) - 3 reviews
INSERT INTO reviews (
  order_id,
  courier_id,
  store_id,
  rating,
  review_text,
  delivery_speed_rating,
  communication_rating,
  package_condition_rating
)
SELECT 
  o.order_id,
  o.courier_id,
  o.store_id,
  4,
  CASE (ROW_NUMBER() OVER (ORDER BY o.created_at)) % 3
    WHEN 0 THEN 'Bra service överlag. Leveransen kom i tid och paketet var i gott skick. Lite långsam kommunikation men inget större problem. Nöjd med leveransen.'
    WHEN 1 THEN 'Väldigt bra! Paketet kom som förväntat och chauffören var trevlig. Lite försenad men inte mycket. Skulle använda tjänsten igen.'
    ELSE 'Bra leverans. Allt gick bra även om det tog lite längre tid än väntat. Paketet kom helt och chauffören var professionell.'
  END,
  4, -- delivery_speed_rating
  4, -- communication_rating
  5 -- package_condition_rating
FROM orders o
LEFT JOIN reviews r ON o.order_id = r.order_id
WHERE o.order_status = 'delivered'
  AND r.review_id IS NULL
  AND o.courier_id IS NOT NULL
ORDER BY o.created_at
OFFSET 3
LIMIT 3;

-- Average reviews (3 stars) - 2 reviews
INSERT INTO reviews (
  order_id,
  courier_id,
  store_id,
  rating,
  review_text,
  delivery_speed_rating,
  communication_rating,
  package_condition_rating
)
SELECT 
  o.order_id,
  o.courier_id,
  o.store_id,
  3,
  CASE (ROW_NUMBER() OVER (ORDER BY o.created_at)) % 2
    WHEN 0 THEN 'Okej service. Paketet kom till slut men det tog längre tid än väntat. Kommunikationen kunde varit bättre. Paketet var i bra skick åtminstone.'
    ELSE 'Genomsnittlig leverans. Inget speciellt att klaga på men inget att hurra över heller. Paketet kom försenat men i gott skick.'
  END,
  3, -- delivery_speed_rating
  3, -- communication_rating
  4 -- package_condition_rating
FROM orders o
LEFT JOIN reviews r ON o.order_id = r.order_id
WHERE o.order_status = 'delivered'
  AND r.review_id IS NULL
  AND o.courier_id IS NOT NULL
ORDER BY o.created_at
OFFSET 6
LIMIT 2;

-- =====================================================
-- 3. ADD MORE REALISTIC REVIEWS (MIXED RATINGS)
-- =====================================================

-- Additional excellent review
INSERT INTO reviews (
  order_id,
  courier_id,
  store_id,
  rating,
  review_text,
  delivery_speed_rating,
  communication_rating,
  package_condition_rating
)
SELECT 
  o.order_id,
  o.courier_id,
  o.store_id,
  5,
  'Supersnabb leverans! Paketet kom dagen efter beställning. Chauffören ringde innan och bekräftade leveranstiden. Mycket professionellt och paketet var perfekt paketerat. 10/10!',
  5,
  5,
  5
FROM orders o
LEFT JOIN reviews r ON o.order_id = r.order_id
WHERE o.order_status = 'delivered'
  AND r.review_id IS NULL
  AND o.courier_id IS NOT NULL
ORDER BY RANDOM()
LIMIT 1;

-- Additional good review with specific feedback
INSERT INTO reviews (
  order_id,
  courier_id,
  store_id,
  rating,
  review_text,
  delivery_speed_rating,
  communication_rating,
  package_condition_rating
)
SELECT 
  o.order_id,
  o.courier_id,
  o.store_id,
  4,
  'Bra leverans! Chauffören var punktlig och vänlig. Paketet kom i gott skick. Enda minuset var att spårningen inte uppdaterades i realtid, men annars mycket nöjd.',
  4,
  4,
  5
FROM orders o
LEFT JOIN reviews r ON o.order_id = r.order_id
WHERE o.order_status = 'delivered'
  AND r.review_id IS NULL
  AND o.courier_id IS NOT NULL
ORDER BY RANDOM()
LIMIT 1;

-- Additional critical but fair review
INSERT INTO reviews (
  order_id,
  courier_id,
  store_id,
  rating,
  review_text,
  delivery_speed_rating,
  communication_rating,
  package_condition_rating
)
SELECT 
  o.order_id,
  o.courier_id,
  o.store_id,
  3,
  'Leveransen tog längre tid än utlovat. Fick inget SMS när paketet var på väg. Chauffören var dock trevlig när han kom. Paketet var oskadad så det är bra.',
  2,
  2,
  5
FROM orders o
LEFT JOIN reviews r ON o.order_id = r.order_id
WHERE o.order_status = 'delivered'
  AND r.review_id IS NULL
  AND o.courier_id IS NOT NULL
ORDER BY RANDOM()
LIMIT 1;

-- =====================================================
-- 4. UPDATE REVIEW STATISTICS
-- =====================================================

-- Orders are automatically linked to reviews via order_id
-- No need to update a flag since we can check via JOIN

-- =====================================================
-- 5. VERIFICATION
-- =====================================================

-- Check review distribution
SELECT 
  rating,
  COUNT(*) as count,
  ROUND((COUNT(*)::NUMERIC / (SELECT COUNT(*) FROM reviews)) * 100, 1) as percentage
FROM reviews
GROUP BY rating
ORDER BY rating DESC;

-- Check Swedish text samples
SELECT 
  rating,
  LEFT(review_text, 100) || '...' as review_preview,
  delivery_speed_rating,
  communication_rating,
  package_condition_rating
FROM reviews
ORDER BY created_at DESC
LIMIT 5;

-- Check orders with reviews
SELECT 
  COUNT(*) as total_delivered_orders,
  COUNT(DISTINCT r.order_id) as orders_with_reviews,
  ROUND((COUNT(DISTINCT r.order_id)::NUMERIC / COUNT(*)) * 100, 1) as review_percentage
FROM orders o
LEFT JOIN reviews r ON o.order_id = r.order_id
WHERE o.order_status = 'delivered';

-- Check delivery dates
SELECT 
  COUNT(*) as total_orders,
  COUNT(delivery_date) as with_delivery_date,
  COUNT(estimated_delivery) as with_estimated_delivery,
  ROUND((COUNT(delivery_date)::NUMERIC / COUNT(*)) * 100, 1) as delivery_date_percentage
FROM orders
WHERE order_status = 'delivered';

-- Sample of orders with reviews and dates
SELECT 
  o.order_id,
  o.order_status,
  o.delivery_date,
  o.estimated_delivery,
  r.rating,
  LEFT(r.review_text, 50) || '...' as review_preview
FROM orders o
LEFT JOIN reviews r ON o.order_id = r.order_id
WHERE o.order_status = 'delivered'
ORDER BY o.created_at DESC
LIMIT 10;

-- =====================================================
-- 6. RECALCULATE TRUSTSCORE FOR ALL COURIERS
-- =====================================================

-- Update courier_analytics with new review data
-- This will be picked up by the TrustScore calculation
INSERT INTO courier_analytics (
  courier_id,
  courier_name,
  total_reviews,
  avg_rating,
  total_orders,
  delivered_orders,
  completion_rate,
  on_time_rate,
  last_calculated
)
SELECT 
  c.courier_id,
  c.courier_name,
  COUNT(DISTINCT r.review_id) as total_reviews,
  ROUND(AVG(r.rating)::NUMERIC, 2) as avg_rating,
  COUNT(DISTINCT o.order_id) as total_orders,
  COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END) as delivered_orders,
  ROUND((COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END)::NUMERIC / 
         NULLIF(COUNT(DISTINCT o.order_id), 0)) * 100, 2) as completion_rate,
  ROUND((COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' AND o.delivery_date <= DATE(o.estimated_delivery) THEN o.order_id END)::NUMERIC / 
         NULLIF(COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END), 0)) * 100, 2) as on_time_rate,
  NOW() as last_calculated
FROM couriers c
LEFT JOIN orders o ON c.courier_id = o.courier_id
LEFT JOIN reviews r ON o.order_id = r.order_id
WHERE c.is_active = true
GROUP BY c.courier_id, c.courier_name
ON CONFLICT (courier_id) 
DO UPDATE SET
  total_reviews = EXCLUDED.total_reviews,
  avg_rating = EXCLUDED.avg_rating,
  total_orders = EXCLUDED.total_orders,
  delivered_orders = EXCLUDED.delivered_orders,
  completion_rate = EXCLUDED.completion_rate,
  on_time_rate = EXCLUDED.on_time_rate,
  last_calculated = EXCLUDED.last_calculated;

-- =====================================================
-- 7. SUCCESS MESSAGE
-- =====================================================

DO $$
DECLARE
  v_total_reviews INTEGER;
  v_avg_rating NUMERIC;
  v_orders_with_dates INTEGER;
  v_couriers_with_analytics INTEGER;
  v_avg_rating_analytics NUMERIC;
BEGIN
  SELECT COUNT(*), ROUND(AVG(rating)::NUMERIC, 2) 
  INTO v_total_reviews, v_avg_rating
  FROM reviews;
  
  SELECT COUNT(*) 
  INTO v_orders_with_dates
  FROM orders 
  WHERE order_status = 'delivered' AND delivery_date IS NOT NULL;
  
  SELECT COUNT(*), ROUND(AVG(avg_rating)::NUMERIC, 2)
  INTO v_couriers_with_analytics, v_avg_rating_analytics
  FROM courier_analytics
  WHERE total_reviews > 0;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DEMO DATA CREATED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total Reviews: %', v_total_reviews;
  RAISE NOTICE 'Average Rating: % / 5', v_avg_rating;
  RAISE NOTICE 'Orders with Delivery Dates: %', v_orders_with_dates;
  RAISE NOTICE 'Couriers with Analytics: %', v_couriers_with_analytics;
  RAISE NOTICE 'Average Rating (Analytics): % / 5', v_avg_rating_analytics;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Swedish review comments added';
  RAISE NOTICE '✅ Delivery dates populated';
  RAISE NOTICE '✅ Realistic rating distribution';
  RAISE NOTICE '✅ TrustScore calculated for all couriers';
  RAISE NOTICE '✅ courier_analytics table updated';
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- 8. SHOW TRUSTSCORE RESULTS
-- =====================================================

-- Display analytics for all couriers
SELECT 
  c.courier_name,
  ca.total_reviews,
  ca.avg_rating,
  ca.on_time_rate,
  ca.completion_rate,
  ca.total_orders,
  ca.delivered_orders
FROM courier_analytics ca
JOIN couriers c ON ca.courier_id = c.courier_id
WHERE ca.total_reviews > 0
ORDER BY ca.avg_rating DESC, ca.total_reviews DESC;
