-- =====================================================
-- Seed Sample Data for Testing
-- =====================================================
-- Purpose: Add realistic sample data to test TrustScore system
-- =====================================================

-- =====================================================
-- 1. CREATE SAMPLE ORDERS
-- =====================================================

-- Get courier IDs
DO $$
DECLARE
  v_postnord_id UUID;
  v_dhl_id UUID;
  v_bring_id UUID;
  v_budbee_id UUID;
  v_merchant_id UUID;
  v_consumer_id UUID;
  v_order_id UUID;
  i INTEGER;
BEGIN
  -- Get courier IDs from couriers table
  SELECT courier_id INTO v_postnord_id FROM couriers WHERE courier_name = 'PostNord' LIMIT 1;
  SELECT courier_id INTO v_dhl_id FROM couriers WHERE courier_name LIKE '%DHL%' LIMIT 1;
  SELECT courier_id INTO v_bring_id FROM couriers WHERE courier_name = 'Bring' LIMIT 1;
  SELECT courier_id INTO v_budbee_id FROM couriers WHERE courier_name = 'Budbee' LIMIT 1;
  
  -- Get a merchant
  SELECT user_id INTO v_merchant_id FROM users WHERE user_role = 'merchant' LIMIT 1;
  
  -- Get a consumer
  SELECT user_id INTO v_consumer_id FROM users WHERE user_role = 'consumer' LIMIT 1;
  
  -- If no users exist, create them
  IF v_merchant_id IS NULL THEN
    INSERT INTO users (email, password_hash, first_name, last_name, user_role, is_active)
    VALUES ('merchant@test.com', '$2a$10$abcdefghijklmnopqrstuv', 'Test', 'Merchant', 'merchant', TRUE)
    RETURNING user_id INTO v_merchant_id;
  END IF;
  
  IF v_consumer_id IS NULL THEN
    INSERT INTO users (email, password_hash, first_name, last_name, user_role, is_active)
    VALUES ('consumer@test.com', '$2a$10$abcdefghijklmnopqrstuv', 'Test', 'Consumer', 'consumer', TRUE)
    RETURNING user_id INTO v_consumer_id;
  END IF;

  -- Create sample orders for PostNord (85% on-time, 95% completion)
  IF v_postnord_id IS NOT NULL THEN
    FOR i IN 1..50 LOOP
      INSERT INTO orders (
        merchant_id, courier_id, consumer_id,
        tracking_number, order_number, store_name,
        pickup_address, delivery_address,
        pickup_city, pickup_country, pickup_postal_code,
        city, country, postal_code,
        order_status, order_date, delivery_date,
        on_time, completed
      ) VALUES (
        v_merchant_id, v_postnord_id, v_consumer_id,
        'PN' || LPAD(i::TEXT, 10, '0'),
        'ORD-PN-' || i,
        'Test Store',
        'Warehouse Street 1',
        'Customer Street ' || i,
        'Stockholm', 'Sweden', '11122',
        'Stockholm', 'Sweden', '11' || LPAD(i::TEXT, 3, '0'),
        CASE WHEN i <= 47 THEN 'delivered' ELSE 'in_transit' END,
        NOW() - (i || ' days')::INTERVAL,
        CASE WHEN i <= 47 THEN NOW() - ((i-2) || ' days')::INTERVAL ELSE NULL END,
        CASE WHEN i <= 42 THEN TRUE ELSE FALSE END,
        CASE WHEN i <= 47 THEN TRUE ELSE FALSE END
      );
    END LOOP;
    
    -- Add reviews for PostNord
    FOR i IN 1..30 LOOP
      INSERT INTO reviews (
        courier_id, consumer_id, order_id,
        rating, review_text, delivery_speed, package_condition, communication,
        is_verified, created_at
      )
      SELECT 
        v_postnord_id, v_consumer_id, order_id,
        CASE WHEN i <= 25 THEN 4 + (RANDOM() * 1)::INTEGER ELSE 3 + (RANDOM() * 1)::INTEGER END,
        'Good service, reliable delivery',
        CASE WHEN i <= 25 THEN 4 + (RANDOM() * 1)::INTEGER ELSE 3 END,
        5, 4, TRUE,
        NOW() - (i || ' days')::INTERVAL
      FROM orders WHERE courier_id = v_postnord_id LIMIT 1 OFFSET (i-1);
    END LOOP;
  END IF;

  -- Create sample orders for DHL (90% on-time, 98% completion)
  IF v_dhl_id IS NOT NULL THEN
    FOR i IN 1..60 LOOP
      INSERT INTO orders (
        merchant_id, courier_id, consumer_id,
        tracking_number, order_number, store_name,
        pickup_address, delivery_address,
        pickup_city, pickup_country, pickup_postal_code,
        city, country, postal_code,
        order_status, order_date, delivery_date,
        on_time, completed
      ) VALUES (
        v_merchant_id, v_dhl_id, v_consumer_id,
        'DHL' || LPAD(i::TEXT, 10, '0'),
        'ORD-DHL-' || i,
        'Test Store',
        'Warehouse Street 1',
        'Customer Street ' || i,
        'Stockholm', 'Sweden', '11122',
        'Gothenburg', 'Sweden', '41' || LPAD(i::TEXT, 3, '0'),
        CASE WHEN i <= 58 THEN 'delivered' ELSE 'in_transit' END,
        NOW() - (i || ' days')::INTERVAL,
        CASE WHEN i <= 58 THEN NOW() - ((i-2) || ' days')::INTERVAL ELSE NULL END,
        CASE WHEN i <= 54 THEN TRUE ELSE FALSE END,
        CASE WHEN i <= 58 THEN TRUE ELSE FALSE END
      );
    END LOOP;
    
    -- Add reviews for DHL
    FOR i IN 1..40 LOOP
      INSERT INTO reviews (
        courier_id, consumer_id, order_id,
        rating, review_text, delivery_speed, package_condition, communication,
        is_verified, created_at
      )
      SELECT 
        v_dhl_id, v_consumer_id, order_id,
        4 + (RANDOM() * 1)::INTEGER,
        'Excellent service, fast delivery',
        5, 5, 4, TRUE,
        NOW() - (i || ' days')::INTERVAL
      FROM orders WHERE courier_id = v_dhl_id LIMIT 1 OFFSET (i-1);
    END LOOP;
  END IF;

  -- Create sample orders for Bring (80% on-time, 92% completion)
  IF v_bring_id IS NOT NULL THEN
    FOR i IN 1..45 LOOP
      INSERT INTO orders (
        merchant_id, courier_id, consumer_id,
        tracking_number, order_number, store_name,
        pickup_address, delivery_address,
        pickup_city, pickup_country, pickup_postal_code,
        city, country, postal_code,
        order_status, order_date, delivery_date,
        on_time, completed
      ) VALUES (
        v_merchant_id, v_bring_id, v_consumer_id,
        'BRING' || LPAD(i::TEXT, 10, '0'),
        'ORD-BRING-' || i,
        'Test Store',
        'Warehouse Street 1',
        'Customer Street ' || i,
        'Oslo', 'Norway', '0150',
        'Bergen', 'Norway', '50' || LPAD(i::TEXT, 2, '0'),
        CASE WHEN i <= 41 THEN 'delivered' ELSE 'in_transit' END,
        NOW() - (i || ' days')::INTERVAL,
        CASE WHEN i <= 41 THEN NOW() - ((i-2) || ' days')::INTERVAL ELSE NULL END,
        CASE WHEN i <= 36 THEN TRUE ELSE FALSE END,
        CASE WHEN i <= 41 THEN TRUE ELSE FALSE END
      );
    END LOOP;
    
    -- Add reviews for Bring
    FOR i IN 1..25 LOOP
      INSERT INTO reviews (
        courier_id, consumer_id, order_id,
        rating, review_text, delivery_speed, package_condition, communication,
        is_verified, created_at
      )
      SELECT 
        v_bring_id, v_consumer_id, order_id,
        3 + (RANDOM() * 2)::INTEGER,
        'Decent service, sometimes delayed',
        3 + (RANDOM() * 1)::INTEGER, 4, 3, TRUE,
        NOW() - (i || ' days')::INTERVAL
      FROM orders WHERE courier_id = v_bring_id LIMIT 1 OFFSET (i-1);
    END LOOP;
  END IF;

  -- Create sample orders for Budbee (88% on-time, 96% completion)
  IF v_budbee_id IS NOT NULL THEN
    FOR i IN 1..55 LOOP
      INSERT INTO orders (
        merchant_id, courier_id, consumer_id,
        tracking_number, order_number, store_name,
        pickup_address, delivery_address,
        pickup_city, pickup_country, pickup_postal_code,
        city, country, postal_code,
        order_status, order_date, delivery_date,
        on_time, completed
      ) VALUES (
        v_merchant_id, v_budbee_id, v_consumer_id,
        'BUD' || LPAD(i::TEXT, 10, '0'),
        'ORD-BUD-' || i,
        'Test Store',
        'Warehouse Street 1',
        'Customer Street ' || i,
        'Stockholm', 'Sweden', '11122',
        'Malmö', 'Sweden', '21' || LPAD(i::TEXT, 3, '0'),
        CASE WHEN i <= 53 THEN 'delivered' ELSE 'in_transit' END,
        NOW() - (i || ' days')::INTERVAL,
        CASE WHEN i <= 53 THEN NOW() - ((i-2) || ' days')::INTERVAL ELSE NULL END,
        CASE WHEN i <= 48 THEN TRUE ELSE FALSE END,
        CASE WHEN i <= 53 THEN TRUE ELSE FALSE END
      );
    END LOOP;
    
    -- Add reviews for Budbee
    FOR i IN 1..35 LOOP
      INSERT INTO reviews (
        courier_id, consumer_id, order_id,
        rating, review_text, delivery_speed, package_condition, communication,
        is_verified, created_at
      )
      SELECT 
        v_budbee_id, v_consumer_id, order_id,
        4 + (RANDOM() * 1)::INTEGER,
        'Great service, love the time window',
        4 + (RANDOM() * 1)::INTEGER, 5, 5, TRUE,
        NOW() - (i || ' days')::INTERVAL
      FROM orders WHERE courier_id = v_budbee_id LIMIT 1 OFFSET (i-1);
    END LOOP;
  END IF;

  RAISE NOTICE 'Sample data created successfully!';
END $$;

-- =====================================================
-- 2. RECALCULATE TRUSTSCORES
-- =====================================================

-- This will trigger the TrustScore calculation for all couriers
UPDATE couriers SET updated_at = NOW();

-- Success message
SELECT 
  'Sample data seeded successfully!' as status,
  COUNT(*) as total_orders
FROM orders;

SELECT 
  'Reviews created!' as status,
  COUNT(*) as total_reviews
FROM reviews;
