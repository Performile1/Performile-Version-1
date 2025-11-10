-- ============================================================================
-- COURIER PRICING SYSTEM - SAMPLE DATA
-- ============================================================================
-- Date: November 10, 2025
-- Purpose: Insert realistic sample pricing data for testing
-- Couriers: PostNord, Bring, DHL
-- ============================================================================

-- ============================================================================
-- STEP 1: Get Courier IDs
-- ============================================================================

DO $$
DECLARE
    v_postnord_id UUID;
    v_bring_id UUID;
    v_dhl_id UUID;
BEGIN
    -- Get existing courier IDs
    SELECT courier_id INTO v_postnord_id FROM couriers WHERE courier_name = 'PostNord' LIMIT 1;
    SELECT courier_id INTO v_bring_id FROM couriers WHERE courier_name = 'Bring' LIMIT 1;
    SELECT courier_id INTO v_dhl_id FROM couriers WHERE courier_name = 'DHL' LIMIT 1;
    
    -- Store in temp table for use in subsequent inserts
    CREATE TEMP TABLE IF NOT EXISTS temp_courier_ids (
        courier_name VARCHAR(50),
        courier_id UUID
    );
    
    DELETE FROM temp_courier_ids;
    
    IF v_postnord_id IS NOT NULL THEN
        INSERT INTO temp_courier_ids VALUES ('PostNord', v_postnord_id);
        RAISE NOTICE 'Found PostNord: %', v_postnord_id;
    END IF;
    
    IF v_bring_id IS NOT NULL THEN
        INSERT INTO temp_courier_ids VALUES ('Bring', v_bring_id);
        RAISE NOTICE 'Found Bring: %', v_bring_id;
    END IF;
    
    IF v_dhl_id IS NOT NULL THEN
        INSERT INTO temp_courier_ids VALUES ('DHL', v_dhl_id);
        RAISE NOTICE 'Found DHL: %', v_dhl_id;
    END IF;
END $$;

-- ============================================================================
-- TABLE 1: courier_base_prices
-- Base starting prices for each service type
-- ============================================================================

-- PostNord Base Prices (Sweden/Denmark - SEK)
INSERT INTO courier_base_prices (courier_id, service_type, base_price, currency, price_source, notes)
SELECT 
    courier_id,
    'express',
    89.00,
    'SEK',
    'manual',
    'PostNord Express base price - Next day delivery (Sweden/Denmark)'
FROM temp_courier_ids WHERE courier_name = 'PostNord'
ON CONFLICT (courier_id, service_type, effective_from) DO NOTHING;

INSERT INTO courier_base_prices (courier_id, service_type, base_price, currency, price_source, notes)
SELECT 
    courier_id,
    'standard',
    59.00,
    'SEK',
    'manual',
    'PostNord Standard base price - 2-3 days delivery (Sweden/Denmark)'
FROM temp_courier_ids WHERE courier_name = 'PostNord'
ON CONFLICT (courier_id, service_type, effective_from) DO NOTHING;

INSERT INTO courier_base_prices (courier_id, service_type, base_price, currency, price_source, notes)
SELECT 
    courier_id,
    'economy',
    39.00,
    'SEK',
    'manual',
    'PostNord Economy base price - 3-5 days delivery (Sweden/Denmark)'
FROM temp_courier_ids WHERE courier_name = 'PostNord'
ON CONFLICT (courier_id, service_type, effective_from) DO NOTHING;

-- Bring Base Prices
INSERT INTO courier_base_prices (courier_id, service_type, base_price, currency, price_source, notes)
SELECT 
    courier_id,
    'express',
    95.00,
    'NOK',
    'manual',
    'Bring Express base price - Next day delivery'
FROM temp_courier_ids WHERE courier_name = 'Bring'
ON CONFLICT (courier_id, service_type, effective_from) DO NOTHING;

INSERT INTO courier_base_prices (courier_id, service_type, base_price, currency, price_source, notes)
SELECT 
    courier_id,
    'standard',
    65.00,
    'NOK',
    'manual',
    'Bring Standard base price - 2-3 days delivery'
