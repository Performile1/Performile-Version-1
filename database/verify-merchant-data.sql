-- =====================================================
-- Verify Merchant Dashboard Data
-- =====================================================
-- Run this to see what data exists for your merchant account

-- 1. Check your merchant user
SELECT 
  '=== YOUR MERCHANT ACCOUNT ===' as section,
  user_id,
  email,
  first_name,
  last_name,
  user_role
FROM users
WHERE user_role = 'merchant'
LIMIT 5;

-- 2. Check stores for merchants
SELECT 
  '=== STORES ===' as section,
  s.store_id,
  s.store_name,
  s.owner_user_id,
  u.email as owner_email,
  s.is_active
FROM stores s
JOIN users u ON s.owner_user_id = u.user_id
WHERE u.user_role = 'merchant';

-- 3. Check merchant-courier selections
SELECT 
  '=== MERCHANT-COURIER LINKS ===' as section,
  mcs.selection_id,
  u.email as merchant_email,
  c.courier_name,
  mcs.priority_level,
  mcs.is_active
FROM merchant_courier_selections mcs
JOIN users u ON mcs.merchant_id = u.user_id
JOIN couriers c ON mcs.courier_id = c.courier_id
WHERE u.user_role = 'merchant'
ORDER BY u.email, mcs.priority_level;

-- 4. Check orders for merchants
SELECT 
  '=== ORDERS ===' as section,
  o.order_id,
  o.tracking_number,
  o.order_status,
  s.store_name,
  u.email as merchant_email,
  c.courier_name,
  o.order_date,
  o.delivery_date
FROM orders o
JOIN stores s ON o.store_id = s.store_id
JOIN users u ON s.owner_user_id = u.user_id
LEFT JOIN couriers c ON o.courier_id = c.courier_id
WHERE u.user_role = 'merchant'
ORDER BY o.created_at DESC
LIMIT 10;

-- 5. Summary for each merchant
SELECT 
  '=== MERCHANT SUMMARY ===' as section,
  u.email as merchant_email,
  COUNT(DISTINCT s.store_id) as total_stores,
  COUNT(DISTINCT mcs.courier_id) as linked_couriers,
  COUNT(DISTINCT o.order_id) as total_orders,
  COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END) as delivered_orders,
  ROUND(
    COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END)::NUMERIC / 
    NULLIF(COUNT(DISTINCT o.order_id), 0) * 100, 
    1
  ) as completion_rate_percent
FROM users u
LEFT JOIN stores s ON u.user_id = s.owner_user_id
LEFT JOIN merchant_courier_selections mcs ON u.user_id = mcs.merchant_id AND mcs.is_active = TRUE
LEFT JOIN orders o ON s.store_id = o.store_id
WHERE u.user_role = 'merchant'
GROUP BY u.user_id, u.email;

-- 6. Check if you're logged in as the right user
-- Replace 'your-email@example.com' with your actual merchant email
SELECT 
  '=== CHECK YOUR LOGIN ===' as section,
  'Run this query with your email to verify your user_id:' as instruction;

-- Example: Find your user_id
-- SELECT user_id, email FROM users WHERE email = 'your-merchant-email@example.com';
