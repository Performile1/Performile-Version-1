-- ============================================================================
-- WEEK 4 - PHASE 2: PARCEL POINTS & DELIVERY COVERAGE
-- ============================================================================
-- Created: October 19, 2025, 8:35 PM
-- Purpose: Map parcel shops, lockers, and delivery coverage areas
-- Dependencies: couriers, servicetypes tables
-- ============================================================================

-- ============================================================================
-- ENABLE REQUIRED EXTENSIONS
-- ============================================================================

-- Enable cube extension (required for earthdistance)
CREATE EXTENSION IF NOT EXISTS cube;

-- Enable earthdistance extension for geographic calculations
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- Verify extensions are enabled
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'cube') THEN
        RAISE EXCEPTION 'cube extension is required but not available';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'earthdistance') THEN
        RAISE EXCEPTION 'earthdistance extension is required but not available';
    END IF;
    
    RAISE NOTICE '✅ Extensions enabled: cube, earthdistance';
END $$;

-- ============================================================================
-- TABLE 1: parcel_points
-- Purpose: Physical locations for parcel shops and lockers
-- ============================================================================

CREATE TABLE IF NOT EXISTS parcel_points (
    parcel_point_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
    service_type_id UUID NOT NULL REFERENCES servicetypes(service_type_id) ON DELETE CASCADE,
    
    -- Location Identifiers
    external_id VARCHAR(100), -- Courier's internal ID
    point_code VARCHAR(50), -- Unique code (e.g., locker code)
    point_name VARCHAR(200) NOT NULL,
    
    -- Point Type
    point_type VARCHAR(50) NOT NULL CHECK (point_type IN ('parcel_shop', 'parcel_locker', 'service_point', 'pickup_point')),
    
    -- Address Information
    street_address VARCHAR(200) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    city VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    country VARCHAR(2) DEFAULT 'SE', -- ISO 3166-1 alpha-2
    
    -- Geographic Coordinates
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    
    -- Contact Information
    phone VARCHAR(20),
    email VARCHAR(100),
    website_url VARCHAR(255),
    
    -- Operating Status
    is_active BOOLEAN DEFAULT true,
    is_temporarily_closed BOOLEAN DEFAULT false,
    closure_reason TEXT,
    
    -- Capacity (for lockers)
    total_compartments INTEGER, -- Total locker compartments
    available_compartments INTEGER, -- Currently available
    small_compartments INTEGER,
    medium_compartments INTEGER,
    large_compartments INTEGER,
    
    -- Additional Information
    description TEXT,
    instructions TEXT, -- How to access/use the point
    
    -- API Sync
    api_source VARCHAR(50), -- 'dhl', 'postnord', 'bring', etc.
    api_last_synced TIMESTAMP WITH TIME ZONE,
    api_data JSONB, -- Full API response
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(courier_id, external_id),
    UNIQUE(courier_id, point_code)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_parcel_points_courier ON parcel_points(courier_id);
CREATE INDEX IF NOT EXISTS idx_parcel_points_service_type ON parcel_points(service_type_id);
CREATE INDEX IF NOT EXISTS idx_parcel_points_postal_code ON parcel_points(postal_code);
CREATE INDEX IF NOT EXISTS idx_parcel_points_city ON parcel_points(city);
CREATE INDEX IF NOT EXISTS idx_parcel_points_type ON parcel_points(point_type);
CREATE INDEX IF NOT EXISTS idx_parcel_points_active ON parcel_points(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_parcel_points_location ON parcel_points USING GIST (
    ll_to_earth(latitude, longitude)
);

-- ============================================================================
-- TABLE 2: parcel_point_hours
-- Purpose: Operating hours for parcel points
-- ============================================================================

CREATE TABLE IF NOT EXISTS parcel_point_hours (
    hours_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_point_id UUID NOT NULL REFERENCES parcel_points(parcel_point_id) ON DELETE CASCADE,
    
    -- Day of Week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    
    -- Opening Hours
    opens_at TIME,
    closes_at TIME,
    is_closed BOOLEAN DEFAULT false, -- Closed all day
    
    -- Special Hours
    is_24_hours BOOLEAN DEFAULT false,
    
    -- Notes
    notes TEXT, -- e.g., "Lunch break 12:00-13:00"
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(parcel_point_id, day_of_week)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_parcel_point_hours_point ON parcel_point_hours(parcel_point_id);
CREATE INDEX IF NOT EXISTS idx_parcel_point_hours_day ON parcel_point_hours(day_of_week);

-- ============================================================================
-- TABLE 3: parcel_point_facilities
-- Purpose: Amenities and facilities available at parcel points
-- ============================================================================

CREATE TABLE IF NOT EXISTS parcel_point_facilities (
    facility_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_point_id UUID NOT NULL REFERENCES parcel_points(parcel_point_id) ON DELETE CASCADE,
    
    -- Facility Type
    facility_type VARCHAR(50) NOT NULL CHECK (facility_type IN (
        'parking',
        'wheelchair_access',
        'elevator',
        'restroom',
        'wifi',
        'seating',
        'climate_controlled',
        'security_camera',
        'staff_assistance',
        'package_wrapping',
        'printing_service',
        'payment_terminal',
        'atm',
        'bike_parking',
        'ev_charging'
    )),
    
    -- Availability
    is_available BOOLEAN DEFAULT true,
    
    -- Additional Details
    description TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(parcel_point_id, facility_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_parcel_point_facilities_point ON parcel_point_facilities(parcel_point_id);
CREATE INDEX IF NOT EXISTS idx_parcel_point_facilities_type ON parcel_point_facilities(facility_type);

-- ============================================================================
-- TABLE 4: delivery_coverage
-- Purpose: Delivery coverage by postal code and service type
-- ============================================================================

CREATE TABLE IF NOT EXISTS delivery_coverage (
    coverage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
    service_type_id UUID NOT NULL REFERENCES servicetypes(service_type_id) ON DELETE CASCADE,
    
    -- Geographic Area
    postal_code VARCHAR(10) NOT NULL,
    city VARCHAR(100),
    region VARCHAR(100),
    country VARCHAR(2) DEFAULT 'SE',
    
    -- Coverage Details
    is_covered BOOLEAN DEFAULT true,
    coverage_type VARCHAR(50) CHECK (coverage_type IN ('full', 'partial', 'limited', 'none')),
    
    -- Delivery Times
    standard_delivery_days INTEGER, -- Normal delivery time
    express_delivery_days INTEGER, -- Express option
    same_day_available BOOLEAN DEFAULT false,
    next_day_available BOOLEAN DEFAULT false,
    
    -- Service Availability
    home_delivery_available BOOLEAN DEFAULT true,
    parcel_shop_available BOOLEAN DEFAULT false,
    parcel_locker_available BOOLEAN DEFAULT false,
    
    -- Restrictions
    max_weight_kg DECIMAL(8,2), -- Maximum package weight
    max_dimensions_cm VARCHAR(50), -- e.g., "120x80x80"
    restricted_items TEXT[], -- Array of restricted item types
    
    -- Pricing (optional)
    base_price_sek DECIMAL(10,2),
    price_per_kg DECIMAL(10,2),
    
    -- Additional Information
    notes TEXT,
    
    -- API Sync
    api_source VARCHAR(50),
    api_last_synced TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(courier_id, service_type_id, postal_code)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_delivery_coverage_courier ON delivery_coverage(courier_id);
CREATE INDEX IF NOT EXISTS idx_delivery_coverage_service_type ON delivery_coverage(service_type_id);
CREATE INDEX IF NOT EXISTS idx_delivery_coverage_postal_code ON delivery_coverage(postal_code);
CREATE INDEX IF NOT EXISTS idx_delivery_coverage_city ON delivery_coverage(city);
CREATE INDEX IF NOT EXISTS idx_delivery_coverage_covered ON delivery_coverage(is_covered) WHERE is_covered = true;
CREATE INDEX IF NOT EXISTS idx_delivery_coverage_composite ON delivery_coverage(courier_id, service_type_id, postal_code);

-- ============================================================================
-- TABLE 5: coverage_zones
-- Purpose: Define geographic zones for delivery pricing and service levels
-- ============================================================================

CREATE TABLE IF NOT EXISTS coverage_zones (
    zone_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
    
    -- Zone Information
    zone_name VARCHAR(100) NOT NULL,
    zone_code VARCHAR(50),
    zone_type VARCHAR(50) CHECK (zone_type IN ('urban', 'suburban', 'rural', 'remote', 'international')),
    
    -- Geographic Definition
    postal_codes TEXT[], -- Array of postal codes in this zone
    cities TEXT[], -- Array of cities in this zone
    regions TEXT[], -- Array of regions in this zone
    
    -- Service Levels
    standard_delivery_days INTEGER,
    express_available BOOLEAN DEFAULT false,
    same_day_available BOOLEAN DEFAULT false,
    
    -- Pricing
    base_price_sek DECIMAL(10,2),
    price_multiplier DECIMAL(5,2) DEFAULT 1.00, -- Multiplier for this zone
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(courier_id, zone_code)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_coverage_zones_courier ON coverage_zones(courier_id);
CREATE INDEX IF NOT EXISTS idx_coverage_zones_type ON coverage_zones(zone_type);
CREATE INDEX IF NOT EXISTS idx_coverage_zones_active ON coverage_zones(is_active) WHERE is_active = true;

-- ============================================================================
-- MATERIALIZED VIEW: parcel_points_summary
-- Purpose: Quick access to parcel point information with facilities
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS parcel_points_summary AS
SELECT 
    pp.parcel_point_id,
    pp.courier_id,
    c.courier_name,
    pp.service_type_id,
    st.service_name,
    pp.point_name,
    pp.point_type,
    pp.street_address,
    pp.postal_code,
    pp.city,
    pp.latitude,
    pp.longitude,
    pp.is_active,
    pp.is_temporarily_closed,
    
    -- Aggregated facilities
    COALESCE(
        (ARRAY_AGG(DISTINCT ppf.facility_type) FILTER (WHERE ppf.facility_type IS NOT NULL))::text[],
        ARRAY[]::text[]
    ) as facilities,

    -- Capability flags derived from facilities/point type
    (
        pp.point_type = 'parcel_locker'
        OR ARRAY['qr_dropoff', 'qr_pickup', 'qr_code', 'digital_token']::text[]
            && COALESCE(
                (ARRAY_AGG(DISTINCT ppf.facility_type) FILTER (WHERE ppf.facility_type IS NOT NULL))::text[],
                ARRAY[]::text[]
            )
    ) AS supports_qr,
    (
        pp.point_type IN ('parcel_shop', 'service_point', 'pickup_point')
        OR ARRAY['label_printing', 'printing_service', 'staff_assistance', 'counter_service']::text[]
            && COALESCE(
                (ARRAY_AGG(DISTINCT ppf.facility_type) FILTER (WHERE ppf.facility_type IS NOT NULL))::text[],
                ARRAY[]::text[]
            )
    ) AS supports_printed_label,
    
    -- Opening hours (simplified)
    CASE 
        WHEN COUNT(pph.hours_id) FILTER (WHERE pph.is_24_hours = true) > 0 THEN '24/7'
        ELSE 'Regular hours'
    END as hours_type,
    
    -- Capacity (for lockers)
    pp.total_compartments,
    pp.available_compartments,
    
    -- Last updated
    pp.updated_at

FROM parcel_points pp
JOIN couriers c ON pp.courier_id = c.courier_id
JOIN servicetypes st ON pp.service_type_id = st.service_type_id
LEFT JOIN parcel_point_facilities ppf ON pp.parcel_point_id = ppf.parcel_point_id
LEFT JOIN parcel_point_hours pph ON pp.parcel_point_id = pph.parcel_point_id
WHERE pp.is_active = true
GROUP BY 
    pp.parcel_point_id,
    pp.courier_id,
    c.courier_name,
    pp.service_type_id,
    st.service_name,
    pp.point_name,
    pp.point_type,
    pp.street_address,
    pp.postal_code,
    pp.city,
    pp.latitude,
    pp.longitude,
    pp.is_active,
    pp.is_temporarily_closed,
    pp.total_compartments,
    pp.available_compartments,
    pp.updated_at;

-- Unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_parcel_points_summary_unique 
ON parcel_points_summary(parcel_point_id);

-- Regular indexes
CREATE INDEX IF NOT EXISTS idx_parcel_points_summary_courier ON parcel_points_summary(courier_id);
CREATE INDEX IF NOT EXISTS idx_parcel_points_summary_postal ON parcel_points_summary(postal_code);
CREATE INDEX IF NOT EXISTS idx_parcel_points_summary_city ON parcel_points_summary(city);
CREATE INDEX IF NOT EXISTS idx_parcel_points_summary_type ON parcel_points_summary(point_type);

-- ============================================================================
-- FUNCTION: find_nearby_parcel_points
-- Purpose: Find parcel points near a location
-- ============================================================================

CREATE OR REPLACE FUNCTION find_nearby_parcel_points(
    p_latitude DECIMAL(10,8),
    p_longitude DECIMAL(11,8),
    p_radius_km DECIMAL(10,2) DEFAULT 5.0,
    p_courier_id UUID DEFAULT NULL,
    p_point_type VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE (
    parcel_point_id UUID,
    courier_name VARCHAR,
    point_name VARCHAR,
    point_type VARCHAR,
    street_address VARCHAR,
    postal_code VARCHAR,
    city VARCHAR,
    latitude DECIMAL,
    longitude DECIMAL,
    distance_km DECIMAL,
    facilities TEXT[],
    supports_qr BOOLEAN,
    supports_printed_label BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pps.parcel_point_id,
        pps.courier_name,
        pps.point_name,
        pps.point_type,
        pps.street_address,
        pps.postal_code,
        pps.city,
        pps.latitude,
        pps.longitude,
        ROUND(
            earth_distance(
                ll_to_earth(p_latitude, p_longitude),
                ll_to_earth(pps.latitude, pps.longitude)
            ) / 1000.0, 
            2
        )::DECIMAL as distance_km,
        pps.facilities,
        pps.supports_qr,
        pps.supports_printed_label
    FROM parcel_points_summary pps
    WHERE pps.is_active = true
      AND (p_courier_id IS NULL OR pps.courier_id = p_courier_id)
      AND (p_point_type IS NULL OR pps.point_type = p_point_type)
      AND earth_distance(
          ll_to_earth(p_latitude, p_longitude),
          ll_to_earth(pps.latitude, pps.longitude)
      ) <= (p_radius_km * 1000)
    ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: check_delivery_coverage
-- Purpose: Check if delivery is available for a postal code
-- ============================================================================

CREATE OR REPLACE FUNCTION check_delivery_coverage(
    p_postal_code VARCHAR(10),
    p_courier_id UUID DEFAULT NULL,
    p_service_type_id UUID DEFAULT NULL
)
RETURNS TABLE (
    courier_id UUID,
    courier_name VARCHAR,
    service_type_id UUID,
    service_name VARCHAR,
    is_covered BOOLEAN,
    standard_delivery_days INTEGER,
    home_delivery_available BOOLEAN,
    parcel_shop_available BOOLEAN,
    parcel_locker_available BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.courier_id,
        c.courier_name,
        dc.service_type_id,
        st.service_name,
        dc.is_covered,
        dc.standard_delivery_days,
        dc.home_delivery_available,
        dc.parcel_shop_available,
        dc.parcel_locker_available
    FROM delivery_coverage dc
    JOIN couriers c ON dc.courier_id = c.courier_id
    JOIN servicetypes st ON dc.service_type_id = st.service_type_id
    WHERE dc.postal_code = p_postal_code
      AND (p_courier_id IS NULL OR dc.courier_id = p_courier_id)
      AND (p_service_type_id IS NULL OR dc.service_type_id = p_service_type_id)
      AND dc.is_covered = true
    ORDER BY dc.standard_delivery_days, c.courier_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: refresh_parcel_points_summary
-- Purpose: Refresh the materialized view
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_parcel_points_summary()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY parcel_points_summary;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE parcel_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcel_point_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcel_point_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_coverage ENABLE ROW LEVEL SECURITY;
ALTER TABLE coverage_zones ENABLE ROW LEVEL SECURITY;

-- Admin: Full access
CREATE POLICY parcel_points_admin_all ON parcel_points
    FOR ALL USING (auth.jwt() ->> 'user_role' = 'admin');

CREATE POLICY parcel_point_hours_admin_all ON parcel_point_hours
    FOR ALL USING (auth.jwt() ->> 'user_role' = 'admin');

CREATE POLICY parcel_point_facilities_admin_all ON parcel_point_facilities
    FOR ALL USING (auth.jwt() ->> 'user_role' = 'admin');

CREATE POLICY delivery_coverage_admin_all ON delivery_coverage
    FOR ALL USING (auth.jwt() ->> 'user_role' = 'admin');

CREATE POLICY coverage_zones_admin_all ON coverage_zones
    FOR ALL USING (auth.jwt() ->> 'user_role' = 'admin');

-- Courier: Manage own parcel points
CREATE POLICY parcel_points_courier_manage ON parcel_points
    FOR ALL USING (
        courier_id IN (
            SELECT courier_id FROM couriers 
            WHERE user_id = (auth.jwt() ->> 'user_id')::UUID
        )
    );

-- Public: View active parcel points
CREATE POLICY parcel_points_public_view ON parcel_points
    FOR SELECT USING (is_active = true);

CREATE POLICY parcel_point_hours_public_view ON parcel_point_hours
    FOR SELECT USING (true);

CREATE POLICY parcel_point_facilities_public_view ON parcel_point_facilities
    FOR SELECT USING (true);

CREATE POLICY delivery_coverage_public_view ON delivery_coverage
    FOR SELECT USING (is_covered = true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE parcel_points IS 'Physical locations for parcel shops and lockers';
COMMENT ON TABLE parcel_point_hours IS 'Operating hours for parcel points';
COMMENT ON TABLE parcel_point_facilities IS 'Amenities and facilities at parcel points';
COMMENT ON TABLE delivery_coverage IS 'Delivery coverage by postal code and service type';
COMMENT ON TABLE coverage_zones IS 'Geographic zones for delivery pricing and service levels';
COMMENT ON MATERIALIZED VIEW parcel_points_summary IS 'Quick access to parcel point information';
COMMENT ON FUNCTION find_nearby_parcel_points IS 'Find parcel points within radius of a location';
COMMENT ON FUNCTION check_delivery_coverage IS 'Check delivery availability for a postal code';
COMMENT ON FUNCTION refresh_parcel_points_summary IS 'Refresh the parcel points summary view';

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert sample parcel points for testing (commented out by default)
/*
DO $$
DECLARE
    v_dhl_id UUID;
    v_postnord_id UUID;
    v_home_delivery_id UUID;
    v_parcel_shop_id UUID;
    v_parcel_locker_id UUID;
    v_point_id UUID;
BEGIN
    -- Get courier IDs
    SELECT courier_id INTO v_dhl_id FROM couriers WHERE courier_name = 'DHL Express' LIMIT 1;
    SELECT courier_id INTO v_postnord_id FROM couriers WHERE courier_name = 'PostNord' LIMIT 1;
    
    -- Get service type IDs
    SELECT service_type_id INTO v_home_delivery_id FROM servicetypes WHERE service_code = 'home_delivery';
    SELECT service_type_id INTO v_parcel_shop_id FROM servicetypes WHERE service_code = 'parcel_shop';
    SELECT service_type_id INTO v_parcel_locker_id FROM servicetypes WHERE service_code = 'parcel_locker';
    
    -- Insert sample DHL parcel shop in Stockholm
    INSERT INTO parcel_points (
        courier_id, service_type_id, point_name, point_type,
        street_address, postal_code, city, latitude, longitude,
        phone, is_active
    ) VALUES (
        v_dhl_id, v_parcel_shop_id, 'DHL ServicePoint - Pressbyrån Centralstation',
        'parcel_shop', 'Centralplan 15', '11120', 'Stockholm',
        59.3293, 18.0686, '+46 8 123 456', true
    ) RETURNING parcel_point_id INTO v_point_id;
    
    -- Add opening hours
    INSERT INTO parcel_point_hours (parcel_point_id, day_of_week, opens_at, closes_at)
    VALUES 
        (v_point_id, 1, '07:00', '22:00'), -- Monday
        (v_point_id, 2, '07:00', '22:00'), -- Tuesday
        (v_point_id, 3, '07:00', '22:00'), -- Wednesday
        (v_point_id, 4, '07:00', '22:00'), -- Thursday
        (v_point_id, 5, '07:00', '22:00'), -- Friday
        (v_point_id, 6, '08:00', '20:00'), -- Saturday
        (v_point_id, 0, '09:00', '18:00'); -- Sunday
    
    -- Add facilities
    INSERT INTO parcel_point_facilities (parcel_point_id, facility_type)
    VALUES 
        (v_point_id, 'wheelchair_access'),
        (v_point_id, 'staff_assistance'),
        (v_point_id, 'payment_terminal');
    
    RAISE NOTICE '✅ Sample parcel point created for testing';
END $$;
*/

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Week 4 Phase 2: Parcel Points & Coverage Tables Created Successfully!';
    RAISE NOTICE '📍 Tables: parcel_points, parcel_point_hours, parcel_point_facilities, delivery_coverage, coverage_zones';
    RAISE NOTICE '📈 Materialized View: parcel_points_summary';
    RAISE NOTICE '🔧 Functions: find_nearby_parcel_points, check_delivery_coverage, refresh_parcel_points_summary';
    RAISE NOTICE '🔒 RLS Policies: Enabled for all tables';
    RAISE NOTICE '📅 Ready for courier API integration';
END $$;
