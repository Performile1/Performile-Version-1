-- =====================================================
-- RLS POLICY TEST - CORRECTED FOR PRODUCTION SCHEMA
-- =====================================================
-- Purpose: Test RLS policies with ACTUAL production schema
-- Date: October 26, 2025
-- Schema: Uses consumer_id, store_id, owner_user_id (verified)
-- =====================================================

-- =====================================================
-- 1. RLS STATUS CHECK
-- =====================================================

SELECT '🔐 RLS STATUS' as section;

SELECT 
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) as rls_enabled_tables,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_policies,
  (SELECT COUNT(*) FROM users WHERE user_role = 'merchant') as merchants,
  (SELECT COUNT(*) FROM users WHERE user_role = 'courier') as couriers,
  (SELECT COUNT(*) FROM users WHERE user_role = 'admin') as admins,
  (SELECT COUNT(*) FROM orders) as total_orders,
  (SELECT COUNT(*) FROM stores) as total_stores;

-- =====================================================
-- 2. MERCHANT DATA CHECK
-- =====================================================

SELECT '🏪 MERCHANT DATA (Stores & Orders)' as section;

SELECT 
  u.email as merchant_email,
  u.user_role,
  s.store_id,
  s.store_name,
  (SELECT COUNT(*) FROM orders WHERE store_id = s.store_id) as order_count
FROM users u
LEFT JOIN stores s ON s.owner_user_id = u.user_id
WHERE u.user_role = 'merchant'
ORDER BY u.email;

-- =====================================================
-- 3. COURIER DATA CHECK
-- =====================================================

SELECT '🚚 COURIER DATA (Assigned Orders)' as section;

SELECT 
  u.email as courier_email,
  u.user_role,
  c.courier_id,
  c.courier_name,
  (SELECT COUNT(*) FROM orders WHERE courier_id = c.courier_id) as order_count
FROM users u
LEFT JOIN couriers c ON c.user_id = u.user_id
WHERE u.user_role = 'courier'
ORDER BY u.email
LIMIT 10;

-- =====================================================
-- 4. CONSUMER DATA CHECK
-- =====================================================

SELECT '👤 CONSUMER DATA (Orders Placed)' as section;

SELECT 
  u.email as consumer_email,
  u.user_role,
  (SELECT COUNT(*) FROM orders WHERE consumer_id = u.user_id) as order_count
FROM users u
WHERE u.user_role = 'consumer'
OR u.user_id IN (SELECT DISTINCT consumer_id FROM orders WHERE consumer_id IS NOT NULL)
ORDER BY order_count DESC
LIMIT 10;

-- =====================================================
-- 5. SAMPLE ORDERS WITH RELATIONSHIPS
-- =====================================================

SELECT '📦 SAMPLE ORDERS (First 5 with relationships)' as section;

SELECT 
  o.order_id,
  o.order_number,
  o.tracking_number,
  o.order_status,
  s.store_name as merchant_store,
  s.owner_user_id as merchant_user_id,
  c.courier_name,
  c.user_id as courier_user_id,
  o.consumer_id,
  o.customer_email,
  o.created_at
FROM orders o
LEFT JOIN stores s ON o.store_id = s.store_id
LEFT JOIN couriers c ON o.courier_id = c.courier_id
ORDER BY o.created_at DESC
LIMIT 5;

-- =====================================================
-- 6. RLS POLICY LIST
-- =====================================================

SELECT '📜 ALL RLS POLICIES' as section;

SELECT 
  tablename,
  policyname,
  CASE cmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as operation,
  CASE 
    WHEN qual LIKE '%auth.uid()%' THEN 'User-based'
    WHEN qual LIKE '%user_role%' THEN 'Role-based'
    WHEN qual = 'true' THEN 'Public'
    ELSE 'Custom'
  END as policy_type
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- 7. FOREIGN KEY VERIFICATION
-- =====================================================

SELECT '🔗 FOREIGN KEY VERIFICATION' as section;

SELECT 
  kcu.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.key_column_usage AS kcu
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = kcu.constraint_name
WHERE kcu.table_name IN ('orders', 'stores', 'couriers')
AND kcu.constraint_name LIKE '%fkey%'
ORDER BY kcu.table_name, kcu.column_name;

-- =====================================================
-- 8. TEST SPECIFIC MERCHANT
-- =====================================================

SELECT '🧪 TEST: Merchant merchant@performile.com' as section;

WITH merchant_user AS (
  SELECT user_id FROM users WHERE email = 'merchant@performile.com'
),
merchant_stores AS (
  SELECT store_id, store_name FROM stores 
  WHERE owner_user_id = (SELECT user_id FROM merchant_user)
)
SELECT 
  'Stores owned' as metric,
  COUNT(*)::TEXT as value
FROM merchant_stores
UNION ALL
SELECT 
  'Orders for stores' as metric,
  COUNT(*)::TEXT as value
FROM orders
WHERE store_id IN (SELECT store_id FROM merchant_stores)
UNION ALL
SELECT 
  'Store names' as metric,
  STRING_AGG(store_name, ', ') as value
FROM merchant_stores;

-- =====================================================
-- 9. TEST SPECIFIC COURIER
-- =====================================================

SELECT '🧪 TEST: Courier courier@performile.com' as section;

WITH courier_user AS (
  SELECT user_id FROM users WHERE email = 'courier@performile.com'
),
courier_profile AS (
  SELECT courier_id, courier_name FROM couriers 
  WHERE user_id = (SELECT user_id FROM courier_user)
)
SELECT 
  'Courier profile exists' as metric,
  CASE WHEN COUNT(*) > 0 THEN 'Yes' ELSE 'No' END as value
FROM courier_profile
UNION ALL
SELECT 
  'Orders assigned' as metric,
  COUNT(*)::TEXT as value
FROM orders
WHERE courier_id IN (SELECT courier_id FROM courier_profile)
UNION ALL
SELECT 
  'Courier name' as metric,
  COALESCE(MAX(courier_name), 'N/A') as value
FROM courier_profile;

-- =====================================================
-- 10. SUMMARY & RECOMMENDATIONS
-- =====================================================

SELECT '✅ TEST SUMMARY' as section;

SELECT 
  'RLS policies created' as metric,
  COUNT(*)::TEXT as value
FROM pg_policies
WHERE schemaname = 'public'
UNION ALL
SELECT 
  'Tables with RLS enabled' as metric,
  COUNT(*)::TEXT as value
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true
UNION ALL
SELECT 
  'Test users available' as metric,
  (
    SELECT COUNT(*)::TEXT FROM users 
    WHERE user_role IN ('merchant', 'courier', 'admin')
  ) as value
UNION ALL
SELECT 
  'Orders in database' as metric,
  COUNT(*)::TEXT as value
FROM orders
UNION ALL
SELECT 
  'Schema documented' as metric,
  'See PRODUCTION_SCHEMA_DOCUMENTED.md' as value;

-- =====================================================
-- NOTES
-- =====================================================

SELECT '📝 IMPORTANT NOTES' as section;

SELECT 
  'Production schema uses:' as note,
  'consumer_id (not customer_id), store_id (not merchant_id), owner_user_id (not merchant_id in stores)' as details
UNION ALL
SELECT 
  'RLS testing requires:' as note,
  'Actual user sessions with auth.uid() set - these queries run as superuser' as details
UNION ALL
SELECT 
  'For real RLS testing:' as note,
  'Use Supabase client with authenticated users or SET LOCAL role' as details
UNION ALL
SELECT 
  'Schema documentation:' as note,
  'database/PRODUCTION_SCHEMA_DOCUMENTED.md' as details;
