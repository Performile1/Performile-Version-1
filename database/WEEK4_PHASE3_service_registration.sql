-- ============================================================================
-- WEEK 4 - PHASE 3: SERVICE REGISTRATION & OFFERINGS
-- ============================================================================
-- Created: October 19, 2025, 8:40 PM
-- Purpose: Detailed service offerings, pricing, and configuration per courier
-- Dependencies: couriers, servicetypes, coverage_zones tables
-- ============================================================================

-- ============================================================================
-- TABLE 1: courier_service_offerings
-- Purpose: Main service configuration and capabilities per courier
-- ============================================================================

CREATE TABLE IF NOT EXISTS courier_service_offerings (
    offering_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
    service_type_id UUID NOT NULL REFERENCES servicetypes(service_type_id) ON DELETE CASCADE,
    
    -- Service Identification
    service_name VARCHAR(200) NOT NULL, -- e.g., "DHL Express 12:00", "PostNord MyPack"
    service_code VARCHAR(100), -- Internal code
    service_description TEXT,
    
    -- Service Category
    service_category VARCHAR(50) CHECK (service_category IN (
        'standard', 'express', 'economy', 'premium', 'same_day', 'next_day', 'international'
    )),
    
    -- Availability
    is_active BOOLEAN DEFAULT true,
    is_available_for_booking BOOLEAN DEFAULT true,
    available_from_date DATE,
    available_to_date DATE,
    
    -- Delivery Specifications
    standard_delivery_days INTEGER,
    min_delivery_days INTEGER,
    max_delivery_days INTEGER,
    guaranteed_delivery BOOLEAN DEFAULT false,
    
    -- Time Windows
    cutoff_time TIME, -- Order by this time for same-day processing
    delivery_time_from TIME, -- Delivery window start
    delivery_time_to TIME, -- Delivery window end
    saturday_delivery BOOLEAN DEFAULT false,
    sunday_delivery BOOLEAN DEFAULT false,
    
    -- Package Specifications
    min_weight_kg DECIMAL(8,2) DEFAULT 0.00,
    max_weight_kg DECIMAL(8,2),
    min_dimensions_cm VARCHAR(50), -- e.g., "10x10x10"
    max_dimensions_cm VARCHAR(50), -- e.g., "120x80x80"
    max_volume_cm3 INTEGER,
    
    -- Restrictions
    restricted_items TEXT[], -- Array of restricted item types
    requires_signature BOOLEAN DEFAULT false,
    age_verification_required BOOLEAN DEFAULT false,
    id_verification_required BOOLEAN DEFAULT false,
    
    -- Capabilities
    tracking_available BOOLEAN DEFAULT true,
    real_time_tracking BOOLEAN DEFAULT false,
    proof_of_delivery BOOLEAN DEFAULT true,
    photo_on_delivery BOOLEAN DEFAULT false,
    sms_notification BOOLEAN DEFAULT true,
    email_notification BOOLEAN DEFAULT true,
    delivery_instructions BOOLEAN DEFAULT true,
    safe_place_delivery BOOLEAN DEFAULT false,
    neighbor_delivery BOOLEAN DEFAULT false,
    
    -- Insurance & Liability
    insurance_included BOOLEAN DEFAULT false,
    max_insurance_value_sek DECIMAL(10,2),
    liability_limit_sek DECIMAL(10,2),
    
    -- Returns
    returns_supported BOOLEAN DEFAULT false,
    return_label_included BOOLEAN DEFAULT false,
    return_pickup_available BOOLEAN DEFAULT false,
    
    -- Integration
    api_integration_available BOOLEAN DEFAULT false,
    webhook_support BOOLEAN DEFAULT false,
    label_generation_api BOOLEAN DEFAULT false,
    
    -- SLA (Service Level Agreement)
    sla_on_time_percentage DECIMAL(5,2), -- e.g., 95.00 = 95%
    sla_compensation_policy TEXT,
    
    -- Pricing Summary (detailed pricing in separate table)
    base_price_sek DECIMAL(10,2),
    price_calculation_method VARCHAR(50) CHECK (price_calculation_method IN (
        'flat_rate', 'weight_based', 'distance_based', 'zone_based', 'dimensional_weight', 'custom'
    )),
    
    -- Additional Fees
    fuel_surcharge_percentage DECIMAL(5,2),
    remote_area_surcharge_sek DECIMAL(10,2),
    
    -- Metadata
    terms_and_conditions_url VARCHAR(255),
    service_guide_url VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(courier_id, service_code),
    UNIQUE(courier_id, service_type_id, service_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_courier_service_offerings_courier ON courier_service_offerings(courier_id);
CREATE INDEX IF NOT EXISTS idx_courier_service_offerings_service_type ON courier_service_offerings(service_type_id);
CREATE INDEX IF NOT EXISTS idx_courier_service_offerings_category ON courier_service_offerings(service_category);
CREATE INDEX IF NOT EXISTS idx_courier_service_offerings_active ON courier_service_offerings(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_courier_service_offerings_composite ON courier_service_offerings(courier_id, service_type_id, is_active);

-- ============================================================================
-- TABLE 2: courier_service_pricing
-- Purpose: Detailed pricing tiers and rules
-- ============================================================================

CREATE TABLE IF NOT EXISTS courier_service_pricing (
    pricing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offering_id UUID NOT NULL REFERENCES courier_service_offerings(offering_id) ON DELETE CASCADE,
    
    -- Pricing Tier
    tier_name VARCHAR(100), -- e.g., "0-5kg", "Zone 1", "Express"
    tier_order INTEGER DEFAULT 0, -- For sorting
    
    -- Weight-Based Pricing
    weight_from_kg DECIMAL(8,2),
    weight_to_kg DECIMAL(8,2),
    price_per_kg DECIMAL(10,2),
    
    -- Distance-Based Pricing
    distance_from_km DECIMAL(10,2),
    distance_to_km DECIMAL(10,2),
    price_per_km DECIMAL(10,2),
    
    -- Zone-Based Pricing
    zone_id UUID REFERENCES coverage_zones(zone_id) ON DELETE SET NULL,
    zone_price DECIMAL(10,2),
    
    -- Flat Rate
    flat_rate_price DECIMAL(10,2),
    
    -- Dimensional Weight
    volumetric_divisor INTEGER, -- e.g., 5000 for (L*W*H)/5000
    
    -- Additional Fees
    handling_fee DECIMAL(10,2),
    fuel_surcharge DECIMAL(10,2),
    insurance_fee_percentage DECIMAL(5,2),
    
    -- Discounts
    volume_discount_threshold INTEGER, -- Number of packages
    volume_discount_percentage DECIMAL(5,2),
    
    -- Validity
    valid_from DATE,
    valid_to DATE,
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_courier_service_pricing_offering ON courier_service_pricing(offering_id);
CREATE INDEX IF NOT EXISTS idx_courier_service_pricing_zone ON courier_service_pricing(zone_id);
CREATE INDEX IF NOT EXISTS idx_courier_service_pricing_active ON courier_service_pricing(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_courier_service_pricing_weight ON courier_service_pricing(weight_from_kg, weight_to_kg);

-- ============================================================================
-- TABLE 3: courier_service_zones
-- Purpose: Zone-specific service configurations
-- ============================================================================

CREATE TABLE IF NOT EXISTS courier_service_zones (
    service_zone_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offering_id UUID NOT NULL REFERENCES courier_service_offerings(offering_id) ON DELETE CASCADE,
    zone_id UUID NOT NULL REFERENCES coverage_zones(zone_id) ON DELETE CASCADE,
    
    -- Service Availability in Zone
    is_available BOOLEAN DEFAULT true,
    
    -- Zone-Specific Delivery Times
    standard_delivery_days INTEGER,
    express_delivery_days INTEGER,
    same_day_available BOOLEAN DEFAULT false,
    
    -- Zone-Specific Restrictions
    max_weight_kg DECIMAL(8,2),
    max_dimensions_cm VARCHAR(50),
    restricted_items TEXT[],
    
    -- Zone-Specific Pricing Override
    base_price_override DECIMAL(10,2),
    price_multiplier DECIMAL(5,2) DEFAULT 1.00,
    
    -- Additional Fees for Zone
    remote_area_surcharge DECIMAL(10,2),
    island_surcharge DECIMAL(10,2),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(offering_id, zone_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_courier_service_zones_offering ON courier_service_zones(offering_id);
CREATE INDEX IF NOT EXISTS idx_courier_service_zones_zone ON courier_service_zones(zone_id);
CREATE INDEX IF NOT EXISTS idx_courier_service_zones_available ON courier_service_zones(is_available) WHERE is_available = true;

-- ============================================================================
-- TABLE 4: service_certifications
-- Purpose: Track certifications and compliance
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_certifications (
    certification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offering_id UUID REFERENCES courier_service_offerings(offering_id) ON DELETE CASCADE,
    courier_id UUID REFERENCES couriers(courier_id) ON DELETE CASCADE,
    
    -- Certification Type
    certification_type VARCHAR(100) NOT NULL CHECK (certification_type IN (
        'iso_9001', 'iso_14001', 'iso_27001', 'gdpr_compliant', 'carbon_neutral',
        'cool_chain', 'hazmat', 'pharmaceutical', 'food_safety', 'tapa', 'aeo',
        'organic_certified', 'fair_trade', 'b_corp', 'other'
    )),
    
    -- Certification Details
    certification_name VARCHAR(200),
    certification_number VARCHAR(100),
    issuing_authority VARCHAR(200),
    
    -- Validity
    issued_date DATE,
    expiry_date DATE,
    is_valid BOOLEAN DEFAULT true,
    
    -- Documentation
    certificate_url VARCHAR(255),
    verification_url VARCHAR(255),
    
    -- Scope
    scope_description TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CHECK (offering_id IS NOT NULL OR courier_id IS NOT NULL)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_service_certifications_offering ON service_certifications(offering_id);
CREATE INDEX IF NOT EXISTS idx_service_certifications_courier ON service_certifications(courier_id);
CREATE INDEX IF NOT EXISTS idx_service_certifications_type ON service_certifications(certification_type);
CREATE INDEX IF NOT EXISTS idx_service_certifications_valid ON service_certifications(is_valid) WHERE is_valid = true;

-- ============================================================================
-- TABLE 5: service_availability_calendar
-- Purpose: Track service availability exceptions (holidays, maintenance, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_availability_calendar (
    calendar_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offering_id UUID NOT NULL REFERENCES courier_service_offerings(offering_id) ON DELETE CASCADE,
    
    -- Date Range
    unavailable_from DATE NOT NULL,
    unavailable_to DATE NOT NULL,
    
    -- Reason
    reason VARCHAR(100) CHECK (reason IN (
        'holiday', 'maintenance', 'weather', 'strike', 'capacity', 'other'
    )),
    reason_description TEXT,
    
    -- Impact
    is_completely_unavailable BOOLEAN DEFAULT true,
    limited_capacity_percentage DECIMAL(5,2), -- If partially available
    
    -- Alternative Service
    alternative_offering_id UUID REFERENCES courier_service_offerings(offering_id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_service_availability_calendar_offering ON service_availability_calendar(offering_id);
CREATE INDEX IF NOT EXISTS idx_service_availability_calendar_dates ON service_availability_calendar(unavailable_from, unavailable_to);

-- ============================================================================
-- MATERIALIZED VIEW: service_offerings_summary
-- Purpose: Quick access to service offerings with pricing
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS service_offerings_summary AS
SELECT 
    cso.offering_id,
    cso.courier_id,
    c.courier_name,
    cso.service_type_id,
    st.service_name as service_type_name,
    cso.service_name,
    cso.service_code,
    cso.service_category,
    cso.is_active,
    cso.is_available_for_booking,
    
    -- Delivery Specs
    cso.standard_delivery_days,
    cso.guaranteed_delivery,
    cso.saturday_delivery,
    cso.sunday_delivery,
    
    -- Package Specs
    cso.max_weight_kg,
    cso.max_dimensions_cm,
    
    -- Capabilities
    cso.tracking_available,
    cso.real_time_tracking,
    cso.sms_notification,
    cso.email_notification,
    
    -- Pricing
    cso.base_price_sek,
    cso.price_calculation_method,
    
    -- SLA
    cso.sla_on_time_percentage,
    
    -- Certifications Count
    COUNT(DISTINCT sc.certification_id) as certifications_count,
    
    -- Pricing Tiers Count
    COUNT(DISTINCT csp.pricing_id) as pricing_tiers_count,
    
    -- Zones Count
    COUNT(DISTINCT csz.zone_id) as zones_count,
    
    -- Timestamps
    cso.created_at,
    cso.updated_at

FROM courier_service_offerings cso
JOIN couriers c ON cso.courier_id = c.courier_id
JOIN servicetypes st ON cso.service_type_id = st.service_type_id
LEFT JOIN service_certifications sc ON cso.offering_id = sc.offering_id AND sc.is_valid = true
LEFT JOIN courier_service_pricing csp ON cso.offering_id = csp.offering_id AND csp.is_active = true
LEFT JOIN courier_service_zones csz ON cso.offering_id = csz.offering_id AND csz.is_available = true
WHERE cso.is_active = true
GROUP BY 
    cso.offering_id,
    cso.courier_id,
    c.courier_name,
    cso.service_type_id,
    st.service_name,
    cso.service_name,
    cso.service_code,
    cso.service_category,
    cso.is_active,
    cso.is_available_for_booking,
    cso.standard_delivery_days,
    cso.guaranteed_delivery,
    cso.saturday_delivery,
    cso.sunday_delivery,
    cso.max_weight_kg,
    cso.max_dimensions_cm,
    cso.tracking_available,
    cso.real_time_tracking,
    cso.sms_notification,
    cso.email_notification,
    cso.base_price_sek,
    cso.price_calculation_method,
    cso.sla_on_time_percentage,
    cso.created_at,
    cso.updated_at;

-- Unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_offerings_summary_unique 
ON service_offerings_summary(offering_id);

-- Regular indexes
CREATE INDEX IF NOT EXISTS idx_service_offerings_summary_courier ON service_offerings_summary(courier_id);
CREATE INDEX IF NOT EXISTS idx_service_offerings_summary_service_type ON service_offerings_summary(service_type_id);
CREATE INDEX IF NOT EXISTS idx_service_offerings_summary_category ON service_offerings_summary(service_category);

-- ============================================================================
-- FUNCTION: calculate_service_price
-- Purpose: Calculate price for a service based on weight, distance, and zone
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_service_price(
    p_offering_id UUID,
    p_weight_kg DECIMAL(8,2),
    p_distance_km DECIMAL(10,2) DEFAULT NULL,
    p_zone_id UUID DEFAULT NULL
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_base_price DECIMAL(10,2);
    v_calculation_method VARCHAR(50);
    v_price DECIMAL(10,2) := 0;
    v_pricing_record RECORD;
BEGIN
    -- Get base price and calculation method
    SELECT base_price_sek, price_calculation_method
    INTO v_base_price, v_calculation_method
    FROM courier_service_offerings
    WHERE offering_id = p_offering_id;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Calculate based on method
    CASE v_calculation_method
        WHEN 'flat_rate' THEN
            v_price := v_base_price;
            
        WHEN 'weight_based' THEN
            SELECT flat_rate_price + (price_per_kg * p_weight_kg)
            INTO v_price
            FROM courier_service_pricing
            WHERE offering_id = p_offering_id
              AND p_weight_kg >= COALESCE(weight_from_kg, 0)
              AND p_weight_kg <= COALESCE(weight_to_kg, 999999)
              AND is_active = true
            LIMIT 1;
            
            v_price := COALESCE(v_price, v_base_price);
            
        WHEN 'zone_based' THEN
            IF p_zone_id IS NOT NULL THEN
                SELECT zone_price
                INTO v_price
                FROM courier_service_pricing
                WHERE offering_id = p_offering_id
                  AND zone_id = p_zone_id
                  AND is_active = true
                LIMIT 1;
            END IF;
            
            v_price := COALESCE(v_price, v_base_price);
            
        ELSE
            v_price := v_base_price;
    END CASE;
    
    RETURN COALESCE(v_price, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: find_available_services
-- Purpose: Find available services for a postal code and package specs
-- ============================================================================

CREATE OR REPLACE FUNCTION find_available_services(
    p_postal_code VARCHAR(10),
    p_weight_kg DECIMAL(8,2),
    p_service_type_id UUID DEFAULT NULL
)
RETURNS TABLE (
    offering_id UUID,
    courier_name VARCHAR,
    service_name VARCHAR,
    service_category VARCHAR,
    delivery_days INTEGER,
    estimated_price DECIMAL,
    tracking_available BOOLEAN,
    guaranteed_delivery BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sos.offering_id,
        sos.courier_name,
        sos.service_name,
        sos.service_category,
        sos.standard_delivery_days as delivery_days,
        sos.base_price_sek as estimated_price,
        sos.tracking_available,
        sos.guaranteed_delivery
    FROM service_offerings_summary sos
    WHERE sos.is_active = true
      AND sos.is_available_for_booking = true
      AND (p_service_type_id IS NULL OR sos.service_type_id = p_service_type_id)
      AND (sos.max_weight_kg IS NULL OR p_weight_kg <= sos.max_weight_kg)
      AND EXISTS (
          SELECT 1 FROM delivery_coverage dc
          WHERE dc.courier_id = sos.courier_id
            AND dc.postal_code = p_postal_code
            AND dc.is_covered = true
      )
    ORDER BY sos.standard_delivery_days, sos.base_price_sek;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: refresh_service_offerings_summary
-- Purpose: Refresh the materialized view
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_service_offerings_summary()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY service_offerings_summary;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE courier_service_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE courier_service_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE courier_service_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_availability_calendar ENABLE ROW LEVEL SECURITY;

-- Admin: Full access
CREATE POLICY courier_service_offerings_admin_all ON courier_service_offerings
    FOR ALL USING (auth.jwt() ->> 'user_role' = 'admin');

CREATE POLICY courier_service_pricing_admin_all ON courier_service_pricing
    FOR ALL USING (auth.jwt() ->> 'user_role' = 'admin');

CREATE POLICY courier_service_zones_admin_all ON courier_service_zones
    FOR ALL USING (auth.jwt() ->> 'user_role' = 'admin');

CREATE POLICY service_certifications_admin_all ON service_certifications
    FOR ALL USING (auth.jwt() ->> 'user_role' = 'admin');

CREATE POLICY service_availability_calendar_admin_all ON service_availability_calendar
    FOR ALL USING (auth.jwt() ->> 'user_role' = 'admin');

-- Courier: Manage own offerings
CREATE POLICY courier_service_offerings_courier_manage ON courier_service_offerings
    FOR ALL USING (
        courier_id IN (
            SELECT courier_id FROM couriers 
            WHERE user_id = (auth.jwt() ->> 'user_id')::UUID
        )
    );

-- Public: View active offerings
CREATE POLICY courier_service_offerings_public_view ON courier_service_offerings
    FOR SELECT USING (is_active = true AND is_available_for_booking = true);

CREATE POLICY courier_service_pricing_public_view ON courier_service_pricing
    FOR SELECT USING (is_active = true);

CREATE POLICY service_certifications_public_view ON service_certifications
    FOR SELECT USING (is_valid = true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE courier_service_offerings IS 'Main service configuration and capabilities per courier';
COMMENT ON TABLE courier_service_pricing IS 'Detailed pricing tiers and rules';
COMMENT ON TABLE courier_service_zones IS 'Zone-specific service configurations';
COMMENT ON TABLE service_certifications IS 'Track certifications and compliance';
COMMENT ON TABLE service_availability_calendar IS 'Track service availability exceptions';
COMMENT ON MATERIALIZED VIEW service_offerings_summary IS 'Quick access to service offerings with pricing';
COMMENT ON FUNCTION calculate_service_price IS 'Calculate price for a service based on weight, distance, and zone';
COMMENT ON FUNCTION find_available_services IS 'Find available services for a postal code and package specs';
COMMENT ON FUNCTION refresh_service_offerings_summary IS 'Refresh the service offerings summary view';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Week 4 Phase 3: Service Registration Tables Created Successfully!';
    RAISE NOTICE '📊 Tables: courier_service_offerings, courier_service_pricing, courier_service_zones, service_certifications, service_availability_calendar';
    RAISE NOTICE '📈 Materialized View: service_offerings_summary';
    RAISE NOTICE '🔧 Functions: calculate_service_price, find_available_services, refresh_service_offerings_summary';
    RAISE NOTICE '🔒 RLS Policies: Enabled for all tables';
    RAISE NOTICE '📅 Ready for courier service registration';
END $$;
