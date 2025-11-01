-- =====================================================
-- VERIFY DATA COLLECTION: RATINGS, REVIEWS & TRACKING
-- =====================================================
-- Date: November 1, 2025, 8:10 PM
-- Purpose: Ensure we're collecting ALL necessary data
-- Focus: Reviews, Ratings, Tracking Data
-- =====================================================

-- =====================================================
-- 1. CHECK REVIEWS TABLE STRUCTURE
-- =====================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'reviews'
ORDER BY ordinal_position;

-- Expected columns for complete review data:
-- ✅ review_id
-- ✅ order_id (link to order)
-- ✅ courier_id (who is being reviewed)
-- ✅ customer_id/user_id (who wrote review)
-- ✅ rating (1-5 stars)
-- ✅ review_text (customer feedback)
-- ✅ delivery_speed_score (how fast)
-- ✅ communication_score (how responsive)
-- ✅ packaging_score (condition on arrival)
-- ✅ on_time_delivery_score (punctuality)
-- ✅ created_at (when review submitted)

-- =====================================================
-- 2. CHECK ORDERS TABLE - TRACKING DATA
-- =====================================================

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- Expected columns for tracking data:
-- ✅ order_id
-- ✅ courier_id (who delivered)
-- ✅ order_status (pending, in_transit, delivered, cancelled)
-- ✅ created_at (order placed)
-- ✅ pickup_date (when picked up)
-- ✅ delivery_date (when delivered)
-- ✅ estimated_delivery (promised delivery)
-- ✅ delivered_at (actual delivery timestamp)
-- ✅ delivery_attempts (how many tries)
-- ✅ tracking_number
-- ✅ first_response_time (courier response)
-- ✅ last_mile_duration (final delivery time)
-- ✅ issue_reported (problems)
-- ✅ issue_resolved (fixed)

-- =====================================================
-- 3. CHECK TRACKING EVENTS TABLE (IF EXISTS)
-- =====================================================

SELECT table_name 
FROM information_schema.tables 
WHERE table_name ILIKE '%tracking%'
  AND table_schema = 'public'
ORDER BY table_name;

-- Check structure if exists
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN (
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_name ILIKE '%tracking%'
    AND table_schema = 'public'
)
ORDER BY table_name, ordinal_position;

-- =====================================================
-- 4. VERIFY SAMPLE DATA EXISTS
-- =====================================================

-- Check reviews data
SELECT 
  COUNT(*) as total_reviews,
  COUNT(DISTINCT courier_id) as couriers_reviewed,
  ROUND(AVG(rating)::NUMERIC, 2) as avg_rating,
  COUNT(*) FILTER (WHERE rating >= 4) as positive_reviews,
  COUNT(*) FILTER (WHERE rating <= 2) as negative_reviews,
  MIN(created_at) as oldest_review,
  MAX(created_at) as newest_review
FROM reviews;

-- Check orders tracking data
SELECT 
  COUNT(*) as total_orders,
  COUNT(DISTINCT courier_id) as couriers_with_orders,
  COUNT(*) FILTER (WHERE order_status = 'delivered') as delivered_orders,
  COUNT(*) FILTER (WHERE order_status = 'in_transit') as in_transit_orders,
  COUNT(*) FILTER (WHERE delivery_date <= estimated_delivery) as on_time_deliveries,
  COUNT(*) FILTER (WHERE delivery_date > estimated_delivery) as late_deliveries,
  ROUND(AVG(delivery_attempts)::NUMERIC, 2) as avg_delivery_attempts
FROM orders
WHERE courier_id IS NOT NULL;

-- =====================================================
-- 5. CHECK WHAT DATA IS MISSING
-- =====================================================

-- Reviews without ratings
SELECT 
  'Reviews missing rating' as issue,
  COUNT(*) as count
FROM reviews
WHERE rating IS NULL;

-- Orders without delivery tracking
SELECT 
  'Delivered orders missing delivery_date' as issue,
  COUNT(*) as count
FROM orders
WHERE order_status = 'delivered'
  AND delivery_date IS NULL;

-- Orders without estimated delivery
SELECT 
  'Orders missing estimated_delivery' as issue,
  COUNT(*) as count
FROM orders
WHERE estimated_delivery IS NULL;

-- =====================================================
-- 6. CHECK COURIER_ANALYTICS POPULATION
-- =====================================================

SELECT 
  COUNT(*) as total_couriers,
  COUNT(*) FILTER (WHERE trust_score IS NOT NULL) as with_trust_score,
  COUNT(*) FILTER (WHERE total_reviews > 0) as with_reviews,
  COUNT(*) FILTER (WHERE on_time_rate IS NOT NULL) as with_on_time_rate,
  COUNT(*) FILTER (WHERE avg_delivery_days IS NOT NULL) as with_delivery_days,
  ROUND(AVG(trust_score)::NUMERIC, 2) as avg_trust_score,
  ROUND(AVG(on_time_rate)::NUMERIC, 2) as avg_on_time_rate
FROM courier_analytics;

-- =====================================================
-- 7. IDENTIFY MISSING TRACKING DATA POINTS
-- =====================================================

