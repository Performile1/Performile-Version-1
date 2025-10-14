-- =====================================================
-- COMPLETE DATABASE & API AUDIT
-- =====================================================
-- This script checks everything related to RLS and data integrity

-- =====================================================
-- 1. CHECK RLS STATUS
-- =====================================================
SELECT 
  '=== RLS STATUS ===' as section,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'orders';

-- =====================================================
-- 2. CHECK RLS POLICIES
-- =====================================================
SELECT 
  '=== RLS POLICIES ===' as section,
  policyname,
  cmd as command,
  permissive,
  roles,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'orders'
ORDER BY policyname;

-- =====================================================
-- 3. CHECK STORES
-- =====================================================
SELECT 
  '=== STORES ===' as section,
  store_id,
  store_name,
  owner_user_id,
  created_at
FROM stores
ORDER BY store_name;

-- =====================================================
-- 4. CHECK ORDERS BY STORE
-- =====================================================
SELECT 
  '=== ORDERS BY STORE ===' as section,
  s.store_name,
  COUNT(o.order_id) as order_count,
  MIN(o.created_at) as oldest_order,
  MAX(o.created_at) as newest_order
FROM orders o
JOIN stores s ON o.store_id = s.store_id
GROUP BY s.store_name
ORDER BY order_count DESC;

-- =====================================================
-- 5. CHECK TOTAL ORDERS
-- =====================================================
SELECT 
  '=== TOTAL ORDERS ===' as section,
  COUNT(*) as total_orders,
  COUNT(DISTINCT store_id) as unique_stores,
  COUNT(DISTINCT courier_id) as unique_couriers,
  MIN(created_at) as oldest_order,
  MAX(created_at) as newest_order
FROM orders;

-- =====================================================
-- 6. CHECK ADMIN USER
-- =====================================================
SELECT 
  '=== ADMIN USER ===' as section,
  user_id,
  email,
  user_role,
  created_at
FROM users
WHERE email = 'admin@performile.com';

-- =====================================================
-- 7. CHECK IF ADMIN OWNS ANY STORES
-- =====================================================
SELECT 
  '=== ADMIN STORE OWNERSHIP ===' as section,
  u.email,
  u.user_role,
  s.store_id,
  s.store_name
FROM users u
LEFT JOIN stores s ON s.owner_user_id = u.user_id
WHERE u.email = 'admin@performile.com';

-- =====================================================
-- 8. CHECK SAMPLE ORDERS (Latest 10)
-- =====================================================
SELECT 
  '=== SAMPLE ORDERS (Latest 10) ===' as section,
  o.order_number,
  s.store_name,
  o.order_status,
  o.created_at
FROM orders o
JOIN stores s ON o.store_id = s.store_id
ORDER BY o.created_at DESC
LIMIT 10;

-- =====================================================
-- 9. CHECK FOR OLD DATA (Demo Electronics Store)
-- =====================================================
SELECT 
  '=== OLD DATA CHECK ===' as section,
  COUNT(*) as count
FROM stores
WHERE store_name LIKE '%Electronics%' 
   OR store_name LIKE '%Merchant%Store%'
   OR store_name LIKE '%Rickard%Store%'
   OR store_name LIKE '%Fashion%Boutique%';

-- =====================================================
-- 10. CHECK ORDER NUMBERS FORMAT
-- =====================================================
SELECT 
  '=== ORDER NUMBER FORMATS ===' as section,
  CASE 
    WHEN order_number LIKE 'ORD-202%' THEN 'New Format (ORD-YYYYMMDD-XXXXX)'
    WHEN order_number LIKE 'ORD0%' THEN 'Old Format (ORD000XXX)'
    WHEN order_number LIKE 'TRK%' THEN 'Tracking Format (TRK000XXX)'
    WHEN order_number LIKE 'Jan-%' THEN 'Jane Courier Format'
    WHEN order_number LIKE 'Sch-%' THEN 'Schenker Format'
    ELSE 'Unknown Format'
  END as format_type,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM orders
GROUP BY format_type
ORDER BY count DESC;

-- =====================================================
-- 11. CHECK DATABASE CONNECTION SETTINGS
-- =====================================================
SELECT 
  '=== DATABASE SETTINGS ===' as section,
  name,
  setting
FROM pg_settings
WHERE name IN ('max_connections', 'shared_buffers', 'effective_cache_size');

-- =====================================================
-- 12. SIMULATE RLS FOR ADMIN (What admin SHOULD see)
-- =====================================================
-- This shows what the admin policy should return
SELECT 
  '=== SIMULATED ADMIN RLS (Should see ALL orders) ===' as section,
  COUNT(*) as orders_admin_should_see
FROM orders
WHERE true; -- Admin policy: sees everything

-- =====================================================
-- 13. CHECK FOR ORPHANED ORDERS
-- =====================================================
SELECT 
  '=== ORPHANED ORDERS (No Store) ===' as section,
  COUNT(*) as orphaned_count
FROM orders o
LEFT JOIN stores s ON o.store_id = s.store_id
WHERE s.store_id IS NULL;

-- =====================================================
-- 14. CHECK COURIER ASSIGNMENTS
-- =====================================================
SELECT 
  '=== COURIER ASSIGNMENTS ===' as section,
  COUNT(*) as total_orders,
  COUNT(courier_id) as orders_with_courier,
  COUNT(*) - COUNT(courier_id) as orders_without_courier
FROM orders;

-- =====================================================
-- SUMMARY
-- =====================================================
SELECT '
========================================
✅ AUDIT COMPLETE
========================================

Next Steps:
1. Review the results above
2. Compare with API response
3. Check if RLS policies are correct
4. Verify admin can see all stores

Key Questions:
- Is RLS enabled? (Should be true)
- How many stores exist? (Should be 11)
- How many total orders? (Should be 105)
- Does admin own any stores? (Should be NULL)
- Are there old "Demo Electronics Store" entries? (Should be 0)

========================================
' as summary;
