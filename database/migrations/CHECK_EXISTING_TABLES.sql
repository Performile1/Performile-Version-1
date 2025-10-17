-- ============================================================================
-- CHECK EXISTING TABLES AND ROW COUNTS
-- This script only queries what EXISTS - no errors if tables are missing
-- ============================================================================

-- ============================================================================
-- SECTION 1: ALL TABLES IN DATABASE
-- ============================================================================

SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- SECTION 2: ROW COUNTS FOR ALL EXISTING TABLES
-- ============================================================================

DO $$
DECLARE
  table_record RECORD;
  row_count INTEGER;
  total_tables INTEGER := 0;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'TABLE ROW COUNTS';
  RAISE NOTICE '============================================';
  
  FOR table_record IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I', table_record.table_name) INTO row_count;
    RAISE NOTICE '% : % rows', RPAD(table_record.table_name, 40), row_count;
    total_tables := total_tables + 1;
  END LOOP;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'TOTAL TABLES: %', total_tables;
  RAISE NOTICE '============================================';
END $$;

-- ============================================================================
-- SECTION 3: CHECK WEEK 1 IMPLEMENTATION STATUS
-- ============================================================================

SELECT 
  'WEEK 1 - SYSTEM SETTINGS' as feature,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings') 
    THEN '✅ INSTALLED' ELSE '❌ NOT INSTALLED' END as status;

SELECT 
  'WEEK 1 - PROXIMITY SYSTEM' as feature,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'proximity_settings') 
    THEN '✅ INSTALLED' ELSE '❌ NOT INSTALLED' END as status;

-- ============================================================================
-- SECTION 4: DETAILED WEEK 1 TABLE CHECK
-- ============================================================================

SELECT 
  t.table_name,
  t.feature,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = t.table_name
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM (
  VALUES 
    ('system_settings', 'System Settings'),
    ('system_settings_history', 'System Settings'),
    ('system_settings_backups', 'System Settings'),
    ('proximity_settings', 'Proximity System'),
    ('postal_codes', 'Proximity System'),
    ('proximity_matches', 'Proximity System')
) AS t(table_name, feature)
ORDER BY t.feature, t.table_name;

-- ============================================================================
-- SECTION 5: CHECK ALTERED COLUMNS ON EXISTING TABLES
-- ============================================================================

-- Check merchants table
SELECT 
  'merchants' as table_name,
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
) AS c(column_name)
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchants');

-- Check couriers table
SELECT 
  'couriers' as table_name,
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
) AS c(column_name)
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'couriers');

-- ============================================================================
-- SECTION 6: CHECK FUNCTIONS
-- ============================================================================

SELECT 
  routine_name as function_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND (
    routine_name LIKE '%settings%' OR
    routine_name LIKE '%distance%' OR
    routine_name LIKE '%postal%' OR
    routine_name LIKE '%proximity%' OR
    routine_name LIKE '%nearby%'
  )
ORDER BY routine_name;

-- ============================================================================
-- SECTION 7: CHECK TRIGGERS
-- ============================================================================

SELECT 
  trigger_name,
  event_object_table as table_name,
  event_manipulation as event_type
FROM information_schema.triggers
WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- SECTION 8: CHECK INDEXES
-- ============================================================================

SELECT 
  tablename,
  indexname,
  CASE 
    WHEN indexname LIKE '%pkey%' THEN 'Primary Key'
    WHEN indexname LIKE '%proximity%' THEN 'Proximity Index'
    WHEN indexname LIKE '%coords%' THEN 'Coordinates Index'
    WHEN indexname LIKE '%settings%' THEN 'Settings Index'
    ELSE 'Other Index'
  END as index_type
FROM pg_indexes 
WHERE schemaname = 'public'
  AND (
    tablename IN ('system_settings', 'system_settings_history', 'system_settings_backups',
                  'proximity_settings', 'postal_codes', 'proximity_matches',
                  'merchants', 'couriers')
    OR indexname LIKE '%proximity%'
    OR indexname LIKE '%coords%'
    OR indexname LIKE '%settings%'
  )
ORDER BY tablename, indexname;

-- ============================================================================
-- SECTION 9: CHECK RLS POLICIES
-- ============================================================================

