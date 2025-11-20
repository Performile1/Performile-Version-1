-- ============================================================================
-- COURIER PRICING SYSTEM - SIMPLE DEPLOYMENT
-- Run this entire file in Supabase SQL Editor
-- ============================================================================

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS pricing_distance_tiers CASCADE;
DROP TABLE IF EXISTS pricing_weight_tiers CASCADE;
DROP TABLE IF EXISTS pricing_surcharges CASCADE;
DROP TABLE IF EXISTS pricing_zones CASCADE;
DROP TABLE IF EXISTS courier_pricing CASCADE;

-- ============================================================================
-- TABLE 1: COURIER_PRICING
-- ============================================================================

CREATE TABLE courier_pricing (
  pricing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID REFERENCES couriers(courier_id) ON DELETE CASCADE,
  service_level VARCHAR(50) NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  price_per_kg DECIMAL(10,2) DEFAULT 0,
  price_per_km DECIMAL(10,2) DEFAULT 0,
  min_price DECIMAL(10,2),
  max_price DECIMAL(10,2),
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_to DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_service_level CHECK (service_level IN ('standard', 'express', 'same_day')),
  CONSTRAINT valid_prices CHECK (base_price >= 0 AND price_per_kg >= 0 AND price_per_km >= 0),
  CONSTRAINT valid_date_range CHECK (valid_to IS NULL OR valid_to >= valid_from)
);

CREATE INDEX idx_pricing_courier ON courier_pricing(courier_id);
CREATE INDEX idx_pricing_service ON courier_pricing(service_level);
CREATE INDEX idx_pricing_active ON courier_pricing(active) WHERE active = true;

ALTER TABLE courier_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active pricing" ON courier_pricing FOR SELECT TO public
USING (active = true AND (valid_to IS NULL OR valid_to >= CURRENT_DATE));

-- ============================================================================
-- TABLE 2: PRICING_ZONES
-- ============================================================================

CREATE TABLE pricing_zones (
  zone_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID REFERENCES couriers(courier_id) ON DELETE CASCADE,
  zone_name VARCHAR(100) NOT NULL,
  country VARCHAR(2) NOT NULL DEFAULT 'NO',
  postal_code_from VARCHAR(10) NOT NULL,
  postal_code_to VARCHAR(10) NOT NULL,
  zone_multiplier DECIMAL(5,2) DEFAULT 1.0,
  is_remote_area BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_multiplier CHECK (zone_multiplier >= 0.1 AND zone_multiplier <= 10.0),
  CONSTRAINT valid_postal_codes CHECK (postal_code_from <= postal_code_to)
);

CREATE INDEX idx_zones_courier ON pricing_zones(courier_id);
CREATE INDEX idx_zones_country ON pricing_zones(country);
CREATE INDEX idx_zones_postal ON pricing_zones(postal_code_from, postal_code_to);

ALTER TABLE pricing_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view zones" ON pricing_zones FOR SELECT TO public USING (true);

-- ============================================================================
-- TABLE 3: PRICING_SURCHARGES
-- ============================================================================

CREATE TABLE pricing_surcharges (
  surcharge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID REFERENCES couriers(courier_id) ON DELETE CASCADE,
  surcharge_type VARCHAR(50) NOT NULL,
  surcharge_name VARCHAR(100) NOT NULL,
  surcharge_amount DECIMAL(10,2),
  surcharge_percentage DECIMAL(5,2),
  applies_to VARCHAR(50) DEFAULT 'all',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_surcharge_type CHECK (surcharge_type IN ('fuel', 'remote_area', 'oversized', 'fragile', 'insurance', 'weekend', 'holiday', 'express_fee')),
  CONSTRAINT valid_applies_to CHECK (applies_to IN ('all', 'express', 'standard', 'same_day')),
  CONSTRAINT has_amount_or_percentage CHECK (
    (surcharge_amount IS NOT NULL AND surcharge_percentage IS NULL) OR
    (surcharge_amount IS NULL AND surcharge_percentage IS NOT NULL)
  )
);

CREATE INDEX idx_surcharges_courier ON pricing_surcharges(courier_id);
CREATE INDEX idx_surcharges_type ON pricing_surcharges(surcharge_type);
CREATE INDEX idx_surcharges_active ON pricing_surcharges(active) WHERE active = true;

ALTER TABLE pricing_surcharges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active surcharges" ON pricing_surcharges FOR SELECT TO public
USING (active = true);

-- ============================================================================
-- TABLE 4: PRICING_WEIGHT_TIERS
-- ============================================================================

CREATE TABLE pricing_weight_tiers (
  tier_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID REFERENCES couriers(courier_id) ON DELETE CASCADE,
  service_level VARCHAR(50) NOT NULL,
  weight_from DECIMAL(10,2) NOT NULL,
  weight_to DECIMAL(10,2) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_weight_service CHECK (service_level IN ('standard', 'express', 'same_day')),
  CONSTRAINT valid_weight_range CHECK (weight_to > weight_from),
  CONSTRAINT valid_weight_price CHECK (price >= 0)
);

CREATE INDEX idx_weight_tiers_courier ON pricing_weight_tiers(courier_id);
CREATE INDEX idx_weight_tiers_service ON pricing_weight_tiers(service_level);
CREATE INDEX idx_weight_tiers_range ON pricing_weight_tiers(weight_from, weight_to);

ALTER TABLE pricing_weight_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view weight tiers" ON pricing_weight_tiers FOR SELECT TO public USING (true);

