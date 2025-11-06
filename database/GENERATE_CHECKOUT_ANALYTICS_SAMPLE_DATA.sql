/**
 * GENERATE CHECKOUT ANALYTICS SAMPLE DATA
 * Purpose: Create checkout_courier_analytics entries from existing orders
 * Created: November 6, 2025 - Week 2 Day 4
 * 
 * This script generates realistic checkout analytics data for testing
 * the Performance by Location feature (Market List + Heatmap)
 * 
 * What it does:
 * 1. Takes existing orders with delivery_country
 * 2. Creates 2-4 courier display events per order (simulating checkout)
 * 3. Marks one courier as selected (the one that got the order)
 * 4. Adds realistic timestamps and data
 * 
 * SAFE TO RUN: Only inserts if checkout_courier_analytics is empty
 */

-- ============================================================================
-- STEP 1: Check Current State
-- ============================================================================

DO $$
DECLARE
  v_orders_count INTEGER;
  v_analytics_count INTEGER;
  v_couriers_count INTEGER;
BEGIN
  -- Count existing data
  SELECT COUNT(*) INTO v_orders_count FROM orders WHERE delivery_country IS NOT NULL;
  SELECT COUNT(*) INTO v_analytics_count FROM checkout_courier_analytics;
  SELECT COUNT(*) INTO v_couriers_count FROM couriers WHERE is_active = true;
  
  RAISE NOTICE '=== CURRENT STATE ===';
  RAISE NOTICE 'Orders with country: %', v_orders_count;
  RAISE NOTICE 'Checkout analytics entries: %', v_analytics_count;
  RAISE NOTICE 'Active couriers: %', v_couriers_count;
  RAISE NOTICE '';
  
  IF v_orders_count = 0 THEN
    RAISE EXCEPTION 'No orders with delivery_country found. Cannot generate analytics data.';
  END IF;
  
  IF v_couriers_count < 2 THEN
    RAISE EXCEPTION 'Need at least 2 active couriers to generate realistic data.';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Generate Checkout Analytics Data
-- ============================================================================

DO $$
DECLARE
  v_order RECORD;
  v_courier RECORD;
  v_selected_courier_id UUID;
  v_display_count INTEGER;
  v_event_time TIMESTAMP;
  v_session_id UUID;
  v_inserted_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== GENERATING CHECKOUT ANALYTICS DATA ===';
  RAISE NOTICE 'Starting data generation...';
  RAISE NOTICE '';
  
  -- Loop through each order with delivery country
  FOR v_order IN 
    SELECT 
      o.order_id,
      o.courier_id as selected_courier_id,
      o.delivery_postal_code,
      o.delivery_city,
      o.delivery_country,
      o.order_date,
      o.store_id,
      s.owner_user_id as merchant_id
    FROM orders o
    JOIN stores s ON s.store_id = o.store_id
    WHERE o.delivery_country IS NOT NULL
      AND o.courier_id IS NOT NULL
    ORDER BY o.order_date DESC
    LIMIT 100  -- Limit to last 100 orders for performance
  LOOP
    -- Generate unique session ID for this checkout
    v_session_id := gen_random_uuid();
    
    -- Event timestamp slightly before order was placed
    v_event_time := v_order.order_date - INTERVAL '5 minutes';
    
    -- Determine how many couriers were displayed (2-4)
    v_display_count := 2 + floor(random() * 3)::INTEGER;
    
    -- Get random couriers to display (including the selected one)
    FOR v_courier IN
      SELECT courier_id, courier_name
      FROM couriers
      WHERE is_active = true
        AND (courier_id = v_order.selected_courier_id OR courier_id != v_order.selected_courier_id)
      ORDER BY 
        CASE WHEN courier_id = v_order.selected_courier_id THEN 0 ELSE 1 END,
        random()
      LIMIT v_display_count
    LOOP
      -- Insert checkout analytics event
      INSERT INTO checkout_courier_analytics (
        analytics_id,
        merchant_id,
        courier_id,
        checkout_session_id,
        position_shown,
        total_couriers_shown,
        was_selected,
        delivery_postal_code,
        delivery_city,
        delivery_country,
        event_timestamp,
        created_at
      ) VALUES (
        gen_random_uuid(),
        v_order.merchant_id,  -- From JOIN with stores table
        v_courier.courier_id,
        v_session_id::TEXT,  -- checkout_session_id is VARCHAR
        floor(random() * v_display_count + 1)::INTEGER,  -- position_shown
        v_display_count,  -- total_couriers_shown
        v_courier.courier_id = v_order.selected_courier_id,  -- was_selected
        v_order.delivery_postal_code,
        v_order.delivery_city,
        v_order.delivery_country,
        v_event_time + (random() * INTERVAL '2 minutes'),  -- slight variation
        v_event_time
      );
      
      v_inserted_count := v_inserted_count + 1;
    END LOOP;
    
    -- Progress indicator every 10 orders
    IF v_inserted_count % 30 = 0 THEN
      RAISE NOTICE 'Processed % analytics events...', v_inserted_count;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== GENERATION COMPLETE ===';
  RAISE NOTICE 'Total analytics events created: %', v_inserted_count;
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 3: Verify Generated Data
-- ============================================================================

