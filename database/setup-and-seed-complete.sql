-- =====================================================
-- Complete Setup and Seed Script
-- =====================================================
-- This script does EVERYTHING in one go:
-- 1. Creates missing tables (merchant_courier_selections)
-- 2. Creates stores for merchants
-- 3. Links merchants with couriers
-- 4. Creates sample orders
-- 5. Shows verification data
-- =====================================================

-- =====================================================
-- STEP 1: Create merchant_courier_selections table
-- =====================================================

CREATE TABLE IF NOT EXISTS merchant_courier_selections (
  selection_id SERIAL PRIMARY KEY,
  merchant_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  courier_id UUID REFERENCES couriers(courier_id) ON DELETE CASCADE,
  priority_level INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Prevent duplicate selections
  CONSTRAINT unique_merchant_courier UNIQUE (merchant_id, courier_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_mcs_merchant ON merchant_courier_selections(merchant_id);
CREATE INDEX IF NOT EXISTS idx_mcs_courier ON merchant_courier_selections(courier_id);
CREATE INDEX IF NOT EXISTS idx_mcs_active ON merchant_courier_selections(is_active);

-- =====================================================
-- STEP 2: Create stores for merchants
-- =====================================================

INSERT INTO stores (
  owner_user_id,
  store_name,
  website_url,
  description,
  is_active
)
SELECT 
  u.user_id,
  u.first_name || '''s Store',
  'https://example.com',
  'Sample store for testing',
  TRUE
FROM users u
WHERE u.user_role = 'merchant'
  AND NOT EXISTS (
    SELECT 1 FROM stores s WHERE s.owner_user_id = u.user_id
  );

-- =====================================================
-- STEP 3: Link merchants with couriers
-- =====================================================

-- Link each merchant with up to 5 couriers (Tier 1 limit)
INSERT INTO merchant_courier_selections (
  merchant_id,
  courier_id,
  priority_level,
  is_active
)
SELECT 
  u.user_id as merchant_id,
  c.courier_id,
  ROW_NUMBER() OVER (PARTITION BY u.user_id ORDER BY c.trust_score DESC) as priority_level,
  TRUE
FROM users u
CROSS JOIN couriers c
WHERE u.user_role = 'merchant'
  AND NOT EXISTS (
    SELECT 1 FROM merchant_courier_selections mcs 
    WHERE mcs.merchant_id = u.user_id AND mcs.courier_id = c.courier_id
  )
  AND (
    SELECT COUNT(*) 
    FROM merchant_courier_selections mcs2 
    WHERE mcs2.merchant_id = u.user_id
  ) < 5 -- Limit to 5 couriers per merchant (Tier 1)
LIMIT 100; -- Safety limit

-- =====================================================
-- STEP 4: Create sample orders
-- =====================================================

INSERT INTO orders (
  tracking_number,
  order_number,
  store_id,
  courier_id,
  order_status,
  order_date,
  delivery_date,
  delivery_address,
  postal_code,
  city,
  country,
  created_at
)
SELECT 
  'TRK' || LPAD((ROW_NUMBER() OVER())::TEXT, 8, '0') as tracking_number,
  'ORD' || LPAD((ROW_NUMBER() OVER())::TEXT, 6, '0') as order_number,
  s.store_id,
  mcs.courier_id,
  CASE 
    WHEN random() < 0.7 THEN 'delivered'
    WHEN random() < 0.85 THEN 'in_transit'
    WHEN random() < 0.95 THEN 'pending'
    ELSE 'cancelled'
  END as order_status,
  NOW() - (random() * INTERVAL '30 days') as order_date,
  NOW() - (random() * INTERVAL '25 days') as delivery_date,
  '123 Test Street' as delivery_address,
  '12345' as postal_code,
  'Test City' as city,
  'USA' as country,
  NOW() - (random() * INTERVAL '30 days') as created_at
FROM stores s
JOIN merchant_courier_selections mcs ON s.owner_user_id = mcs.merchant_id
WHERE s.owner_user_id IN (SELECT user_id FROM users WHERE user_role = 'merchant')
  AND mcs.is_active = TRUE
LIMIT 50; -- Create 50 sample orders

-- =====================================================
-- STEP 5: Verification Queries
-- =====================================================

-- Check stores created
SELECT 
  '=== STORES CREATED ===' as section,
  s.store_name,
  u.email as owner_email,
  COUNT(DISTINCT o.order_id) as total_orders
FROM stores s
JOIN users u ON s.owner_user_id = u.user_id
LEFT JOIN orders o ON s.store_id = o.store_id
WHERE u.user_role = 'merchant'
GROUP BY s.store_id, s.store_name, u.email;

-- Check merchant-courier relationships
SELECT 
  '=== MERCHANT-COURIER LINKS ===' as section,
  u.email as merchant_email,
  COUNT(DISTINCT mcs.courier_id) as linked_couriers,
  STRING_AGG(c.courier_name, ', ') as courier_names
FROM users u
LEFT JOIN merchant_courier_selections mcs ON u.user_id = mcs.merchant_id AND mcs.is_active = TRUE
LEFT JOIN couriers c ON mcs.courier_id = c.courier_id
WHERE u.user_role = 'merchant'
GROUP BY u.user_id, u.email;

-- Check orders by status
SELECT 
  '=== ORDERS BY STATUS ===' as section,
  order_status,
  COUNT(*) as count
FROM orders
GROUP BY order_status
ORDER BY count DESC;

-- Check merchant dashboard summary
SELECT 
  '=== MERCHANT DASHBOARD DATA ===' as section,
  u.email as merchant_email,
  COUNT(DISTINCT s.store_id) as total_stores,
  COUNT(DISTINCT mcs.courier_id) as available_couriers,
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

-- Final success message
SELECT 
  '✅ SETUP COMPLETE!' as status,
  'Stores created, couriers linked, and sample orders generated' as message;
