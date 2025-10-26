-- =====================================================
-- SCHEMA DISCOVERY SCRIPT
-- =====================================================
-- Purpose: Discover actual production schema
-- Date: October 26, 2025
-- Use this to find out what columns actually exist
-- =====================================================

-- 1. Check ORDERS table columns
SELECT '📦 ORDERS TABLE COLUMNS' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- 2. Check STORES table columns
SELECT '🏪 STORES TABLE COLUMNS' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'stores'
ORDER BY ordinal_position;

-- 3. Check COURIERS table columns
SELECT '🚚 COURIERS TABLE COLUMNS' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'couriers'
ORDER BY ordinal_position;

-- 4. Check USERS table columns
SELECT '👤 USERS TABLE COLUMNS' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 5. Check foreign keys on ORDERS table
SELECT '🔗 ORDERS TABLE FOREIGN KEYS' as info;
SELECT 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.key_column_usage AS kcu
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = kcu.constraint_name
WHERE kcu.table_name = 'orders'
AND kcu.constraint_name LIKE '%fkey%'
ORDER BY kcu.column_name;

-- 6. Sample data from ORDERS (first row)
SELECT '📊 SAMPLE ORDER DATA' as info;
SELECT *
FROM orders
LIMIT 1;

-- 7. Sample data from STORES (first row)
SELECT '📊 SAMPLE STORE DATA' as info;
SELECT *
FROM stores
LIMIT 1;

-- 8. Summary
SELECT '✅ SCHEMA SUMMARY' as info;
SELECT 
  'orders' as table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'orders') as column_count,
  (SELECT COUNT(*) FROM orders) as row_count
UNION ALL
SELECT 
  'stores' as table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'stores') as column_count,
  (SELECT COUNT(*) FROM stores) as row_count
UNION ALL
SELECT 
  'couriers' as table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'couriers') as column_count,
  (SELECT COUNT(*) FROM couriers) as row_count
UNION ALL
SELECT 
  'users' as table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users') as column_count,
  (SELECT COUNT(*) FROM users) as row_count;
