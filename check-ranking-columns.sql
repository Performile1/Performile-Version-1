-- ============================================================================
-- CHECK RANKING TABLES COLUMNS
-- ============================================================================

-- Check columns in courier_ranking_scores
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'courier_ranking_scores'
ORDER BY ordinal_position;
