-- Check Test Data for Analytics APIs
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. Check if test merchant has stores
-- ============================================
SELECT 
  store_id,
  store_name,
  created_at
FROM stores 
WHERE owner_user_id = 'fc1a0fdb-a82c-4a83-82bb-fa7a4b4b13c9';

-- Expected: At least 1 store
-- If empty: Merchant has no stores (explains "Failed to load order trends")

-- ============================================
-- 2. Check if test courier has orders
-- ============================================
SELECT 
  COUNT(*) as courier_order_count,
  MIN(created_at) as oldest_order,
  MAX(created_at) as newest_order
FROM orders 
WHERE courier_id = '617f3f03-ec94-415a-8400-dc5c7e29d96f';

-- Expected: At least 1 order
-- If 0: Courier has no orders (explains empty analytics)

-- ============================================
-- 3. Check if test merchant has orders
-- ============================================
SELECT 
  COUNT(*) as merchant_order_count,
  MIN(o.created_at) as oldest_order,
  MAX(o.created_at) as newest_order
FROM orders o
JOIN stores s ON o.store_id = s.store_id
WHERE s.owner_user_id = 'fc1a0fdb-a82c-4a83-82bb-fa7a4b4b13c9';

-- Expected: At least 1 order
-- If 0: Merchant has no orders (explains empty analytics)

-- ============================================
-- 4. Check if any claims exist
-- ============================================
SELECT 
  COUNT(*) as total_claims
FROM claims;

-- Expected: 0 or more (claims are optional)

-- ============================================
-- 5. Check test user details
-- ============================================
SELECT 
  user_id,
  email,
  user_role,
  first_name,
  last_name
FROM users
WHERE user_id IN (
  '617f3f03-ec94-415a-8400-dc5c7e29d96f',
  'fc1a0fdb-a82c-4a83-82bb-fa7a4b4b13c9'
);

-- Expected: 2 users (courier and merchant)

-- ============================================
-- DIAGNOSIS
-- ============================================
-- If merchant has NO stores:
--   → Order trends API returns empty (correct behavior)
--   → Need to create a store for the merchant
--
-- If merchant has stores but NO orders:
--   → Order trends API returns empty (correct behavior)
--   → Need to create orders for testing
--
-- If courier has NO orders:
--   → Order trends API returns empty (correct behavior)
--   → Need to create orders for testing
