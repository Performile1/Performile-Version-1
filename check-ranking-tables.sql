-- ============================================================================
-- CHECK RANKING TABLES STRUCTURE
-- ============================================================================

-- 1. Check if courier_ranking_scores table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'courier_ranking_scores';

-- 2. Check columns in courier_ranking_scores
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'courier_ranking_scores'
ORDER BY ordinal_position;

-- 3. Check if courier_ranking_history table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'courier_ranking_history';

-- 4. Check columns in courier_ranking_history
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'courier_ranking_history'
ORDER BY ordinal_position;

-- 5. Check current data in ranking_scores (if table exists)
SELECT COUNT(*) as total_scores
FROM courier_ranking_scores;

-- 6. Check current data in ranking_history (if table exists)
SELECT COUNT(*) as total_history_records
FROM courier_ranking_history;
