-- ============================================================================
-- FIX: Update Courier Ranking Function - Add courier_id Parameter
-- ============================================================================
-- Date: November 10, 2025
-- Purpose: Fix function signature to match API usage
-- Issue: API calls function with courier_id but function doesn't accept it
-- ============================================================================

DROP FUNCTION IF EXISTS update_courier_ranking_scores(VARCHAR);
DROP FUNCTION IF EXISTS update_courier_ranking_scores(VARCHAR, UUID);
DROP FUNCTION IF EXISTS calculate_courier_selection_rate(UUID, VARCHAR, INTEGER);
DROP FUNCTION IF EXISTS calculate_position_performance(UUID, VARCHAR);

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

-- Recreate calculate_position_performance helper (align with current schema)
CREATE OR REPLACE FUNCTION calculate_position_performance(
  p_courier_id UUID,
  p_postal_area VARCHAR DEFAULT NULL,
  p_days_back INTEGER DEFAULT 30
)
RETURNS NUMERIC AS $$
DECLARE
  v_avg_position NUMERIC;
  v_selection_rate NUMERIC;
  v_expected_rate NUMERIC;
  v_display_count BIGINT;
BEGIN
  SELECT 
    AVG(position_shown),
    (COUNT(*) FILTER (WHERE was_selected = true)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
    COUNT(*)
  INTO v_avg_position, v_selection_rate, v_display_count
  FROM checkout_courier_analytics
  WHERE
    courier_id = p_courier_id
    AND created_at > NOW() - (p_days_back || ' days')::INTERVAL
    AND (p_postal_area IS NULL OR delivery_postal_code LIKE p_postal_area || '%');

  IF v_display_count IS NULL OR v_display_count < 10 THEN
    RETURN 1.0;
  END IF;

  v_expected_rate := CASE 
    WHEN v_avg_position IS NULL THEN 20
    WHEN v_avg_position <= 1.0 THEN 40
    WHEN v_avg_position <= 1.5 THEN 32.5
    WHEN v_avg_position <= 2.0 THEN 25
    WHEN v_avg_position <= 2.5 THEN 20
    WHEN v_avg_position <= 3.0 THEN 15
    WHEN v_avg_position <= 3.5 THEN 12.5
    WHEN v_avg_position <= 4.0 THEN 10
    WHEN v_avg_position <= 4.5 THEN 7.5
    ELSE 5
  END;

  IF v_expected_rate <= 0 OR v_selection_rate IS NULL THEN
    RETURN 1.0;
  END IF;

  RETURN GREATEST(0, LEAST(2.0, ROUND(v_selection_rate / v_expected_rate, 4)));
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION update_courier_ranking_scores(
  p_postal_code VARCHAR DEFAULT NULL,
  p_courier_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_courier RECORD;
  v_selection_data RECORD;
  v_performance_score NUMERIC;
  v_conversion_score NUMERIC;
  v_activity_score NUMERIC;
  v_recent_performance NUMERIC;
  v_position_performance NUMERIC;
  v_final_score NUMERIC;
  v_effective_postal VARCHAR;
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
    FROM calculate_courier_selection_rate(v_courier.courier_id, p_postal_code, 30);
    
    -- Determine effective postal code bucket
    v_effective_postal := COALESCE(p_postal_code, 'ALL');
    
    -- Calculate position performance (1.0 = expected performance)
    v_position_performance := calculate_position_performance(v_courier.courier_id, p_postal_code, 30);
    
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
          COALESCE(v_position_performance, 1.0) * 0.10 + -- 10%: Position performance
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
    
    IF NOT FOUND THEN
      -- Skip couriers without analytics data
      CONTINUE;
    END IF;

    -- Derive component scores
    v_performance_score := (COALESCE(v_final_score, 0)) * 0.5;
    v_conversion_score := CASE 
      WHEN v_selection_data.total_displays >= 10 THEN
        (COALESCE(v_selection_data.selection_rate, 0) / 100) * 0.7 +
        (COALESCE(v_position_performance, 1.0)) * 0.3
      ELSE NULL
    END;

    v_activity_score := CASE 
      WHEN v_selection_data.total_displays >= 50 THEN 1.0
      WHEN v_selection_data.total_displays >= 20 THEN 0.7
      WHEN v_selection_data.total_displays >= 10 THEN 0.5
      WHEN v_selection_data.total_displays > 0 THEN 0.3
      ELSE 0.0
    END;

    v_recent_performance := CASE 
      WHEN EXISTS (
        SELECT 1 FROM courier_analytics ca
        WHERE ca.courier_id = v_courier.courier_id
          AND ca.last_calculated > NOW() - INTERVAL '7 days'
      ) THEN 1.0
      ELSE 0.5
    END;

    -- Insert or update ranking score using current schema
    INSERT INTO courier_ranking_scores (
      courier_id,
      postal_code,
      trust_score,
      on_time_rate,
      avg_delivery_days,
      completion_rate,
      performance_score,
      selection_rate,
      position_performance,
      conversion_trend,
      conversion_score,
      recent_performance,
      activity_level,
      activity_score,
      final_score,
      rank_position,
      last_calculated,
      created_at,
      updated_at
    )
    SELECT 
      v_courier.courier_id,
      v_effective_postal,
      ca.trust_score,
      ca.on_time_rate,
      ca.avg_delivery_days,
      ca.completion_rate,
      v_performance_score,
      v_selection_data.selection_rate,
      v_position_performance,
      NULL,
      v_conversion_score,
      v_recent_performance,
      COALESCE(v_selection_data.total_displays, 0),
      v_activity_score,
      v_final_score,
      NULL,
      NOW(),
      NOW(),
      NOW()
    FROM courier_analytics ca
    WHERE ca.courier_id = v_courier.courier_id
    ON CONFLICT (courier_id, postal_code) 
    DO UPDATE SET
      trust_score = EXCLUDED.trust_score,
      on_time_rate = EXCLUDED.on_time_rate,
      avg_delivery_days = EXCLUDED.avg_delivery_days,
      completion_rate = EXCLUDED.completion_rate,
      selection_rate = EXCLUDED.selection_rate,
      position_performance = EXCLUDED.position_performance,
      conversion_trend = EXCLUDED.conversion_trend,
      recent_performance = EXCLUDED.recent_performance,
      activity_level = EXCLUDED.activity_level,
      performance_score = EXCLUDED.performance_score,
      conversion_score = EXCLUDED.conversion_score,
      activity_score = EXCLUDED.activity_score,
      final_score = EXCLUDED.final_score,
      rank_position = EXCLUDED.rank_position,
      last_calculated = NOW(),
      updated_at = NOW();
    
    v_updated_count := v_updated_count + 1;
  END LOOP;

  -- Refresh rank positions for affected postal code
  WITH ranked AS (
    SELECT 
      courier_id,
      postal_code,
      ROW_NUMBER() OVER (PARTITION BY postal_code ORDER BY final_score DESC NULLS LAST) AS computed_rank
    FROM courier_ranking_scores
    WHERE postal_code = COALESCE(p_postal_code, 'ALL')
  )
  UPDATE courier_ranking_scores crs
  SET rank_position = ranked.computed_rank
  FROM ranked
  WHERE crs.courier_id = ranked.courier_id
    AND crs.postal_code = ranked.postal_code;
  
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- Recreate snapshot helper aligned with current history schema
CREATE OR REPLACE FUNCTION save_ranking_snapshot()
RETURNS INTEGER AS $$
DECLARE
  v_saved_count INTEGER := 0;
BEGIN
  INSERT INTO courier_ranking_history (
    courier_id,
    postal_code,
    performance_score,
    conversion_score,
    activity_score,
    final_score,
    rank_position,
    snapshot_date,
    created_at
  )
  SELECT
    courier_id,
    postal_code,
    performance_score,
    conversion_score,
    activity_score,
    final_score,
    ROW_NUMBER() OVER (
      PARTITION BY postal_code
      ORDER BY final_score DESC NULLS LAST
    ) AS rank_position,
    CURRENT_DATE,
    NOW()
  FROM courier_ranking_scores
  ON CONFLICT (courier_id, postal_code, snapshot_date)
  DO UPDATE SET
    performance_score = EXCLUDED.performance_score,
    conversion_score = EXCLUDED.conversion_score,
    activity_score = EXCLUDED.activity_score,
    final_score = EXCLUDED.final_score,
    rank_position = EXCLUDED.rank_position,
    created_at = NOW();

  GET DIAGNOSTICS v_saved_count = ROW_COUNT;
  RETURN v_saved_count;
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
