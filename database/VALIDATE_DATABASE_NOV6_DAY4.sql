-- =====================================================
-- DATABASE VALIDATION - WEEK 2 DAY 4 (November 6, 2025)
-- SPEC_DRIVEN_FRAMEWORK - RULE #1
-- Purpose: Validate database before Day 4 implementation
-- =====================================================

-- ============================================================================
-- STEP 1: CHECK ANALYTICS TABLE FOR PERFORMANCE LIMITS
-- ============================================================================

-- Check if checkout_courier_analytics table exists
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = 'checkout_courier_analytics') as column_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'checkout_courier_analytics';

-- Check columns in analytics table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'checkout_courier_analytics'
ORDER BY ordinal_position;

-- Check sample data
SELECT COUNT(*) as total_records FROM checkout_courier_analytics;

-- Check data by country
SELECT 
    delivery_country,
    COUNT(*) as record_count
FROM checkout_courier_analytics
WHERE delivery_country IS NOT NULL
GROUP BY delivery_country
ORDER BY record_count DESC
LIMIT 10;

-- ============================================================================
-- STEP 2: CHECK SUBSCRIPTION TABLES
-- ============================================================================

-- Check users table for country column
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('user_id', 'email', 'user_role', 'country')
ORDER BY ordinal_position;

-- Check subscription_plans table
SELECT 
    plan_id,
    plan_name,
    user_type,
    monthly_price,
    annual_price
FROM subscription_plans
ORDER BY user_type, monthly_price;

-- Check user_subscriptions table
SELECT 
    COUNT(*) as total_subscriptions,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscriptions,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_subscriptions
FROM user_subscriptions;

-- Check users without subscriptions
SELECT 
    COUNT(*) as users_without_subscription
FROM users u
LEFT JOIN user_subscriptions us ON u.user_id = us.user_id
WHERE us.subscription_id IS NULL
  AND u.user_role IN ('merchant', 'courier');

-- ============================================================================
-- STEP 3: CHECK PERFORMANCE VIEW ACCESS FUNCTION
-- ============================================================================

-- Check if function exists
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_name = 'check_performance_view_access'
  AND routine_schema = 'public';

-- Test the function with a merchant user
SELECT * FROM check_performance_view_access(
    (SELECT user_id FROM users WHERE user_role = 'merchant' LIMIT 1),
    'NO',
    30
);

-- ============================================================================
-- STEP 4: CHECK FOR DUPLICATE ANALYTICS TABLES
-- ============================================================================

-- Check for any analytics-related tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%analytics%'
ORDER BY table_name;

-- Check for any performance-related tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%performance%'
ORDER BY table_name;

-- ============================================================================
-- STEP 5: CHECK API-RELATED TABLES
-- ============================================================================

-- Check merchant_preferences table (for API fix)
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = 'merchant_preferences') as column_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'merchant_preferences';

-- If exists, check columns
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'merchant_preferences'
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 6: CHECK SERVICE SECTIONS TABLES
-- ============================================================================

-- Check for any service-related tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%service%' OR table_name LIKE '%delivery%')
ORDER BY table_name;

-- Check courier_services table
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'courier_services'
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 7: CHECK INDEXES FOR PERFORMANCE
-- ============================================================================

-- Check indexes on analytics table
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'checkout_courier_analytics'
ORDER BY indexname;

-- Check indexes on users table
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'users'
ORDER BY indexname;

-- ============================================================================
-- STEP 8: CHECK RLS POLICIES
-- ============================================================================

-- Check RLS on analytics table
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'checkout_courier_analytics'
ORDER BY policyname;

-- Check RLS on subscription tables
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename IN ('subscription_plans', 'user_subscriptions')
ORDER BY tablename, policyname;

-- ============================================================================
-- STEP 9: VALIDATION SUMMARY
-- ============================================================================

SELECT 
    'VALIDATION COMPLETE' as status,
    NOW() as completed_at,
    'Review results above before Day 4 implementation' as next_action;

-- ============================================================================
-- EXPECTED RESULTS FOR DAY 4:
-- ============================================================================
-- ✅ checkout_courier_analytics table exists with data
-- ✅ users table has country column
-- ✅ subscription_plans table has all plans
-- ✅ user_subscriptions table exists
-- ✅ check_performance_view_access function exists
-- ✅ No duplicate tables found
-- ✅ RLS policies in place
-- ============================================================================
