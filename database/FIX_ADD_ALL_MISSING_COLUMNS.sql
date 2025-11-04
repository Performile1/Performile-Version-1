-- ============================================================================
-- ADD ALL MISSING COLUMNS TO parcel_location_cache
-- ============================================================================
-- Current: 8 columns
-- Required: 25+ columns
-- This will add all missing columns safely
-- ============================================================================

-- Add missing columns one by one
DO $$
BEGIN
    -- cache_id (primary key)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcel_location_cache' AND column_name = 'cache_id') THEN
        ALTER TABLE parcel_location_cache ADD COLUMN cache_id UUID DEFAULT gen_random_uuid();
        RAISE NOTICE '✅ Added: cache_id';
    END IF;

    -- location_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcel_location_cache' AND column_name = 'location_type') THEN
        ALTER TABLE parcel_location_cache ADD COLUMN location_type VARCHAR(50) NOT NULL DEFAULT 'parcel_shop';
        RAISE NOTICE '✅ Added: location_type';
    END IF;

    -- name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcel_location_cache' AND column_name = 'name') THEN
        ALTER TABLE parcel_location_cache ADD COLUMN name VARCHAR(200) NOT NULL DEFAULT 'Unknown Location';
        RAISE NOTICE '✅ Added: name';
    END IF;

    -- carrier
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcel_location_cache' AND column_name = 'carrier') THEN
        ALTER TABLE parcel_location_cache ADD COLUMN carrier VARCHAR(50);
        RAISE NOTICE '✅ Added: carrier';
    END IF;

    -- Address fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcel_location_cache' AND column_name = 'street') THEN
        ALTER TABLE parcel_location_cache ADD COLUMN street VARCHAR(200);
        RAISE NOTICE '✅ Added: street';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcel_location_cache' AND column_name = 'city') THEN
        ALTER TABLE parcel_location_cache ADD COLUMN city VARCHAR(100);
        RAISE NOTICE '✅ Added: city';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcel_location_cache' AND column_name = 'country') THEN
        ALTER TABLE parcel_location_cache ADD COLUMN country VARCHAR(2) DEFAULT 'NO';
        RAISE NOTICE '✅ Added: country';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcel_location_cache' AND column_name = 'full_address') THEN
        ALTER TABLE parcel_location_cache ADD COLUMN full_address TEXT;
        RAISE NOTICE '✅ Added: full_address';
    END IF;

    -- Features
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcel_location_cache' AND column_name = 'has_parking') THEN
        ALTER TABLE parcel_location_cache ADD COLUMN has_parking BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Added: has_parking';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcel_location_cache' AND column_name = 'wheelchair_accessible') THEN
        ALTER TABLE parcel_location_cache ADD COLUMN wheelchair_accessible BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Added: wheelchair_accessible';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcel_location_cache' AND column_name = 'available_24_7') THEN
        ALTER TABLE parcel_location_cache ADD COLUMN available_24_7 BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Added: available_24_7';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcel_location_cache' AND column_name = 'has_refrigeration') THEN
        ALTER TABLE parcel_location_cache ADD COLUMN has_refrigeration BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Added: has_refrigeration';
    END IF;

    -- Capacity
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcel_location_cache' AND column_name = 'capacity_status') THEN
        ALTER TABLE parcel_location_cache ADD COLUMN capacity_status VARCHAR(20);
        RAISE NOTICE '✅ Added: capacity_status';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcel_location_cache' AND column_name = 'available_compartments') THEN
        ALTER TABLE parcel_location_cache ADD COLUMN available_compartments INTEGER;
        RAISE NOTICE '✅ Added: available_compartments';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcel_location_cache' AND column_name = 'total_compartments') THEN
        ALTER TABLE parcel_location_cache ADD COLUMN total_compartments INTEGER;
        RAISE NOTICE '✅ Added: total_compartments';
    END IF;

    -- API Response
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcel_location_cache' AND column_name = 'raw_api_response') THEN
        ALTER TABLE parcel_location_cache ADD COLUMN raw_api_response JSONB;
        RAISE NOTICE '✅ Added: raw_api_response';
    END IF;

    -- Cache management
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcel_location_cache' AND column_name = 'last_updated') THEN
        ALTER TABLE parcel_location_cache ADD COLUMN last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Added: last_updated';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcel_location_cache' AND column_name = 'is_active') THEN
        ALTER TABLE parcel_location_cache ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE '✅ Added: is_active';
    END IF;

    -- Timestamps
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcel_location_cache' AND column_name = 'created_at') THEN
        ALTER TABLE parcel_location_cache ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Added: created_at';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcel_location_cache' AND column_name = 'updated_at') THEN
        ALTER TABLE parcel_location_cache ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Added: updated_at';
    END IF;

    RAISE NOTICE '==============================================';
    RAISE NOTICE '✅ ALL COLUMNS ADDED SUCCESSFULLY';
    RAISE NOTICE '==============================================';
