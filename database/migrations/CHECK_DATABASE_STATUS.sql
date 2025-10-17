-- ============================================================================
-- DATABASE STATUS CHECK - Comprehensive Analysis
-- Date: October 17, 2025
-- Purpose: Identify missing tables, columns, functions, and policies
-- ============================================================================

-- ============================================================================
-- SECTION 1: CHECK ALL EXPECTED TABLES
-- ============================================================================

SELECT 
  t.table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = t.table_name
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM (
  VALUES 
    ('users'),
    ('merchants'),
    ('couriers'),
    ('orders'),
    ('reviews'),
    ('system_settings'),
    ('system_settings_history'),
    ('system_settings_backups'),
    ('proximity_settings'),
    ('postal_codes'),
    ('proximity_matches'),
    ('subscription_plans'),
    ('user_subscriptions'),
    ('claims'),
    ('tracking_events'),
    ('notifications')
) AS t(table_name)
ORDER BY 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = t.table_name
    ) THEN 0 ELSE 1 
  END,
  t.table_name;

-- ============================================================================
-- SECTION 2: CHECK SYSTEM_SETTINGS TABLE
-- ============================================================================

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings')
    THEN '✅ system_settings table EXISTS'
    ELSE '❌ system_settings table MISSING'
  END as status;

-- Check columns if table exists
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'system_settings'
ORDER BY ordinal_position;

-- ============================================================================
-- SECTION 3: CHECK PROXIMITY TABLES
-- ============================================================================

SELECT 
  'proximity_settings' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'proximity_settings')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
UNION ALL
SELECT 
  'postal_codes',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'postal_codes')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END
UNION ALL
SELECT 
  'proximity_matches',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'proximity_matches')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END;

-- ============================================================================
-- SECTION 4: CHECK MERCHANTS TABLE PROXIMITY COLUMNS
-- ============================================================================

SELECT 
  c.column_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'merchants' AND column_name = c.column_name
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM (
  VALUES 
    ('delivery_range_km'),
    ('postal_code_ranges'),
    ('latitude'),
    ('longitude')
) AS c(column_name);

-- ============================================================================
-- SECTION 5: CHECK COURIERS TABLE PROXIMITY COLUMNS
-- ============================================================================

SELECT 
  c.column_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'couriers' AND column_name = c.column_name
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM (
  VALUES 
    ('service_range_km'),
    ('postal_code_ranges'),
    ('latitude'),
    ('longitude')
) AS c(column_name);

-- ============================================================================
-- SECTION 6: CHECK HELPER FUNCTIONS
-- ============================================================================

SELECT 
  f.function_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_name = f.function_name
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM (
  VALUES 
    ('update_system_settings_updated_at'),
    ('create_settings_backup'),
    ('restore_settings_backup'),
    ('get_setting_value'),
    ('calculate_distance_km'),
    ('is_postal_code_in_range'),
    ('find_nearby_couriers'),
    ('get_proximity_settings')
) AS f(function_name)
ORDER BY 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_name = f.function_name
    ) THEN 0 ELSE 1 
  END;

-- ============================================================================
-- SECTION 7: CHECK TRIGGERS
-- ============================================================================

SELECT 
  t.trigger_name,
  t.table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE event_object_table = t.table_name AND trigger_name = t.trigger_name
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM (
  VALUES 
    ('trigger_update_system_settings_updated_at', 'system_settings'),
    ('trigger_update_system_settings_history_updated_at', 'system_settings_history'),
    ('trigger_update_proximity_settings_updated_at', 'proximity_settings'),
    ('trigger_update_postal_codes_updated_at', 'postal_codes')
) AS t(trigger_name, table_name);

-- ============================================================================
-- SECTION 8: CHECK RLS STATUS
-- ============================================================================

SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS ENABLED'
    ELSE '⚠️ RLS DISABLED'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'system_settings',
    'system_settings_history',
    'system_settings_backups',
    'proximity_settings',
    'postal_codes',
    'proximity_matches'
  )
ORDER BY tablename;

-- ============================================================================
-- SECTION 9: CHECK INDEXES
-- ============================================================================

SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND (
    tablename IN ('system_settings', 'proximity_settings', 'postal_codes', 'proximity_matches')
    OR indexname LIKE '%proximity%'
    OR indexname LIKE '%coords%'
  )
ORDER BY tablename, indexname;

-- ============================================================================
-- SECTION 10: DATA COUNTS
-- ============================================================================

DO $$
DECLARE
  ss_count INTEGER := 0;
  pc_count INTEGER := 0;
  ps_count INTEGER := 0;
BEGIN
  -- Count system_settings
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings') THEN
    SELECT COUNT(*) INTO ss_count FROM system_settings;
  END IF;
  
  -- Count postal_codes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'postal_codes') THEN
    SELECT COUNT(*) INTO pc_count FROM postal_codes;
  END IF;
  
  -- Count proximity_settings
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'proximity_settings') THEN
    SELECT COUNT(*) INTO ps_count FROM proximity_settings;
  END IF;
  
  RAISE NOTICE 'DATA COUNTS:';
  RAISE NOTICE '  system_settings: % rows', ss_count;
  RAISE NOTICE '  postal_codes: % rows', pc_count;
  RAISE NOTICE '  proximity_settings: % rows', ps_count;
END $$;

-- ============================================================================
-- SECTION 11: SUMMARY
-- ============================================================================

SELECT 
  'SUMMARY' as section,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('system_settings', 'system_settings_history', 'system_settings_backups')) as system_settings_tables,
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('proximity_settings', 'postal_codes', 'proximity_matches')) as proximity_tables,
  (SELECT COUNT(*) FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name IN ('calculate_distance_km', 'is_postal_code_in_range', 'find_nearby_couriers', 'get_proximity_settings')) as proximity_functions,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = 'merchants' 
   AND column_name IN ('delivery_range_km', 'postal_code_ranges', 'latitude', 'longitude')) as merchant_proximity_columns,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = 'couriers' 
   AND column_name IN ('service_range_km', 'postal_code_ranges', 'latitude', 'longitude')) as courier_proximity_columns;
