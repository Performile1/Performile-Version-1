-- =====================================================
-- VERIFY DATABASE SETUP - Complete Check
-- =====================================================
-- Run this to verify the database is correctly configured

-- =====================================================
-- 1. CHECK ALL TABLES EXIST
-- =====================================================
SELECT 
  '1. Tables Check' as check_section,
  tablename,
  CASE 
    WHEN tablename IN (
      'users', 'stores', 'orders', 'couriers', 'reviews',
      'notifications', 'courier_trust_scores', 'orderservicetype'
    ) THEN '✅ Core table'
    ELSE '⚠️ Additional table'
  END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- 2. CHECK RLS IS ENABLED
-- =====================================================
SELECT 
  '2. RLS Status' as check_section,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity = true THEN '✅ Enabled'
    ELSE '❌ Disabled'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('orders', 'stores', 'couriers', 'users')
ORDER BY tablename;

-- =====================================================
-- 3. CHECK RLS POLICIES
-- =====================================================
SELECT 
  '3. RLS Policies' as check_section,
  tablename,
  policyname,
  cmd as command,
  CASE 
    WHEN policyname LIKE '%admin%' THEN '✅ Admin policy'
    WHEN policyname LIKE '%merchant%' THEN '✅ Merchant policy'
    WHEN policyname LIKE '%courier%' THEN '✅ Courier policy'
    WHEN policyname LIKE '%consumer%' THEN '✅ Consumer policy'
    ELSE '⚠️ Other policy'
  END as policy_type
FROM pg_policies 
WHERE tablename = 'orders'
ORDER BY policyname;

-- =====================================================
-- 4. CHECK DATA COUNTS
-- =====================================================
SELECT '4. Data Counts' as check_section, 'Users' as table_name, COUNT(*)::text as count FROM users
UNION ALL
SELECT '4. Data Counts', 'Stores', COUNT(*)::text FROM stores
UNION ALL
SELECT '4. Data Counts', 'Orders', COUNT(*)::text FROM orders
UNION ALL
SELECT '4. Data Counts', 'Couriers', COUNT(*)::text FROM couriers;

-- =====================================================
-- 5. CHECK STORE NAMES (Should be 11 real stores)
-- =====================================================
SELECT 
  '5. Store Names' as check_section,
  store_name,
  CASE 
    WHEN store_name LIKE '%Demo Electronics%' THEN '❌ OLD DATA'
    WHEN store_name LIKE '%Merchant''s Store%' THEN '❌ OLD DATA'
    WHEN store_name LIKE '%Rickard''s Store%' THEN '❌ OLD DATA'
    WHEN store_name LIKE '%Fashion Boutique%' THEN '❌ OLD DATA'
    ELSE '✅ Valid store'
  END as status
FROM stores
ORDER BY store_name;

-- =====================================================
-- 6. CHECK ORDERS SAMPLE (Latest 5)
-- =====================================================
SELECT 
  '6. Latest Orders' as check_section,
  o.order_number,
  s.store_name,
  o.order_status,
  o.created_at::date as created_date
FROM orders o
JOIN stores s ON o.store_id = s.store_id
ORDER BY o.created_at DESC
LIMIT 5;

-- =====================================================
-- 7. CHECK USER ROLES
-- =====================================================
SELECT 
  '7. User Roles' as check_section,
  user_role,
  COUNT(*) as count
FROM users
GROUP BY user_role
ORDER BY user_role;

-- =====================================================
-- 8. CHECK ADMIN USER
-- =====================================================
SELECT 
  '8. Admin User' as check_section,
  email,
  user_role,
  CASE 
    WHEN email = 'admin@performile.com' AND user_role = 'admin' THEN '✅ Correct'
    ELSE '⚠️ Check this'
  END as status
FROM users
WHERE email = 'admin@performile.com' OR user_role = 'admin';

-- =====================================================
-- 9. CHECK FOR OLD TRACKING NUMBERS
-- =====================================================
SELECT 
  '9. Old Data Check' as check_section,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ No old data'
    ELSE '❌ OLD DATA EXISTS'
  END as status
FROM orders
WHERE tracking_number IN ('TRK00000004', 'TRK00000084', 'TRK00000072');

-- =====================================================
-- 10. CHECK DATABASE CONNECTION INFO
-- =====================================================
SELECT 
  '10. Database Info' as check_section,
  current_database() as database_name,
  current_user as connected_as,
  version() as postgres_version;

-- =====================================================
-- SUMMARY
-- =====================================================
SELECT '
========================================
✅ DATABASE VERIFICATION COMPLETE
========================================

Expected Results:
1. Tables: Should have users, stores, orders, couriers, etc.
2. RLS Status: orders table should have RLS enabled
3. RLS Policies: Should have 4 policies (admin, merchant, courier, consumer)
4. Data Counts: 
   - Orders: 105
   - Stores: 11
   - Users: Multiple with different roles
5. Store Names: Should NOT contain "Demo Electronics Store", "Merchant''s Store", etc.
6. Latest Orders: Should show recent orders with real store names
7. User Roles: Should have admin, merchant, courier, consumer
8. Admin User: admin@performile.com should exist with role=admin
9. Old Data: Count should be 0 (no old tracking numbers)
10. Database: Should show correct database name

If any checks fail, the database may need updates!

========================================
' as summary;