END $$;

-- Add primary key if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'parcel_location_cache_pkey'
    ) THEN
        -- First, ensure cache_id has values
        UPDATE parcel_location_cache SET cache_id = gen_random_uuid() WHERE cache_id IS NULL;
        
        -- Make cache_id NOT NULL
        ALTER TABLE parcel_location_cache ALTER COLUMN cache_id SET NOT NULL;
        
        -- Add primary key
        ALTER TABLE parcel_location_cache ADD PRIMARY KEY (cache_id);
        
        RAISE NOTICE '✅ Added primary key on cache_id';
    END IF;
END $$;

-- Add unique constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'parcel_location_cache_courier_id_location_id_key'
    ) THEN
        ALTER TABLE parcel_location_cache 
        ADD CONSTRAINT parcel_location_cache_courier_id_location_id_key 
        UNIQUE (courier_id, location_id);
        
        RAISE NOTICE '✅ Added unique constraint on (courier_id, location_id)';
    END IF;
END $$;

-- Add foreign key to couriers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'parcel_location_cache_courier_id_fkey'
    ) THEN
        ALTER TABLE parcel_location_cache 
        ADD CONSTRAINT parcel_location_cache_courier_id_fkey 
        FOREIGN KEY (courier_id) REFERENCES couriers(courier_id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Added foreign key to couriers';
    END IF;
END $$;

-- Add all indexes
CREATE INDEX IF NOT EXISTS idx_parcel_location_postal ON parcel_location_cache(postal_code);
CREATE INDEX IF NOT EXISTS idx_parcel_location_type ON parcel_location_cache(location_type);
CREATE INDEX IF NOT EXISTS idx_parcel_location_courier ON parcel_location_cache(courier_id);
CREATE INDEX IF NOT EXISTS idx_parcel_location_active ON parcel_location_cache(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_parcel_location_expires ON parcel_location_cache(cache_expires_at);
CREATE INDEX IF NOT EXISTS idx_parcel_location_carrier ON parcel_location_cache(carrier);

-- Add PostGIS index
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'parcel_location_cache' 
        AND column_name IN ('latitude', 'longitude')
        GROUP BY table_name
        HAVING COUNT(*) = 2
    ) THEN
        -- Ensure earthdistance extension is loaded
        CREATE EXTENSION IF NOT EXISTS cube;
        CREATE EXTENSION IF NOT EXISTS earthdistance;
        
        -- Create PostGIS index
        CREATE INDEX IF NOT EXISTS idx_parcel_location_coordinates 
        ON parcel_location_cache 
        USING GIST (ll_to_earth(latitude, longitude));
        
        RAISE NOTICE '✅ Added PostGIS index on coordinates';
    END IF;
END $$;

-- Enable RLS
ALTER TABLE parcel_location_cache ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
DROP POLICY IF EXISTS parcel_location_cache_select ON parcel_location_cache;
CREATE POLICY parcel_location_cache_select 
ON parcel_location_cache FOR SELECT 
USING (is_active = true);

DROP POLICY IF EXISTS parcel_location_cache_insert ON parcel_location_cache;
CREATE POLICY parcel_location_cache_insert 
ON parcel_location_cache FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS parcel_location_cache_update ON parcel_location_cache;
CREATE POLICY parcel_location_cache_update 
ON parcel_location_cache FOR UPDATE 
USING (true);

-- RLS policies created successfully

-- Final verification
DO $$
DECLARE
    v_column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_column_count
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'parcel_location_cache';
    
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'FINAL STATUS';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Total columns: %', v_column_count;
    RAISE NOTICE 'Expected: 25+';
    
    IF v_column_count >= 25 THEN
        RAISE NOTICE '✅ TABLE IS COMPLETE!';
    ELSE
        RAISE WARNING '⚠️ Table may still be missing some columns';
    END IF;
    RAISE NOTICE '==============================================';
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
