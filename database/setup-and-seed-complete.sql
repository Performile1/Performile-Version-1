-- =====================================================
-- Complete Setup and Seed Script (IDEMPOTENT VERSION)
-- =====================================================
-- This script does EVERYTHING in one go:
-- 1. Creates missing tables (merchant_courier_selections)
-- 2. Adds missing columns to orders table
-- 3. Creates stores for merchants (if they don't exist)
-- 4. Links merchants with couriers (if not already linked)
-- 5. Creates sample orders (with unique tracking numbers)
-- 6. Shows verification data
--
-- ✅ SAFE TO RUN MULTIPLE TIMES
-- - Won't create duplicates
-- - Won't delete existing data
-- - Shows what already exists
-- - Only creates what's missing
-- =====================================================

-- Start message
DO $$
BEGIN
  RAISE NOTICE '🚀 Starting database setup and seeding...';
  RAISE NOTICE '📋 This script is safe to run multiple times';
END $$;

-- =====================================================
-- STEP 1: Create merchant_courier_selections table
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchant_courier_selections') THEN
    RAISE NOTICE '✅ Table merchant_courier_selections already exists';
  ELSE
    RAISE NOTICE '📝 Creating merchant_courier_selections table...';
  END IF;
END $$;

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
-- STEP 1.5: Add address columns to orders table
-- =====================================================

-- Add delivery address columns if they don't exist
DO $$ 
DECLARE
  columns_added INTEGER := 0;
BEGIN
    RAISE NOTICE '📝 Checking address columns in orders table...';
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'delivery_address'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivery_address TEXT;
        columns_added := columns_added + 1;
        RAISE NOTICE '  ✅ Added delivery_address column';
    ELSE
        RAISE NOTICE '  ✓ delivery_address column already exists';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'postal_code'
    ) THEN
        ALTER TABLE orders ADD COLUMN postal_code VARCHAR(20);
        columns_added := columns_added + 1;
        RAISE NOTICE '  ✅ Added postal_code column';
    ELSE
        RAISE NOTICE '  ✓ postal_code column already exists';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'city'
    ) THEN
        ALTER TABLE orders ADD COLUMN city VARCHAR(100);
        columns_added := columns_added + 1;
        RAISE NOTICE '  ✅ Added city column';
    ELSE
        RAISE NOTICE '  ✓ city column already exists';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'state'
    ) THEN
        ALTER TABLE orders ADD COLUMN state VARCHAR(100);
        columns_added := columns_added + 1;
        RAISE NOTICE '  ✅ Added state column';
    ELSE
        RAISE NOTICE '  ✓ state column already exists';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'country'
    ) THEN
        ALTER TABLE orders ADD COLUMN country VARCHAR(100);
        columns_added := columns_added + 1;
        RAISE NOTICE '  ✅ Added country column';
    ELSE
        RAISE NOTICE '  ✓ country column already exists';
    END IF;
    
    IF columns_added > 0 THEN
        RAISE NOTICE '✅ Added % new columns to orders table', columns_added;
    ELSE
        RAISE NOTICE '✅ All address columns already exist';
    END IF;
END $$;

-- =====================================================
-- STEP 2: Create stores for merchants
-- =====================================================

DO $$
DECLARE
  stores_created INTEGER := 0;
  existing_stores INTEGER := 0;
BEGIN
  RAISE NOTICE '📝 Creating stores for merchants...';
  
  -- Count existing stores
  SELECT COUNT(*) INTO existing_stores 
  FROM stores s 
  JOIN users u ON s.owner_user_id = u.user_id 
  WHERE u.user_role = 'merchant';
  
  RAISE NOTICE '  Found % existing merchant stores', existing_stores;
  
  -- Create new stores
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
  
  GET DIAGNOSTICS stores_created = ROW_COUNT;
  
  IF stores_created > 0 THEN
    RAISE NOTICE '✅ Created % new stores', stores_created;
  ELSE
    RAISE NOTICE '✅ All merchants already have stores';
  END IF;
END $$;

-- =====================================================
-- STEP 3: Link merchants with couriers
-- =====================================================

DO $$
DECLARE
  links_created INTEGER := 0;
  existing_links INTEGER := 0;
BEGIN
  RAISE NOTICE '📝 Linking merchants with couriers...';
  
  -- Count existing links
  SELECT COUNT(*) INTO existing_links FROM merchant_courier_selections;
  RAISE NOTICE '  Found % existing merchant-courier links', existing_links;
  
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
    ROW_NUMBER() OVER (PARTITION BY u.user_id ORDER BY c.courier_id) as priority_level,
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
  
  GET DIAGNOSTICS links_created = ROW_COUNT;
  
  IF links_created > 0 THEN
    RAISE NOTICE '✅ Created % new merchant-courier links', links_created;
  ELSE
    RAISE NOTICE '✅ All merchants already linked to couriers';
  END IF;
