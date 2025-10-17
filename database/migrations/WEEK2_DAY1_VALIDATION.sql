-- ============================================================================
-- WEEK 2 - DAY 1: ANALYTICS VALIDATION
-- Date: October 17, 2025
-- Purpose: Validate existing analytics tables before implementation
-- ============================================================================

-- ============================================================================
-- 1. CHECK ANALYTICS TABLES STRUCTURE
-- ============================================================================

-- Check shopanalyticssnapshots structure
SELECT 
  'shopanalyticssnapshots' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'shopanalyticssnapshots'
ORDER BY ordinal_position;

-- Check platform_analytics structure
SELECT 
  'platform_analytics' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'platform_analytics'
ORDER BY ordinal_position;

-- Check courier_analytics structure
SELECT 
  'courier_analytics' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'courier_analytics'
ORDER BY ordinal_position;

-- ============================================================================
-- 2. CHECK ROW COUNTS
-- ============================================================================

SELECT 'shopanalyticssnapshots' as table_name, COUNT(*) as row_count 
FROM shopanalyticssnapshots
UNION ALL
SELECT 'platform_analytics', COUNT(*) 
FROM platform_analytics
UNION ALL
SELECT 'courier_analytics', COUNT(*) 
FROM courier_analytics;

-- ============================================================================
-- 3. CHECK INDEXES
-- ============================================================================

SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('shopanalyticssnapshots', 'platform_analytics', 'courier_analytics')
ORDER BY tablename, indexname;

-- ============================================================================
-- 4. CHECK RLS POLICIES
-- ============================================================================

SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename IN ('shopanalyticssnapshots', 'platform_analytics', 'courier_analytics')
ORDER BY tablename, policyname;

-- ============================================================================
-- 5. CHECK FOREIGN KEYS
-- ============================================================================

SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('shopanalyticssnapshots', 'platform_analytics', 'courier_analytics');

-- ============================================================================
-- 6. SAMPLE DATA FROM EACH TABLE
-- ============================================================================

-- Sample from shopanalyticssnapshots
SELECT * FROM shopanalyticssnapshots LIMIT 3;

-- Sample from platform_analytics
SELECT * FROM platform_analytics LIMIT 3;

-- Sample from courier_analytics
SELECT * FROM courier_analytics LIMIT 3;

-- ============================================================================
-- 7. CHECK IF WE NEED ANALYTICS_EVENTS TABLE
-- ============================================================================

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'analytics_events')
    THEN '✅ analytics_events EXISTS'
    ELSE '❌ analytics_events MISSING - Need to create'
  END as status;

-- ============================================================================
-- 8. SUMMARY
-- ============================================================================

SELECT 
  'ANALYTICS TABLES SUMMARY' as section,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_name IN ('shopanalyticssnapshots', 'platform_analytics', 'courier_analytics')) as existing_tables,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = 'shopanalyticssnapshots') as shop_columns,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = 'platform_analytics') as platform_columns,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = 'courier_analytics') as courier_columns;
