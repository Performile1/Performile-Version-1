-- =====================================================
-- IDENTIFY TEST DATA - SIMPLE VERSION
-- =====================================================
-- Purpose: Find test/demo data to remove
-- Date: October 26, 2025
-- =====================================================

-- 1. TEST USERS
SELECT '👤 TEST USERS' as section;
SELECT user_id, email, user_role, created_at
FROM users
WHERE email LIKE '%test%' OR email LIKE '%demo%'
ORDER BY created_at DESC;

-- 2. SYSTEM USERS TO KEEP
SELECT '✅ SYSTEM USERS (KEEP)' as section;
SELECT user_id, email, user_role, created_at
FROM users
WHERE email IN ('admin@performile.com', 'merchant@performile.com', 'courier@performile.com')
ORDER BY user_role;

-- 3. TEST ORDERS
SELECT '📦 TEST ORDERS' as section;
SELECT order_id, order_number, customer_email, order_status, created_at
FROM orders
WHERE customer_email LIKE '%test%' OR customer_email LIKE '%demo%'
ORDER BY created_at DESC
LIMIT 20;

-- 4. TEST STORES
SELECT '🏪 TEST STORES' as section;
SELECT store_id, store_name, owner_user_id, created_at
FROM stores
WHERE store_name LIKE '%Test%' OR store_name LIKE '%Demo%'
ORDER BY created_at DESC;

-- 5. ALL STORES
SELECT '🏪 ALL STORES' as section;
SELECT store_id, store_name, owner_user_id, created_at
FROM stores
ORDER BY created_at DESC;

-- 6. TEST COURIERS
SELECT '🚚 TEST COURIERS' as section;
SELECT courier_id, courier_name, user_id, created_at
FROM couriers
WHERE courier_name LIKE '%Test%' OR courier_name LIKE '%Demo%'
ORDER BY created_at DESC;

-- 7. PRODUCTION COURIERS TO KEEP
SELECT '✅ PRODUCTION COURIERS (KEEP)' as section;
SELECT courier_id, courier_name, courier_code, created_at
FROM couriers
WHERE courier_name IN ('DHL Express', 'DHL eCommerce', 'Bring', 'Budbee', 'Airmee')
OR courier_code IS NOT NULL
ORDER BY courier_name;

-- 8. DATA COUNTS
SELECT '📈 DATA SUMMARY' as section;
SELECT 
  'Users' as table_name,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE email LIKE '%test%' OR email LIKE '%demo%') as test_count
FROM users
UNION ALL
SELECT 
  'Orders' as table_name,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE customer_email LIKE '%test%' OR customer_email LIKE '%demo%') as test_count
FROM orders
UNION ALL
SELECT 
  'Stores' as table_name,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE store_name LIKE '%Test%' OR store_name LIKE '%Demo%') as test_count
FROM stores
UNION ALL
SELECT 
  'Couriers' as table_name,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE courier_name LIKE '%Test%' OR courier_name LIKE '%Demo%') as test_count
FROM couriers;