FROM temp_courier_ids WHERE courier_name = 'Bring'
ON CONFLICT (courier_id, service_type, effective_from) DO NOTHING;

-- DHL Base Prices
INSERT INTO courier_base_prices (courier_id, service_type, base_price, currency, price_source, notes)
SELECT 
    courier_id,
    'express',
    120.00,
    'NOK',
    'manual',
    'DHL Express base price - Same/next day delivery'
FROM temp_courier_ids WHERE courier_name = 'DHL'
ON CONFLICT (courier_id, service_type, effective_from) DO NOTHING;

-- ============================================================================
-- TABLE 2: courier_weight_pricing
-- Weight-based pricing tiers
-- ============================================================================

-- PostNord Weight Pricing (SEK)
INSERT INTO courier_weight_pricing (courier_id, service_type, min_weight, max_weight, price_per_kg, currency)
SELECT courier_id, 'express', 0, 5, 12.00, 'SEK' FROM temp_courier_ids WHERE courier_name = 'PostNord'
ON CONFLICT (courier_id, service_type, min_weight, max_weight) DO NOTHING;

INSERT INTO courier_weight_pricing (courier_id, service_type, min_weight, max_weight, price_per_kg, currency)
SELECT courier_id, 'express', 5, 10, 10.00, 'SEK' FROM temp_courier_ids WHERE courier_name = 'PostNord'
ON CONFLICT (courier_id, service_type, min_weight, max_weight) DO NOTHING;

INSERT INTO courier_weight_pricing (courier_id, service_type, min_weight, max_weight, price_per_kg, currency)
SELECT courier_id, 'express', 10, 20, 8.00, 'SEK' FROM temp_courier_ids WHERE courier_name = 'PostNord'
ON CONFLICT (courier_id, service_type, min_weight, max_weight) DO NOTHING;

INSERT INTO courier_weight_pricing (courier_id, service_type, min_weight, max_weight, price_per_kg, currency)
SELECT courier_id, 'express', 20, 35, 6.00, 'SEK' FROM temp_courier_ids WHERE courier_name = 'PostNord'
ON CONFLICT (courier_id, service_type, min_weight, max_weight) DO NOTHING;

INSERT INTO courier_weight_pricing (courier_id, service_type, min_weight, max_weight, price_per_kg, currency)
SELECT courier_id, 'standard', 0, 5, 10.00, 'SEK' FROM temp_courier_ids WHERE courier_name = 'PostNord'
ON CONFLICT (courier_id, service_type, min_weight, max_weight) DO NOTHING;

INSERT INTO courier_weight_pricing (courier_id, service_type, min_weight, max_weight, price_per_kg, currency)
SELECT courier_id, 'standard', 5, 10, 8.00, 'SEK' FROM temp_courier_ids WHERE courier_name = 'PostNord'
ON CONFLICT (courier_id, service_type, min_weight, max_weight) DO NOTHING;

INSERT INTO courier_weight_pricing (courier_id, service_type, min_weight, max_weight, price_per_kg, currency)
SELECT courier_id, 'standard', 10, 20, 6.00, 'SEK' FROM temp_courier_ids WHERE courier_name = 'PostNord'
ON CONFLICT (courier_id, service_type, min_weight, max_weight) DO NOTHING;

INSERT INTO courier_weight_pricing (courier_id, service_type, min_weight, max_weight, price_per_kg, currency)
SELECT courier_id, 'economy', 0, 5, 8.00, 'SEK' FROM temp_courier_ids WHERE courier_name = 'PostNord'
ON CONFLICT (courier_id, service_type, min_weight, max_weight) DO NOTHING;

INSERT INTO courier_weight_pricing (courier_id, service_type, min_weight, max_weight, price_per_kg, currency)
SELECT courier_id, 'economy', 5, 10, 6.00, 'SEK' FROM temp_courier_ids WHERE courier_name = 'PostNord'
ON CONFLICT (courier_id, service_type, min_weight, max_weight) DO NOTHING;

