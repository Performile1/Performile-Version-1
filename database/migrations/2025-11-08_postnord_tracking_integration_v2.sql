-- ============================================================================
-- POSTNORD TRACKING INTEGRATION MIGRATION V2 (UNIFIED ARCHITECTURE)
-- ============================================================================
-- Date: November 8, 2025
-- Purpose: Add courier-agnostic tracking infrastructure
-- Framework: SPEC_DRIVEN_FRAMEWORK v1.20 + UNIFIED PLATFORM ARCHITECTURE
-- Rules: #1 (Validate First), #2 (Never Change Existing), #3 (Conform to Schema)
--
-- ARCHITECTURE: Unified Platform (no courier-specific columns)
-- ✅ Uses courier_metadata JSONB for courier-specific data
-- ✅ Unified tracking cache for all couriers
-- ✅ Unified API request logging for all couriers
--
-- WHAT THIS DOES:
-- ✅ Validates existing tracking infrastructure
-- ✅ Adds courier_metadata JSONB to orders table (if not exists)
-- ✅ Creates courier_tracking_cache table for API responses
-- ✅ Creates courier_api_requests table for logging
-- ✅ Adds indexes for performance
-- ✅ Adds RLS policies
--
-- WHAT THIS DOES NOT DO:
-- ❌ Does NOT add courier-specific columns (postnord_*, bring_*, etc.)
-- ❌ Does NOT create courier-specific tables
-- ❌ Does NOT modify existing tracking_events table
-- ============================================================================

-- ============================================================================
-- STEP 1: VALIDATION - CHECK EXISTING TABLES
-- ============================================================================

DO $$
DECLARE
    table_count INTEGER;
BEGIN
    RAISE NOTICE '=== COURIER TRACKING INTEGRATION VALIDATION ===';
    
    -- Check orders table exists
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'orders';
    
    IF table_count = 0 THEN
        RAISE EXCEPTION '❌ orders table does not exist!';
    ELSE
        RAISE NOTICE '✅ orders table exists';
    END IF;
    
    -- Check tracking_events table exists
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tracking_events';
    
    IF table_count = 0 THEN
        RAISE EXCEPTION '❌ tracking_events table does not exist!';
    ELSE
        RAISE NOTICE '✅ tracking_events table exists';
    END IF;
    
    -- Check courier_api_credentials table exists
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'courier_api_credentials';
    
    IF table_count = 0 THEN
        RAISE EXCEPTION '❌ courier_api_credentials table does not exist!';
    ELSE
        RAISE NOTICE '✅ courier_api_credentials table exists';
    END IF;
    
    -- Check couriers table exists
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'couriers';
    
    IF table_count = 0 THEN
        RAISE EXCEPTION '❌ couriers table does not exist!';
    ELSE
        RAISE NOTICE '✅ couriers table exists';
    END IF;
    
    RAISE NOTICE '✅ All required tables exist - proceeding with migration';
END $$;

-- ============================================================================
-- STEP 2: ADD COURIER_METADATA TO ORDERS TABLE (UNIFIED APPROACH)
-- ============================================================================

-- Add courier_metadata JSONB column for courier-specific data
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS courier_metadata JSONB DEFAULT '{}'::JSONB;

-- Add comment
COMMENT ON COLUMN orders.courier_metadata IS 'Courier-specific metadata (PostNord, Bring, Budbee, etc.) stored as JSONB';

-- Example structure:
-- {
--   "postnord": {
--     "shipment_id": "ABC123",
--     "service_code": "17",
--     "delivery_option_id": "xyz789",
--     "tracking_url": "https://...",
--     "last_update": "2025-11-08T14:00:00Z"
--   },
--   "bring": {
--     "consignment_id": "DEF456",
--     "product_code": "SERVICEPAKKE"
--   }
-- }

-- ============================================================================
-- STEP 3: CREATE COURIER_TRACKING_CACHE TABLE
-- ============================================================================

