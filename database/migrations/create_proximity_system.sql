-- ============================================================================
-- PROXIMITY SYSTEM MIGRATION
-- Date: October 17, 2025
-- Purpose: Enable proximity-based courier matching and delivery range management
-- Status: AWAITING APPROVAL (per HARD RULE #1)
-- ============================================================================

-- ⚠️ DO NOT RUN WITHOUT USER APPROVAL ⚠️
-- This migration creates proximity system tables and alters existing tables

-- ============================================================================
-- 1. CREATE PROXIMITY_SETTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS proximity_settings (
  setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  entity_type VARCHAR(20) NOT NULL, -- 'merchant', 'courier'
  entity_id UUID NOT NULL,
  
  -- Range settings
  delivery_range_km INTEGER DEFAULT 50,
  postal_code_ranges JSONB DEFAULT '[]'::jsonb,
  -- Example: [{"start": "1000", "end": "1999"}, {"start": "2000", "end": "2500"}]
  
  -- Coordinates (for distance calculation)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  
  -- Additional settings
  auto_accept_within_range BOOLEAN DEFAULT false,
  notify_on_nearby_orders BOOLEAN DEFAULT true,
  priority_zones JSONB DEFAULT '[]'::jsonb,
  -- Example: [{"postal_code": "1000", "priority": 1}]
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_entity UNIQUE(entity_type, entity_id),
  CONSTRAINT valid_entity_type CHECK (entity_type IN ('merchant', 'courier')),
  CONSTRAINT valid_range CHECK (delivery_range_km >= 0 AND delivery_range_km <= 1000),
  CONSTRAINT valid_coordinates CHECK (
    (latitude IS NULL AND longitude IS NULL) OR 
    (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
  )
);

-- ============================================================================
-- 2. CREATE INDEXES FOR PROXIMITY_SETTINGS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_proximity_user_id 
  ON proximity_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_proximity_entity 
  ON proximity_settings(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_proximity_coords 
  ON proximity_settings(latitude, longitude) 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_proximity_active 
  ON proximity_settings(is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_proximity_postal_code 
  ON proximity_settings(postal_code);

CREATE INDEX IF NOT EXISTS idx_proximity_city 
  ON proximity_settings(city);

-- ============================================================================
-- 3. CREATE POSTAL_CODES TABLE (Reference Data)
-- ============================================================================

CREATE TABLE IF NOT EXISTS postal_codes (
  postal_code_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  postal_code VARCHAR(20) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state_province VARCHAR(100),
  country VARCHAR(100) NOT NULL,
  
  -- Coordinates (center of postal code area)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_postal_code UNIQUE(postal_code, country)
);

CREATE INDEX IF NOT EXISTS idx_postal_codes_code 
  ON postal_codes(postal_code);

CREATE INDEX IF NOT EXISTS idx_postal_codes_city 
  ON postal_codes(city);

CREATE INDEX IF NOT EXISTS idx_postal_codes_country 
  ON postal_codes(country);

CREATE INDEX IF NOT EXISTS idx_postal_codes_coords 
  ON postal_codes(latitude, longitude) 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ============================================================================
-- 4. CREATE PROXIMITY_MATCHES TABLE (Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS proximity_matches (
  match_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
  merchant_id UUID REFERENCES merchants(merchant_id),
  courier_id UUID REFERENCES couriers(courier_id),
  
  -- Match details
  distance_km DECIMAL(10, 2),
  within_postal_range BOOLEAN DEFAULT false,
  match_score INTEGER, -- 0-100, based on distance, rating, etc.
  
  -- Status
  match_status VARCHAR(20) DEFAULT 'suggested', -- 'suggested', 'accepted', 'rejected', 'expired'
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  match_criteria JSONB DEFAULT '{}'::jsonb,
  -- Example: {"distance": 25, "postal_match": true, "rating": 4.5}
  
  CONSTRAINT valid_match_status CHECK (
    match_status IN ('suggested', 'accepted', 'rejected', 'expired')
  )
);

CREATE INDEX IF NOT EXISTS idx_proximity_matches_order 
  ON proximity_matches(order_id);

CREATE INDEX IF NOT EXISTS idx_proximity_matches_merchant 
  ON proximity_matches(merchant_id);

CREATE INDEX IF NOT EXISTS idx_proximity_matches_courier 
  ON proximity_matches(courier_id);

CREATE INDEX IF NOT EXISTS idx_proximity_matches_status 
  ON proximity_matches(match_status);

CREATE INDEX IF NOT EXISTS idx_proximity_matches_score 
  ON proximity_matches(match_score DESC);

-- ============================================================================
-- 5. ALTER EXISTING TABLES (REQUIRES APPROVAL ⚠️)
-- ============================================================================

-- Add proximity columns to merchants table
DO $$ 
BEGIN
  -- Check if columns exist before adding
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'merchants' AND column_name = 'delivery_range_km'
  ) THEN
    ALTER TABLE merchants 
    ADD COLUMN delivery_range_km INTEGER DEFAULT 50,
    ADD COLUMN postal_code_ranges JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN latitude DECIMAL(10, 8),
    ADD COLUMN longitude DECIMAL(11, 8);
  END IF;
END $$;

-- Add proximity columns to couriers table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'couriers' AND column_name = 'service_range_km'
  ) THEN
    ALTER TABLE couriers 
    ADD COLUMN service_range_km INTEGER DEFAULT 100,
    ADD COLUMN postal_code_ranges JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN latitude DECIMAL(10, 8),
    ADD COLUMN longitude DECIMAL(11, 8);
  END IF;
END $$;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_merchants_coords 
  ON merchants(latitude, longitude) 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_couriers_coords 
  ON couriers(latitude, longitude) 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ============================================================================
-- 6. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function: Calculate distance between two coordinates (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance_km(
  lat1 DECIMAL,
  lon1 DECIMAL,
  lat2 DECIMAL,
  lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  earth_radius_km CONSTANT DECIMAL := 6371;
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  -- Return NULL if any coordinate is NULL
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN NULL;
  END IF;

  -- Convert to radians
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  -- Haversine formula
  a := sin(dlat/2) * sin(dlat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN earth_radius_km * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Check if postal code is in range
CREATE OR REPLACE FUNCTION is_postal_code_in_range(
  postal_code VARCHAR,
  postal_ranges JSONB
) RETURNS BOOLEAN AS $$
DECLARE
  range_item JSONB;
  start_code VARCHAR;
  end_code VARCHAR;
BEGIN
  -- If no ranges defined, return false
  IF postal_ranges IS NULL OR jsonb_array_length(postal_ranges) = 0 THEN
    RETURN false;
  END IF;

  -- Check each range
  FOR range_item IN SELECT * FROM jsonb_array_elements(postal_ranges)
  LOOP
    start_code := range_item->>'start';
    end_code := range_item->>'end';
    
    -- Simple string comparison (works for numeric postal codes)
    IF postal_code >= start_code AND postal_code <= end_code THEN
      RETURN true;
    END IF;
  END LOOP;

  RETURN false;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Find nearby couriers for an order
CREATE OR REPLACE FUNCTION find_nearby_couriers(
  p_merchant_id UUID,
  p_delivery_postal_code VARCHAR DEFAULT NULL,
  p_max_distance_km INTEGER DEFAULT 50,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  courier_id UUID,
  courier_name VARCHAR,
  distance_km DECIMAL,
  within_postal_range BOOLEAN,
  avg_rating DECIMAL,
  match_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH merchant_location AS (
    SELECT latitude, longitude, postal_code_ranges
    FROM merchants
    WHERE merchant_id = p_merchant_id
  ),
  courier_distances AS (
    SELECT 
      c.courier_id,
      c.courier_name,
      calculate_distance_km(
        m.latitude, m.longitude,
        c.latitude, c.longitude
      ) as distance,
      CASE 
        WHEN p_delivery_postal_code IS NOT NULL THEN
          is_postal_code_in_range(p_delivery_postal_code, c.postal_code_ranges)
        ELSE false
      END as postal_match,
      COALESCE(
        (SELECT AVG(rating) FROM reviews WHERE courier_id = c.courier_id),
        0
      ) as rating
    FROM couriers c
    CROSS JOIN merchant_location m
    WHERE c.is_active = true
      AND c.latitude IS NOT NULL 
      AND c.longitude IS NOT NULL
      AND m.latitude IS NOT NULL 
      AND m.longitude IS NOT NULL
  )
  SELECT 
    cd.courier_id,
    cd.courier_name,
    cd.distance,
    cd.postal_match,
    cd.rating,
    -- Calculate match score (0-100)
    (
      CASE 
        WHEN cd.distance <= 10 THEN 50
        WHEN cd.distance <= 25 THEN 40
        WHEN cd.distance <= 50 THEN 30
        ELSE 20
      END +
      CASE WHEN cd.postal_match THEN 30 ELSE 0 END +
      (cd.rating * 4)::INTEGER
    )::INTEGER as match_score
  FROM courier_distances cd
  WHERE cd.distance IS NOT NULL 
    AND cd.distance <= p_max_distance_km
  ORDER BY match_score DESC, cd.distance ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get proximity settings for entity
CREATE OR REPLACE FUNCTION get_proximity_settings(
  p_entity_type VARCHAR,
  p_entity_id UUID
) RETURNS TABLE (
  setting_id UUID,
  delivery_range_km INTEGER,
  postal_code_ranges JSONB,
  latitude DECIMAL,
  longitude DECIMAL,
  address TEXT,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.setting_id,
    ps.delivery_range_km,
    ps.postal_code_ranges,
    ps.latitude,
    ps.longitude,
    ps.address,
    ps.is_active
  FROM proximity_settings ps
  WHERE ps.entity_type = p_entity_type
    AND ps.entity_id = p_entity_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 7. CREATE TRIGGERS
-- ============================================================================

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_proximity_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_proximity_settings_updated_at
  BEFORE UPDATE ON proximity_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_proximity_settings_updated_at();

CREATE TRIGGER trigger_update_postal_codes_updated_at
  BEFORE UPDATE ON postal_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_proximity_settings_updated_at();

-- ============================================================================
-- 8. CREATE RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE proximity_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE postal_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proximity_matches ENABLE ROW LEVEL SECURITY;

-- Proximity Settings Policies
CREATE POLICY proximity_select_own ON proximity_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY proximity_update_own ON proximity_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY proximity_insert_own ON proximity_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY proximity_admin_all ON proximity_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.user_id = auth.uid() 
      AND users.user_role = 'admin'
    )
  );

-- Postal Codes Policies (public read)
CREATE POLICY postal_codes_public_select ON postal_codes
  FOR SELECT
  USING (true);

CREATE POLICY postal_codes_admin_all ON postal_codes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.user_id = auth.uid() 
      AND users.user_role = 'admin'
    )
  );

-- Proximity Matches Policies
CREATE POLICY proximity_matches_merchant_select ON proximity_matches
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM merchants m
      WHERE m.merchant_id = proximity_matches.merchant_id
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY proximity_matches_courier_select ON proximity_matches
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM couriers c
      WHERE c.courier_id = proximity_matches.courier_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY proximity_matches_admin_all ON proximity_matches
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.user_id = auth.uid() 
      AND users.user_role = 'admin'
    )
  );

-- ============================================================================
-- 9. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON proximity_settings TO authenticated;
GRANT SELECT ON postal_codes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON proximity_matches TO authenticated;

-- ============================================================================
-- 10. INSERT SAMPLE POSTAL CODES (Optional)
-- ============================================================================

-- Sample postal codes for testing (can be removed in production)
INSERT INTO postal_codes (postal_code, city, country, latitude, longitude) VALUES
  ('1000', 'Brussels', 'Belgium', 50.8503, 4.3517),
  ('2000', 'Antwerp', 'Belgium', 51.2194, 4.4025),
  ('3000', 'Leuven', 'Belgium', 50.8798, 4.7005),
  ('4000', 'Liège', 'Belgium', 50.6326, 5.5797),
  ('5000', 'Namur', 'Belgium', 50.4674, 4.8720),
  ('6000', 'Charleroi', 'Belgium', 50.4108, 4.4446),
  ('7000', 'Mons', 'Belgium', 50.4542, 3.9564),
  ('8000', 'Bruges', 'Belgium', 51.2093, 3.2247),
  ('9000', 'Ghent', 'Belgium', 51.0543, 3.7174)
ON CONFLICT (postal_code, country) DO NOTHING;

-- ============================================================================
-- 11. VERIFICATION QUERIES
-- ============================================================================

-- Check if tables were created
SELECT 
  'proximity_settings' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'proximity_settings'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
  'postal_codes',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'postal_codes'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'proximity_matches',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'proximity_matches'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END;

-- Check if columns were added to merchants
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'merchants' 
  AND column_name IN ('delivery_range_km', 'postal_code_ranges', 'latitude', 'longitude')
ORDER BY column_name;

-- Check if columns were added to couriers
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'couriers' 
  AND column_name IN ('service_range_km', 'postal_code_ranges', 'latitude', 'longitude')
ORDER BY column_name;

-- Test distance calculation function
SELECT calculate_distance_km(50.8503, 4.3517, 51.2194, 4.4025) as distance_brussels_antwerp_km;
-- Expected: ~44 km

-- Test postal code range function
SELECT is_postal_code_in_range(
  '1500',
  '[{"start": "1000", "end": "1999"}]'::jsonb
) as is_in_range;
-- Expected: true

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'PROXIMITY SYSTEM MIGRATION COMPLETE';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Tables Created:';
  RAISE NOTICE '   - proximity_settings';
  RAISE NOTICE '   - postal_codes';
  RAISE NOTICE '   - proximity_matches';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Tables Altered:';
  RAISE NOTICE '   - merchants (4 columns added)';
  RAISE NOTICE '   - couriers (4 columns added)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Indexes Created: 15 indexes';
  RAISE NOTICE '✅ Functions Created: 4 helper functions';
  RAISE NOTICE '✅ Triggers Created: 2 triggers';
  RAISE NOTICE '✅ RLS Policies: 9 policies';
  RAISE NOTICE '✅ Sample Data: 9 postal codes';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Security:';
  RAISE NOTICE '   - RLS enabled on all tables';
  RAISE NOTICE '   - User-specific access control';
  RAISE NOTICE '   - Admin full access';
  RAISE NOTICE '   - Public postal code read access';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;