-- Bring Weight Pricing
INSERT INTO courier_weight_pricing (courier_id, service_type, min_weight, max_weight, price_per_kg)
SELECT courier_id, 'express', 0, 5, 13.00 FROM temp_courier_ids WHERE courier_name = 'Bring'
ON CONFLICT (courier_id, service_type, min_weight, max_weight) DO NOTHING;

INSERT INTO courier_weight_pricing (courier_id, service_type, min_weight, max_weight, price_per_kg)
SELECT courier_id, 'express', 5, 10, 11.00 FROM temp_courier_ids WHERE courier_name = 'Bring'
ON CONFLICT (courier_id, service_type, min_weight, max_weight) DO NOTHING;

INSERT INTO courier_weight_pricing (courier_id, service_type, min_weight, max_weight, price_per_kg)
SELECT courier_id, 'express', 10, 20, 9.00 FROM temp_courier_ids WHERE courier_name = 'Bring'
ON CONFLICT (courier_id, service_type, min_weight, max_weight) DO NOTHING;

INSERT INTO courier_weight_pricing (courier_id, service_type, min_weight, max_weight, price_per_kg)
SELECT courier_id, 'standard', 0, 5, 11.00 FROM temp_courier_ids WHERE courier_name = 'Bring'
ON CONFLICT (courier_id, service_type, min_weight, max_weight) DO NOTHING;

INSERT INTO courier_weight_pricing (courier_id, service_type, min_weight, max_weight, price_per_kg)
SELECT courier_id, 'standard', 5, 10, 9.00 FROM temp_courier_ids WHERE courier_name = 'Bring'
ON CONFLICT (courier_id, service_type, min_weight, max_weight) DO NOTHING;

-- DHL Weight Pricing
INSERT INTO courier_weight_pricing (courier_id, service_type, min_weight, max_weight, price_per_kg)
SELECT courier_id, 'express', 0, 5, 15.00 FROM temp_courier_ids WHERE courier_name = 'DHL'
ON CONFLICT (courier_id, service_type, min_weight, max_weight) DO NOTHING;

INSERT INTO courier_weight_pricing (courier_id, service_type, min_weight, max_weight, price_per_kg)
SELECT courier_id, 'express', 5, 10, 13.00 FROM temp_courier_ids WHERE courier_name = 'DHL'
ON CONFLICT (courier_id, service_type, min_weight, max_weight) DO NOTHING;

INSERT INTO courier_weight_pricing (courier_id, service_type, min_weight, max_weight, price_per_kg)
SELECT courier_id, 'express', 10, 20, 11.00 FROM temp_courier_ids WHERE courier_name = 'DHL'
ON CONFLICT (courier_id, service_type, min_weight, max_weight) DO NOTHING;

-- ============================================================================
-- TABLE 3: courier_distance_pricing
-- Distance-based pricing tiers
-- ============================================================================

-- PostNord Distance Pricing (SEK)
INSERT INTO courier_distance_pricing (courier_id, service_type, min_distance, max_distance, price_per_km, currency)
SELECT courier_id, 'express', 0, 50, 2.50, 'SEK' FROM temp_courier_ids WHERE courier_name = 'PostNord'
ON CONFLICT (courier_id, service_type, min_distance, max_distance) DO NOTHING;

INSERT INTO courier_distance_pricing (courier_id, service_type, min_distance, max_distance, price_per_km, currency)
SELECT courier_id, 'express', 50, 200, 1.80, 'SEK' FROM temp_courier_ids WHERE courier_name = 'PostNord'
ON CONFLICT (courier_id, service_type, min_distance, max_distance) DO NOTHING;

INSERT INTO courier_distance_pricing (courier_id, service_type, min_distance, max_distance, price_per_km, currency)
SELECT courier_id, 'express', 200, 500, 1.20, 'SEK' FROM temp_courier_ids WHERE courier_name = 'PostNord'
ON CONFLICT (courier_id, service_type, min_distance, max_distance) DO NOTHING;

INSERT INTO courier_distance_pricing (courier_id, service_type, min_distance, max_distance, price_per_km, currency)
SELECT courier_id, 'express', 500, 10000, 0.80, 'SEK' FROM temp_courier_ids WHERE courier_name = 'PostNord'
ON CONFLICT (courier_id, service_type, min_distance, max_distance) DO NOTHING;

