-- =====================================================
-- Seed Test Data for Development
-- =====================================================
-- This script adds sample data so dashboards show real numbers
-- Run this AFTER assigning subscriptions to users
-- =====================================================

-- =====================================================
-- 1. Get User IDs (Update these with your actual user emails)
-- =====================================================

-- Check what users you have
SELECT user_id, email, user_role, first_name, last_name
FROM users
WHERE user_role IN ('merchant', 'courier')
ORDER BY user_role, email;

-- =====================================================
-- 2. Create Sample Stores for Merchants
-- =====================================================

-- Create a store for each merchant (if they don't have one)
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
-- 3. Link Merchants with Couriers (SKIPPED)
-- =====================================================
-- Note: The merchant-courier relationship table doesn't exist yet
-- Orders will be created with random couriers from the couriers table
-- You can manually select couriers in the UI later

-- =====================================================
-- 4. Create Sample Orders
-- =====================================================

-- Create sample orders for merchants
-- This will populate the dashboard with data
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
  c.courier_id,
  CASE 
    WHEN random() < 0.7 THEN 'delivered'
    WHEN random() < 0.9 THEN 'in_transit'
    ELSE 'pending'
  END as order_status,
  NOW() - (random() * INTERVAL '30 days') as order_date,
  NOW() - (random() * INTERVAL '25 days') as delivery_date,
  '123 Test Street' as delivery_address,
  '12345' as postal_code,
  'Test City' as city,
  'USA' as country,
  NOW() - (random() * INTERVAL '30 days') as created_at
FROM stores s
CROSS JOIN (SELECT courier_id FROM couriers LIMIT 1) c
WHERE s.owner_user_id IN (SELECT user_id FROM users WHERE user_role = 'merchant')
LIMIT 50; -- Create 50 sample orders

-- =====================================================
-- 5. Verify Data
-- =====================================================

-- Check stores created
SELECT 
  s.store_name,
  u.email as owner_email,
  COUNT(DISTINCT o.order_id) as total_orders
FROM stores s
JOIN users u ON s.owner_user_id = u.user_id
LEFT JOIN orders o ON s.store_id = o.store_id
WHERE u.user_role = 'merchant'
GROUP BY s.store_id, s.store_name, u.email;

-- Check orders created
SELECT 
  order_status,
  COUNT(*) as count
FROM orders
GROUP BY order_status;

-- Check merchant dashboard data
SELECT 
  u.email as merchant_email,
  COUNT(DISTINCT o.order_id) as total_orders,
  COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END) as delivered_orders
FROM users u
JOIN stores s ON u.user_id = s.owner_user_id
LEFT JOIN orders o ON s.store_id = o.store_id
WHERE u.user_role = 'merchant'
GROUP BY u.user_id, u.email;

SELECT 'Test data seeded successfully!' as status;
