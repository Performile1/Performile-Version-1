-- ============================================================================
-- COURIER PRICING SYSTEM - COMPLETE IMPLEMENTATION
-- ============================================================================
-- Date: November 10, 2025
-- Purpose: Build complete courier base pricing system
-- Includes: Base prices, weight/distance tiers, zones, surcharges, volumetric weight, CSV uploads
-- ============================================================================

-- ============================================================================
-- TABLE 1: courier_base_prices
-- Base prices per courier and service type
-- ============================================================================

CREATE TABLE IF NOT EXISTS courier_base_prices (
    price_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('express', 'standard', 'economy', 'same_day', 'scheduled', 'overnight')),
    
    -- Pricing
    base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
    currency VARCHAR(3) DEFAULT 'NOK',
    
    -- Data source tracking
    price_source VARCHAR(20) DEFAULT 'manual' CHECK (price_source IN ('manual', 'csv_upload', 'api', 'cached_api')),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID REFERENCES users(user_id),
    
    -- Validity period
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(courier_id, service_type, effective_from)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_courier_base_prices_courier ON courier_base_prices(courier_id);
CREATE INDEX IF NOT EXISTS idx_courier_base_prices_service ON courier_base_prices(service_type);
CREATE INDEX IF NOT EXISTS idx_courier_base_prices_active ON courier_base_prices(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_courier_base_prices_effective ON courier_base_prices(effective_from, effective_to);

-- RLS
ALTER TABLE courier_base_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "courier_base_prices_select" ON courier_base_prices FOR SELECT USING (true);
CREATE POLICY "courier_base_prices_insert" ON courier_base_prices FOR INSERT WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'courier'));
CREATE POLICY "courier_base_prices_update" ON courier_base_prices FOR UPDATE USING (auth.jwt() ->> 'role' IN ('admin', 'courier'));
CREATE POLICY "courier_base_prices_delete" ON courier_base_prices FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

COMMENT ON TABLE courier_base_prices IS 'Base prices per courier and service type';

-- ============================================================================
-- TABLE 2: courier_weight_pricing
-- Weight-based pricing tiers
-- ============================================================================

CREATE TABLE IF NOT EXISTS courier_weight_pricing (
    weight_price_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL,
    
    -- Weight range (in kg)
    min_weight DECIMAL(10,2) NOT NULL CHECK (min_weight >= 0),
    max_weight DECIMAL(10,2) NOT NULL CHECK (max_weight > min_weight),
    
    -- Pricing
    price_per_kg DECIMAL(10,2) CHECK (price_per_kg >= 0),
    fixed_price DECIMAL(10,2) CHECK (fixed_price >= 0),
    currency VARCHAR(3) DEFAULT 'NOK',
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CHECK (price_per_kg IS NOT NULL OR fixed_price IS NOT NULL),
    UNIQUE(courier_id, service_type, min_weight, max_weight)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_courier_weight_pricing_courier ON courier_weight_pricing(courier_id);
CREATE INDEX IF NOT EXISTS idx_courier_weight_pricing_service ON courier_weight_pricing(service_type);
CREATE INDEX IF NOT EXISTS idx_courier_weight_pricing_range ON courier_weight_pricing(min_weight, max_weight);

-- RLS
ALTER TABLE courier_weight_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "courier_weight_pricing_select" ON courier_weight_pricing FOR SELECT USING (true);
CREATE POLICY "courier_weight_pricing_insert" ON courier_weight_pricing FOR INSERT WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'courier'));
CREATE POLICY "courier_weight_pricing_update" ON courier_weight_pricing FOR UPDATE USING (auth.jwt() ->> 'role' IN ('admin', 'courier'));
CREATE POLICY "courier_weight_pricing_delete" ON courier_weight_pricing FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

COMMENT ON TABLE courier_weight_pricing IS 'Weight-based pricing tiers per courier';

-- ============================================================================
-- TABLE 3: courier_distance_pricing
-- Distance-based pricing tiers
-- ============================================================================

CREATE TABLE IF NOT EXISTS courier_distance_pricing (
    distance_price_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL,
    
    -- Distance range (in km)
    min_distance DECIMAL(10,2) NOT NULL CHECK (min_distance >= 0),
    max_distance DECIMAL(10,2) NOT NULL CHECK (max_distance > min_distance),
    
    -- Pricing
    price_per_km DECIMAL(10,2) CHECK (price_per_km >= 0),
    fixed_price DECIMAL(10,2) CHECK (fixed_price >= 0),
    currency VARCHAR(3) DEFAULT 'NOK',
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CHECK (price_per_km IS NOT NULL OR fixed_price IS NOT NULL),
    UNIQUE(courier_id, service_type, min_distance, max_distance)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_courier_distance_pricing_courier ON courier_distance_pricing(courier_id);
CREATE INDEX IF NOT EXISTS idx_courier_distance_pricing_service ON courier_distance_pricing(service_type);
CREATE INDEX IF NOT EXISTS idx_courier_distance_pricing_range ON courier_distance_pricing(min_distance, max_distance);

-- RLS
ALTER TABLE courier_distance_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "courier_distance_pricing_select" ON courier_distance_pricing FOR SELECT USING (true);
CREATE POLICY "courier_distance_pricing_insert" ON courier_distance_pricing FOR INSERT WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'courier'));
CREATE POLICY "courier_distance_pricing_update" ON courier_distance_pricing FOR UPDATE USING (auth.jwt() ->> 'role' IN ('admin', 'courier'));
CREATE POLICY "courier_distance_pricing_delete" ON courier_distance_pricing FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