INSERT INTO courier_distance_pricing (courier_id, service_type, min_distance, max_distance, price_per_km, currency)
SELECT courier_id, 'standard', 0, 50, 2.00, 'SEK' FROM temp_courier_ids WHERE courier_name = 'PostNord'
ON CONFLICT (courier_id, service_type, min_distance, max_distance) DO NOTHING;

INSERT INTO courier_distance_pricing (courier_id, service_type, min_distance, max_distance, price_per_km, currency)
SELECT courier_id, 'standard', 50, 200, 1.50, 'SEK' FROM temp_courier_ids WHERE courier_name = 'PostNord'
ON CONFLICT (courier_id, service_type, min_distance, max_distance) DO NOTHING;

INSERT INTO courier_distance_pricing (courier_id, service_type, min_distance, max_distance, price_per_km, currency)
SELECT courier_id, 'standard', 200, 10000, 1.00, 'SEK' FROM temp_courier_ids WHERE courier_name = 'PostNord'
ON CONFLICT (courier_id, service_type, min_distance, max_distance) DO NOTHING;

INSERT INTO courier_distance_pricing (courier_id, service_type, min_distance, max_distance, price_per_km, currency)
SELECT courier_id, 'economy', 0, 50, 1.50, 'SEK' FROM temp_courier_ids WHERE courier_name = 'PostNord'
ON CONFLICT (courier_id, service_type, min_distance, max_distance) DO NOTHING;

INSERT INTO courier_distance_pricing (courier_id, service_type, min_distance, max_distance, price_per_km, currency)
SELECT courier_id, 'economy', 50, 10000, 1.00, 'SEK' FROM temp_courier_ids WHERE courier_name = 'PostNord'
ON CONFLICT (courier_id, service_type, min_distance, max_distance) DO NOTHING;

-- Bring Distance Pricing
INSERT INTO courier_distance_pricing (courier_id, service_type, min_distance, max_distance, price_per_km)
SELECT courier_id, 'express', 0, 50, 2.80 FROM temp_courier_ids WHERE courier_name = 'Bring'
ON CONFLICT (courier_id, service_type, min_distance, max_distance) DO NOTHING;

INSERT INTO courier_distance_pricing (courier_id, service_type, min_distance, max_distance, price_per_km)
SELECT courier_id, 'express', 50, 200, 2.00 FROM temp_courier_ids WHERE courier_name = 'Bring'
ON CONFLICT (courier_id, service_type, min_distance, max_distance) DO NOTHING;

INSERT INTO courier_distance_pricing (courier_id, service_type, min_distance, max_distance, price_per_km)
SELECT courier_id, 'express', 200, 10000, 1.30 FROM temp_courier_ids WHERE courier_name = 'Bring'
ON CONFLICT (courier_id, service_type, min_distance, max_distance) DO NOTHING;

INSERT INTO courier_distance_pricing (courier_id, service_type, min_distance, max_distance, price_per_km)
SELECT courier_id, 'standard', 0, 50, 2.20 FROM temp_courier_ids WHERE courier_name = 'Bring'
ON CONFLICT (courier_id, service_type, min_distance, max_distance) DO NOTHING;

INSERT INTO courier_distance_pricing (courier_id, service_type, min_distance, max_distance, price_per_km)
SELECT courier_id, 'standard', 50, 10000, 1.60 FROM temp_courier_ids WHERE courier_name = 'Bring'
ON CONFLICT (courier_id, service_type, min_distance, max_distance) DO NOTHING;

-- DHL Distance Pricing
INSERT INTO courier_distance_pricing (courier_id, service_type, min_distance, max_distance, price_per_km)
SELECT courier_id, 'express', 0, 50, 3.00 FROM temp_courier_ids WHERE courier_name = 'DHL'
ON CONFLICT (courier_id, service_type, min_distance, max_distance) DO NOTHING;

