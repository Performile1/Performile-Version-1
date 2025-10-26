-- =====================================================
-- COMPLETE DATABASE AUDIT
-- =====================================================
-- Purpose: Audit ALL tables in production database
-- Date: October 26, 2025
-- =====================================================

-- =====================================================
-- 1. ALL TABLES IN DATABASE
-- =====================================================

SELECT '📋 ALL TABLES IN DATABASE' as section;

SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::regclass)) as total_size
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =====================================================
-- 2. TABLES WITH DATA
-- =====================================================

SELECT '📊 TABLES WITH DATA (Row Counts)' as section;

SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count,
  pg_size_pretty(pg_total_relation_size(quote_ident(schemaname)||'.'||quote_ident(tablename))) as size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- =====================================================
-- 3. EMPTY TABLES
-- =====================================================

SELECT '⚠️ EMPTY TABLES (No Data)' as section;

SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
AND n_live_tup = 0
ORDER BY tablename;

-- =====================================================
-- 4. RLS STATUS FOR ALL TABLES
-- =====================================================

SELECT '🔐 RLS STATUS (All Tables)' as section;

SELECT 
  tablename,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rls_enabled DESC, tablename;

-- =====================================================
-- 5. ALL FOREIGN KEYS
-- =====================================================

SELECT '🔗 ALL FOREIGN KEYS' as section;

SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- 6. TABLES WITHOUT RLS
-- =====================================================

SELECT '⚠️ TABLES WITHOUT RLS (Security Risk)' as section;

SELECT 
  tablename,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = pg_tables.tablename) as column_count,
  (SELECT n_live_tup FROM pg_stat_user_tables WHERE pg_stat_user_tables.tablename = pg_tables.tablename) as row_count
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false
ORDER BY row_count DESC NULLS LAST;

-- =====================================================
-- 7. ALL INDEXES
-- =====================================================

SELECT '📇 ALL INDEXES' as section;

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =====================================================
-- 8. MATERIALIZED VIEWS
-- =====================================================

SELECT '📊 MATERIALIZED VIEWS' as section;

SELECT 
  schemaname,
  matviewname,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) as size
FROM pg_matviews
WHERE schemaname = 'public'
ORDER BY matviewname;

-- =====================================================
-- 9. DATABASE SIZE SUMMARY
-- =====================================================

SELECT '💾 DATABASE SIZE SUMMARY' as section;