-- Check if we're tracking all necessary metrics
SELECT 
  'delivery_attempts' as metric,
  COUNT(*) FILTER (WHERE delivery_attempts IS NOT NULL) as has_data,
  COUNT(*) as total_orders,
  ROUND((COUNT(*) FILTER (WHERE delivery_attempts IS NOT NULL)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2) as percentage_tracked
FROM orders
WHERE order_status = 'delivered'

UNION ALL

SELECT 
  'first_response_time',
  COUNT(*) FILTER (WHERE first_response_time IS NOT NULL),
  COUNT(*),
  ROUND((COUNT(*) FILTER (WHERE first_response_time IS NOT NULL)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2)
FROM orders
WHERE courier_id IS NOT NULL

UNION ALL

SELECT 
  'last_mile_duration',
  COUNT(*) FILTER (WHERE last_mile_duration IS NOT NULL),
  COUNT(*),
  ROUND((COUNT(*) FILTER (WHERE last_mile_duration IS NOT NULL)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2)
FROM orders
WHERE order_status = 'delivered'

UNION ALL

SELECT 
  'issue_tracking',
  COUNT(*) FILTER (WHERE issue_reported IS NOT NULL),
  COUNT(*),
  ROUND((COUNT(*) FILTER (WHERE issue_reported IS NOT NULL)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2)
FROM orders;

-- =====================================================
-- 8. CHECK FOR ADDITIONAL REVIEW METRICS
-- =====================================================

-- Verify we're collecting detailed review scores
SELECT 
  column_name,
  COUNT(*) as non_null_count,
  ROUND(AVG(CASE WHEN column_name LIKE '%score%' THEN 
    (SELECT AVG(r.rating) FROM reviews r) -- Placeholder, actual column values
  END)::NUMERIC, 2) as avg_value
FROM information_schema.columns
WHERE table_name = 'reviews'
  AND column_name ILIKE '%score%'
GROUP BY column_name;

-- =====================================================
-- 9. RECOMMENDATIONS FOR MISSING DATA
-- =====================================================

/*
CRITICAL DATA TO COLLECT:

FROM REVIEWS:
✅ rating (1-5 stars) - MUST HAVE
✅ review_text - Customer feedback
✅ delivery_speed_score - How fast was delivery
✅ communication_score - Courier responsiveness
✅ packaging_score - Condition on arrival
✅ on_time_delivery_score - Punctuality rating

FROM ORDERS (TRACKING):
✅ order_status - Current state
✅ created_at - Order placed
✅ delivery_date - When delivered
✅ estimated_delivery - Promised date
✅ delivered_at - Actual timestamp
✅ delivery_attempts - Number of tries
✅ tracking_number - Tracking ID
✅ first_response_time - Courier response speed
✅ last_mile_duration - Final delivery time
✅ issue_reported - Problems flagged
✅ issue_resolved - Problems fixed

FROM TRACKING EVENTS (IF SEPARATE TABLE):
✅ event_type (picked_up, in_transit, out_for_delivery, delivered)
✅ event_timestamp
✅ location (GPS coordinates)
✅ status_message
✅ courier_notes

ADDITIONAL METRICS TO CONSIDER:
- Customer satisfaction survey (post-delivery)
- Packaging quality photos
- Delivery proof (signature, photo)
- Real-time GPS tracking
- Temperature monitoring (for sensitive items)
- Handling incidents (drops, delays)
*/

-- =====================================================
-- 10. VERIFY DATA FLOWS INTO TRUSTSCORE
-- =====================================================

-- Check if TrustScore calculation has access to all data
SELECT 
  c.courier_id,
  c.courier_name,
  COUNT(DISTINCT r.review_id) as total_reviews,
  ROUND(AVG(r.rating)::NUMERIC, 2) as avg_rating,
  COUNT(DISTINCT o.order_id) as total_orders,
  COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END) as delivered_orders,
  COUNT(DISTINCT CASE 
    WHEN o.order_status = 'delivered' 
    AND o.delivery_date <= o.estimated_delivery 
    THEN o.order_id 
  END) as on_time_deliveries,
  ca.trust_score
FROM couriers c
LEFT JOIN orders o ON c.courier_id = o.courier_id
LEFT JOIN reviews r ON o.order_id = r.order_id
LEFT JOIN courier_analytics ca ON c.courier_id = ca.courier_id
WHERE c.is_active = true
GROUP BY c.courier_id, c.courier_name, ca.trust_score
ORDER BY ca.trust_score DESC NULLS LAST
LIMIT 10;

-- =====================================================
-- VERIFICATION SUMMARY
-- =====================================================

SELECT 
  '✅ Reviews Table' as component,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews')
    THEN 'EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
  '✅ Orders Table (Tracking)',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders')
    THEN 'EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  '✅ Courier Analytics',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_analytics')
    THEN 'EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  '✅ TrustScore Function',
  CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_courier_trustscore')
    THEN 'EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  '✅ Auto-Update Triggers',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name LIKE '%trustscore%')
    THEN 'EXISTS' ELSE '❌ MISSING' END;
