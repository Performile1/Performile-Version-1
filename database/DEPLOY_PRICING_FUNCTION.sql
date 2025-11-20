-- ============================================================================
-- PRICING CALCULATION FUNCTION
-- Run this in Supabase SQL Editor after creating the tables
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_shipping_price(
  p_courier_id UUID,
  p_service_level VARCHAR(50),
  p_weight DECIMAL(10,2),
  p_distance INTEGER,
  p_from_postal VARCHAR(10),
  p_to_postal VARCHAR(10),
  p_surcharges TEXT[] DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_base_price DECIMAL(10,2) DEFAULT 0;
  v_price_per_kg DECIMAL(10,2) DEFAULT 0;
  v_price_per_km DECIMAL(10,2) DEFAULT 0;
  v_weight_cost DECIMAL(10,2) DEFAULT 0;
  v_distance_cost DECIMAL(10,2) DEFAULT 0;
  v_zone_multiplier DECIMAL(5,2) DEFAULT 1.0;
  v_surcharge_total DECIMAL(10,2) DEFAULT 0;
  v_surcharge_percentage DECIMAL(5,2) DEFAULT 0;
  v_subtotal DECIMAL(10,2);
  v_final_price DECIMAL(10,2);
  v_min_price DECIMAL(10,2);
  v_max_price DECIMAL(10,2);
  v_breakdown JSONB;
  v_courier_name VARCHAR(255);
  v_zone_name VARCHAR(100);
  v_is_remote BOOLEAN DEFAULT false;
BEGIN
  -- Validate inputs
  IF p_courier_id IS NULL THEN
    RAISE EXCEPTION 'courier_id is required';
  END IF;
  
  IF p_service_level IS NULL OR p_service_level NOT IN ('standard', 'express', 'same_day') THEN
    RAISE EXCEPTION 'Invalid service_level. Must be: standard, express, or same_day';
  END IF;
  
  IF p_weight IS NULL OR p_weight <= 0 THEN
    RAISE EXCEPTION 'Weight must be greater than 0';
  END IF;
  
  IF p_distance IS NULL OR p_distance < 0 THEN
    RAISE EXCEPTION 'Distance must be 0 or greater';
  END IF;

  -- Get courier name
  SELECT c.courier_name INTO v_courier_name
  FROM couriers c
  WHERE c.courier_id = p_courier_id;
  
  IF v_courier_name IS NULL THEN
    RAISE EXCEPTION 'Courier not found: %', p_courier_id;
  END IF;

  -- 1. Get base pricing
  SELECT 
    cp.base_price,
    cp.price_per_kg,
    cp.price_per_km,
    cp.min_price,
    cp.max_price
  INTO 
    v_base_price,
    v_price_per_kg,
    v_price_per_km,
    v_min_price,
    v_max_price
  FROM courier_pricing cp
  WHERE cp.courier_id = p_courier_id
    AND cp.service_level = p_service_level
    AND cp.active = true
    AND (cp.valid_from IS NULL OR cp.valid_from <= CURRENT_DATE)
    AND (cp.valid_to IS NULL OR cp.valid_to >= CURRENT_DATE)
  ORDER BY cp.created_at DESC
  LIMIT 1;

  IF v_base_price IS NULL THEN
    RAISE EXCEPTION 'No pricing found for courier % with service level %', v_courier_name, p_service_level;
  END IF;

  -- 2. Calculate weight cost (tiered pricing takes precedence)
  SELECT pwt.price INTO v_weight_cost
  FROM pricing_weight_tiers pwt
  WHERE pwt.courier_id = p_courier_id
    AND pwt.service_level = p_service_level
    AND p_weight >= pwt.weight_from
    AND p_weight < pwt.weight_to
  ORDER BY pwt.weight_from DESC
  LIMIT 1;
  
  -- Fallback to per-kg pricing if no tier found
  IF v_weight_cost IS NULL THEN
    v_weight_cost := v_price_per_kg * p_weight;
  END IF;

  -- 3. Calculate distance cost (tiered pricing takes precedence)
  SELECT pdt.price INTO v_distance_cost
  FROM pricing_distance_tiers pdt
  WHERE pdt.courier_id = p_courier_id
    AND pdt.service_level = p_service_level
    AND p_distance >= pdt.distance_from
    AND p_distance < pdt.distance_to
  ORDER BY pdt.distance_from DESC
  LIMIT 1;
  
  -- Fallback to per-km pricing if no tier found
  IF v_distance_cost IS NULL THEN
    v_distance_cost := v_price_per_km * p_distance;
  END IF;

  -- 4. Get zone multiplier based on destination postal code
  SELECT 
    pz.zone_multiplier,
    pz.zone_name,
    pz.is_remote_area
  INTO 
    v_zone_multiplier,
    v_zone_name,
    v_is_remote
  FROM pricing_zones pz
  WHERE pz.courier_id = p_courier_id
    AND p_to_postal >= pz.postal_code_from
    AND p_to_postal <= pz.postal_code_to
  ORDER BY pz.zone_multiplier DESC
  LIMIT 1;
  
  -- Default zone multiplier if no zone found
  IF v_zone_multiplier IS NULL THEN
    v_zone_multiplier := 1.0;
    v_zone_name := 'Standard Zone';
  END IF;

  -- 5. Calculate subtotal before surcharges
  v_subtotal := (v_base_price + v_weight_cost + v_distance_cost) * v_zone_multiplier;

  -- 6. Calculate surcharges (fixed amounts)
  IF p_surcharges IS NOT NULL AND array_length(p_surcharges, 1) > 0 THEN
    SELECT COALESCE(SUM(ps.surcharge_amount), 0) INTO v_surcharge_total
    FROM pricing_surcharges ps
    WHERE ps.courier_id = p_courier_id
      AND ps.surcharge_type = ANY(p_surcharges)
      AND ps.active = true
      AND ps.surcharge_amount IS NOT NULL
      AND (ps.applies_to = 'all' OR ps.applies_to = p_service_level);
  END IF;
  
  -- 7. Calculate percentage surcharges (applied to subtotal)
  IF p_surcharges IS NOT NULL AND array_length(p_surcharges, 1) > 0 THEN
    SELECT COALESCE(SUM(ps.surcharge_percentage), 0) INTO v_surcharge_percentage
    FROM pricing_surcharges ps
    WHERE ps.courier_id = p_courier_id
      AND ps.surcharge_type = ANY(p_surcharges)
      AND ps.active = true
      AND ps.surcharge_percentage IS NOT NULL
      AND (ps.applies_to = 'all' OR ps.applies_to = p_service_level);
    
    -- Add percentage surcharge to total
    v_surcharge_total := v_surcharge_total + (v_subtotal * v_surcharge_percentage / 100);
  END IF;
  
  -- Add remote area surcharge if in remote zone
  IF v_is_remote = true THEN
    SELECT COALESCE(ps.surcharge_amount, 0) INTO v_surcharge_total
    FROM pricing_surcharges ps
    WHERE ps.courier_id = p_courier_id
      AND ps.surcharge_type = 'remote_area'
      AND ps.active = true
      AND ps.surcharge_amount IS NOT NULL
    LIMIT 1;
  END IF;

  -- 8. Calculate final price
  v_final_price := v_subtotal + v_surcharge_total;
  
  -- Apply min/max constraints
  IF v_min_price IS NOT NULL AND v_final_price < v_min_price THEN
    v_final_price := v_min_price;
  END IF;
  
  IF v_max_price IS NOT NULL AND v_final_price > v_max_price THEN
    v_final_price := v_max_price;
  END IF;

  -- 9. Build detailed breakdown
  v_breakdown := jsonb_build_object(
    'courier_id', p_courier_id,
    'courier_name', v_courier_name,
    'service_level', p_service_level,
    'base_price', ROUND(v_base_price, 2),
    'weight_cost', ROUND(v_weight_cost, 2),
    'distance_cost', ROUND(v_distance_cost, 2),
    'zone_multiplier', v_zone_multiplier,
    'zone_name', v_zone_name,
    'is_remote_area', v_is_remote,
    'subtotal', ROUND(v_subtotal, 2),
    'surcharge_total', ROUND(v_surcharge_total, 2),
    'surcharge_percentage', v_surcharge_percentage,
    'final_price', ROUND(v_final_price, 2),
    'currency', 'NOK',
    'weight_kg', p_weight,
    'distance_km', p_distance,
    'from_postal', p_from_postal,
    'to_postal', p_to_postal,
    'calculated_at', NOW()
  );

  RETURN v_breakdown;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error in JSON format
    RETURN jsonb_build_object(
      'error', true,
      'message', SQLERRM,
      'courier_id', p_courier_id,
      'service_level', p_service_level
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION calculate_shipping_price TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_shipping_price TO anon;

-- Test the function
DO $$
DECLARE
  v_result JSONB;
  v_courier_id UUID;
BEGIN
  SELECT courier_id INTO v_courier_id FROM couriers WHERE courier_name = 'PostNord' LIMIT 1;
  
  IF v_courier_id IS NOT NULL THEN
    SELECT calculate_shipping_price(
      v_courier_id,
      'standard',
      5.0,
      50,
      '0150',
      '0250',
      ARRAY['fuel']
    ) INTO v_result;
    
    RAISE NOTICE 'Test result: %', v_result;
  ELSE
    RAISE NOTICE 'PostNord courier not found - skipping test';
  END IF;
END $$;