-- Purpose: Cache tracking responses from courier APIs to reduce API calls
CREATE TABLE IF NOT EXISTS courier_tracking_cache (
    cache_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Tracking identifiers
    courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
    tracking_number VARCHAR(100) NOT NULL,
    order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
    
    -- Cached data
    tracking_response JSONB NOT NULL, -- Full API response
    tracking_status VARCHAR(50),
    estimated_delivery TIMESTAMPTZ,
    last_event_description TEXT,
    last_event_timestamp TIMESTAMPTZ,
    
    -- Cache metadata
    cached_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    cache_hit_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint
    UNIQUE(courier_id, tracking_number)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tracking_cache_tracking_number 
    ON courier_tracking_cache(tracking_number);

CREATE INDEX IF NOT EXISTS idx_tracking_cache_order_id 
    ON courier_tracking_cache(order_id) 
    WHERE order_id IS NOT NULL;

-- Index for non-expired cache entries (no WHERE clause due to NOW() immutability)
CREATE INDEX IF NOT EXISTS idx_tracking_cache_expires 
    ON courier_tracking_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_tracking_cache_courier 
    ON courier_tracking_cache(courier_id, tracking_number);

-- Comments
COMMENT ON TABLE courier_tracking_cache IS 'Caches tracking API responses to reduce API calls (unified for all couriers)';
COMMENT ON COLUMN courier_tracking_cache.tracking_response IS 'Full JSON response from courier API';
COMMENT ON COLUMN courier_tracking_cache.expires_at IS 'When this cache entry expires';
COMMENT ON COLUMN courier_tracking_cache.cache_hit_count IS 'Number of times this cache was used';

-- ============================================================================
-- STEP 4: CREATE COURIER_API_REQUESTS TABLE
-- ============================================================================

-- Purpose: Log all API requests to courier APIs for debugging and monitoring
CREATE TABLE IF NOT EXISTS courier_api_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Request details
    courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
    merchant_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(order_id) ON DELETE SET NULL,
    
    -- API details
    api_endpoint VARCHAR(255) NOT NULL,
    http_method VARCHAR(10) NOT NULL,
    request_body JSONB,
    request_headers JSONB,
    
    -- Response details
    response_status INTEGER,
    response_body JSONB,
    response_time_ms INTEGER,
    
    -- Error tracking
    success BOOLEAN NOT NULL,
    error_message TEXT,
    error_code VARCHAR(50),
    
    -- Tracking context
    tracking_number VARCHAR(100),
    shipment_id VARCHAR(100),
    
    -- Timestamps
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Rate limiting
    rate_limit_remaining INTEGER,
    rate_limit_reset TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_requests_courier 
    ON courier_api_requests(courier_id, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_requests_merchant 
    ON courier_api_requests(merchant_id, requested_at DESC) 
    WHERE merchant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_api_requests_order 
    ON courier_api_requests(order_id) 
    WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_api_requests_tracking 
    ON courier_api_requests(tracking_number) 
    WHERE tracking_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_api_requests_errors 
    ON courier_api_requests(success, requested_at DESC) 
    WHERE success = FALSE;

-- Comments
COMMENT ON TABLE courier_api_requests IS 'Logs all API requests to courier APIs (unified for all couriers)';
COMMENT ON COLUMN courier_api_requests.response_time_ms IS 'API response time in milliseconds';
COMMENT ON COLUMN courier_api_requests.rate_limit_remaining IS 'Remaining API calls from rate limit header';

-- ============================================================================
-- STEP 5: CREATE INDEXES ON ORDERS TABLE
-- ============================================================================

-- Index for courier_metadata JSONB queries
CREATE INDEX IF NOT EXISTS idx_orders_courier_metadata 
    ON orders USING GIN (courier_metadata);

-- ============================================================================
-- STEP 6: CREATE RLS POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE courier_tracking_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE courier_api_requests ENABLE ROW LEVEL SECURITY;

-- Tracking cache policies
DROP POLICY IF EXISTS "Users can view tracking cache" ON courier_tracking_cache;
CREATE POLICY "Users can view tracking cache"
    ON courier_tracking_cache FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM orders o
            LEFT JOIN stores s ON o.store_id = s.store_id
            WHERE o.order_id = courier_tracking_cache.order_id
            AND (
                s.owner_user_id = auth.uid()  -- Merchant owns the store
                OR o.customer_id = auth.uid()  -- Customer placed the order
                OR EXISTS (
                    SELECT 1 FROM users
                    WHERE users.user_id = auth.uid()
                    AND users.user_role IN ('admin', 'courier')
                )
            )
        )
    );

DROP POLICY IF EXISTS "System can manage tracking cache" ON courier_tracking_cache;
CREATE POLICY "System can manage tracking cache"
    ON courier_tracking_cache FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- API requests policies
DROP POLICY IF EXISTS "Merchants can view their API requests" ON courier_api_requests;
CREATE POLICY "Merchants can view their API requests"
    ON courier_api_requests FOR SELECT
    TO authenticated
    USING (
        merchant_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM users
            WHERE users.user_id = auth.uid()
            AND users.user_role = 'admin'
        )
    );

DROP POLICY IF EXISTS "System can log API requests" ON courier_api_requests;
CREATE POLICY "System can log API requests"
    ON courier_api_requests FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============================================================================