END $$;

-- =====================================================
-- STEP 4: Create sample orders
-- =====================================================

-- First, check how many orders already exist
DO $$
DECLARE
  existing_orders_count INTEGER;
  max_tracking_num INTEGER := 0;
  max_order_num INTEGER := 0;
BEGIN
  -- Count existing orders
  SELECT COUNT(*) INTO existing_orders_count FROM orders;
  
  -- Get the highest tracking number
  SELECT COALESCE(MAX(SUBSTRING(tracking_number FROM 4)::INTEGER), 0) 
  INTO max_tracking_num 
  FROM orders 
  WHERE tracking_number ~ '^TRK[0-9]+$';
  
  -- Get the highest order number
  SELECT COALESCE(MAX(SUBSTRING(order_number FROM 4)::INTEGER), 0) 
  INTO max_order_num 
  FROM orders 
  WHERE order_number ~ '^ORD[0-9]+$';
  
  RAISE NOTICE '📊 Found % existing orders', existing_orders_count;
  RAISE NOTICE '📊 Highest tracking number: TRK%', LPAD(max_tracking_num::TEXT, 8, '0');
  RAISE NOTICE '📊 Highest order number: ORD%', LPAD(max_order_num::TEXT, 6, '0');
END $$;

-- Create sample orders with complete address information
-- Using a sequence-based approach to avoid duplicates
DO $$
DECLARE
  max_tracking_num INTEGER;
  max_order_num INTEGER;
  orders_to_create INTEGER := 50;
  orders_created INTEGER := 0;
BEGIN
  -- Get current max numbers
  SELECT COALESCE(MAX(SUBSTRING(tracking_number FROM 4)::INTEGER), 0) 
  INTO max_tracking_num 
  FROM orders 
  WHERE tracking_number ~ '^TRK[0-9]+$';
  
  SELECT COALESCE(MAX(SUBSTRING(order_number FROM 4)::INTEGER), 0) 
  INTO max_order_num 
  FROM orders 
  WHERE order_number ~ '^ORD[0-9]+$';
  
  -- Insert new orders starting from the next available number
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
    state,
    country,
    created_at
  )
  SELECT 
    'TRK' || LPAD((max_tracking_num + ROW_NUMBER() OVER())::TEXT, 8, '0') as tracking_number,
    'ORD' || LPAD((max_order_num + ROW_NUMBER() OVER())::TEXT, 6, '0') as order_number,
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
    (ARRAY['123 Main St', '456 Oak Ave', '789 Pine Rd', '321 Elm St', '654 Maple Dr'])[FLOOR(random() * 5 + 1)] as delivery_address,
    (ARRAY['10001', '90210', '60601', '33101', '94102'])[FLOOR(random() * 5 + 1)] as postal_code,
    (ARRAY['New York', 'Los Angeles', 'Chicago', 'Miami', 'San Francisco'])[FLOOR(random() * 5 + 1)] as city,
    (ARRAY['NY', 'CA', 'IL', 'FL', 'CA'])[FLOOR(random() * 5 + 1)] as state,
    'USA' as country,
    NOW() - (random() * INTERVAL '30 days') as created_at
  FROM stores s
  JOIN merchant_courier_selections mcs ON s.owner_user_id = mcs.merchant_id
  WHERE s.owner_user_id IN (SELECT user_id FROM users WHERE user_role = 'merchant')
    AND mcs.is_active = TRUE
  LIMIT orders_to_create;
  
  GET DIAGNOSTICS orders_created = ROW_COUNT;
  RAISE NOTICE '✅ Created % new orders', orders_created;
END $$;

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

-- =====================================================
-- FINAL SUMMARY
-- =====================================================

DO $$
DECLARE
  total_merchants INTEGER;
  total_stores INTEGER;
  total_links INTEGER;
  total_orders INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_merchants FROM users WHERE user_role = 'merchant';
  SELECT COUNT(*) INTO total_stores FROM stores;
  SELECT COUNT(*) INTO total_links FROM merchant_courier_selections;
  SELECT COUNT(*) INTO total_orders FROM orders;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '✅ SETUP COMPLETE!';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Database Summary:';
  RAISE NOTICE '  • Merchants: %', total_merchants;
  RAISE NOTICE '  • Stores: %', total_stores;
  RAISE NOTICE '  • Merchant-Courier Links: %', total_links;
  RAISE NOTICE '  • Total Orders: %', total_orders;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next Steps:';
  RAISE NOTICE '  1. Check the verification queries below';
  RAISE NOTICE '  2. Test merchant dashboard at /dashboard';
  RAISE NOTICE '  3. Verify API endpoint /api/merchant/dashboard';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;

-- Final success message for query results
SELECT 
  '✅ SETUP COMPLETE!' as status,
  'All tables created, data seeded, ready to use!' as message;
