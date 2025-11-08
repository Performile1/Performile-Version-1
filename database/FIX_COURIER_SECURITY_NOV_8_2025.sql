-- ============================================
-- COURIER DATA ISOLATION - SECURITY FIX
-- ============================================
-- Date: November 8, 2025
-- Purpose: Add direct RLS policies for courier data isolation
-- Priority: CRITICAL SECURITY
--
-- WHAT THIS FIXES:
-- 1. Adds direct courier_id filtering to orders table
-- 2. Adds courier isolation to tracking_data
-- 3. Adds courier isolation to courier_analytics
-- 4. Adds courier isolation to reviews
-- 5. Adds validation function for courier access
--
-- HOW TO RUN:
-- 1. Copy this entire file
-- 2. Open Supabase → SQL Editor
-- 3. Paste and click "RUN"
-- ============================================

-- ============================================
-- PART 1: VALIDATION FUNCTION
-- ============================================

-- Function to validate courier can only access their data
CREATE OR REPLACE FUNCTION validate_courier_access(
  p_courier_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM couriers 
    WHERE courier_id = p_courier_id 
    AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_courier_access IS 'Validates that a user can only access their own courier data';

-- ============================================
-- PART 2: ORDERS TABLE - COURIER RLS POLICY
-- ============================================

-- Drop existing courier policy if exists
DROP POLICY IF EXISTS orders_courier_select ON orders;
DROP POLICY IF EXISTS orders_courier_update ON orders;

-- Courier can only SELECT their orders
CREATE POLICY orders_courier_select ON orders
FOR SELECT 
TO authenticated
USING (
  -- Check if user is a courier
  (auth.jwt() ->> 'role' = 'courier' OR auth.jwt() ->> 'user_role' = 'courier')
  AND 
  -- Check if order belongs to this courier
  courier_id IN (
    SELECT courier_id FROM couriers WHERE user_id = auth.uid()
  )
);

-- Courier can only UPDATE their orders (status, tracking, etc.)
CREATE POLICY orders_courier_update ON orders
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() ->> 'role' = 'courier' OR auth.jwt() ->> 'user_role' = 'courier')
  AND 
  courier_id IN (
    SELECT courier_id FROM couriers WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  (auth.jwt() ->> 'role' = 'courier' OR auth.jwt() ->> 'user_role' = 'courier')
  AND 
  courier_id IN (
    SELECT courier_id FROM couriers WHERE user_id = auth.uid()
  )
);

-- ============================================
-- PART 3: TRACKING_DATA - COURIER RLS POLICY
-- ============================================

-- Check if tracking_data table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tracking_data') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS tracking_data_courier_select ON tracking_data;
    DROP POLICY IF EXISTS tracking_data_courier_insert ON tracking_data;
    DROP POLICY IF EXISTS tracking_data_courier_update ON tracking_data;

    -- Courier can only see their tracking data
    EXECUTE 'CREATE POLICY tracking_data_courier_select ON tracking_data
    FOR SELECT
    TO authenticated
    USING (
      (auth.jwt() ->> ''role'' = ''courier'' OR auth.jwt() ->> ''user_role'' = ''courier'')
      AND 
      order_id IN (
        SELECT order_id FROM orders 
        WHERE courier_id IN (
          SELECT courier_id FROM couriers WHERE user_id = auth.uid()
        )
      )
    )';

    -- Courier can insert tracking data for their orders
    EXECUTE 'CREATE POLICY tracking_data_courier_insert ON tracking_data
    FOR INSERT
    TO authenticated
    WITH CHECK (
      (auth.jwt() ->> ''role'' = ''courier'' OR auth.jwt() ->> ''user_role'' = ''courier'')
      AND 
      order_id IN (
        SELECT order_id FROM orders 
        WHERE courier_id IN (
          SELECT courier_id FROM couriers WHERE user_id = auth.uid()
        )
      )
    )';

    -- Courier can update tracking data for their orders
    EXECUTE 'CREATE POLICY tracking_data_courier_update ON tracking_data
    FOR UPDATE
    TO authenticated
    USING (
      (auth.jwt() ->> ''role'' = ''courier'' OR auth.jwt() ->> ''user_role'' = ''courier'')
      AND 
      order_id IN (
        SELECT order_id FROM orders 
        WHERE courier_id IN (
          SELECT courier_id FROM couriers WHERE user_id = auth.uid()
        )
      )
    )';

    RAISE NOTICE 'RLS policies created for tracking_data';
  ELSE
    RAISE NOTICE 'Skipping tracking_data - table does not exist';
  END IF;
END $$;

-- ============================================
-- PART 4: COURIER_ANALYTICS - COURIER RLS POLICY
-- ============================================

-- Drop existing policy
DROP POLICY IF EXISTS courier_analytics_courier_select ON courier_analytics;
DROP POLICY IF EXISTS courier_analytics_courier_update ON courier_analytics;

-- Courier can only see their own analytics
CREATE POLICY courier_analytics_courier_select ON courier_analytics
FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'role' = 'courier' OR auth.jwt() ->> 'user_role' = 'courier')
  AND 
  courier_id IN (
    SELECT courier_id FROM couriers WHERE user_id = auth.uid()
  )
);

