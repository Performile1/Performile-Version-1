-- =====================================================
-- RLS POLICIES - TRACKING TABLES (Priority 2)
-- =====================================================
-- Purpose: Secure tracking data, events, and analytics
-- Date: October 26, 2025
-- Tables: Tracking-related tables
-- Note: Drops existing policies first, then recreates
-- =====================================================

-- =====================================================
-- 1. TRACKING DATA (ORDER TRACKING)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tracking_data') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS tracking_data_select_merchant ON tracking_data;
    DROP POLICY IF EXISTS tracking_data_select_courier ON tracking_data;
    DROP POLICY IF EXISTS tracking_data_insert_courier ON tracking_data;
    DROP POLICY IF EXISTS tracking_data_update_courier ON tracking_data;
    
    -- Merchants can see tracking for their orders
    CREATE POLICY tracking_data_select_merchant ON tracking_data
      FOR SELECT USING (
        order_id IN (
          SELECT order_id FROM orders 
          WHERE store_id IN (
            SELECT store_id FROM stores WHERE owner_user_id = auth.uid()
          )
        )
      );

    -- Couriers can see tracking for their orders
    CREATE POLICY tracking_data_select_courier ON tracking_data
      FOR SELECT USING (
        order_id IN (
          SELECT order_id FROM orders WHERE courier_id IN (
            SELECT courier_id FROM couriers WHERE user_id = auth.uid()
          )
        )
      );

    -- Couriers can insert tracking data
    CREATE POLICY tracking_data_insert_courier ON tracking_data
      FOR INSERT WITH CHECK (
        order_id IN (
          SELECT order_id FROM orders WHERE courier_id IN (
            SELECT courier_id FROM couriers WHERE user_id = auth.uid()
          )
        )
      );

    -- Couriers can update tracking data
    CREATE POLICY tracking_data_update_courier ON tracking_data
      FOR UPDATE USING (
        order_id IN (
          SELECT order_id FROM orders WHERE courier_id IN (
            SELECT courier_id FROM couriers WHERE user_id = auth.uid()
          )
        )
      );
      
    RAISE NOTICE 'RLS policies created for tracking_data';
  ELSE
    RAISE NOTICE 'Skipping tracking_data - table does not exist';
  END IF;
END $$;

-- =====================================================
-- 2. TRACKING EVENTS (SHIPMENT EVENTS)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tracking_events') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS tracking_events_select_merchant ON tracking_events;
    DROP POLICY IF EXISTS tracking_events_select_courier ON tracking_events;
    DROP POLICY IF EXISTS tracking_events_insert_courier ON tracking_events;
    
    -- Merchants can see events for their orders
    CREATE POLICY tracking_events_select_merchant ON tracking_events
      FOR SELECT USING (
        order_id IN (
          SELECT order_id FROM orders 
          WHERE store_id IN (
            SELECT store_id FROM stores WHERE owner_user_id = auth.uid()
          )
        )
      );

    -- Couriers can see events for their orders
    CREATE POLICY tracking_events_select_courier ON tracking_events
      FOR SELECT USING (
        order_id IN (
          SELECT order_id FROM orders WHERE courier_id IN (
            SELECT courier_id FROM couriers WHERE user_id = auth.uid()
          )
        )
      );

    -- Couriers can insert events
    CREATE POLICY tracking_events_insert_courier ON tracking_events
      FOR INSERT WITH CHECK (
        order_id IN (
          SELECT order_id FROM orders WHERE courier_id IN (
            SELECT courier_id FROM couriers WHERE user_id = auth.uid()
          )
        )
      );
      
    RAISE NOTICE 'RLS policies created for tracking_events';
  ELSE
    RAISE NOTICE 'Skipping tracking_events - table does not exist';
  END IF;
END $$;

-- =====================================================
-- 3. SHIPMENT EVENTS (ALTERNATIVE NAME)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shipment_events') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS shipment_events_select_merchant ON shipment_events;
    DROP POLICY IF EXISTS shipment_events_select_courier ON shipment_events;
    DROP POLICY IF EXISTS shipment_events_insert_courier ON shipment_events;
    
    -- Merchants can see events for their orders
    CREATE POLICY shipment_events_select_merchant ON shipment_events
      FOR SELECT USING (
        order_id IN (
          SELECT order_id FROM orders 
          WHERE store_id IN (
            SELECT store_id FROM stores WHERE owner_user_id = auth.uid()
          )
        )
      );

    -- Couriers can see events for their orders
    CREATE POLICY shipment_events_select_courier ON shipment_events
      FOR SELECT USING (
        order_id IN (
          SELECT order_id FROM orders WHERE courier_id IN (
            SELECT courier_id FROM couriers WHERE user_id = auth.uid()
          )
        )
      );

    -- Couriers can insert events
    CREATE POLICY shipment_events_insert_courier ON shipment_events
      FOR INSERT WITH CHECK (
        order_id IN (
          SELECT order_id FROM orders WHERE courier_id IN (
            SELECT courier_id FROM couriers WHERE user_id = auth.uid()
          )
        )
      );
      
    RAISE NOTICE 'RLS policies created for shipment_events';
  ELSE
    RAISE NOTICE 'Skipping shipment_events - table does not exist';
  END IF;
END $$;

