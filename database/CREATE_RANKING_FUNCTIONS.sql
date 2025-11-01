-- =====================================================
-- DYNAMIC COURIER RANKING - CALCULATION FUNCTIONS
-- =====================================================
-- Date: November 1, 2025
-- Purpose: Calculate data-driven courier rankings from checkout analytics
-- Implementation: Phase 2 of 5
-- =====================================================

-- =====================================================
-- FUNCTION 1: CALCULATE COURIER SELECTION RATE
-- =====================================================

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
    AND event_timestamp > NOW() - (p_days_back || ' days')::INTERVAL
    AND (p_postal_area IS NULL OR delivery_postal_code LIKE p_postal_area || '%');
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_courier_selection_rate IS 
'Calculate selection rate and position metrics for a courier from checkout analytics';

-- =====================================================
-- FUNCTION 2: CALCULATE POSITION PERFORMANCE
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_position_performance(
  p_courier_id UUID,
  p_postal_area VARCHAR DEFAULT NULL
)
RETURNS NUMERIC AS $$
DECLARE
  v_avg_position NUMERIC;
  v_selection_rate NUMERIC;
  v_expected_rate NUMERIC;
  v_performance NUMERIC;
  v_display_count BIGINT;
BEGIN
  -- Get average position and selection rate
  SELECT 
    AVG(position_shown),
    (COUNT(*) FILTER (WHERE was_selected = true)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
    COUNT(*)
  INTO v_avg_position, v_selection_rate, v_display_count
  FROM checkout_courier_analytics
  WHERE 
    courier_id = p_courier_id
    AND event_timestamp > NOW() - INTERVAL '30 days'
    AND (p_postal_area IS NULL OR delivery_postal_code LIKE p_postal_area || '%');
  
  -- Need minimum data for statistical significance
  IF v_display_count < 10 THEN
    RETURN 1.0; -- Neutral score if not enough data
  END IF;
  
  -- Expected selection rate based on average position
  -- Position 1: 40%, Position 2: 25%, Position 3: 15%, Position 4: 10%, Position 5+: 5%
  v_expected_rate := CASE 
    WHEN v_avg_position IS NULL THEN 20 -- Default if no position data
    WHEN v_avg_position <= 1.0 THEN 40
    WHEN v_avg_position <= 1.5 THEN 32.5 -- Between 1 and 2
    WHEN v_avg_position <= 2.0 THEN 25
    WHEN v_avg_position <= 2.5 THEN 20 -- Between 2 and 3
    WHEN v_avg_position <= 3.0 THEN 15
    WHEN v_avg_position <= 3.5 THEN 12.5 -- Between 3 and 4
    WHEN v_avg_position <= 4.0 THEN 10
    WHEN v_avg_position <= 4.5 THEN 7.5 -- Between 4 and 5
    ELSE 5
  END;
  
  -- Performance = actual / expected (1.0 = meets expectations)
  v_performance := CASE 
    WHEN v_expected_rate > 0 AND v_selection_rate IS NOT NULL
    THEN v_selection_rate / v_expected_rate
    ELSE 1.0
  END;
  
  -- Cap performance between 0 and 2.0 (200% of expected)
  RETURN GREATEST(0, LEAST(2.0, ROUND(v_performance, 4)));
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_position_performance IS 
'Calculate if courier performs better/worse than expected for their average position (1.0 = meets expectations)';

-- =====================================================
-- FUNCTION 3: UPDATE ALL COURIER RANKING SCORES
-- =====================================================

CREATE OR REPLACE FUNCTION update_courier_ranking_scores(
  p_postal_area VARCHAR DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_courier RECORD;
  v_selection_data RECORD;
  v_final_score NUMERIC;
BEGIN
  -- Loop through all active couriers
  FOR v_courier IN 
    SELECT DISTINCT c.courier_id
    FROM couriers c
    WHERE c.is_active = true
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
'Calculate and update dynamic ranking scores for all active couriers. Returns count of updated couriers.';

-- =====================================================
-- FUNCTION 4: SAVE RANKING SNAPSHOT TO HISTORY
-- =====================================================

CREATE OR REPLACE FUNCTION save_ranking_snapshot()
RETURNS INTEGER AS $$
DECLARE
  v_saved_count INTEGER := 0;
BEGIN
  -- Insert daily snapshot into history table
  INSERT INTO courier_ranking_history (
    courier_id,
    postal_area,
    ranking_score,
    rank_position,
    trust_score,
    selection_rate,
    total_displays,
    total_selections,
    snapshot_date
  )
  SELECT 
    courier_id,
    postal_area,
    final_ranking_score,
    ROW_NUMBER() OVER (
      PARTITION BY postal_area 
      ORDER BY final_ranking_score DESC
    ) as rank_position,
    trust_score,
    selection_rate,
    total_displays,
    total_selections,
    CURRENT_DATE
  FROM courier_ranking_scores
  ON CONFLICT (courier_id, postal_area, snapshot_date) 
  DO UPDATE SET
    ranking_score = EXCLUDED.ranking_score,
    rank_position = EXCLUDED.rank_position,
    trust_score = EXCLUDED.trust_score,
    selection_rate = EXCLUDED.selection_rate,
    total_displays = EXCLUDED.total_displays,
    total_selections = EXCLUDED.total_selections;
  
  GET DIAGNOSTICS v_saved_count = ROW_COUNT;
  
  RETURN v_saved_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION save_ranking_snapshot IS 
'Save daily snapshot of courier rankings to history table for trend analysis';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify functions created
SELECT 
  'Function Created' as status,
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname IN (
  'calculate_courier_selection_rate',
  'calculate_position_performance',
  'update_courier_ranking_scores',
  'save_ranking_snapshot'
)
ORDER BY proname;

-- Test calculate_courier_selection_rate (if checkout data exists)
-- SELECT * FROM calculate_courier_selection_rate(
--   (SELECT courier_id FROM couriers LIMIT 1),
--   NULL,
--   30
-- );

-- Test calculate_position_performance (if checkout data exists)
-- SELECT calculate_position_performance(
--   (SELECT courier_id FROM couriers LIMIT 1),
--   NULL
-- );
