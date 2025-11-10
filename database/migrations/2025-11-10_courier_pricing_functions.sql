-- ============================================================================
-- COURIER PRICING SYSTEM - CALCULATION FUNCTIONS
-- ============================================================================
-- Date: November 10, 2025
-- Purpose: Functions to calculate courier base prices with all components
-- Includes: Volumetric weight, surcharges, zone multipliers, complete pricing
-- ============================================================================

-- ============================================================================
-- FUNCTION 1: calculate_volumetric_weight
-- Calculate volumetric weight and determine chargeable weight
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_volumetric_weight(
    p_courier_id UUID,
    p_service_type VARCHAR,
    p_length_cm DECIMAL,
    p_width_cm DECIMAL,
    p_height_cm DECIMAL,
    p_actual_weight_kg DECIMAL
)
RETURNS TABLE (
    actual_weight DECIMAL,
    volumetric_weight DECIMAL,
    chargeable_weight DECIMAL,
    calculation_method VARCHAR
) AS $$
DECLARE
    v_divisor INTEGER;
    v_volume DECIMAL;
    v_volumetric_weight DECIMAL;
    v_applies_when VARCHAR;
BEGIN
    -- Get volumetric rule for this courier
    SELECT volumetric_divisor, applies_when
    INTO v_divisor, v_applies_when
    FROM courier_volumetric_rules
    WHERE courier_id = p_courier_id
        AND service_type = p_service_type
        AND is_active = true
    LIMIT 1;
    
    -- If no rule exists, use actual weight
    IF v_divisor IS NULL THEN
        RETURN QUERY SELECT 
            p_actual_weight_kg,
            p_actual_weight_kg,
            p_actual_weight_kg,
            'actual_weight'::VARCHAR;
        RETURN;
    END IF;
    
    -- Calculate volumetric weight: (L × W × H) / divisor
    v_volume := p_length_cm * p_width_cm * p_height_cm;
    v_volumetric_weight := v_volume / v_divisor;
    
    -- Determine chargeable weight based on rule
    IF v_applies_when = 'always' THEN
        -- Always use volumetric weight
        RETURN QUERY SELECT 
            p_actual_weight_kg,
            v_volumetric_weight,
            v_volumetric_weight,
            'volumetric_always'::VARCHAR;
    ELSIF v_applies_when = 'if_greater_than_actual' THEN
        -- Use higher of the two (standard practice)
        RETURN QUERY SELECT 
            p_actual_weight_kg,
            v_volumetric_weight,
            GREATEST(p_actual_weight_kg, v_volumetric_weight),
            CASE 
                WHEN v_volumetric_weight > p_actual_weight_kg THEN 'volumetric_greater'
                ELSE 'actual_weight'
            END::VARCHAR;
    ELSE
        -- Default to actual weight
        RETURN QUERY SELECT 
            p_actual_weight_kg,
            v_volumetric_weight,
            p_actual_weight_kg,
            'actual_weight'::VARCHAR;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_volumetric_weight IS 
'Calculate volumetric weight and determine chargeable weight based on courier rules';

