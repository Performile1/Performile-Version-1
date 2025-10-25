-- =====================================================
-- Test Claims Analytics Implementation
-- =====================================================
-- Run these queries to verify the implementation works
-- =====================================================

-- =====================================================
-- 1. VERIFY INDEXES EXIST
-- =====================================================

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('claims', 'orders', 'stores')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Expected indexes:
-- idx_claims_created_at
-- idx_claims_order_id
-- idx_claims_status
-- idx_claims_resolution_date
-- idx_claims_created_order
-- idx_orders_courier_id
-- idx_orders_store_id
-- idx_stores_owner_user_id

-- =====================================================
-- 2. VERIFY FUNCTION EXISTS
-- =====================================================

SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name IN ('get_claims_trends', 'get_claims_summary')
ORDER BY routine_name;

-- Expected: 2 functions

-- =====================================================
-- 3. CHECK EXISTING CLAIMS DATA
-- =====================================================

-- Count total claims
SELECT COUNT(*) as total_claims FROM claims;

-- Count claims by status
SELECT 
  claim_status,
  COUNT(*) as count
FROM claims
GROUP BY claim_status
ORDER BY count DESC;

-- Count claims with order relationships
SELECT 
  COUNT(*) as claims_with_orders,
  COUNT(DISTINCT c.order_id) as unique_orders,
  COUNT(DISTINCT o.courier_id) as unique_couriers,
  COUNT(DISTINCT s.owner_user_id) as unique_merchants
FROM claims c
LEFT JOIN orders o ON c.order_id = o.order_id
LEFT JOIN stores s ON o.store_id = s.store_id;

-- =====================================================
-- 4. TEST WITH MERCHANT ACCOUNT
-- =====================================================

-- Get merchant ID (test-merchant@performile.com)
SELECT 
  user_id,
  email,
  user_role
FROM users
WHERE email = 'test-merchant@performile.com';

-- Test claims trends for merchant (last 30 days)
-- Replace UUID with actual merchant user_id from above query
SELECT * 
FROM get_claims_trends(
  'merchant', 
  'fc1a0fdb-a82c-4a83-82bb-fa7a4b4b13c9',  -- Replace with actual merchant ID
  CURRENT_DATE - INTERVAL '30 days'
)
ORDER BY trend_date DESC;

-- Test claims summary for merchant
SELECT * 
FROM get_claims_summary(
  'merchant', 
  'fc1a0fdb-a82c-4a83-82bb-fa7a4b4b13c9',  -- Replace with actual merchant ID
  CURRENT_DATE - INTERVAL '30 days'
);

-- =====================================================
-- 5. TEST WITH COURIER ACCOUNT
-- =====================================================

-- Get courier ID (test-courier@performile.com)
SELECT 
  u.user_id,
  u.email,
  c.courier_id,
  c.courier_name
FROM users u
LEFT JOIN couriers c ON u.user_id = c.user_id
WHERE u.email = 'test-courier@performile.com';

-- Test claims trends for courier (last 30 days)
-- Replace UUID with actual courier user_id from above query
SELECT * 
FROM get_claims_trends(
  'courier', 
  '617f3f03-ec94-415a-8400-dc5c7e29d96f',  -- Replace with actual courier ID
  CURRENT_DATE - INTERVAL '30 days'
)
ORDER BY trend_date DESC;

-- Test claims summary for courier
SELECT * 
FROM get_claims_summary(
  'courier', 
  '617f3f03-ec94-415a-8400-dc5c7e29d96f',  -- Replace with actual courier ID
  CURRENT_DATE - INTERVAL '30 days'
);

-- =====================================================
-- 6. CREATE TEST CLAIMS (If no data exists)
-- =====================================================

-- Only run this if you have no claims data
-- This creates sample claims for testing