SELECT 
  pg_size_pretty(pg_database_size(current_database())) as total_database_size,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as total_tables,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) as tables_with_rls,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_rls_policies,
  (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as total_indexes;

-- =====================================================
-- 10. TABLES BY CATEGORY
-- =====================================================

SELECT '📂 TABLES BY CATEGORY' as section;

SELECT 
  CASE 
    WHEN table_name IN ('users', 'roles', 'permissions') THEN '👤 Authentication'
    WHEN table_name IN ('orders', 'order_items', 'order_history') THEN '📦 Orders'
    WHEN table_name IN ('stores', 'merchants', 'shops') THEN '🏪 Stores'
    WHEN table_name IN ('couriers', 'courier_analytics', 'courier_api_credentials') THEN '🚚 Couriers'
    WHEN table_name LIKE '%tracking%' THEN '📍 Tracking'
    WHEN table_name LIKE '%payment%' OR table_name LIKE '%subscription%' THEN '💳 Payments'
    WHEN table_name LIKE '%message%' OR table_name LIKE '%conversation%' OR table_name LIKE '%notification%' THEN '💬 Communication'
    WHEN table_name LIKE '%review%' OR table_name LIKE '%rating%' THEN '⭐ Reviews'
    WHEN table_name LIKE '%analytics%' OR table_name LIKE '%stats%' THEN '📊 Analytics'
    WHEN table_name LIKE '%api%' OR table_name LIKE '%webhook%' OR table_name LIKE '%integration%' THEN '🔌 Integrations'
    WHEN table_name LIKE '%rule%' OR table_name LIKE '%action%' OR table_name LIKE '%condition%' THEN '⚙️ Rules Engine'
    ELSE '📋 Other'
  END as category,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as columns,
  (SELECT n_live_tup FROM pg_stat_user_tables WHERE pg_stat_user_tables.tablename = tables.table_name) as rows
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY category, table_name;

-- =====================================================
-- 11. CRITICAL TABLES STATUS
-- =====================================================

SELECT '⚡ CRITICAL TABLES STATUS' as section;

WITH critical_tables AS (
  SELECT unnest(ARRAY[
    'users', 'orders', 'stores', 'couriers',
    'payment_methods', 'subscriptions', 'api_credentials',
    'tracking_data', 'tracking_events'
  ]) as table_name
)
SELECT 
  ct.table_name,
  CASE WHEN t.table_name IS NOT NULL THEN '✅ Exists' ELSE '❌ Missing' END as exists,
  COALESCE((SELECT n_live_tup FROM pg_stat_user_tables WHERE tablename = ct.table_name), 0) as row_count,
  CASE WHEN pt.rowsecurity THEN '✅ Enabled' ELSE '❌ Disabled' END as rls_status,
  COALESCE((SELECT COUNT(*) FROM pg_policies WHERE tablename = ct.table_name), 0) as policy_count
FROM critical_tables ct
LEFT JOIN information_schema.tables t ON t.table_name = ct.table_name AND t.table_schema = 'public'
LEFT JOIN pg_tables pt ON pt.tablename = ct.table_name AND pt.schemaname = 'public'
ORDER BY ct.table_name;

-- =====================================================
-- 12. DUPLICATE/SIMILAR TABLE NAMES
-- =====================================================

SELECT '⚠️ POTENTIAL DUPLICATE/SIMILAR TABLES' as section;

SELECT 
  t1.table_name as table_1,
  t2.table_name as table_2,
  'Similar names - check if duplicates' as warning
FROM information_schema.tables t1
JOIN information_schema.tables t2 
  ON t1.table_name < t2.table_name
  AND (
    t1.table_name LIKE '%' || SUBSTRING(t2.table_name FROM 1 FOR 5) || '%'
    OR t2.table_name LIKE '%' || SUBSTRING(t1.table_name FROM 1 FOR 5) || '%'
  )
WHERE t1.table_schema = 'public'
AND t2.table_schema = 'public'
AND t1.table_type = 'BASE TABLE'
AND t2.table_type = 'BASE TABLE'
ORDER BY t1.table_name;

-- =====================================================
-- 13. TABLES WITH MOST COLUMNS
-- =====================================================

SELECT '📊 TABLES WITH MOST COLUMNS' as section;

SELECT 
  table_name,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY column_count DESC
LIMIT 10;

-- =====================================================
-- 14. RECENTLY MODIFIED TABLES
-- =====================================================

SELECT '🕐 RECENTLY ACTIVE TABLES' as section;

SELECT 
  schemaname,
  tablename,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY GREATEST(
  COALESCE(last_vacuum, '1970-01-01'::timestamp),
  COALESCE(last_autovacuum, '1970-01-01'::timestamp),
  COALESCE(last_analyze, '1970-01-01'::timestamp),
  COALESCE(last_autoanalyze, '1970-01-01'::timestamp)
) DESC
LIMIT 10;

-- =====================================================
-- 15. AUDIT SUMMARY
-- =====================================================

SELECT '✅ COMPLETE DATABASE AUDIT SUMMARY' as section;

SELECT 
  'Total Tables' as metric,
  COUNT(*)::TEXT as value
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL
SELECT 
  'Tables with Data' as metric,
  COUNT(*)::TEXT as value
FROM pg_stat_user_tables
WHERE schemaname = 'public' AND n_live_tup > 0
UNION ALL
SELECT 
  'Empty Tables' as metric,
  COUNT(*)::TEXT as value
FROM pg_stat_user_tables
WHERE schemaname = 'public' AND n_live_tup = 0
UNION ALL
SELECT 
  'Tables with RLS' as metric,
  COUNT(*)::TEXT as value
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true
UNION ALL
SELECT 
  'Tables WITHOUT RLS' as metric,
  COUNT(*)::TEXT as value
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false
UNION ALL
SELECT 
  'Total RLS Policies' as metric,
  COUNT(*)::TEXT as value
FROM pg_policies
WHERE schemaname = 'public'
UNION ALL
SELECT 
  'Total Foreign Keys' as metric,
  COUNT(*)::TEXT as value
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public'
UNION ALL
SELECT 
  'Total Indexes' as metric,
  COUNT(*)::TEXT as value
FROM pg_indexes
WHERE schemaname = 'public'
UNION ALL
SELECT 
  'Database Size' as metric,
  pg_size_pretty(pg_database_size(current_database())) as value;