-- ============================================================================
-- TABLE 5: PRICING_DISTANCE_TIERS
-- ============================================================================

CREATE TABLE pricing_distance_tiers (
  tier_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID REFERENCES couriers(courier_id) ON DELETE CASCADE,
  service_level VARCHAR(50) NOT NULL,
  distance_from INTEGER NOT NULL,
  distance_to INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_distance_service CHECK (service_level IN ('standard', 'express', 'same_day')),
  CONSTRAINT valid_distance_range CHECK (distance_to > distance_from),
  CONSTRAINT valid_distance_price CHECK (price >= 0)
);

CREATE INDEX idx_distance_tiers_courier ON pricing_distance_tiers(courier_id);
CREATE INDEX idx_distance_tiers_service ON pricing_distance_tiers(service_level);
CREATE INDEX idx_distance_tiers_range ON pricing_distance_tiers(distance_from, distance_to);

ALTER TABLE pricing_distance_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view distance tiers" ON pricing_distance_tiers FOR SELECT TO public USING (true);

-- ============================================================================
-- SAMPLE DATA FOR POSTNORD
-- ============================================================================

DO $$
DECLARE
  v_postnord_id UUID;
BEGIN
  SELECT courier_id INTO v_postnord_id FROM couriers WHERE courier_name = 'PostNord' LIMIT 1;
  
  IF v_postnord_id IS NOT NULL THEN
    -- Base pricing
    INSERT INTO courier_pricing (courier_id, service_level, base_price, price_per_kg, price_per_km, min_price, max_price)
    VALUES 
      (v_postnord_id, 'standard', 69.00, 8.00, 1.50, 69.00, 299.00),
      (v_postnord_id, 'express', 129.00, 12.00, 2.50, 129.00, 349.00);
    
    -- Weight tiers
    INSERT INTO pricing_weight_tiers (courier_id, service_level, weight_from, weight_to, price)
    VALUES
      (v_postnord_id, 'standard', 0, 2, 69.00),
      (v_postnord_id, 'standard', 2, 5, 89.00),
      (v_postnord_id, 'standard', 5, 10, 119.00),
      (v_postnord_id, 'standard', 10, 20, 159.00),
      (v_postnord_id, 'standard', 20, 35, 219.00),
      (v_postnord_id, 'express', 0, 2, 129.00),
      (v_postnord_id, 'express', 2, 5, 149.00),
      (v_postnord_id, 'express', 5, 10, 189.00),
      (v_postnord_id, 'express', 10, 20, 249.00);
    
    -- Distance tiers
    INSERT INTO pricing_distance_tiers (courier_id, service_level, distance_from, distance_to, price)
    VALUES
      (v_postnord_id, 'standard', 0, 50, 0),
      (v_postnord_id, 'standard', 50, 200, 10.00),
      (v_postnord_id, 'standard', 200, 999, 20.00),
      (v_postnord_id, 'express', 0, 50, 0),
      (v_postnord_id, 'express', 50, 200, 20.00),
      (v_postnord_id, 'express', 200, 999, 40.00);
    
    -- Surcharges (percentage)
    INSERT INTO pricing_surcharges (courier_id, surcharge_type, surcharge_name, surcharge_percentage, applies_to)
    VALUES (v_postnord_id, 'fuel', 'Fuel Surcharge', 12.0, 'all');
    
    -- Surcharges (fixed amount)
    INSERT INTO pricing_surcharges (courier_id, surcharge_type, surcharge_name, surcharge_amount, applies_to)
    VALUES
      (v_postnord_id, 'remote_area', 'Remote Area Fee', 50.00, 'all'),
      (v_postnord_id, 'weekend', 'Weekend Delivery', 100.00, 'all');
    
    -- Zones
    INSERT INTO pricing_zones (courier_id, zone_name, country, postal_code_from, postal_code_to, zone_multiplier, is_remote_area)
    VALUES
      (v_postnord_id, 'Oslo Region', 'NO', '0000', '0999', 1.0, false),
      (v_postnord_id, 'Eastern Norway', 'NO', '1000', '1999', 1.0, false),
      (v_postnord_id, 'Southern Norway', 'NO', '3000', '4999', 1.05, false),
      (v_postnord_id, 'Western Norway', 'NO', '5000', '6999', 1.10, false),
      (v_postnord_id, 'Central Norway', 'NO', '7000', '7999', 1.15, false),
      (v_postnord_id, 'Northern Norway', 'NO', '8000', '8999', 1.25, true),
      (v_postnord_id, 'Finnmark', 'NO', '9000', '9999', 1.50, true);
    
    RAISE NOTICE 'Sample pricing data inserted for PostNord';
  ELSE
    RAISE NOTICE 'PostNord courier not found - skipping sample data';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '- courier_pricing: % rows', (SELECT COUNT(*) FROM courier_pricing);
  RAISE NOTICE '- pricing_zones: % rows', (SELECT COUNT(*) FROM pricing_zones);
  RAISE NOTICE '- pricing_surcharges: % rows', (SELECT COUNT(*) FROM pricing_surcharges);
  RAISE NOTICE '- pricing_weight_tiers: % rows', (SELECT COUNT(*) FROM pricing_weight_tiers);
  RAISE NOTICE '- pricing_distance_tiers: % rows', (SELECT COUNT(*) FROM pricing_distance_tiers);
  RAISE NOTICE 'Deployment complete!';
END $$;
