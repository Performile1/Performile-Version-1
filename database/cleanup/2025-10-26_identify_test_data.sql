-- =====================================================
-- IDENTIFY TEST DATA FOR CLEANUP
-- =====================================================
-- Purpose: Find test/demo data that should be removed before production
-- Date: October 26, 2025
-- =====================================================

-- =====================================================
-- 1. TEST USERS
-- =====================================================

SELECT '👤 TEST USERS TO REVIEW' as section;

SELECT 
  user_id,
  email,
  user_role,
  created_at,
  CASE 
    WHEN email LIKE '%test%' THEN '⚠️ TEST USER'
    WHEN email LIKE '%demo%' THEN '⚠️ DEMO USER'
    WHEN email LIKE '%@performile.com%' THEN '✅ KEEP (System)'
    ELSE '✅ KEEP (Real)'
  END as recommendation
FROM users
ORDER BY 
  CASE 
    WHEN email LIKE '%test%' THEN 1
    WHEN email LIKE '%demo%' THEN 2
    ELSE 3
  END,
  created_at DESC;

-- =====================================================
-- 2. TEST ORDERS
-- =====================================================

SELECT '📦 TEST ORDERS TO REVIEW' as section;

SELECT 
  order_id,
  order_number,
  customer_email,
  order_status,
  created_at,
  CASE 
    WHEN customer_email LIKE '%test%' THEN '⚠️ TEST ORDER'
    WHEN customer_email LIKE '%demo%' THEN '⚠️ DEMO ORDER'
    WHEN order_number LIKE '%TEST%' THEN '⚠️ TEST ORDER'
    WHEN created_at < NOW() - INTERVAL '90 days' THEN '⚠️ OLD ORDER'
    ELSE '✅ KEEP'
  END as recommendation
FROM orders
ORDER BY 
  CASE 
    WHEN customer_email LIKE '%test%' THEN 1
    WHEN customer_email LIKE '%demo%' THEN 2
    WHEN order_number LIKE '%TEST%' THEN 3
    ELSE 4
  END,
  created_at DESC
LIMIT 50;

-- =====================================================
-- 3. TEST STORES
-- =====================================================

SELECT '🏪 TEST STORES TO REVIEW' as section;

SELECT 
  store_id,
  store_name,
  owner_user_id,
  (SELECT email FROM users WHERE user_id = stores.owner_user_id) as owner_email,
  created_at,
  CASE 
    WHEN store_name LIKE '%Test%' THEN '⚠️ TEST STORE'
    WHEN store_name LIKE '%Demo%' THEN '⚠️ DEMO STORE'
    ELSE '✅ KEEP'
  END as recommendation
FROM stores
ORDER BY 
  CASE 
    WHEN store_name LIKE '%Test%' THEN 1
    WHEN store_name LIKE '%Demo%' THEN 2
    ELSE 3
  END,
  created_at DESC;

-- =====================================================
-- 4. TEST COURIERS
-- =====================================================

SELECT '🚚 TEST COURIERS TO REVIEW' as section;

SELECT 
  courier_id,
  courier_name,
  user_id,
  (SELECT email FROM users WHERE user_id = couriers.user_id) as user_email,
  created_at,
  CASE 
    WHEN courier_name LIKE '%Test%' THEN '⚠️ TEST COURIER'
    WHEN courier_name LIKE '%Demo%' THEN '⚠️ DEMO COURIER'
    ELSE '✅ KEEP (Real)'
  END as recommendation
FROM couriers
ORDER BY 
  CASE 
    WHEN courier_name LIKE '%Test%' THEN 1
    WHEN courier_name LIKE '%Demo%' THEN 2
    ELSE 3
  END,
  created_at DESC;

-- =====================================================
-- 5. EMPTY TABLES (SAFE TO IGNORE)
-- =====================================================

SELECT '📊 EMPTY TABLES (No Data to Clean)' as section;

SELECT 
  t.table_name,
  0 as row_count
FROM information_schema.tables t
LEFT JOIN pg_stat_user_tables s ON s.tablename = t.table_name AND s.schemaname = 'public'
WHERE t.table_schema = 'public'
AND t.table_type = 'BASE TABLE'
AND (s.n_live_tup = 0 OR s.n_live_tup IS NULL)
ORDER BY t.table_name;

-- =====================================================
-- 6. DATA SUMMARY
-- =====================================================

SELECT '📈 DATA SUMMARY' as section;

SELECT 
  'Total Users' as metric,
  COUNT(*)::TEXT as count,
  COUNT(*) FILTER (WHERE email LIKE '%test%' OR email LIKE '%demo%')::TEXT as test_count
FROM users
UNION ALL
SELECT 
  'Total Orders' as metric,
  COUNT(*)::TEXT as count,
  COUNT(*) FILTER (WHERE customer_email LIKE '%test%' OR customer_email LIKE '%demo%')::TEXT as test_count
FROM orders
UNION ALL
SELECT 
  'Total Stores' as metric,
  COUNT(*)::TEXT as count,
  COUNT(*) FILTER (WHERE store_name LIKE '%Test%' OR store_name LIKE '%Demo%')::TEXT as test_count
FROM stores
UNION ALL
SELECT 
  'Total Couriers' as metric,
  COUNT(*)::TEXT as count,
  COUNT(*) FILTER (WHERE courier_name LIKE '%Test%' OR courier_name LIKE '%Demo%')::TEXT as test_count
FROM couriers;

-- =====================================================
-- 7. SYSTEM USERS TO KEEP
-- =====================================================

SELECT '✅ SYSTEM USERS TO KEEP' as section;

SELECT 
  user_id,
  email,
  user_role,
  created_at
FROM users
WHERE email IN (
  'admin@performile.com',
  'merchant@performile.com',
  'courier@performile.com'
)
OR user_role = 'admin'
ORDER BY user_role, email;

-- =====================================================
-- 8. PRODUCTION COURIERS TO KEEP
-- =====================================================

SELECT '✅ PRODUCTION COURIERS TO KEEP' as section;

SELECT 
  courier_id,
  courier_name,
  courier_code,
  (SELECT email FROM users WHERE user_id = couriers.user_id) as user_email
FROM couriers
WHERE courier_name IN (
  'DHL Express',
  'DHL eCommerce',
  'Bring',
  'Budbee',
  'Airmee',
  'PostNord',
  'UPS',
  'FedEx'
)
OR courier_code IS NOT NULL
ORDER BY courier_name;

-- =====================================================
-- SUMMARY
-- =====================================================

SELECT '📝 CLEANUP RECOMMENDATIONS' as section;

SELECT 
  'Review test users with email containing test/demo' as recommendation,
  'DELETE FROM users WHERE email LIKE ''%test%'' OR email LIKE ''%demo%''' as example_query
UNION ALL
SELECT 
  'Review test orders from test users' as recommendation,
  'DELETE FROM orders WHERE customer_email LIKE ''%test%'' OR customer_email LIKE ''%demo%''' as example_query
UNION ALL
SELECT 
  'Keep system users (admin, merchant, courier @performile.com)' as recommendation,
  'These are needed for testing and demos' as example_query
UNION ALL
SELECT 
  'Keep production couriers (DHL, Bring, Budbee, etc.)' as recommendation,
  'These are real courier integrations' as example_query;