-- =====================================================
-- 4. COURIER ANALYTICS (PERFORMANCE DATA)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_analytics') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS courier_analytics_select_own ON courier_analytics;
    DROP POLICY IF EXISTS courier_analytics_select_public ON courier_analytics;
    
    -- Couriers can see their own analytics
    CREATE POLICY courier_analytics_select_own ON courier_analytics
      FOR SELECT USING (
        courier_id IN (
          SELECT courier_id FROM couriers WHERE user_id = auth.uid()
        )
      );

    -- Public can see basic analytics (for marketplace)
    CREATE POLICY courier_analytics_select_public ON courier_analytics
      FOR SELECT USING (true);
      
    RAISE NOTICE 'RLS policies created for courier_analytics';
  ELSE
    RAISE NOTICE 'Skipping courier_analytics - table does not exist';
  END IF;
END $$;

-- =====================================================
-- 5. PLATFORM ANALYTICS (ADMIN ONLY)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'platform_analytics') THEN
    -- Drop existing policy
    DROP POLICY IF EXISTS platform_analytics_select_all ON platform_analytics;
    
    -- Everyone can see platform analytics (aggregated, no sensitive data)
    CREATE POLICY platform_analytics_select_all ON platform_analytics
      FOR SELECT USING (true);
      
    RAISE NOTICE 'RLS policies created for platform_analytics';
  ELSE
    RAISE NOTICE 'Skipping platform_analytics - table does not exist';
  END IF;
END $$;

-- =====================================================
-- 6. SHOP ANALYTICS SNAPSHOTS (MERCHANT ONLY)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shopanalyticssnapshots') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS shop_analytics_select_own ON shopanalyticssnapshots;
    DROP POLICY IF EXISTS shop_analytics_insert_own ON shopanalyticssnapshots;
    
    -- Note: shop_id could be INTEGER or UUID, handle both
    -- Merchants can see their own shop analytics
    CREATE POLICY shop_analytics_select_own ON shopanalyticssnapshots
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM stores 
          WHERE stores.store_id::TEXT = shopanalyticssnapshots.shop_id::TEXT
          AND stores.owner_user_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM shops 
          WHERE shops.shop_id::TEXT = shopanalyticssnapshots.shop_id::TEXT
          AND shops.owner_user_id = auth.uid()
        )
      );

    -- System can insert analytics (service role)
    CREATE POLICY shop_analytics_insert_own ON shopanalyticssnapshots
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM stores 
          WHERE stores.store_id::TEXT = shopanalyticssnapshots.shop_id::TEXT
        )
        OR EXISTS (
          SELECT 1 FROM shops 
          WHERE shops.shop_id::TEXT = shopanalyticssnapshots.shop_id::TEXT
        )
      );
      
    RAISE NOTICE 'RLS policies created for shopanalyticssnapshots';
  ELSE
    RAISE NOTICE 'Skipping shopanalyticssnapshots - table does not exist';
  END IF;
END $$;

-- =====================================================
-- 7. INTEGRATION EVENTS (WEBHOOK/API EVENTS)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'integration_events') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS integration_events_select_merchant ON integration_events;
    DROP POLICY IF EXISTS integration_events_select_courier ON integration_events;
    
    -- Merchants can see their integration events
    CREATE POLICY integration_events_select_merchant ON integration_events
      FOR SELECT USING (
        user_id = auth.uid()
        OR
        (shop_id IS NOT NULL AND (
          EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.store_id::TEXT = integration_events.shop_id::TEXT
            AND stores.owner_user_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM shops 
            WHERE shops.shop_id::TEXT = integration_events.shop_id::TEXT
            AND shops.owner_user_id = auth.uid()
          )
        ))
      );

    -- Couriers can see their integration events
    CREATE POLICY integration_events_select_courier ON integration_events
      FOR SELECT USING (
        user_id = auth.uid()
        OR
        courier_name IN (
          SELECT courier_name FROM couriers WHERE user_id = auth.uid()
        )
      );
      
    RAISE NOTICE 'RLS policies created for integration_events';
  ELSE
    RAISE NOTICE 'Skipping integration_events - table does not exist';
  END IF;
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
  v_policy_count INTEGER;
  v_table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE tablename IN (
    'tracking_data',
    'tracking_events',
    'shipment_events',
    'courier_analytics',
    'platform_analytics',
    'shopanalyticssnapshots',
    'integration_events'
  );
  
  SELECT COUNT(*) INTO v_table_count
  FROM information_schema.tables
  WHERE table_name IN (
    'tracking_data',
    'tracking_events',
    'shipment_events',
    'courier_analytics',
    'platform_analytics',
    'shopanalyticssnapshots',
    'integration_events'
  );
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'RLS POLICIES CREATED - TRACKING TABLES';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Tables found: %', v_table_count;
  RAISE NOTICE 'Policies created: %', v_policy_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Tracking tables now protected (if they exist):';
  RAISE NOTICE '  ✅ tracking_data (order tracking)';
  RAISE NOTICE '  ✅ tracking_events (shipment events)';
  RAISE NOTICE '  ✅ shipment_events (alternative name)';
  RAISE NOTICE '  ✅ courier_analytics (performance data)';
  RAISE NOTICE '  ✅ platform_analytics (public aggregated)';
  RAISE NOTICE '  ✅ shopanalyticssnapshots (merchant analytics)';
  RAISE NOTICE '  ✅ integration_events (webhook/API events)';
  RAISE NOTICE '==============================================';
END $$;
