-- =====================================================
-- DATABASE FUNCTION AUDIT
-- =====================================================
-- Date: November 1, 2025, 8:05 PM
-- Purpose: Audit all existing functions and identify missing ones
-- Focus: Review/Rating system (main function)
-- =====================================================

-- =====================================================
-- 1. LIST ALL EXISTING FUNCTIONS
-- =====================================================

SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type,
  CASE 
    WHEN p.provolatile = 'i' THEN 'IMMUTABLE'
    WHEN p.provolatile = 's' THEN 'STABLE'
    WHEN p.provolatile = 'v' THEN 'VOLATILE'
  END as volatility,
  obj_description(p.oid, 'pg_proc') as description
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND p.prokind = 'f' -- Functions only (not procedures)
ORDER BY n.nspname, p.proname;

-- =====================================================
-- 2. SEARCH FOR REVIEW/RATING RELATED FUNCTIONS
-- =====================================================

SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    p.proname ILIKE '%review%' OR
    p.proname ILIKE '%rating%' OR
    p.proname ILIKE '%trust%' OR
    p.proname ILIKE '%score%'
  )
ORDER BY p.proname;

-- =====================================================
-- 3. CHECK REVIEWS TABLE STRUCTURE
-- =====================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'reviews'
ORDER BY ordinal_position;

-- =====================================================
-- 4. CHECK COURIER_ANALYTICS TABLE
-- =====================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'courier_analytics'
ORDER BY ordinal_position;

-- =====================================================
-- 5. CHECK FOR TRUST_SCORE CALCULATION
-- =====================================================

-- Check if trust_score is calculated or stored
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE column_name ILIKE '%trust%score%'
ORDER BY table_name;

-- =====================================================
-- 6. CHECK FOR MATERIALIZED VIEWS (ANALYTICS)
-- =====================================================

SELECT 
  schemaname,
  matviewname,
  definition
FROM pg_matviews
WHERE schemaname = 'public'
ORDER BY matviewname;

-- =====================================================
-- 7. SEARCH FOR COURIER RANKING FUNCTIONS
-- =====================================================

SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    p.proname ILIKE '%courier%' OR
    p.proname ILIKE '%rank%' OR
    p.proname ILIKE '%available%'
  )
ORDER BY p.proname;

-- =====================================================
-- 8. CHECK FOR ANALYTICS CALCULATION FUNCTIONS
-- =====================================================

SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    p.proname ILIKE '%calculate%' OR
    p.proname ILIKE '%update%' OR
    p.proname ILIKE '%refresh%'
  )
ORDER BY p.proname;

-- =====================================================
-- 9. CHECK TRIGGERS (AUTO-UPDATE MECHANISMS)
-- =====================================================

SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 10. SAMPLE DATA CHECK - REVIEWS
-- =====================================================

SELECT 
  COUNT(*) as total_reviews,
  COUNT(DISTINCT courier_id) as couriers_with_reviews,
  ROUND(AVG(rating)::NUMERIC, 2) as avg_rating,
  MIN(created_at) as oldest_review,
  MAX(created_at) as newest_review
FROM reviews;

-- =====================================================
-- 11. SAMPLE DATA CHECK - COURIER_ANALYTICS
-- =====================================================

SELECT 
  COUNT(*) as total_couriers,
  COUNT(*) FILTER (WHERE trust_score IS NOT NULL) as couriers_with_trust_score,
  ROUND(AVG(trust_score)::NUMERIC, 2) as avg_trust_score,
  COUNT(*) FILTER (WHERE total_reviews > 0) as couriers_with_reviews
FROM courier_analytics;

-- =====================================================
-- 12. CHECK FOR CHECKOUT_COURIER_ANALYTICS
-- =====================================================

SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'checkout_courier_analytics') as column_count
FROM information_schema.tables
WHERE table_name = 'checkout_courier_analytics';

-- If exists, check structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'checkout_courier_analytics'
ORDER BY ordinal_position;

-- =====================================================
-- EXPECTED FUNCTIONS (SHOULD EXIST)
-- =====================================================

/*
CRITICAL FUNCTIONS FOR REVIEW/RATING SYSTEM:

1. calculate_trust_score(courier_id) 
   - Calculate TrustScore from reviews
   - Should update courier_analytics.trust_score

2. update_courier_analytics(courier_id)
   - Recalculate all analytics for a courier
   - Triggered after new review or order

3. get_courier_reviews(courier_id, limit)
   - Get reviews for a courier
   - With pagination

4. submit_review(order_id, rating, review_text, ...)
   - Create new review
   - Trigger analytics update

5. calculate_on_time_rate(courier_id)
   - Calculate on-time delivery percentage
   - From orders table

6. get_available_couriers_for_merchant(merchant_id)
   - Get couriers available to merchant
   - Based on subscription limits

7. refresh_courier_analytics_materialized_view()
   - Refresh materialized view if exists
   - For performance

NICE TO HAVE:

8. calculate_courier_ranking(postal_code)
   - Dynamic ranking (what we're building)

9. get_courier_performance_trends(courier_id, days)
   - Trend analysis

10. validate_review_eligibility(user_id, order_id)
    - Check if user can review this order
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if critical functions exist
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_trust_score') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as calculate_trust_score,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_courier_analytics') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as update_courier_analytics,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_courier_reviews') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as get_courier_reviews,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'submit_review') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as submit_review,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_on_time_rate') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as calculate_on_time_rate,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname ILIKE '%available%courier%') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as get_available_couriers;
