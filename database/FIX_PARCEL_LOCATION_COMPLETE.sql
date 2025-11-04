-- ============================================================================
-- COMPLETE FIX: Ensure parcel_location_cache has all required columns
-- ============================================================================
-- Date: November 4, 2025, 5:05 PM
-- Issue: Table exists but may be missing columns from full migration
-- Solution: Add all missing columns safely
-- ============================================================================

-- Function to add column if not exists
CREATE OR REPLACE FUNCTION add_column_if_not_exists(
    p_table_name TEXT,
    p_column_name TEXT,
    p_column_definition TEXT
) RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = p_table_name
          AND column_name = p_column_name
    ) THEN
        EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', 
            p_table_name, p_column_name, p_column_definition);
        RAISE NOTICE '✅ Added column: %', p_column_name;
    ELSE
        RAISE NOTICE 'ℹ️ Column already exists: %', p_column_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Add all potentially missing columns
SELECT add_column_if_not_exists('parcel_location_cache', 'street', 'VARCHAR(200)');
SELECT add_column_if_not_exists('parcel_location_cache', 'postal_code', 'VARCHAR(20)');
SELECT add_column_if_not_exists('parcel_location_cache', 'city', 'VARCHAR(100)');
SELECT add_column_if_not_exists('parcel_location_cache', 'country', 'VARCHAR(2) DEFAULT ''NO''');
SELECT add_column_if_not_exists('parcel_location_cache', 'full_address', 'TEXT');
SELECT add_column_if_not_exists('parcel_location_cache', 'opening_hours', 'JSONB');
SELECT add_column_if_not_exists('parcel_location_cache', 'services', 'TEXT[]');
SELECT add_column_if_not_exists('parcel_location_cache', 'has_parking', 'BOOLEAN DEFAULT false');
SELECT add_column_if_not_exists('parcel_location_cache', 'wheelchair_accessible', 'BOOLEAN DEFAULT false');
SELECT add_column_if_not_exists('parcel_location_cache', 'available_24_7', 'BOOLEAN DEFAULT false');
SELECT add_column_if_not_exists('parcel_location_cache', 'has_refrigeration', 'BOOLEAN DEFAULT false');
SELECT add_column_if_not_exists('parcel_location_cache', 'capacity_status', 'VARCHAR(20)');
SELECT add_column_if_not_exists('parcel_location_cache', 'available_compartments', 'INTEGER');
SELECT add_column_if_not_exists('parcel_location_cache', 'total_compartments', 'INTEGER');
SELECT add_column_if_not_exists('parcel_location_cache', 'raw_api_response', 'JSONB');
SELECT add_column_if_not_exists('parcel_location_cache', 'cache_expires_at', 'TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL ''24 hours'')');

-- Drop the helper function
DROP FUNCTION IF EXISTS add_column_if_not_exists(TEXT, TEXT, TEXT);

-- Add missing indexes
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

-- Add PostGIS index if coordinates exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'parcel_location_cache' 
          AND column_name IN ('latitude', 'longitude')
        HAVING COUNT(*) = 2
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_parcel_location_coordinates 
        ON parcel_location_cache 
        USING GIST (ll_to_earth(latitude, longitude));
        
        RAISE NOTICE '✅ Added PostGIS index on coordinates';
    ELSE
        RAISE NOTICE '⚠️ Skipping PostGIS index - latitude/longitude columns missing';
    END IF;
END $$;

-- Verification
DO $$
DECLARE
    v_column_count INTEGER;
    v_required_columns TEXT[] := ARRAY[
        'cache_id', 'location_id', 'courier_id', 'location_type', 'name', 
        'carrier', 'street', 'postal_code', 'city', 'country', 'full_address',
        'latitude', 'longitude', 'opening_hours', 'services', 
        'has_parking', 'wheelchair_accessible', 'available_24_7', 
        'capacity_status', 'cache_expires_at', 'is_active'
    ];
    v_missing_columns TEXT[];
BEGIN
    -- Check for missing required columns
    SELECT ARRAY_AGG(col)
    INTO v_missing_columns
    FROM UNNEST(v_required_columns) AS col
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'parcel_location_cache' 
          AND column_name = col
    );
    
    IF v_missing_columns IS NULL THEN
        RAISE NOTICE '==============================================';
        RAISE NOTICE '✅ ALL REQUIRED COLUMNS EXIST';
        RAISE NOTICE '==============================================';
    ELSE
        RAISE WARNING '==============================================';
        RAISE WARNING '⚠️ MISSING COLUMNS: %', array_to_string(v_missing_columns, ', ');
        RAISE WARNING '==============================================';
    END IF;
    
    -- Count total columns
    SELECT COUNT(*) INTO v_column_count
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'parcel_location_cache';
    
    RAISE NOTICE 'Total columns in parcel_location_cache: %', v_column_count;
END $$;

-- Show all columns
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'parcel_location_cache'
ORDER BY ordinal_position;
