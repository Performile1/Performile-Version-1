-- ============================================================================
-- VERIFY CHECKOUT ANALYTICS SYSTEM
-- ============================================================================
-- Check if the system is working correctly
-- ============================================================================

-- 1. Check recent analytics data
SELECT 
  checkout_session_id,
  courier_id,
  position_shown,
  was_selected,
  created_at
FROM checkout_courier_analytics 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Check selection rates by courier
SELECT 
  courier_id,
  COUNT(*) as total_displays,
  SUM(CASE WHEN was_selected THEN 1 ELSE 0 END) as total_selections,
  ROUND(100.0 * SUM(CASE WHEN was_selected THEN 1 ELSE 0 END) / COUNT(*), 2) as selection_rate_percent
FROM checkout_courier_analytics
GROUP BY courier_id
ORDER BY selection_rate_percent DESC;

SELECT 
  courier_id,
  postal_code,
  final_score,
  selection_rate,
  position_performance,
  activity_level,
  last_calculated
FROM courier_ranking_scores
ORDER BY final_score DESC
LIMIT 10;

SELECT 
  snapshot_date,
  COUNT(*) as couriers_ranked
FROM courier_ranking_history
GROUP BY snapshot_date
ORDER BY snapshot_date DESC
LIMIT 5;

SELECT update_courier_ranking_scores(NULL, NULL) as couriers_updated;

-- 6. Verify today's snapshot
SELECT 
  courier_id,
  postal_code,
  final_score,
  rank_position,
  snapshot_date,
  created_at
FROM courier_ranking_history
WHERE snapshot_date = CURRENT_DATE
ORDER BY rank_position
LIMIT 10;