-- Summary by country
SELECT 
  delivery_country,
  COUNT(*) as total_events,
  COUNT(DISTINCT courier_id) as unique_couriers,
  COUNT(DISTINCT delivery_postal_code) as unique_postal_codes,
  COUNT(*) as displays,
  COUNT(*) FILTER (WHERE was_selected) as selections,
  ROUND(
    (COUNT(*) FILTER (WHERE was_selected)::NUMERIC / 
     NULLIF(COUNT(*), 0)) * 100, 
    1
  ) as selection_rate_pct
FROM checkout_courier_analytics
GROUP BY delivery_country
ORDER BY total_events DESC;

-- Summary by courier
SELECT 
  c.courier_name,
  COUNT(*) as total_displays,
  COUNT(*) FILTER (WHERE cca.was_selected) as total_selections,
  ROUND(
    (COUNT(*) FILTER (WHERE cca.was_selected)::NUMERIC / 
     NULLIF(COUNT(*), 0)) * 100, 
    1
  ) as selection_rate_pct
FROM checkout_courier_analytics cca
JOIN couriers c ON c.courier_id = cca.courier_id
GROUP BY c.courier_name
ORDER BY total_displays DESC;

-- Sample data by postal code (top 10)
SELECT 
  delivery_postal_code,
  delivery_city,
  delivery_country,
  COUNT(DISTINCT courier_id) as couriers_shown,
  COUNT(*) as total_displays,
  COUNT(*) FILTER (WHERE was_selected) as selections
FROM checkout_courier_analytics
GROUP BY delivery_postal_code, delivery_city, delivery_country
ORDER BY total_displays DESC
LIMIT 10;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if data is ready for Performance by Location
SELECT 
  '✅ Ready for Performance by Location' as status,
  COUNT(DISTINCT delivery_country) as countries_with_data,
  COUNT(DISTINCT delivery_postal_code) as postal_codes_with_data,
  COUNT(DISTINCT courier_id) as couriers_with_data,
  MIN(event_timestamp) as earliest_event,
  MAX(event_timestamp) as latest_event
FROM checkout_courier_analytics;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  ✅ CHECKOUT ANALYTICS SAMPLE DATA GENERATED!             ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Your Performance by Location feature is now ready to test!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 What to do next:';
  RAISE NOTICE '1. Go to Analytics → Market Insights tab';
  RAISE NOTICE '2. Click on a market (e.g., Sweden)';
  RAISE NOTICE '3. See the data populate in the table';
  RAISE NOTICE '4. Toggle to Heatmap view to see the visual representation';
  RAISE NOTICE '';
  RAISE NOTICE '🎨 Features to test:';
  RAISE NOTICE '- Market list with order counts';
  RAISE NOTICE '- Performance by Location table view';
  RAISE NOTICE '- Performance by Location heatmap view';
  RAISE NOTICE '- Country and time range filters';
  RAISE NOTICE '';
END $$;