INSERT INTO courier_distance_pricing (courier_id, service_type, min_distance, max_distance, price_per_km)
SELECT courier_id, 'express', 50, 200, 2.20 FROM temp_courier_ids WHERE courier_name = 'DHL'
ON CONFLICT (courier_id, service_type, min_distance, max_distance) DO NOTHING;

INSERT INTO courier_distance_pricing (courier_id, service_type, min_distance, max_distance, price_per_km)
SELECT courier_id, 'express', 200, 10000, 1.50 FROM temp_courier_ids WHERE courier_name = 'DHL'
ON CONFLICT (courier_id, service_type, min_distance, max_distance) DO NOTHING;

-- ============================================================================
-- TABLE 4: postal_code_zones
-- Norwegian postal code zones with multipliers
-- ============================================================================

-- Oslo and surrounding areas (normal pricing)
INSERT INTO postal_code_zones (zone_name, country, postal_code_pattern, zone_multiplier, description)
VALUES 
    ('Oslo City', 'NO', '01%', 1.0, 'Oslo city center - normal pricing'),
    ('Oslo East', 'NO', '02%', 1.0, 'Oslo eastern suburbs - normal pricing'),
    ('Oslo West', 'NO', '03%', 1.0, 'Oslo western suburbs - normal pricing')
ON CONFLICT (country, postal_code_pattern) DO NOTHING;

-- Major cities (normal pricing)
INSERT INTO postal_code_zones (zone_name, country, postal_code_pattern, zone_multiplier, description)
VALUES 
    ('Bergen', 'NO', '50%', 1.0, 'Bergen city - normal pricing'),
    ('Trondheim', 'NO', '70%', 1.0, 'Trondheim city - normal pricing'),
    ('Stavanger', 'NO', '40%', 1.0, 'Stavanger city - normal pricing')
ON CONFLICT (country, postal_code_pattern) DO NOTHING;

-- Northern Norway (higher pricing)
INSERT INTO postal_code_zones (zone_name, country, postal_code_pattern, zone_multiplier, is_remote_area, description)
VALUES 
    ('Tromsø', 'NO', '90%', 1.3, true, 'Tromsø area - 30% surcharge'),
    ('Finnmark', 'NO', '95%', 1.4, true, 'Finnmark - 40% surcharge'),
    ('Svalbard', 'NO', '97%', 2.0, true, 'Svalbard - 100% surcharge')
ON CONFLICT (country, postal_code_pattern) DO NOTHING;

-- Islands and remote areas
INSERT INTO postal_code_zones (zone_name, country, postal_code_pattern, zone_multiplier, is_remote_area, is_island, description)
VALUES 
    ('Lofoten', 'NO', '83%', 1.25, true, true, 'Lofoten islands - 25% surcharge'),
    ('Vesterålen', 'NO', '84%', 1.25, true, true, 'Vesterålen islands - 25% surcharge')
ON CONFLICT (country, postal_code_pattern) DO NOTHING;

-- ============================================================================
-- TABLE 5: courier_surcharge_rules
-- Surcharges and additional fees
-- ============================================================================

-- PostNord Surcharges (SEK)
INSERT INTO courier_surcharge_rules (courier_id, surcharge_type, surcharge_name, amount, amount_type, currency, applies_to, description)
SELECT 
    courier_id,
    'fuel',
    'Fuel Surcharge',
    12.00,
    'percentage',
    'SEK',
    'all',
    'Fuel surcharge calculated as 12% of subtotal'
FROM temp_courier_ids t
WHERE courier_name = 'PostNord'
  AND NOT EXISTS (
    SELECT 1
    FROM courier_surcharge_rules csr
    WHERE csr.courier_id = t.courier_id
      AND csr.surcharge_type = 'fuel'
      AND csr.surcharge_name = 'Fuel Surcharge'
  );

INSERT INTO courier_surcharge_rules (courier_id, surcharge_type, surcharge_name, amount, amount_type, currency, applies_to, min_weight, description)
SELECT 
    courier_id,
    'oversized',
    'Oversized Package Fee',
    50.00,
    'fixed',
    'SEK',
    'all',
    20.00,
    'Fee for packages over 20kg'