-- STEP 7: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to get cached tracking data
CREATE OR REPLACE FUNCTION get_cached_tracking(
    p_courier_id UUID,
    p_tracking_number VARCHAR(100)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cache_record RECORD;
BEGIN
    -- Get cache record if not expired
    SELECT * INTO v_cache_record
    FROM courier_tracking_cache
    WHERE courier_id = p_courier_id
    AND tracking_number = p_tracking_number
    AND expires_at > NOW();
    
    IF FOUND THEN
        -- Increment cache hit count
        UPDATE courier_tracking_cache
        SET cache_hit_count = cache_hit_count + 1,
            updated_at = NOW()
        WHERE cache_id = v_cache_record.cache_id;
        
        RETURN v_cache_record.tracking_response;
    ELSE
        RETURN NULL;
    END IF;
END;
$$;

-- Function to update tracking cache
CREATE OR REPLACE FUNCTION update_tracking_cache(
    p_courier_id UUID,
    p_tracking_number VARCHAR(100),
    p_order_id UUID,
    p_tracking_response JSONB,
    p_tracking_status VARCHAR(50),
    p_estimated_delivery TIMESTAMPTZ,
    p_cache_duration_minutes INTEGER DEFAULT 60
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cache_id UUID;
    v_last_event JSONB;
BEGIN
    -- Extract last event from response (works for most courier APIs)
    v_last_event := p_tracking_response->'events'->0;
    IF v_last_event IS NULL THEN
        v_last_event := p_tracking_response->'TrackingInformationResponse'->'shipments'->0->'items'->0->'events'->0;
    END IF;
    
    -- Insert or update cache
    INSERT INTO courier_tracking_cache (
        courier_id,
        tracking_number,
        order_id,
        tracking_response,
        tracking_status,
        estimated_delivery,
        last_event_description,
        last_event_timestamp,
        expires_at
    ) VALUES (
        p_courier_id,
        p_tracking_number,
        p_order_id,
        p_tracking_response,
        p_tracking_status,
        p_estimated_delivery,
        v_last_event->>'eventDescription',
        (v_last_event->>'eventTime')::TIMESTAMPTZ,
        NOW() + (p_cache_duration_minutes || ' minutes')::INTERVAL
    )
    ON CONFLICT (courier_id, tracking_number)
    DO UPDATE SET
        tracking_response = EXCLUDED.tracking_response,
        tracking_status = EXCLUDED.tracking_status,
        estimated_delivery = EXCLUDED.estimated_delivery,
        last_event_description = EXCLUDED.last_event_description,
        last_event_timestamp = EXCLUDED.last_event_timestamp,
        expires_at = EXCLUDED.expires_at,
        updated_at = NOW()
    RETURNING cache_id INTO v_cache_id;
    
    RETURN v_cache_id;
END;
$$;

-- Function to log API request
CREATE OR REPLACE FUNCTION log_courier_api_request(
    p_courier_id UUID,
    p_merchant_id UUID,
    p_order_id UUID,
    p_api_endpoint VARCHAR(255),
    p_http_method VARCHAR(10),
    p_request_body JSONB,
    p_response_status INTEGER,
    p_response_body JSONB,
    p_response_time_ms INTEGER,
    p_success BOOLEAN,
    p_error_message TEXT DEFAULT NULL,
    p_tracking_number VARCHAR(100) DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_request_id UUID;
BEGIN
    INSERT INTO courier_api_requests (
        courier_id,
        merchant_id,
        order_id,
        api_endpoint,
        http_method,
        request_body,
        response_status,
        response_body,
        response_time_ms,
        success,
        error_message,
        tracking_number
    ) VALUES (
        p_courier_id,
        p_merchant_id,
        p_order_id,
        p_api_endpoint,
        p_http_method,
        p_request_body,
        p_response_status,
        p_response_body,
        p_response_time_ms,
        p_success,
        p_error_message,
        p_tracking_number
    )
    RETURNING request_id INTO v_request_id;
    
    RETURN v_request_id;
END;
$$;

-- ============================================================================
-- STEP 8: VERIFICATION
-- ============================================================================

DO $$
DECLARE
    column_count INTEGER;
    table_count INTEGER;
    index_count INTEGER;
BEGIN
    RAISE NOTICE '=== VERIFICATION ===';
    
    -- Verify courier_metadata column
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'orders'
    AND column_name = 'courier_metadata';
    
    IF column_count = 1 THEN
        RAISE NOTICE '✅ courier_metadata column added to orders table';
    ELSE
        RAISE WARNING '⚠️ courier_metadata column not found in orders table';
    END IF;
    
    -- Verify new tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('courier_tracking_cache', 'courier_api_requests');
    
    IF table_count = 2 THEN
        RAISE NOTICE '✅ New tracking tables created';
    ELSE
        RAISE WARNING '⚠️ Only % of 2 new tables found', table_count;
    END IF;
    
    -- Verify indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE tablename IN ('orders', 'courier_tracking_cache', 'courier_api_requests');
    
    RAISE NOTICE '✅ Created % indexes for tracking', index_count;
    
    -- Verify functions
    SELECT COUNT(*) INTO column_count
    FROM pg_proc
    WHERE proname IN ('get_cached_tracking', 'update_tracking_cache', 'log_courier_api_request');
    
    IF column_count = 3 THEN
        RAISE NOTICE '✅ Helper functions created';
    ELSE
        RAISE WARNING '⚠️ Only % of 3 functions found', column_count;
    END IF;
    
    RAISE NOTICE '✅ Courier tracking integration migration complete!';
    RAISE NOTICE '📋 Architecture: Unified Platform (courier-agnostic)';
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