SELECT 
  pg_policies.tablename,
  pg_policies.policyname,
  pg_policies.cmd as operation,
  CASE 
    WHEN pg_tables.rowsecurity THEN '✅ RLS ENABLED'
    ELSE '⚠️ RLS DISABLED'
  END as rls_status
FROM pg_policies
JOIN pg_tables ON pg_policies.tablename = pg_tables.tablename 
  AND pg_policies.schemaname = pg_tables.schemaname
WHERE pg_policies.schemaname = 'public'
  AND pg_policies.tablename IN (
    'system_settings', 'system_settings_history', 'system_settings_backups',
    'proximity_settings', 'postal_codes', 'proximity_matches'
  )
ORDER BY pg_policies.tablename, pg_policies.policyname;

-- ============================================================================
-- SECTION 10: SUMMARY REPORT
-- ============================================================================

DO $$
DECLARE
  total_tables INTEGER;
  system_settings_tables INTEGER;
  proximity_tables INTEGER;
  merchant_cols INTEGER;
  courier_cols INTEGER;
  total_functions INTEGER;
  total_triggers INTEGER;
  total_indexes INTEGER;
BEGIN
  -- Count total tables
  SELECT COUNT(*) INTO total_tables
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  
  -- Count system settings tables
  SELECT COUNT(*) INTO system_settings_tables
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('system_settings', 'system_settings_history', 'system_settings_backups');
  
  -- Count proximity tables
  SELECT COUNT(*) INTO proximity_tables
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('proximity_settings', 'postal_codes', 'proximity_matches');
  
  -- Count merchant proximity columns
  SELECT COUNT(*) INTO merchant_cols
  FROM information_schema.columns
  WHERE table_name = 'merchants'
    AND column_name IN ('delivery_range_km', 'postal_code_ranges', 'latitude', 'longitude');
  
  -- Count courier proximity columns
  SELECT COUNT(*) INTO courier_cols
  FROM information_schema.columns
  WHERE table_name = 'couriers'
    AND column_name IN ('service_range_km', 'postal_code_ranges', 'latitude', 'longitude');
  
  -- Count functions
  SELECT COUNT(*) INTO total_functions
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND (routine_name LIKE '%settings%' OR routine_name LIKE '%distance%' 
         OR routine_name LIKE '%postal%' OR routine_name LIKE '%proximity%');
  
  -- Count triggers
  SELECT COUNT(*) INTO total_triggers
  FROM information_schema.triggers
  WHERE event_object_schema = 'public';
  
  -- Count indexes
  SELECT COUNT(*) INTO total_indexes
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND (tablename IN ('system_settings', 'proximity_settings', 'postal_codes', 'proximity_matches')
         OR indexname LIKE '%proximity%' OR indexname LIKE '%coords%');
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'DATABASE SUMMARY';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total Tables: %', total_tables;
  RAISE NOTICE '';
  RAISE NOTICE 'WEEK 1 IMPLEMENTATION:';
  RAISE NOTICE '  System Settings Tables: %/3', system_settings_tables;
  RAISE NOTICE '  Proximity Tables: %/3', proximity_tables;
  RAISE NOTICE '  Merchant Proximity Columns: %/4', merchant_cols;
  RAISE NOTICE '  Courier Proximity Columns: %/4', courier_cols;
  RAISE NOTICE '  Helper Functions: %', total_functions;
  RAISE NOTICE '  Triggers: %', total_triggers;
  RAISE NOTICE '  Indexes: %', total_indexes;
  RAISE NOTICE '';
  RAISE NOTICE 'STATUS:';
  IF system_settings_tables = 3 THEN
    RAISE NOTICE '  ✅ System Settings: COMPLETE';
  ELSE
    RAISE NOTICE '  ❌ System Settings: INCOMPLETE (Run create_system_settings_table.sql)';
  END IF;
  
  IF proximity_tables = 3 AND merchant_cols = 4 AND courier_cols = 4 THEN
    RAISE NOTICE '  ✅ Proximity System: COMPLETE';
  ELSE
    RAISE NOTICE '  ❌ Proximity System: INCOMPLETE (Run create_proximity_system.sql)';
  END IF;
  RAISE NOTICE '============================================';
END $$;
