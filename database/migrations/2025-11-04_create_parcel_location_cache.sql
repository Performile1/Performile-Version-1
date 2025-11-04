-- ============================================================================
-- PARCEL LOCATION CACHE - November 4, 2025
-- ============================================================================
-- Purpose: Cache parcel shop and locker locations from courier APIs
-- Features: PostGIS distance search, 24-hour cache, multi-courier support
-- ============================================================================

-- Ensure PostGIS extension is available
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'cube') THEN
        CREATE EXTENSION IF NOT EXISTS cube;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'earthdistance') THEN
        CREATE EXTENSION IF NOT EXISTS earthdistance;
    END IF;
END $$;

-- ============================================================================
-- TABLE: parcel_location_cache
-- ============================================================================

CREATE TABLE IF NOT EXISTS parcel_location_cache (
    cache_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Location Identification
    location_id VARCHAR(100) NOT NULL,
    courier_id UUID REFERENCES couriers(courier_id) ON DELETE CASCADE,
    location_type VARCHAR(50) NOT NULL, -- 'parcel_shop', 'parcel_locker', 'click_collect'
    
    -- Basic Information
    name VARCHAR(200) NOT NULL,
    carrier VARCHAR(50), -- 'dpd', 'postnord', 'bring', 'instabox', 'budbee'
    
    -- Address
    street VARCHAR(200),
    postal_code VARCHAR(20),
    city VARCHAR(100),
    country VARCHAR(2) DEFAULT 'NO',
    full_address TEXT,
    
    -- Coordinates (required for distance calculations)
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    
    -- Opening Hours (JSONB for flexibility)
    opening_hours JSONB,
    -- Example: {"monday": "08:00-22:00", "tuesday": "08:00-22:00", ...}
    
    -- Services Available
    services TEXT[], -- ['pickup', 'dropoff', 'returns']
    
    -- Features
    has_parking BOOLEAN DEFAULT false,
    wheelchair_accessible BOOLEAN DEFAULT false,
    available_24_7 BOOLEAN DEFAULT false,
    has_refrigeration BOOLEAN DEFAULT false,
    
    -- Capacity Information
    capacity_status VARCHAR(20), -- 'available', 'limited', 'full'
    available_compartments INTEGER,
    total_compartments INTEGER,
    
    -- API Response (for debugging and future reference)
    raw_api_response JSONB,
    
    -- Cache Management
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cache_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique locations per courier
    UNIQUE(courier_id, location_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- PostGIS index for distance-based searches (CRITICAL for performance)
CREATE INDEX IF NOT EXISTS idx_parcel_location_coordinates 
ON parcel_location_cache 
USING GIST (ll_to_earth(latitude, longitude));

-- Standard indexes
CREATE INDEX IF NOT EXISTS idx_parcel_location_postal 
ON parcel_location_cache(postal_code);

CREATE INDEX IF NOT EXISTS idx_parcel_location_type 
ON parcel_location_cache(location_type);

CREATE INDEX IF NOT EXISTS idx_parcel_location_courier 
ON parcel_location_cache(courier_id);

CREATE INDEX IF NOT EXISTS idx_parcel_location_active 
ON parcel_location_cache(is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_parcel_location_expires 
ON parcel_location_cache(cache_expires_at);

CREATE INDEX IF NOT EXISTS idx_parcel_location_carrier 
ON parcel_location_cache(carrier);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE parcel_location_cache ENABLE ROW LEVEL SECURITY;

-- Public read access for active locations (consumers need to see these)
DROP POLICY IF EXISTS parcel_location_cache_select ON parcel_location_cache;
CREATE POLICY parcel_location_cache_select 
ON parcel_location_cache FOR SELECT 
USING (is_active = true);

-- Only service role can insert/update (API will manage cache)
DROP POLICY IF EXISTS parcel_location_cache_insert ON parcel_location_cache;
CREATE POLICY parcel_location_cache_insert 
ON parcel_location_cache FOR INSERT 
WITH CHECK (true); -- Service role only

DROP POLICY IF EXISTS parcel_location_cache_update ON parcel_location_cache;
CREATE POLICY parcel_location_cache_update 
ON parcel_location_cache FOR UPDATE 
USING (true); -- Service role only

-- ============================================================================
-- FUNCTION: search_parcel_locations
-- ============================================================================
-- Search for parcel locations near a given coordinate using PostGIS

CREATE OR REPLACE FUNCTION search_parcel_locations(
    p_latitude NUMERIC,
    p_longitude NUMERIC,
    p_radius_meters INTEGER DEFAULT 5000,
    p_limit INTEGER DEFAULT 20,
    p_location_type VARCHAR DEFAULT NULL,
    p_courier_id UUID DEFAULT NULL
)
RETURNS TABLE (
    location_id VARCHAR,
    courier_id UUID,
    name VARCHAR,
    location_type VARCHAR,
    carrier VARCHAR,
    latitude NUMERIC,
    longitude NUMERIC,
    full_address TEXT,
    postal_code VARCHAR,
    city VARCHAR,
    distance_meters INTEGER,
    opening_hours JSONB,
    services TEXT[],
    has_parking BOOLEAN,
    wheelchair_accessible BOOLEAN,
    available_24_7 BOOLEAN,
    capacity_status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        plc.location_id,
        plc.courier_id,
        plc.name,
        plc.location_type,
        plc.carrier,
        plc.latitude,
        plc.longitude,
        plc.full_address,
        plc.postal_code,
        plc.city,
        ROUND(earth_distance(
            ll_to_earth(plc.latitude, plc.longitude),
            ll_to_earth(p_latitude, p_longitude)
        ))::INTEGER as distance_meters,
        plc.opening_hours,
        plc.services,
        plc.has_parking,
        plc.wheelchair_accessible,
        plc.available_24_7,
        plc.capacity_status
    FROM parcel_location_cache plc
    WHERE plc.is_active = true
      AND plc.cache_expires_at > NOW()
      AND earth_box(ll_to_earth(p_latitude, p_longitude), p_radius_meters) @> 
          ll_to_earth(plc.latitude, plc.longitude)
      AND (p_location_type IS NULL OR plc.location_type = p_location_type)
      AND (p_courier_id IS NULL OR plc.courier_id = p_courier_id)
    ORDER BY earth_distance(
        ll_to_earth(plc.latitude, plc.longitude),
        ll_to_earth(p_latitude, p_longitude)
    )
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- FUNCTION: search_parcel_locations_by_postal
-- ============================================================================
-- Search by postal code (when coordinates not available)

CREATE OR REPLACE FUNCTION search_parcel_locations_by_postal(
    p_postal_code VARCHAR,
    p_limit INTEGER DEFAULT 20,
    p_location_type VARCHAR DEFAULT NULL,
    p_courier_id UUID DEFAULT NULL
)
RETURNS TABLE (
    location_id VARCHAR,
    courier_id UUID,
    name VARCHAR,
    location_type VARCHAR,
    carrier VARCHAR,
    latitude NUMERIC,
    longitude NUMERIC,
    full_address TEXT,
    postal_code VARCHAR,
    city VARCHAR,
    opening_hours JSONB,
    services TEXT[],
    has_parking BOOLEAN,
    wheelchair_accessible BOOLEAN,
    available_24_7 BOOLEAN,
    capacity_status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        plc.location_id,
        plc.courier_id,
        plc.name,
        plc.location_type,
        plc.carrier,
        plc.latitude,
        plc.longitude,
        plc.full_address,
        plc.postal_code,
        plc.city,
        plc.opening_hours,
        plc.services,
        plc.has_parking,
        plc.wheelchair_accessible,
        plc.available_24_7,
        plc.capacity_status
    FROM parcel_location_cache plc
    WHERE plc.is_active = true
      AND plc.cache_expires_at > NOW()
      AND plc.postal_code = p_postal_code
      AND (p_location_type IS NULL OR plc.location_type = p_location_type)
      AND (p_courier_id IS NULL OR plc.courier_id = p_courier_id)
    ORDER BY plc.name
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- FUNCTION: clean_expired_cache
-- ============================================================================
-- Remove expired cache entries (run daily via cron)

CREATE OR REPLACE FUNCTION clean_expired_parcel_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM parcel_location_cache
    WHERE cache_expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLE: courier_api_requests
-- ============================================================================
-- Log all courier API requests for monitoring and debugging

CREATE TABLE IF NOT EXISTS courier_api_requests (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Request Details
    courier_id UUID REFERENCES couriers(courier_id) ON DELETE CASCADE,
    api_endpoint VARCHAR(200),
    request_type VARCHAR(50), -- 'parcel_shop_search', 'locker_search', 'route_calculation'
    
    -- Request Parameters
    request_params JSONB,
    
    -- Response
    response_status INTEGER,
    response_body JSONB,
    response_time_ms INTEGER,
    
    -- Error Handling
    is_error BOOLEAN DEFAULT false,
    error_message TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for monitoring
CREATE INDEX IF NOT EXISTS idx_courier_api_requests_courier 
ON courier_api_requests(courier_id);

CREATE INDEX IF NOT EXISTS idx_courier_api_requests_type 
ON courier_api_requests(request_type);

CREATE INDEX IF NOT EXISTS idx_courier_api_requests_created 
ON courier_api_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_courier_api_requests_errors 
ON courier_api_requests(is_error) 
WHERE is_error = true;

-- RLS
ALTER TABLE courier_api_requests ENABLE ROW LEVEL SECURITY;

-- Admin and service role can view logs
DROP POLICY IF EXISTS courier_api_requests_select ON courier_api_requests;
CREATE POLICY courier_api_requests_select 
ON courier_api_requests FOR SELECT 
USING (
    auth.uid() IN (
        SELECT user_id FROM users WHERE user_role = 'admin'
    )
);

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Insert sample parcel shop (Oslo - Majorstuen area)
INSERT INTO parcel_location_cache (
    location_id,
    courier_id,
    location_type,
    name,
    carrier,
    street,
    postal_code,
    city,
    country,
    full_address,
    latitude,
    longitude,
    opening_hours,
    services,
    has_parking,
    wheelchair_accessible,
    available_24_7,
    capacity_status
)
SELECT 
    'SAMPLE-DPD-001',
    courier_id,
    'parcel_shop',
    'DPD Pickup - Rema 1000 Majorstuen',
    'dpd',
    'Bogstadveien 44',
    '0366',
    'Oslo',
    'NO',
    'Bogstadveien 44, 0366 Oslo',
    59.9299,
    10.7185,
    '{"monday": "08:00-22:00", "tuesday": "08:00-22:00", "wednesday": "08:00-22:00", "thursday": "08:00-22:00", "friday": "08:00-22:00", "saturday": "09:00-20:00", "sunday": "10:00-20:00"}'::jsonb,
    ARRAY['pickup', 'dropoff', 'returns'],
    true,
    true,
    false,
    'available'
FROM couriers
WHERE courier_code = 'dpd'
LIMIT 1
ON CONFLICT (courier_id, location_id) DO NOTHING;

-- Insert sample parcel locker
INSERT INTO parcel_location_cache (
    location_id,
    courier_id,
    location_type,
    name,
    carrier,
    street,
    postal_code,
    city,
    country,
    full_address,
    latitude,
    longitude,
    opening_hours,
    services,
    has_parking,
    wheelchair_accessible,
    available_24_7,
    capacity_status,
    available_compartments,
    total_compartments
)
SELECT 
    'SAMPLE-BRING-001',
    courier_id,
    'parcel_locker',
    'Bring Parcel Locker - Majorstuen T-bane',
    'bring',
    'Valkyriegata 1',
    '0366',
    'Oslo',
    'NO',
    'Valkyriegata 1, 0366 Oslo',
    59.9301,
    10.7156,
    '{"monday": "00:00-23:59", "tuesday": "00:00-23:59", "wednesday": "00:00-23:59", "thursday": "00:00-23:59", "friday": "00:00-23:59", "saturday": "00:00-23:59", "sunday": "00:00-23:59"}'::jsonb,
    ARRAY['pickup', 'dropoff'],
    false,
    true,
    true,
    'available',
    15,
    24
FROM couriers
WHERE courier_code = 'bring'
LIMIT 1
ON CONFLICT (courier_id, location_id) DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
    v_table_exists BOOLEAN;
    v_function_exists BOOLEAN;
    v_sample_count INTEGER;
BEGIN
    -- Check table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'parcel_location_cache'
    ) INTO v_table_exists;
    
    -- Check function exists
    SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'search_parcel_locations'
    ) INTO v_function_exists;
    
    -- Check sample data
    SELECT COUNT(*) INTO v_sample_count
    FROM parcel_location_cache
    WHERE location_id LIKE 'SAMPLE-%';
    
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'PARCEL LOCATION CACHE - DEPLOYMENT VERIFICATION';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Table exists: %', v_table_exists;
    RAISE NOTICE 'Search function exists: %', v_function_exists;
    RAISE NOTICE 'Sample locations: %', v_sample_count;
    RAISE NOTICE '==============================================';
    
    IF v_table_exists AND v_function_exists THEN
        RAISE NOTICE '✅ Parcel location cache deployed successfully!';
    ELSE
        RAISE WARNING '⚠️ Deployment incomplete - check errors above';
    END IF;
END $$;

-- ============================================================================
-- USAGE EXAMPLES (commented out - for reference only)
-- ============================================================================

-- Example 1: Search near Oslo city center
-- SELECT * FROM search_parcel_locations(59.9139, 10.7522, 5000, 20);

-- Example 2: Search for parcel lockers only
-- SELECT * FROM search_parcel_locations(59.9139, 10.7522, 5000, 20, 'parcel_locker');

-- Example 3: Search by postal code
-- SELECT * FROM search_parcel_locations_by_postal('0366', 20);

-- Example 4: Clean expired cache
-- SELECT clean_expired_parcel_cache();
