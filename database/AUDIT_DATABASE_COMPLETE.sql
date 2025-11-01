-- =====================================================
-- COMPLETE DATABASE AUDIT
-- =====================================================
-- Date: November 1, 2025, 8:42 PM
-- Purpose: Verify what tables and functions actually exist
-- vs what we think should exist
-- =====================================================

-- =====================================================
-- 1. LIST ALL TABLES
-- =====================================================

SELECT 
  'TABLES' as audit_type,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::regclass)) as size
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =====================================================
-- 2. CHECK CRITICAL TABLES
-- =====================================================

SELECT 
  'CRITICAL TABLES CHECK' as audit_type,
  table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = critical.table_name)
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM (VALUES
  ('users'),
  ('couriers'),
  ('merchants'),
  ('stores'),
  ('orders'),
  ('reviews'),
  ('courier_analytics'),
  ('couriertrustscore'),
  ('couriertrustscores'),
  ('trustscorecache'),
  ('courier_checkout_positions'),
  ('checkout_courier_analytics'),
  ('courier_ranking_scores'),
  ('courier_ranking_history'),
  ('platform_analytics')
) AS critical(table_name)
ORDER BY status, table_name;

-- =====================================================
-- 3. CHECK ORDERS TABLE COLUMNS
-- =====================================================

SELECT 
  'ORDERS COLUMNS' as audit_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- =====================================================
-- 4. CHECK REVIEWS TABLE COLUMNS
-- =====================================================

SELECT 
  'REVIEWS COLUMNS' as audit_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'reviews'
ORDER BY ordinal_position;

-- =====================================================
-- 5. CHECK COURIER_ANALYTICS TABLE
-- =====================================================

SELECT 
  'COURIER_ANALYTICS COLUMNS' as audit_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'courier_analytics'
ORDER BY ordinal_position;

-- =====================================================
-- 6. LIST ALL FUNCTIONS
-- =====================================================

SELECT 
  'FUNCTIONS' as audit_type,
  routine_name as function_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- =====================================================
-- 7. CHECK CRITICAL FUNCTIONS
-- =====================================================

SELECT 
  'CRITICAL FUNCTIONS CHECK' as audit_type,
  function_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name = critical.function_name
    )
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM (VALUES
  ('calculate_courier_trustscore'),
  ('update_courier_trustscore_cache'),
  ('refresh_all_trustscores'),
  ('trigger_trustscore_update'),
  ('calculate_courier_selection_rate'),
  ('calculate_position_performance'),
  ('update_courier_ranking_scores'),
  ('save_ranking_snapshot')
) AS critical(function_name)
ORDER BY status, function_name;

-- =====================================================
-- 8. CHECK TRIGGERS
-- =====================================================

SELECT 
  'TRIGGERS' as audit_type,
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 9. CHECK INDEXES
-- =====================================================

SELECT 
  'INDEXES' as audit_type,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('orders', 'reviews', 'couriers', 'courier_analytics')
ORDER BY tablename, indexname;

-- =====================================================
-- 10. CHECK DATA COUNTS
-- =====================================================

DO $$
DECLARE
  v_users INTEGER;
  v_couriers INTEGER;
  v_merchants INTEGER;
  v_stores INTEGER;
  v_orders INTEGER;
  v_reviews INTEGER;
  v_courier_analytics INTEGER;
BEGIN
  -- Check each table before querying
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    SELECT COUNT(*) INTO v_users FROM users;
  ELSE
    v_users := -1;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'couriers') THEN
    SELECT COUNT(*) INTO v_couriers FROM couriers;
  ELSE
    v_couriers := -1;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchants') THEN
    SELECT COUNT(*) INTO v_merchants FROM merchants;
  ELSE
    v_merchants := -1;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stores') THEN
    SELECT COUNT(*) INTO v_stores FROM stores;
  ELSE
    v_stores := -1;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    SELECT COUNT(*) INTO v_orders FROM orders;
  ELSE
    v_orders := -1;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
    SELECT COUNT(*) INTO v_reviews FROM reviews;
  ELSE
    v_reviews := -1;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_analytics') THEN
    SELECT COUNT(*) INTO v_courier_analytics FROM courier_analytics;
  ELSE
    v_courier_analytics := -1;
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATA COUNTS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Users: %', v_users;
  RAISE NOTICE 'Couriers: %', v_couriers;
  RAISE NOTICE 'Merchants: %', v_merchants;
  RAISE NOTICE 'Stores: %', CASE WHEN v_stores = -1 THEN 'TABLE MISSING' ELSE v_stores::TEXT END;
  RAISE NOTICE 'Orders: %', v_orders;
  RAISE NOTICE 'Reviews: %', v_reviews;
  RAISE NOTICE 'Courier Analytics: %', CASE WHEN v_courier_analytics = -1 THEN 'TABLE MISSING' ELSE v_courier_analytics::TEXT END;
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- 11. CHECK FOREIGN KEY RELATIONSHIPS
-- =====================================================

SELECT 
  'FOREIGN KEYS' as audit_type,
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
  AND tc.table_name IN ('orders', 'reviews', 'courier_analytics')
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- 12. SUMMARY AND RECOMMENDATIONS
-- =====================================================

DO $$
DECLARE
  v_total_tables INTEGER;
  v_total_functions INTEGER;
  v_total_triggers INTEGER;
  v_missing_trustscore_table BOOLEAN;
  v_missing_ranking_tables BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO v_total_tables 
  FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  
  SELECT COUNT(*) INTO v_total_functions 
  FROM information_schema.routines 
  WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
  
  SELECT COUNT(*) INTO v_total_triggers 
  FROM information_schema.triggers 
  WHERE trigger_schema = 'public';
  
  -- Check for missing tables
  v_missing_trustscore_table := NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name IN ('couriertrustscore', 'couriertrustscores', 'trustscorecache')
  );
  
  v_missing_ranking_tables := NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name IN ('courier_ranking_scores', 'courier_ranking_history')
  );
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'AUDIT SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total Tables: %', v_total_tables;
  RAISE NOTICE 'Total Functions: %', v_total_functions;
  RAISE NOTICE 'Total Triggers: %', v_total_triggers;
  RAISE NOTICE '';
  RAISE NOTICE 'CRITICAL FINDINGS:';
  
  IF v_missing_trustscore_table THEN
    RAISE NOTICE '❌ TrustScore cache table MISSING';
    RAISE NOTICE '   → Need to create: couriertrustscores or trustscorecache';
  ELSE
    RAISE NOTICE '✅ TrustScore cache table exists';
  END IF;
  
  IF v_missing_ranking_tables THEN
    RAISE NOTICE '❌ Ranking tables MISSING';
    RAISE NOTICE '   → Need to deploy: CREATE_DYNAMIC_RANKING_TABLES.sql';
  ELSE
    RAISE NOTICE '✅ Ranking tables exist';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Review table list above';
  RAISE NOTICE '2. Check function list for missing functions';
  RAISE NOTICE '3. Deploy missing tables/functions';
  RAISE NOTICE '4. Re-run this audit to verify';
  RAISE NOTICE '========================================';
END $$;