COMMENT ON TABLE courier_distance_pricing IS 'Distance-based pricing tiers per courier';

-- ============================================================================
-- TABLE 4: postal_code_zones
-- Postal code zones with pricing multipliers
-- ============================================================================

CREATE TABLE IF NOT EXISTS postal_code_zones (
    zone_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_name VARCHAR(100) NOT NULL,
    country VARCHAR(2) NOT NULL DEFAULT 'NO',
    
    -- Postal code pattern matching
    postal_code_pattern VARCHAR(10) NOT NULL, -- e.g., '01%', '90%', '97%'
    
    -- Zone multiplier
    zone_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.0 CHECK (zone_multiplier >= 0),
    
    -- Classification
    is_remote_area BOOLEAN DEFAULT false,
    is_island BOOLEAN DEFAULT false,
    is_mountain_area BOOLEAN DEFAULT false,
    
    -- Metadata
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(country, postal_code_pattern)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_postal_code_zones_country ON postal_code_zones(country);
CREATE INDEX IF NOT EXISTS idx_postal_code_zones_pattern ON postal_code_zones(postal_code_pattern);
CREATE INDEX IF NOT EXISTS idx_postal_code_zones_active ON postal_code_zones(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_postal_code_zones_remote ON postal_code_zones(is_remote_area) WHERE is_remote_area = true;

-- RLS
ALTER TABLE postal_code_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "postal_code_zones_select" ON postal_code_zones FOR SELECT USING (true);
CREATE POLICY "postal_code_zones_insert" ON postal_code_zones FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "postal_code_zones_update" ON postal_code_zones FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "postal_code_zones_delete" ON postal_code_zones FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

COMMENT ON TABLE postal_code_zones IS 'Postal code zones with pricing multipliers for remote/special areas';

-- ============================================================================
-- TABLE 5: courier_surcharge_rules
-- Surcharge rules per courier
-- ============================================================================

CREATE TABLE IF NOT EXISTS courier_surcharge_rules (
    surcharge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
    
    -- Surcharge details
    surcharge_type VARCHAR(50) NOT NULL CHECK (surcharge_type IN ('fuel', 'insurance', 'handling', 'remote_area', 'oversized', 'dangerous_goods', 'weekend', 'holiday', 'express_fee')),
    surcharge_name VARCHAR(100) NOT NULL,
    
    -- Amount calculation
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    amount_type VARCHAR(20) NOT NULL CHECK (amount_type IN ('fixed', 'percentage', 'per_kg', 'per_km')),
    currency VARCHAR(3) DEFAULT 'NOK',
    
    -- Conditions for application
    applies_to VARCHAR(50) DEFAULT 'all', -- 'all', 'express', 'standard', 'international', 'domestic'
    min_weight DECIMAL(10,2), -- Apply if weight >= this
    max_weight DECIMAL(10,2), -- Apply if weight <= this
    min_distance DECIMAL(10,2), -- Apply if distance >= this
    postal_code_pattern VARCHAR(10), -- Apply to specific postal codes
    
    -- Validity
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_courier_surcharge_rules_courier ON courier_surcharge_rules(courier_id);
CREATE INDEX IF NOT EXISTS idx_courier_surcharge_rules_type ON courier_surcharge_rules(surcharge_type);
CREATE INDEX IF NOT EXISTS idx_courier_surcharge_rules_active ON courier_surcharge_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_courier_surcharge_rules_effective ON courier_surcharge_rules(effective_from, effective_to);

-- RLS
ALTER TABLE courier_surcharge_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "courier_surcharge_rules_select" ON courier_surcharge_rules FOR SELECT USING (true);
CREATE POLICY "courier_surcharge_rules_insert" ON courier_surcharge_rules FOR INSERT WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'courier'));
CREATE POLICY "courier_surcharge_rules_update" ON courier_surcharge_rules FOR UPDATE USING (auth.jwt() ->> 'role' IN ('admin', 'courier'));
CREATE POLICY "courier_surcharge_rules_delete" ON courier_surcharge_rules FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

COMMENT ON TABLE courier_surcharge_rules IS 'Surcharge rules and fees per courier';

-- ============================================================================
-- TABLE 6: courier_volumetric_rules
-- Volumetric weight calculation rules per courier
-- ============================================================================

CREATE TABLE IF NOT EXISTS courier_volumetric_rules (
    rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL,
    
    -- Volumetric calculation
    volumetric_divisor INTEGER NOT NULL DEFAULT 5000 CHECK (volumetric_divisor > 0), -- e.g., 5000 for (L×W×H)/5000
    measurement_unit VARCHAR(10) DEFAULT 'cm' CHECK (measurement_unit IN ('cm', 'inches')),
    
    -- Application rules
    applies_when VARCHAR(50) DEFAULT 'if_greater_than_actual' CHECK (applies_when IN ('always', 'if_greater_than_actual', 'international_only', 'never')),
    min_dimensions_cm DECIMAL(10,2), -- Minimum size to apply rule
    
    -- Metadata
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(courier_id, service_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_courier_volumetric_rules_courier ON courier_volumetric_rules(courier_id);
CREATE INDEX IF NOT EXISTS idx_courier_volumetric_rules_service ON courier_volumetric_rules(service_type);
CREATE INDEX IF NOT EXISTS idx_courier_volumetric_rules_active ON courier_volumetric_rules(is_active) WHERE is_active = true;

-- RLS
ALTER TABLE courier_volumetric_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "courier_volumetric_rules_select" ON courier_volumetric_rules FOR SELECT USING (true);
CREATE POLICY "courier_volumetric_rules_insert" ON courier_volumetric_rules FOR INSERT WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'courier'));
CREATE POLICY "courier_volumetric_rules_update" ON courier_volumetric_rules FOR UPDATE USING (auth.jwt() ->> 'role' IN ('admin', 'courier'));
CREATE POLICY "courier_volumetric_rules_delete" ON courier_volumetric_rules FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

COMMENT ON TABLE courier_volumetric_rules IS 'Volumetric weight calculation rules per courier';

-- ============================================================================
-- TABLE 7: pricing_csv_uploads
-- Track CSV file uploads for pricing data
-- ============================================================================

CREATE TABLE IF NOT EXISTS pricing_csv_uploads (
    upload_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    courier_id UUID REFERENCES couriers(courier_id) ON DELETE SET NULL,
    uploaded_by UUID NOT NULL REFERENCES users(user_id),
    
    -- File details
    filename VARCHAR(255) NOT NULL,
    file_size INTEGER,
    row_count INTEGER,
    
    -- Processing status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'partially_completed')),
    rows_processed INTEGER DEFAULT 0,
    rows_failed INTEGER DEFAULT 0,
    rows_skipped INTEGER DEFAULT 0,
    
    -- Error tracking
    error_log TEXT,
    warnings JSONB,
    
    -- Metadata
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Upload metadata
    upload_type VARCHAR(50), -- 'base_prices', 'weight_pricing', 'distance_pricing', 'surcharges', 'complete'
    replace_existing BOOLEAN DEFAULT false
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pricing_csv_uploads_courier ON pricing_csv_uploads(courier_id);
CREATE INDEX IF NOT EXISTS idx_pricing_csv_uploads_user ON pricing_csv_uploads(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_pricing_csv_uploads_status ON pricing_csv_uploads(status);
CREATE INDEX IF NOT EXISTS idx_pricing_csv_uploads_date ON pricing_csv_uploads(uploaded_at DESC);

-- RLS
ALTER TABLE pricing_csv_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pricing_csv_uploads_select" ON pricing_csv_uploads FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'courier') OR uploaded_by = auth.uid());
CREATE POLICY "pricing_csv_uploads_insert" ON pricing_csv_uploads FOR INSERT WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'courier'));
CREATE POLICY "pricing_csv_uploads_update" ON pricing_csv_uploads FOR UPDATE USING (auth.jwt() ->> 'role' IN ('admin', 'courier'));

COMMENT ON TABLE pricing_csv_uploads IS 'Track CSV file uploads for courier pricing data';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all tables created
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name IN (
    'courier_base_prices',
    'courier_weight_pricing',
    'courier_distance_pricing',
    'postal_code_zones',
    'courier_surcharge_rules',
    'courier_volumetric_rules',
    'pricing_csv_uploads'
)
ORDER BY table_name;

-- Check RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN (
    'courier_base_prices',
    'courier_weight_pricing',
    'courier_distance_pricing',
    'postal_code_zones',
    'courier_surcharge_rules',
    'courier_volumetric_rules',
    'pricing_csv_uploads'
)
ORDER BY tablename;

-- Check indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE tablename IN (
    'courier_base_prices',
    'courier_weight_pricing',
    'courier_distance_pricing',
    'postal_code_zones',
    'courier_surcharge_rules',
    'courier_volumetric_rules',
    'pricing_csv_uploads'
)
ORDER BY tablename, indexname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Courier Pricing System Tables Created Successfully!';
    RAISE NOTICE '📊 7 tables created with indexes and RLS policies';
    RAISE NOTICE '🎯 Ready for sample data and functions';
END $$;
