-- =====================================================
-- Simple Sample Data Seeding
-- =====================================================
-- Creates realistic orders and reviews for testing
-- =====================================================

DO $$
DECLARE
  v_store_id UUID;
  v_consumer_id UUID;
  v_courier_id UUID;
  v_order_id UUID;
  v_courier_name TEXT;
  i INTEGER;
BEGIN
  -- Get or create store
  SELECT store_id INTO v_store_id FROM stores LIMIT 1;
  IF v_store_id IS NULL THEN
    INSERT INTO stores (store_name, store_url, is_active)
    VALUES ('Demo Store', 'https://demostore.com', TRUE)
    RETURNING store_id INTO v_store_id;
  END IF;
  
  -- Get or create consumer (not needed for orders, just for reference)
  SELECT user_id INTO v_consumer_id FROM users WHERE user_role = 'consumer' LIMIT 1;
  IF v_consumer_id IS NULL THEN
    INSERT INTO users (email, password_hash, first_name, last_name, user_role, is_active)
    VALUES ('demo@consumer.com', '$2a$10$abcdefghijklmnopqrstuv', 'Demo', 'Customer', 'consumer', TRUE)
    RETURNING user_id INTO v_consumer_id;
  END IF;
  
  -- Loop through each courier and create orders
  FOR v_courier_id, v_courier_name IN 
    SELECT courier_id, courier_name FROM couriers WHERE is_active = TRUE LIMIT 10
  LOOP
    -- Create 20-50 orders per courier
    FOR i IN 1..40 LOOP
      INSERT INTO orders (
        store_id, courier_id,
        tracking_number, order_number,
        delivery_address,
        order_status, order_date, delivery_date
      ) VALUES (
        v_store_id, v_courier_id,
        SUBSTRING(v_courier_name FROM 1 FOR 3) || LPAD(i::TEXT, 10, '0'),
        'ORD-' || SUBSTRING(v_courier_name FROM 1 FOR 3) || '-' || i,
        'Test Address ' || i || ', Stockholm, Sweden',
        CASE 
          WHEN i <= 35 THEN 'delivered'::order_status
          WHEN i <= 38 THEN 'in_transit'::order_status
          ELSE 'pending'::order_status
        END,
        NOW() - (i || ' days')::INTERVAL,
        CASE WHEN i <= 35 THEN NOW() - ((i-1) || ' days')::INTERVAL ELSE NULL END
      )
      RETURNING order_id INTO v_order_id;
      
      -- Add review for delivered orders (70% review rate)
      IF i <= 35 AND i % 3 != 0 THEN
        INSERT INTO reviews (
          order_id, courier_id,
          rating, review_text,
          delivery_speed, package_condition, communication,
          is_verified, created_at
        ) VALUES (
          v_order_id, v_courier_id,
          3 + (RANDOM() * 2)::INTEGER, -- Random rating 3-5
          'Good service overall',
          3 + (RANDOM() * 2)::INTEGER,
          4 + (RANDOM() * 1)::INTEGER,
          3 + (RANDOM() * 2)::INTEGER,
          TRUE,
          NOW() - ((i-1) || ' days')::INTERVAL
        );
      END IF;
    END LOOP;
    
    RAISE NOTICE 'Created 40 orders for %', v_courier_name;
  END LOOP;
  
  RAISE NOTICE 'Sample data created successfully!';
END $$;

-- Update courier stats
UPDATE couriers SET updated_at = NOW();

-- Show results
SELECT 
  'Sample data seeded!' as status,
  (SELECT COUNT(*) FROM orders) as total_orders,
  (SELECT COUNT(*) FROM reviews) as total_reviews;