FROM temp_courier_ids t
WHERE courier_name = 'PostNord'
  AND NOT EXISTS (
    SELECT 1
    FROM courier_surcharge_rules csr
    WHERE csr.courier_id = t.courier_id
      AND csr.surcharge_type = 'oversized'
      AND csr.surcharge_name = 'Oversized Package Fee'
  );

INSERT INTO courier_surcharge_rules (courier_id, surcharge_type, surcharge_name, amount, amount_type, currency, applies_to, postal_code_pattern, description)
SELECT 
    courier_id,
    'remote_area',
    'Remote Area Surcharge',
    75.00,
    'fixed',
    'SEK',
    'all',
    '9%',
    'Surcharge for deliveries to Northern Norway'
FROM temp_courier_ids t
WHERE courier_name = 'PostNord'
  AND NOT EXISTS (
    SELECT 1
    FROM courier_surcharge_rules csr
    WHERE csr.courier_id = t.courier_id
      AND csr.surcharge_type = 'remote_area'
      AND csr.surcharge_name = 'Remote Area Surcharge'
  );

-- Bring Surcharges
INSERT INTO courier_surcharge_rules (courier_id, surcharge_type, surcharge_name, amount, amount_type, applies_to, description)
SELECT 
    courier_id,
    'fuel',
    'Fuel Surcharge',
    10.00,
    'percentage',
    'all',
    'Fuel surcharge calculated as 10% of subtotal'
FROM temp_courier_ids t
WHERE courier_name = 'Bring'
  AND NOT EXISTS (
    SELECT 1
    FROM courier_surcharge_rules csr
    WHERE csr.courier_id = t.courier_id
      AND csr.surcharge_type = 'fuel'
      AND csr.surcharge_name = 'Fuel Surcharge'
  );

INSERT INTO courier_surcharge_rules (courier_id, surcharge_type, surcharge_name, amount, amount_type, applies_to, min_weight, description)
SELECT 
    courier_id,
    'handling',
    'Heavy Package Handling',
    60.00,
    'fixed',
    'all',
    25.00,
    'Handling fee for packages over 25kg'
FROM temp_courier_ids t
WHERE courier_name = 'Bring'
  AND NOT EXISTS (
    SELECT 1
    FROM courier_surcharge_rules csr
    WHERE csr.courier_id = t.courier_id
      AND csr.surcharge_type = 'handling'
      AND csr.surcharge_name = 'Heavy Package Handling'
  );

-- DHL Surcharges
INSERT INTO courier_surcharge_rules (courier_id, surcharge_type, surcharge_name, amount, amount_type, applies_to, description)
SELECT 
    courier_id,
    'fuel',
    'Fuel Surcharge',
    12.00,
    'percentage',
    'all',
    '12% fuel surcharge on base price'
FROM temp_courier_ids t
WHERE courier_name = 'DHL'
  AND NOT EXISTS (
    SELECT 1
    FROM courier_surcharge_rules csr
    WHERE csr.courier_id = t.courier_id
      AND csr.surcharge_type = 'fuel'
      AND csr.surcharge_name = 'Fuel Surcharge'
  );

INSERT INTO courier_surcharge_rules (courier_id, surcharge_type, surcharge_name, amount, amount_type, applies_to, description)
SELECT 
    courier_id,
    'express_fee',
    'Express Service Fee',
    35.00,
    'fixed',
    'express',
    'Additional fee for express service'
FROM temp_courier_ids t
WHERE courier_name = 'DHL'
  AND NOT EXISTS (
    SELECT 1
    FROM courier_surcharge_rules csr
    WHERE csr.courier_id = t.courier_id
      AND csr.surcharge_type = 'express_fee'
      AND csr.surcharge_name = 'Express Service Fee'
  );

-- ============================================================================
-- TABLE 6: courier_volumetric_rules
-- Volumetric weight calculation rules
-- ============================================================================

-- PostNord Volumetric Rules (Volume in m³ × 280 kg)
-- PostNord uses: (L×W×H in meters) × 280 kg
-- This is equivalent to divisor of 3571 when using cm: (100×100×100)/280 = 3571.43
INSERT INTO courier_volumetric_rules (courier_id, service_type, volumetric_divisor, measurement_unit, applies_when, description)
SELECT 
    courier_id,
    'express',
    3571,
    'cm',
    'if_greater_than_actual',
    'PostNord formula: Volume (m³) × 280 kg. Use if greater than actual weight.'
