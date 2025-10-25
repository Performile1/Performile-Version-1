-- =====================================================
-- Quick Check: What data exists for merchants?
-- =====================================================

-- 1. All merchants in the system
SELECT 
  '=== ALL MERCHANTS ===' as info,
  user_id,
  email,
  first_name || ' ' || last_name as name
FROM users
WHERE user_role = 'merchant';

-- 2. Stores per merchant
SELECT 
  '=== STORES ===' as info,
  u.email,
  COUNT(s.store_id) as store_count,
  STRING_AGG(s.store_name, ', ') as stores
FROM users u
LEFT JOIN stores s ON u.user_id = s.owner_user_id
WHERE u.user_role = 'merchant'
GROUP BY u.user_id, u.email;

-- 3. Couriers per merchant
SELECT 
  '=== LINKED COURIERS ===' as info,
  u.email,
  COUNT(mcs.courier_id) as courier_count,
  STRING_AGG(c.courier_name, ', ') as couriers
FROM users u
LEFT JOIN merchant_courier_selections mcs ON u.user_id = mcs.merchant_id AND mcs.is_active = TRUE
LEFT JOIN couriers c ON mcs.courier_id = c.courier_id
WHERE u.user_role = 'merchant'
GROUP BY u.user_id, u.email;

-- 4. Orders per merchant
SELECT 
  '=== ORDERS ===' as info,
  u.email,
  COUNT(o.order_id) as total_orders,
  COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END) as delivered,
  COUNT(CASE WHEN o.order_status = 'in_transit' THEN 1 END) as in_transit,
  COUNT(CASE WHEN o.order_status = 'pending' THEN 1 END) as pending
FROM users u
LEFT JOIN stores s ON u.user_id = s.owner_user_id
LEFT JOIN orders o ON s.store_id = o.store_id
WHERE u.user_role = 'merchant'
GROUP BY u.user_id, u.email;

-- 5. Complete summary
SELECT 
  '=== COMPLETE SUMMARY ===' as info,
  u.email as merchant_email,
  COUNT(DISTINCT s.store_id) as stores,
  COUNT(DISTINCT mcs.courier_id) as couriers,
  COUNT(DISTINCT o.order_id) as orders,
  ROUND(
    COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END)::NUMERIC / 
    NULLIF(COUNT(DISTINCT o.order_id), 0) * 100,
    1
  ) as completion_rate
FROM users u
LEFT JOIN stores s ON u.user_id = s.owner_user_id
LEFT JOIN merchant_courier_selections mcs ON u.user_id = mcs.merchant_id AND mcs.is_active = TRUE
LEFT JOIN orders o ON s.store_id = o.store_id
WHERE u.user_role = 'merchant'
GROUP BY u.user_id, u.email;