-- Courier can update their own analytics (if needed)
CREATE POLICY courier_analytics_courier_update ON courier_analytics
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() ->> 'role' = 'courier' OR auth.jwt() ->> 'user_role' = 'courier')
  AND 
  courier_id IN (
    SELECT courier_id FROM couriers WHERE user_id = auth.uid()
  )
);

-- ============================================
-- PART 5: REVIEWS - COURIER RLS POLICY
-- ============================================

-- Drop existing policy
DROP POLICY IF EXISTS reviews_courier_select ON reviews;

-- Courier can only see reviews about them
CREATE POLICY reviews_courier_select ON reviews
FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'role' = 'courier' OR auth.jwt() ->> 'user_role' = 'courier')
  AND 
  courier_id IN (
    SELECT courier_id FROM couriers WHERE user_id = auth.uid()
  )
);

-- ============================================
-- PART 6: TRACKING_EVENTS - COURIER RLS POLICY
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tracking_events') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS tracking_events_courier_select ON tracking_events;
    DROP POLICY IF EXISTS tracking_events_courier_insert ON tracking_events;

    -- Courier can only see their tracking events
    EXECUTE 'CREATE POLICY tracking_events_courier_select ON tracking_events
    FOR SELECT
    TO authenticated
    USING (
      (auth.jwt() ->> ''role'' = ''courier'' OR auth.jwt() ->> ''user_role'' = ''courier'')
      AND 
      tracking_id IN (
        SELECT tracking_id FROM tracking_data 
        WHERE order_id IN (
          SELECT order_id FROM orders 
          WHERE courier_id IN (
            SELECT courier_id FROM couriers WHERE user_id = auth.uid()
          )
        )
      )
    )';

    -- Courier can insert tracking events for their orders
    EXECUTE 'CREATE POLICY tracking_events_courier_insert ON tracking_events
    FOR INSERT
    TO authenticated
    WITH CHECK (
      (auth.jwt() ->> ''role'' = ''courier'' OR auth.jwt() ->> ''user_role'' = ''courier'')
      AND 
      tracking_id IN (
        SELECT tracking_id FROM tracking_data 
        WHERE order_id IN (
          SELECT order_id FROM orders 
          WHERE courier_id IN (
            SELECT courier_id FROM couriers WHERE user_id = auth.uid()
          )
        )
      )
    )';

    RAISE NOTICE 'RLS policies created for tracking_events';
  ELSE
    RAISE NOTICE 'Skipping tracking_events - table does not exist';
  END IF;
END $$;

-- ============================================
-- PART 7: COURIER_TRACKING_CACHE - COURIER RLS POLICY
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_tracking_cache') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS courier_tracking_cache_courier_select ON courier_tracking_cache;
    DROP POLICY IF EXISTS courier_tracking_cache_courier_insert ON courier_tracking_cache;
    DROP POLICY IF EXISTS courier_tracking_cache_courier_update ON courier_tracking_cache;

    -- Courier can only see their tracking cache
    EXECUTE 'CREATE POLICY courier_tracking_cache_courier_select ON courier_tracking_cache
    FOR SELECT
    TO authenticated
    USING (
      (auth.jwt() ->> ''role'' = ''courier'' OR auth.jwt() ->> ''user_role'' = ''courier'')
      AND 
      courier_id IN (
        SELECT courier_id FROM couriers WHERE user_id = auth.uid()
      )
    )';

    -- Courier can insert their tracking cache
    EXECUTE 'CREATE POLICY courier_tracking_cache_courier_insert ON courier_tracking_cache
    FOR INSERT
    TO authenticated
    WITH CHECK (
      (auth.jwt() ->> ''role'' = ''courier'' OR auth.jwt() ->> ''user_role'' = ''courier'')
      AND 
      courier_id IN (
        SELECT courier_id FROM couriers WHERE user_id = auth.uid()
      )
    )';

    -- Courier can update their tracking cache
    EXECUTE 'CREATE POLICY courier_tracking_cache_courier_update ON courier_tracking_cache
    FOR UPDATE
    TO authenticated
    USING (
      (auth.jwt() ->> ''role'' = ''courier'' OR auth.jwt() ->> ''user_role'' = ''courier'')
      AND 
      courier_id IN (
        SELECT courier_id FROM couriers WHERE user_id = auth.uid()
      )
    )';

    RAISE NOTICE 'RLS policies created for courier_tracking_cache';
  ELSE
    RAISE NOTICE 'Skipping courier_tracking_cache - table does not exist';
  END IF;
END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check that policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    CASE 
        WHEN cmd = 'r' THEN 'SELECT'
        WHEN cmd = 'a' THEN 'INSERT'
        WHEN cmd = 'w' THEN 'UPDATE'
        WHEN cmd = 'd' THEN 'DELETE'
        ELSE cmd::text
    END as operation,
    roles
FROM pg_policies
WHERE tablename IN ('orders', 'tracking_data', 'courier_analytics', 'reviews', 'tracking_events', 'courier_tracking_cache')
  AND policyname LIKE '%courier%'
ORDER BY tablename, policyname;

-- Check that function was created
SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'validate_courier_access';

-- Summary
SELECT 
    'COURIER SECURITY POLICIES APPLIED' as status,
    COUNT(*) as policies_created,
    NOW() as timestamp
FROM pg_policies
WHERE policyname LIKE '%courier%';