/*
-- Get a test order
SELECT order_id, courier_id, store_id 
FROM orders 
LIMIT 1;

-- Create test claims (replace order_id with actual value)
INSERT INTO claims (
  order_id,
  tracking_number,
  courier,
  claim_type,
  claim_status,
  claimant_id,
  claimant_name,
  claimant_email,
  incident_date,
  incident_description,
  claimed_amount,
  approved_amount,
  created_at,
  resolution_date
) VALUES
  -- Approved claim (resolved)
  (
    'YOUR_ORDER_ID_HERE',
    'TRACK123',
    'DHL',
    'damaged',
    'approved',
    'YOUR_USER_ID_HERE',
    'Test User',
    'test@example.com',
    CURRENT_DATE - INTERVAL '10 days',
    'Package was damaged during transit',
    150.00,
    150.00,
    CURRENT_DATE - INTERVAL '10 days',
    CURRENT_DATE - INTERVAL '3 days'
  ),
  -- Pending claim
  (
    'YOUR_ORDER_ID_HERE',
    'TRACK124',
    'DHL',
    'lost',
    'submitted',
    'YOUR_USER_ID_HERE',
    'Test User',
    'test@example.com',
    CURRENT_DATE - INTERVAL '5 days',
    'Package never arrived',
    200.00,
    NULL,
    CURRENT_DATE - INTERVAL '5 days',
    NULL
  ),
  -- Draft claim
  (
    'YOUR_ORDER_ID_HERE',
    'TRACK125',
    'DHL',
    'delayed',
    'draft',
    'YOUR_USER_ID_HERE',
    'Test User',
    'test@example.com',
    CURRENT_DATE - INTERVAL '2 days',
    'Significant delay in delivery',
    50.00,
    NULL,
    CURRENT_DATE - INTERVAL '2 days',
    NULL
  );
*/

-- =====================================================
-- 7. PERFORMANCE TEST
-- =====================================================

-- Test query performance
EXPLAIN ANALYZE
SELECT * 
FROM get_claims_trends(
  'merchant', 
  'fc1a0fdb-a82c-4a83-82bb-fa7a4b4b13c9',
  CURRENT_DATE - INTERVAL '90 days'
);

-- Expected: < 200ms with indexes

-- =====================================================
-- 8. VERIFY DATA ACCURACY
-- =====================================================

-- Manual count vs function count
WITH manual_count AS (
  SELECT 
    DATE(c.created_at) as trend_date,
    COUNT(*) as total_claims,
    COUNT(*) FILTER (WHERE c.claim_status = 'approved') as approved_claims
  FROM claims c
  LEFT JOIN orders o ON c.order_id = o.order_id
  LEFT JOIN stores s ON o.store_id = s.store_id
  WHERE c.created_at >= CURRENT_DATE - INTERVAL '30 days'
    AND s.owner_user_id = 'fc1a0fdb-a82c-4a83-82bb-fa7a4b4b13c9'  -- Replace with actual merchant ID
  GROUP BY DATE(c.created_at)
),
function_result AS (
  SELECT 
    trend_date,
    total_claims,
    approved_claims
  FROM get_claims_trends(
    'merchant',
    'fc1a0fdb-a82c-4a83-82bb-fa7a4b4b13c9',  -- Replace with actual merchant ID
    CURRENT_DATE - INTERVAL '30 days'
  )
)
SELECT 
  COALESCE(m.trend_date, f.trend_date) as date,
  m.total_claims as manual_total,
  f.total_claims as function_total,
  m.approved_claims as manual_approved,
  f.approved_claims as function_approved,
  CASE 
    WHEN m.total_claims = f.total_claims THEN '✅ Match'
    ELSE '❌ Mismatch'
  END as status
FROM manual_count m
FULL OUTER JOIN function_result f ON m.trend_date = f.trend_date
ORDER BY date DESC;

-- All rows should show '✅ Match'

-- =====================================================
-- 9. ERROR HANDLING TEST
-- =====================================================

-- Test with invalid entity_type (should fail)
SELECT * FROM get_claims_trends('invalid', 'fc1a0fdb-a82c-4a83-82bb-fa7a4b4b13c9', CURRENT_DATE - INTERVAL '30 days');
-- Expected: ERROR: Invalid entity_type. Must be courier or merchant.

-- Test with NULL entity_id (should fail)
SELECT * FROM get_claims_trends('merchant', NULL, CURRENT_DATE - INTERVAL '30 days');
-- Expected: ERROR: entity_id cannot be null

-- Test with NULL start_date (should fail)
SELECT * FROM get_claims_trends('merchant', 'fc1a0fdb-a82c-4a83-82bb-fa7a4b4b13c9', NULL);
-- Expected: ERROR: start_date cannot be null

-- =====================================================
-- 10. CLEANUP (Optional)
-- =====================================================

-- If you need to drop and recreate the functions:
/*
DROP FUNCTION IF EXISTS get_claims_trends(TEXT, UUID, DATE);
DROP FUNCTION IF EXISTS get_claims_summary(TEXT, UUID, DATE);

-- Then re-run the migration file
*/

-- =====================================================
-- EXPECTED RESULTS
-- =====================================================
--
-- ✅ All indexes exist
-- ✅ Both functions exist
-- ✅ Claims data exists (or test data created)
-- ✅ Merchant query returns data
-- ✅ Courier query returns data
-- ✅ Performance < 200ms
-- ✅ Data accuracy matches manual count
-- ✅ Error handling works correctly
--
-- =====================================================
