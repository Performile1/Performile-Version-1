-- =====================================================
-- QUICK RLS STATUS CHECK
-- =====================================================
-- Purpose: Quick check of RLS policies and data
-- Date: October 26, 2025
-- =====================================================

-- 1. Show all tables
SELECT '📋 ALL TABLES IN DATABASE' as info;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Show RLS enabled tables
SELECT '🔐 TABLES WITH RLS ENABLED' as info;
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true
ORDER BY tablename;

-- 3. Count RLS policies
SELECT '📊 RLS POLICY COUNT' as info;
SELECT 
  COUNT(*) as total_policies,
  COUNT(DISTINCT tablename) as tables_with_policies
FROM pg_policies
WHERE schemaname = 'public';

-- 4. Show all RLS policies
SELECT '📜 ALL RLS POLICIES' as info;
SELECT 
  tablename,
  policyname,
  CASE cmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as operation
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. Check data counts
SELECT '📊 DATA COUNTS' as info;

-- Orders
SELECT 'orders' as table_name, COUNT(*) as row_count
FROM orders
UNION ALL
-- Stores
SELECT 'stores' as table_name, COUNT(*) as row_count
FROM stores
UNION ALL
-- Couriers
SELECT 'couriers' as table_name, COUNT(*) as row_count
FROM couriers
UNION ALL
-- Users
SELECT 'users' as table_name, COUNT(*) as row_count
FROM users
ORDER BY table_name;

-- 6. Check merchant data
SELECT '🏪 MERCHANT DATA CHECK' as info;
SELECT 
  u.email,
  u.user_role,
  s.store_id,
  s.store_name,
  (SELECT COUNT(*) FROM orders WHERE merchant_id = s.store_id) as order_count
FROM users u
LEFT JOIN stores s ON s.owner_user_id = u.user_id
WHERE u.user_role = 'merchant'
ORDER BY u.email;

-- 7. Check courier data
SELECT '🚚 COURIER DATA CHECK' as info;
SELECT 
  u.email,
  u.user_role,
  c.courier_id,
  c.courier_name,
  (SELECT COUNT(*) FROM orders WHERE courier_id = c.courier_id) as order_count
FROM users u
LEFT JOIN couriers c ON c.user_id = u.user_id
WHERE u.user_role = 'courier'
ORDER BY u.email;

-- 8. Sample orders with relationships
SELECT '📦 SAMPLE ORDERS (First 5)' as info;
SELECT 
  o.order_id,
  o.order_number,
  o.order_status,
  s.store_name as merchant_store,
  c.courier_name,
  o.created_at
FROM orders o
LEFT JOIN stores s ON o.merchant_id = s.store_id
LEFT JOIN couriers c ON o.courier_id = c.courier_id
ORDER BY o.created_at DESC
LIMIT 5;

-- 9. Check if RLS is actually blocking data
SELECT '🔒 RLS BLOCKING TEST' as info;
SELECT 
  'If you see this message, the query ran successfully' as status,
  'RLS policies are active but may need testing with actual user sessions' as note;

-- 10. Summary
SELECT '✅ SUMMARY' as info;
SELECT 
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) as rls_enabled_tables,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_policies,
  (SELECT COUNT(*) FROM users WHERE user_role = 'merchant') as merchants,
  (SELECT COUNT(*) FROM users WHERE user_role = 'courier') as couriers,
  (SELECT COUNT(*) FROM users WHERE user_role = 'admin') as admins,
  (SELECT COUNT(*) FROM orders) as total_orders,
  (SELECT COUNT(*) FROM stores) as total_stores;