-- ============================================================================
-- FUNCTION 2: calculate_surcharges
-- Calculate all applicable surcharges for a shipment
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_surcharges(
    p_courier_id UUID,
    p_service_type VARCHAR,
    p_weight DECIMAL,
    p_distance DECIMAL,
    p_postal_code VARCHAR,
    p_base_price DECIMAL
)
RETURNS TABLE (
    surcharge_type VARCHAR,
    surcharge_name VARCHAR,
    amount DECIMAL,
    calculation_method VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        csr.surcharge_type,
        csr.surcharge_name,
        CASE 
            WHEN csr.amount_type = 'fixed' THEN csr.amount
            WHEN csr.amount_type = 'percentage' THEN ROUND((p_base_price * (csr.amount / 100))::NUMERIC, 2)
            WHEN csr.amount_type = 'per_kg' THEN ROUND((p_weight * csr.amount)::NUMERIC, 2)
            WHEN csr.amount_type = 'per_km' THEN ROUND((p_distance * csr.amount)::NUMERIC, 2)
            ELSE 0
        END as amount,
        csr.amount_type as calculation_method
    FROM courier_surcharge_rules csr
    WHERE csr.courier_id = p_courier_id
        AND csr.is_active = true
        AND (csr.effective_from IS NULL OR csr.effective_from <= CURRENT_DATE)
        AND (csr.effective_to IS NULL OR csr.effective_to >= CURRENT_DATE)
        AND (
            -- Check if surcharge applies
            csr.applies_to = 'all' 
            OR csr.applies_to = p_service_type
            OR (csr.min_weight IS NOT NULL AND p_weight >= csr.min_weight)
            OR (csr.max_weight IS NOT NULL AND p_weight <= csr.max_weight)
            OR (csr.min_distance IS NOT NULL AND p_distance >= csr.min_distance)
            OR (csr.postal_code_pattern IS NOT NULL AND p_postal_code LIKE csr.postal_code_pattern)
        );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_surcharges IS 
'Calculate all applicable surcharges based on shipment details and courier rules';

-- ============================================================================
-- FUNCTION 3: calculate_courier_base_price
-- Main function to calculate complete courier base price
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_courier_base_price(
    p_courier_id UUID,
    p_service_type VARCHAR,
    p_actual_weight DECIMAL,
    p_length_cm DECIMAL DEFAULT NULL,
    p_width_cm DECIMAL DEFAULT NULL,
    p_height_cm DECIMAL DEFAULT NULL,
    p_distance DECIMAL DEFAULT 0,
    p_from_postal VARCHAR DEFAULT NULL,
    p_to_postal VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    courier_id UUID,
    service_type VARCHAR,
    base_price DECIMAL,
    currency VARCHAR,
    actual_weight DECIMAL,
    volumetric_weight DECIMAL,
    chargeable_weight DECIMAL,
    weight_cost DECIMAL,
    distance_cost DECIMAL,
    zone_multiplier DECIMAL,
    surcharges JSONB,
    total_surcharges DECIMAL,
    subtotal DECIMAL,
    total_base_price DECIMAL,
    calculation_breakdown JSONB
) AS $$
DECLARE
    v_base_price DECIMAL := 0;
    v_currency VARCHAR(3);
    v_weight_cost DECIMAL := 0;
    v_distance_cost DECIMAL := 0;
    v_zone_mult DECIMAL := 1.0;
    v_chargeable_weight DECIMAL;
    v_volumetric_weight DECIMAL;
    v_actual_weight DECIMAL;
    v_surcharges JSONB;
    v_total_surcharges DECIMAL := 0;
    v_subtotal DECIMAL;
    v_total DECIMAL;
BEGIN
    -- 1. Calculate volumetric weight if dimensions provided
    IF p_length_cm IS NOT NULL AND p_width_cm IS NOT NULL AND p_height_cm IS NOT NULL THEN
        SELECT 
            cw.actual_weight,
            cw.volumetric_weight,
            cw.chargeable_weight
        INTO 
            v_actual_weight,
            v_volumetric_weight,
            v_chargeable_weight
        FROM calculate_volumetric_weight(
            p_courier_id, 
            p_service_type,
            p_length_cm, 
            p_width_cm, 
            p_height_cm,
            p_actual_weight
        ) cw;
    ELSE
        -- No dimensions, use actual weight
        v_actual_weight := p_actual_weight;
        v_volumetric_weight := p_actual_weight;
        v_chargeable_weight := p_actual_weight;
    END IF;
    
    -- 2. Get base price and currency
    SELECT cbp.base_price, cbp.currency
    INTO v_base_price, v_currency
    FROM courier_base_prices cbp
    WHERE cbp.courier_id = p_courier_id
        AND cbp.service_type = p_service_type
        AND cbp.is_active = true
        AND (cbp.effective_from IS NULL OR cbp.effective_from <= CURRENT_DATE)
        AND (cbp.effective_to IS NULL OR cbp.effective_to >= CURRENT_DATE)
    ORDER BY cbp.effective_from DESC
    LIMIT 1;
    
    -- If no base price found, return zeros
    IF v_base_price IS NULL THEN
        RETURN QUERY SELECT 
            p_courier_id,
            p_service_type,
            0::DECIMAL,
            'NOK'::VARCHAR,
            v_actual_weight,
            v_volumetric_weight,
            v_chargeable_weight,
            0::DECIMAL,
            0::DECIMAL,
            1.0::DECIMAL,
            '[]'::JSONB,
            0::DECIMAL,
            0::DECIMAL,
            0::DECIMAL,
            '{}'::JSONB;
        RETURN;
    END IF;
    
    -- 3. Calculate weight cost based on chargeable weight
    SELECT COALESCE(
        CASE 
            WHEN cwp.fixed_price IS NOT NULL THEN cwp.fixed_price
            ELSE v_chargeable_weight * cwp.price_per_kg
        END,
        0
    )
    INTO v_weight_cost
    FROM courier_weight_pricing cwp
    WHERE cwp.courier_id = p_courier_id
        AND cwp.service_type = p_service_type
        AND v_chargeable_weight >= cwp.min_weight
        AND v_chargeable_weight < cwp.max_weight
        AND cwp.is_active = true
    ORDER BY cwp.min_weight DESC
    LIMIT 1;
    
    -- 4. Calculate distance cost if distance provided
    IF p_distance > 0 THEN
        SELECT COALESCE(
            CASE 
                WHEN cdp.fixed_price IS NOT NULL THEN cdp.fixed_price
                ELSE p_distance * cdp.price_per_km
            END,
            0
        )
        INTO v_distance_cost
        FROM courier_distance_pricing cdp
        WHERE cdp.courier_id = p_courier_id
            AND cdp.service_type = p_service_type
            AND p_distance >= cdp.min_distance
            AND p_distance < cdp.max_distance
            AND cdp.is_active = true
        ORDER BY cdp.min_distance DESC
        LIMIT 1;
    END IF;
    
    -- 5. Get zone multiplier if destination postal code provided
    IF p_to_postal IS NOT NULL THEN
        SELECT COALESCE(pcz.zone_multiplier, 1.0)
        INTO v_zone_mult
        FROM postal_code_zones pcz
        WHERE p_to_postal LIKE pcz.postal_code_pattern
            AND pcz.is_active = true
        ORDER BY LENGTH(pcz.postal_code_pattern) DESC
        LIMIT 1;
    END IF;
    
    -- 6. Calculate subtotal before surcharges
    v_subtotal := (v_base_price + v_weight_cost + v_distance_cost) * v_zone_mult;
    
    -- 7. Calculate surcharges
    SELECT 
        COALESCE(jsonb_agg(jsonb_build_object(
            'type', cs.surcharge_type,
            'name', cs.surcharge_name,
            'amount', cs.amount,
            'method', cs.calculation_method
        )), '[]'::JSONB),
        COALESCE(SUM(cs.amount), 0)
    INTO v_surcharges, v_total_surcharges
    FROM calculate_surcharges(
        p_courier_id, 
        p_service_type,
        v_chargeable_weight, 
        p_distance,
        COALESCE(p_to_postal, ''),
        v_subtotal
    ) cs;
    
    -- 8. Calculate final total
    v_total := v_subtotal + v_total_surcharges;
    
    -- 9. Return complete breakdown
    RETURN QUERY SELECT 
        p_courier_id,
        p_service_type,
        v_base_price,
        v_currency,
        v_actual_weight,
        v_volumetric_weight,
        v_chargeable_weight,
        v_weight_cost,
        v_distance_cost,
        v_zone_mult,
        v_surcharges,
        v_total_surcharges,
        v_subtotal,
        v_total,
        jsonb_build_object(
            'base_price', v_base_price,
            'weight_cost', v_weight_cost,
            'distance_cost', v_distance_cost,
            'before_zone', v_base_price + v_weight_cost + v_distance_cost,
            'zone_multiplier', v_zone_mult,
            'after_zone', v_subtotal,
            'surcharges', v_total_surcharges,
            'total', v_total,
            'currency', v_currency
        );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_courier_base_price IS 
'Calculate complete courier base price including volumetric weight, zones, and surcharges';

-- ============================================================================
-- FUNCTION 4: compare_courier_prices
-- Compare prices across multiple couriers for a shipment
-- ============================================================================

CREATE OR REPLACE FUNCTION compare_courier_prices(
    p_courier_ids UUID[],
    p_service_type VARCHAR,
    p_actual_weight DECIMAL,
    p_length_cm DECIMAL DEFAULT NULL,
    p_width_cm DECIMAL DEFAULT NULL,
    p_height_cm DECIMAL DEFAULT NULL,
    p_distance DECIMAL DEFAULT 0,
    p_from_postal VARCHAR DEFAULT NULL,
    p_to_postal VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    courier_id UUID,
    courier_name VARCHAR,
    service_type VARCHAR,
    total_base_price DECIMAL,
    currency VARCHAR,
    chargeable_weight DECIMAL,
    calculation_breakdown JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.courier_id,
        c.courier_name,
        cp.service_type,
        cp.total_base_price,
        cp.currency,
        cp.chargeable_weight,
        cp.calculation_breakdown
    FROM unnest(p_courier_ids) AS courier_id_item
    JOIN couriers c ON c.courier_id = courier_id_item
    CROSS JOIN LATERAL calculate_courier_base_price(
        courier_id_item,
        p_service_type,
        p_actual_weight,
        p_length_cm,
        p_width_cm,
        p_height_cm,
        p_distance,
        p_from_postal,
        p_to_postal
    ) cp
    WHERE cp.total_base_price > 0
    ORDER BY cp.total_base_price ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION compare_courier_prices IS 
'Compare prices across multiple couriers for the same shipment';

-- ============================================================================
-- TEST QUERIES
-- ============================================================================

-- Test 1: Calculate volumetric weight
DO $$
DECLARE
    v_courier_id UUID;
BEGIN
    SELECT courier_id INTO v_courier_id FROM couriers WHERE courier_name = 'PostNord' LIMIT 1;
    
    IF v_courier_id IS NOT NULL THEN
        RAISE NOTICE '=== TEST 1: Volumetric Weight Calculation ===';
        RAISE NOTICE 'Package: 40cm × 30cm × 20cm, Actual weight: 3kg';
        
        PERFORM * FROM calculate_volumetric_weight(
            v_courier_id,
            'express',
            40, 30, 20,
            3.0
        );
    END IF;
END $$;

-- Test 2: Calculate complete price
DO $$
DECLARE
    v_courier_id UUID;
BEGIN
    SELECT courier_id INTO v_courier_id FROM couriers WHERE courier_name = 'PostNord' LIMIT 1;
    
    IF v_courier_id IS NOT NULL THEN
        RAISE NOTICE '=== TEST 2: Complete Price Calculation ===';
        RAISE NOTICE 'PostNord Express: 5kg, 100km, Oslo to Bergen';
        
        PERFORM * FROM calculate_courier_base_price(
            v_courier_id,
            'express',
            5.0,
            NULL, NULL, NULL,
            100,
            '0150',
            '5003'
        );
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- List all functions created
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name IN (
        'calculate_volumetric_weight',
        'calculate_surcharges',
        'calculate_courier_base_price',
        'compare_courier_prices'
    )
ORDER BY routine_name;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Courier Pricing Functions Created Successfully!';
    RAISE NOTICE '📊 4 functions: volumetric weight, surcharges, base price, compare';
    RAISE NOTICE '🎯 Ready for API endpoint creation';
END $$;
