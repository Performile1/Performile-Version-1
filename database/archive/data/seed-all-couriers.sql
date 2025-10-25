-- =====================================================
-- Seed Data for ALL Existing Couriers
-- =====================================================
-- Creates 40 orders + 25 reviews for EACH active courier
-- Uses your existing couriers from the database
-- =====================================================

DO $$
DECLARE
  v_store_id UUID;
  v_consumer_id UUID;
  v_courier_id UUID;
  v_order_id UUID;
  v_courier_name TEXT;
  v_courier_count INTEGER := 0;
  i INTEGER;
BEGIN
  RAISE NOTICE '=== Starting seed process ===';
  
  -- Get or create store
  SELECT store_id INTO v_store_id FROM stores LIMIT 1;
  IF v_store_id IS NULL THEN
    DECLARE
      v_merchant_id UUID;
    BEGIN
      SELECT user_id INTO v_merchant_id FROM users WHERE user_role = 'merchant' LIMIT 1;
      IF v_merchant_id IS NULL THEN
        INSERT INTO users (email, password_hash, first_name, last_name, user_role, is_active)
        VALUES ('demo@merchant.com', '$2a$10$abcdefghijklmnopqrstuv', 'Demo', 'Merchant', 'merchant', TRUE)
        RETURNING user_id INTO v_merchant_id;
        RAISE NOTICE 'Created demo merchant';
      END IF;
      
      INSERT INTO stores (store_name, owner_user_id, is_active)
      VALUES ('Demo Store', v_merchant_id, TRUE)
      RETURNING store_id INTO v_store_id;
      RAISE NOTICE 'Created demo store';
    END;
  ELSE
    RAISE NOTICE 'Using existing store: %', v_store_id;
  END IF;
  
  -- Get or create consumer
  SELECT user_id INTO v_consumer_id FROM users WHERE user_role = 'consumer' LIMIT 1;
  IF v_consumer_id IS NULL THEN
    INSERT INTO users (email, password_hash, first_name, last_name, user_role, is_active)
    VALUES ('demo@consumer.com', '$2a$10$abcdefghijklmnopqrstuv', 'Demo', 'Customer', 'consumer', TRUE)
    RETURNING user_id INTO v_consumer_id;
    RAISE NOTICE 'Created demo consumer';
  ELSE
    RAISE NOTICE 'Using existing consumer: %', v_consumer_id;
  END IF;
  
  RAISE NOTICE '=== Creating orders for each courier ===';
  
  -- Loop through ALL active couriers (not just LIMIT 10)
  FOR v_courier_id, v_courier_name IN 
    SELECT courier_id, courier_name FROM couriers WHERE is_active = TRUE
  LOOP
    v_courier_count := v_courier_count + 1;
    RAISE NOTICE 'Processing courier %: %', v_courier_count, v_courier_name;
    
    -- Create 40 orders per courier
    FOR i IN 1..40 LOOP
      BEGIN
        INSERT INTO orders (
          store_id, courier_id, customer_id,
          tracking_number, order_number,
          delivery_address, postal_code, country,
          order_status, order_date, delivery_date
        ) VALUES (
          v_store_id, v_courier_id, v_consumer_id,
          -- Make tracking number unique per courier
          SUBSTRING(v_courier_name FROM 1 FOR 3) || '-' || v_courier_id::text || '-' || LPAD(i::TEXT, 5, '0'),
          -- Make order number unique per courier
          'ORD-' || SUBSTRING(v_courier_name FROM 1 FOR 3) || '-' || v_courier_id::text || '-' || i,
          'Test Address ' || i || ', Stockholm',
          '11' || LPAD(i::TEXT, 3, '0'),
          'SWE',
          CASE 
            WHEN i <= 35 THEN 'delivered'
            WHEN i <= 38 THEN 'in_transit'
            ELSE 'pending'
          END,
          NOW() - (i || ' days')::INTERVAL,
          CASE WHEN i <= 35 THEN NOW() - ((i-1) || ' days')::INTERVAL ELSE NULL END
        )
        RETURNING order_id INTO v_order_id;
        
        -- Add review for delivered orders (70% review rate)
        IF i <= 35 AND i % 3 != 0 THEN
          INSERT INTO reviews (
            order_id,
            rating,
            review_text
          ) VALUES (
            v_order_id,
            3 + (RANDOM() * 2)::DECIMAL,
            'Good service, delivery was smooth'
          );
        END IF;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error creating order % for %: %', i, v_courier_name, SQLERRM;
      END;
    END LOOP;
    
    RAISE NOTICE 'Created 40 orders for %', v_courier_name;
  END LOOP;
  
  RAISE NOTICE '=== Seed process complete ===';
  RAISE NOTICE 'Total couriers processed: %', v_courier_count;
END $$;

-- Refresh analytics cache
SELECT refresh_courier_analytics();
SELECT refresh_platform_analytics();

-- Show results
SELECT 
  'Seed completed!' as status,
  (SELECT COUNT(*) FROM couriers WHERE is_active = TRUE) as total_couriers,
  (SELECT COUNT(*) FROM orders) as total_orders,
  (SELECT COUNT(*) FROM reviews) as total_reviews,
  (SELECT COUNT(*) FROM courier_analytics WHERE total_orders > 0) as couriers_with_data;

-- Show top 5 couriers by TrustScore
SELECT 
  courier_name,
  total_orders,
  delivered_orders,
  total_reviews,
  avg_rating,
  trust_score
FROM courier_analytics
ORDER BY trust_score DESC
LIMIT 5;
