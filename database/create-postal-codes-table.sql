-- ============================================================================
-- POSTAL CODE PROXIMITY SYSTEM - DATABASE SETUP
-- ============================================================================
-- Purpose: Enable radius-based courier matching and analytics
-- Features: Lat/lon coordinates, distance calculations, radius searches
-- ============================================================================

-- Enable PostGIS extension for geographic calculations
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- POSTAL CODES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS postal_codes (
    postal_code VARCHAR(10) PRIMARY KEY,
    city VARCHAR(255),
    municipality VARCHAR(255),
    county VARCHAR(255),
    country VARCHAR(2) DEFAULT 'SE',
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    -- Geographic point for PostGIS calculations
    location GEOGRAPHY(POINT, 4326),
    -- Metadata
    population INTEGER,
    area_type VARCHAR(20), -- 'urban', 'suburban', 'rural'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Primary lookup by postal code (already indexed as PK)
-- Geographic index for radius searches
CREATE INDEX IF NOT EXISTS idx_postal_codes_location ON postal_codes USING GIST(location);

-- City lookup
CREATE INDEX IF NOT EXISTS idx_postal_codes_city ON postal_codes(city);

-- Country filter
CREATE INDEX IF NOT EXISTS idx_postal_codes_country ON postal_codes(country);

-- Active postal codes
CREATE INDEX IF NOT EXISTS idx_postal_codes_active ON postal_codes(is_active) WHERE is_active = TRUE;

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_postal_codes_country_active ON postal_codes(country, is_active);

-- ============================================================================
-- TRIGGER: Auto-update location from lat/lon
-- ============================================================================

CREATE OR REPLACE FUNCTION update_postal_code_location()
RETURNS TRIGGER AS $$
BEGIN
    -- Create PostGIS point from latitude/longitude
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_postal_code_location
    BEFORE INSERT OR UPDATE OF latitude, longitude ON postal_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_postal_code_location();

-- ============================================================================
-- FUNCTION: Calculate distance between two postal codes (in km)
-- ============================================================================

CREATE OR REPLACE FUNCTION postal_code_distance(
    postal1 VARCHAR,
    postal2 VARCHAR
) RETURNS NUMERIC AS $$
DECLARE
    loc1 GEOGRAPHY;
    loc2 GEOGRAPHY;
BEGIN
    -- Get locations
    SELECT location INTO loc1 FROM postal_codes WHERE postal_code = postal1 AND is_active = TRUE;
    SELECT location INTO loc2 FROM postal_codes WHERE postal_code = postal2 AND is_active = TRUE;
    
    -- Return null if either postal code not found
    IF loc1 IS NULL OR loc2 IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Calculate distance in kilometers using PostGIS
    RETURN ST_Distance(loc1, loc2) / 1000;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- FUNCTION: Find postal codes within radius (in km)
-- ============================================================================

CREATE OR REPLACE FUNCTION postal_codes_within_radius(
    center_postal VARCHAR,
    radius_km NUMERIC DEFAULT 10
) RETURNS TABLE (
    postal_code VARCHAR,
    city VARCHAR,
    distance_km NUMERIC
) AS $$
DECLARE
    center_location GEOGRAPHY;
BEGIN
    -- Get center location
    SELECT location INTO center_location 
    FROM postal_codes 
    WHERE postal_codes.postal_code = center_postal 
      AND is_active = TRUE;
    
    -- Return empty if center not found
    IF center_location IS NULL THEN
        RETURN;
    END IF;
    
    -- Find postal codes within radius
    RETURN QUERY
    SELECT 
        pc.postal_code,
        pc.city,
        ROUND((ST_Distance(center_location, pc.location) / 1000)::NUMERIC, 2) as distance_km
    FROM postal_codes pc
    WHERE pc.is_active = TRUE
      AND ST_DWithin(center_location, pc.location, radius_km * 1000) -- radius in meters
    ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- FUNCTION: Get coordinates for postal code
-- ============================================================================

CREATE OR REPLACE FUNCTION get_postal_code_coords(
    p_postal_code VARCHAR
) RETURNS TABLE (
    latitude NUMERIC,
    longitude NUMERIC,
    city VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pc.latitude,
        pc.longitude,
        pc.city
    FROM postal_codes pc
    WHERE pc.postal_code = p_postal_code
      AND pc.is_active = TRUE
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- SAMPLE DATA (Stockholm area for testing)
-- ============================================================================

INSERT INTO postal_codes (postal_code, city, municipality, county, latitude, longitude, area_type)
VALUES 
    ('11122', 'Stockholm', 'Stockholm', 'Stockholm', 59.3293, 18.0686, 'urban'),
    ('11123', 'Stockholm', 'Stockholm', 'Stockholm', 59.3300, 18.0700, 'urban'),
    ('11124', 'Stockholm', 'Stockholm', 'Stockholm', 59.3310, 18.0720, 'urban'),
    ('11125', 'Stockholm', 'Stockholm', 'Stockholm', 59.3320, 18.0740, 'urban'),
    ('11126', 'Stockholm', 'Stockholm', 'Stockholm', 59.3330, 18.0760, 'urban')
ON CONFLICT (postal_code) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Test distance calculation
DO $$
DECLARE
    test_distance NUMERIC;
BEGIN
    test_distance := postal_code_distance('11122', '11126');
    IF test_distance IS NOT NULL THEN
        RAISE NOTICE '✅ Distance calculation working: %.2f km between 11122 and 11126', test_distance;
    ELSE
        RAISE NOTICE '⚠️ Distance calculation returned NULL';
    END IF;
END $$;

-- Test radius search
DO $$
DECLARE
    result_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO result_count 
    FROM postal_codes_within_radius('11122', 5);
    
    RAISE NOTICE '✅ Found % postal codes within 5km of 11122', result_count;
END $$;

-- Show sample data
SELECT 
    postal_code,
    city,
    latitude,
    longitude,
    postal_code_distance('11122', postal_code) as distance_from_11122_km
FROM postal_codes
WHERE postal_code IN ('11122', '11123', '11124', '11125', '11126')
ORDER BY postal_code;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ POSTAL CODE SYSTEM INITIALIZED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables created: postal_codes';
    RAISE NOTICE 'Functions created: 3';
    RAISE NOTICE 'Indexes created: 5';
    RAISE NOTICE 'Sample data: 5 Stockholm postal codes';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Run import-postal-codes.sql to load full dataset';
    RAISE NOTICE '2. Test with: SELECT * FROM postal_codes_within_radius(''11122'', 10);';
    RAISE NOTICE '========================================';
END $$;
