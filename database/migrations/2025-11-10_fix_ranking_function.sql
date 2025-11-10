-- ============================================================================
-- FIX: Update Courier Ranking Function - Add courier_id Parameter
-- ============================================================================
-- Date: November 10, 2025
-- Purpose: Fix function signature to match API usage
-- Issue: API calls function with courier_id but function doesn't accept it
-- ============================================================================

-- Drop existing functions to avoid signature conflicts
DROP FUNCTION IF EXISTS update_courier_ranking_scores(VARCHAR);
DROP FUNCTION IF EXISTS calculate_courier_selection_rate(UUID, VARCHAR, INTEGER);

-- Recreate calculate_courier_selection_rate (needed by update function)
CREATE OR REPLACE FUNCTION calculate_courier_selection_rate(
  p_courier_id UUID,
  p_postal_area VARCHAR DEFAULT NULL,
  p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_displays BIGINT,
  total_selections BIGINT,
  selection_rate NUMERIC,
  avg_position_shown NUMERIC,
  avg_position_selected NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_displays,
    COUNT(*) FILTER (WHERE was_selected = true) as total_selections,
    CASE 
      WHEN COUNT(*) > 0 
      THEN ROUND((COUNT(*) FILTER (WHERE was_selected = true)::NUMERIC / COUNT(*)) * 100, 4)
      ELSE 0
    END as selection_rate,
    ROUND(AVG(position_shown)::NUMERIC, 2) as avg_position_shown,
    ROUND(AVG(position_shown) FILTER (WHERE was_selected = true)::NUMERIC, 2) as avg_position_selected
  FROM checkout_courier_analytics
  WHERE 
    courier_id = p_courier_id
    AND created_at > NOW() - (p_days_back || ' days')::INTERVAL
    AND (p_postal_area IS NULL OR delivery_postal_code LIKE p_postal_area || '%');
END;
$$ LANGUAGE plpgsql STABLE;

-- Recreate update_courier_ranking_scores with new signature
CREATE OR REPLACE FUNCTION update_courier_ranking_scores(
  p_postal_area VARCHAR DEFAULT NULL,
  p_courier_id UUID DEFAULT NULL  -- ADDED: Filter by specific courier
)
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_courier RECORD;
  v_selection_data RECORD;
  v_final_score NUMERIC;
BEGIN
  -- Loop through all active couriers (with optional filter)
  FOR v_courier IN 
    SELECT DISTINCT c.courier_id
    FROM couriers c
    WHERE c.is_active = true
      AND (p_courier_id IS NULL OR c.courier_id = p_courier_id)  -- ADDED: Filter
  LOOP
    -- Get selection rate data
    SELECT * INTO v_selection_data
    FROM calculate_courier_selection_rate(v_courier.courier_id, p_postal_area, 30);
    
    -- Calculate final ranking score
    SELECT 
      -- Performance Metrics (50% weight)
      (COALESCE(ca.trust_score, 0) / 5.0) * 0.20 +                    -- 20%: TrustScore (0-5 → 0-1)
      (COALESCE(ca.on_time_rate, 0) / 100) * 0.15 +                   -- 15%: On-time rate
      (1 - LEAST(COALESCE(ca.avg_delivery_days, 3), 7) / 7) * 0.10 +  -- 10%: Delivery speed (inverted)
      (COALESCE(ca.completion_rate, 0) / 100) * 0.05 +                -- 5%:  Completion rate
      
      -- Checkout Conversion (30% weight) - only if enough data
      CASE 
        WHEN v_selection_data.total_displays >= 10 THEN
          (COALESCE(v_selection_data.selection_rate, 0) / 100) * 0.15 +  -- 15%: Selection rate
          COALESCE(calculate_position_performance(v_courier.courier_id, p_postal_area), 1.0) * 0.10 * 0.10 + -- 10%: Position performance
          0 * 0.05  -- 5%:  Conversion trend (TODO: implement trend calculation)
        ELSE
          0 -- No conversion data yet, rely on performance metrics
      END +
      
      -- Recency & Activity (20% weight)
      CASE 
        WHEN ca.last_calculated > NOW() - INTERVAL '7 days' THEN 0.10  -- 10%: Recent data
        WHEN ca.last_calculated > NOW() - INTERVAL '30 days' THEN 0.05
        ELSE 0
      END +
      CASE 
        WHEN ca.total_orders >= 50 THEN 0.10  -- 10%: High activity
        WHEN ca.total_orders >= 20 THEN 0.05
        ELSE 0
      END
      
    INTO v_final_score
    FROM courier_analytics ca
    WHERE ca.courier_id = v_courier.courier_id;
    
    -- Insert or update ranking score
    INSERT INTO courier_ranking_scores (
      courier_id,
      postal_area,
      trust_score,
      on_time_rate,
      avg_delivery_days,
      completion_rate,
      total_displays,
      total_selections,
      selection_rate,
      avg_position_shown,
      avg_position_selected,
      position_performance,
      conversion_trend,
      performance_trend,
      recent_performance,
      activity_level,
      final_ranking_score,
      last_calculated,
      calculation_period_start,
      calculation_period_end
    )
    SELECT 
      v_courier.courier_id,
      p_postal_area,
      ca.trust_score,
      ca.on_time_rate,
      ca.avg_delivery_days,
      ca.completion_rate,
      v_selection_data.total_displays,
      v_selection_data.total_selections,
      v_selection_data.selection_rate,
      v_selection_data.avg_position_shown,
      v_selection_data.avg_position_selected,
      calculate_position_performance(v_courier.courier_id, p_postal_area),
      0, -- conversion_trend (TODO)
      0, -- performance_trend (TODO)
      CASE WHEN ca.last_calculated > NOW() - INTERVAL '7 days' THEN 1.0 ELSE 0.5 END,
      CASE WHEN ca.total_orders >= 50 THEN 1.0 WHEN ca.total_orders >= 20 THEN 0.5 ELSE 0.25 END,
      v_final_score,
      NOW(),
      NOW() - INTERVAL '30 days',
      NOW()
    FROM courier_analytics ca
    WHERE ca.courier_id = v_courier.courier_id
    ON CONFLICT (courier_id, postal_area) 
    DO UPDATE SET
      trust_score = EXCLUDED.trust_score,
      on_time_rate = EXCLUDED.on_time_rate,
      avg_delivery_days = EXCLUDED.avg_delivery_days,
      completion_rate = EXCLUDED.completion_rate,
      total_displays = EXCLUDED.total_displays,
      total_selections = EXCLUDED.total_selections,
      selection_rate = EXCLUDED.selection_rate,
      avg_position_shown = EXCLUDED.avg_position_shown,
      avg_position_selected = EXCLUDED.avg_position_selected,
      position_performance = EXCLUDED.position_performance,
      conversion_trend = EXCLUDED.conversion_trend,
      performance_trend = EXCLUDED.performance_trend,
      recent_performance = EXCLUDED.recent_performance,
      activity_level = EXCLUDED.activity_level,
      final_ranking_score = EXCLUDED.final_ranking_score,
      last_calculated = NOW(),
      calculation_period_start = EXCLUDED.calculation_period_start,
      calculation_period_end = EXCLUDED.calculation_period_end,
      updated_at = NOW();
    
    v_updated_count := v_updated_count + 1;
  END LOOP;
  
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_courier_ranking_scores IS 
'Calculate and update dynamic ranking scores for couriers. Optionally filter by postal_area and/or courier_id.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify function signature
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_function_result(oid) as returns
FROM pg_proc
WHERE proname = 'update_courier_ranking_scores';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Function update_courier_ranking_scores() fixed!';
  RAISE NOTICE '📝 Now accepts: p_postal_area, p_courier_id';
  RAISE NOTICE '🎯 Matches API usage';
END $$;