FROM temp_courier_ids WHERE courier_name = 'PostNord'
ON CONFLICT (courier_id, service_type) DO NOTHING;

INSERT INTO courier_volumetric_rules (courier_id, service_type, volumetric_divisor, measurement_unit, applies_when, description)
SELECT 
    courier_id,
    'standard',
    3571,
    'cm',
    'if_greater_than_actual',
    'PostNord formula: Volume (m³) × 280 kg. Use if greater than actual weight.'
FROM temp_courier_ids WHERE courier_name = 'PostNord'
ON CONFLICT (courier_id, service_type) DO NOTHING;

INSERT INTO courier_volumetric_rules (courier_id, service_type, volumetric_divisor, measurement_unit, applies_when, description)
SELECT 
    courier_id,
    'economy',
    3571,
    'cm',
    'if_greater_than_actual',
    'PostNord formula: Volume (m³) × 280 kg. Use if greater than actual weight.'
FROM temp_courier_ids WHERE courier_name = 'PostNord'
ON CONFLICT (courier_id, service_type) DO NOTHING;

-- Bring Volumetric Rules (Volume in m³ × 280 kg - Road/Rail Transport)
INSERT INTO courier_volumetric_rules (courier_id, service_type, volumetric_divisor, measurement_unit, applies_when, description)
SELECT 
    courier_id,
    'express',
    3571,
    'cm',
    'if_greater_than_actual',
    'Road/Rail formula: Volume (m³) × 280 kg. Use if greater than actual weight.'
FROM temp_courier_ids WHERE courier_name = 'Bring'
ON CONFLICT (courier_id, service_type) DO NOTHING;

INSERT INTO courier_volumetric_rules (courier_id, service_type, volumetric_divisor, measurement_unit, applies_when, description)
SELECT 
    courier_id,
    'standard',
    3571,
    'cm',
    'if_greater_than_actual',
    'Road/Rail formula: Volume (m³) × 280 kg. Use if greater than actual weight.'
FROM temp_courier_ids WHERE courier_name = 'Bring'
ON CONFLICT (courier_id, service_type) DO NOTHING;

-- DHL Volumetric Rules (Volume in m³ × 280 kg - Road/Rail Transport)
INSERT INTO courier_volumetric_rules (courier_id, service_type, volumetric_divisor, measurement_unit, applies_when, description)
SELECT 
    courier_id,
    'express',
    3571,
    'cm',
    'if_greater_than_actual',
    'Road/Rail formula: Volume (m³) × 280 kg. Use if greater than actual weight.'
FROM temp_courier_ids WHERE courier_name = 'DHL'
ON CONFLICT (courier_id, service_type) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Count records inserted
SELECT 'courier_base_prices' as table_name, COUNT(*) as record_count FROM courier_base_prices
UNION ALL
SELECT 'courier_weight_pricing', COUNT(*) FROM courier_weight_pricing
UNION ALL
SELECT 'courier_distance_pricing', COUNT(*) FROM courier_distance_pricing
UNION ALL
SELECT 'postal_code_zones', COUNT(*) FROM postal_code_zones
UNION ALL
SELECT 'courier_surcharge_rules', COUNT(*) FROM courier_surcharge_rules
UNION ALL
SELECT 'courier_volumetric_rules', COUNT(*) FROM courier_volumetric_rules
ORDER BY table_name;

-- Sample data check
SELECT 
    c.courier_name,
    cbp.service_type,
    cbp.base_price,
    cbp.currency
FROM courier_base_prices cbp
JOIN couriers c ON c.courier_id = cbp.courier_id
ORDER BY c.courier_name, cbp.service_type;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Sample Pricing Data Inserted Successfully!';
    RAISE NOTICE '📊 Data for PostNord, Bring, and DHL';
    RAISE NOTICE '🎯 Ready for function creation';
END $$;
