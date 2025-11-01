-- =====================================================
-- TEST DEPLOYED FUNCTIONS
-- =====================================================

-- Test 1: Calculate TrustScore for all active couriers
SELECT 
  c.courier_name,
  calculate_courier_trustscore(c.courier_id) as trust_score,
  ca.avg_rating,
  ca.completion_rate,
  ca.on_time_rate
FROM couriers c
LEFT JOIN courier_analytics ca ON c.courier_id = ca.courier_id
WHERE c.is_active = true
ORDER BY trust_score DESC;

-- Test 2: Update courier analytics with TrustScore
UPDATE courier_analytics ca
SET trust_score = calculate_courier_trustscore(ca.courier_id)
WHERE ca.courier_id IN (
  SELECT courier_id FROM couriers WHERE is_active = true
);

-- Test 3: Calculate rankings for all couriers
SELECT update_courier_ranking_scores();

-- Test 4: View ranking results
SELECT 
  c.courier_name,
  crs.postal_code,
  crs.trust_score,
  crs.selection_rate,
  crs.performance_score,
  crs.conversion_score,
  crs.final_score,
  crs.rank_position
FROM courier_ranking_scores crs
JOIN couriers c ON crs.courier_id = c.courier_id
ORDER BY crs.postal_code, crs.rank_position
LIMIT 20;

-- Test 5: Summary
SELECT 
  'Test Results' as status,
  (SELECT COUNT(*) FROM courier_analytics WHERE trust_score > 0) as couriers_with_trustscore,
  (SELECT COUNT(*) FROM courier_ranking_scores) as ranking_scores_calculated,
  (SELECT AVG(trust_score) FROM courier_analytics WHERE trust_score > 0) as avg_trustscore,
  (SELECT AVG(final_score) FROM courier_ranking_scores) as avg_ranking_score;
