-- ============================================================================
-- VERIFY PROXIMITY SYSTEM MIGRATION
-- Run these queries to confirm everything was created successfully
-- ============================================================================

-- 1. Check if all tables exist
SELECT 
  table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = t.table_name
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (
  VALUES 
    ('proximity_settings'),
    ('postal_codes'),
    ('proximity_matches')
) AS t(table_name);

-- 2. Check proximity_settings table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'proximity_settings'
ORDER BY ordinal_position;
-- Expected: 17 columns

-- 3. Check if columns were added to merchants table
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'merchants' 
  AND column_name IN ('delivery_range_km', 'postal_code_ranges', 'latitude', 'longitude')
ORDER BY column_name;
-- Expected: 4 columns

-- 4. Check if columns were added to couriers table
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'couriers' 
  AND column_name IN ('service_range_km', 'postal_code_ranges', 'latitude', 'longitude')
ORDER BY column_name;
-- Expected: 4 columns

-- 5. Check indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('proximity_settings', 'postal_codes', 'proximity_matches', 'merchants', 'couriers')
  AND indexname LIKE '%proximity%' OR indexname LIKE '%coords%'
ORDER BY tablename, indexname;
-- Expected: 15+ indexes

-- 6. Check helper functions
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND (
    routine_name LIKE '%distance%' OR 
    routine_name LIKE '%postal%' OR 
    routine_name LIKE '%proximity%' OR
    routine_name LIKE '%nearby%'
  )
ORDER BY routine_name;
-- Expected: 4 functions

-- 7. Check RLS policies
SELECT 
  tablename,
  policyname,
  cmd as operation,
  qual as using_clause
FROM pg_policies 
WHERE tablename IN ('proximity_settings', 'postal_codes', 'proximity_matches')
ORDER BY tablename, policyname;
-- Expected: 9 policies

-- 8. Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('proximity_settings', 'postal_codes', 'proximity_matches');
-- Expected: all TRUE

-- 9. Check triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('proximity_settings', 'postal_codes')
ORDER BY event_object_table, trigger_name;
-- Expected: 2 triggers

-- 10. Count sample postal codes
SELECT COUNT(*) as postal_code_count FROM postal_codes;
-- Expected: 9 (sample data)

-- 11. View sample postal codes
SELECT 
  postal_code,
  city,
  country,
  latitude,
  longitude
FROM postal_codes
ORDER BY postal_code
LIMIT 10;

-- ============================================================================
-- TEST HELPER FUNCTIONS
-- ============================================================================

-- Test 1: Calculate distance between Brussels and Antwerp
SELECT 
  'Brussels to Antwerp' as route,
  calculate_distance_km(50.8503, 4.3517, 51.2194, 4.4025) as distance_km,
  'Expected: ~44 km' as expected;

-- Test 2: Calculate distance between Brussels and Ghent
SELECT 
  'Brussels to Ghent' as route,
  calculate_distance_km(50.8503, 4.3517, 51.0543, 3.7174) as distance_km,
  'Expected: ~51 km' as expected;

-- Test 3: Check postal code in range (should be TRUE)
SELECT 
  '1500 in range 1000-1999' as test,
  is_postal_code_in_range(
    '1500',
    '[{"start": "1000", "end": "1999"}]'::jsonb
  ) as result,
  'Expected: true' as expected;

-- Test 4: Check postal code NOT in range (should be FALSE)
SELECT 
  '2500 in range 1000-1999' as test,
  is_postal_code_in_range(
    '2500',
    '[{"start": "1000", "end": "1999"}]'::jsonb
  ) as result,
  'Expected: false' as expected;

-- Test 5: Check postal code in multiple ranges
SELECT 
  '2500 in multiple ranges' as test,
  is_postal_code_in_range(
    '2500',
    '[{"start": "1000", "end": "1999"}, {"start": "2000", "end": "2999"}]'::jsonb
  ) as result,
  'Expected: true' as expected;

-- ============================================================================
-- SUMMARY QUERY - Run this for a quick overview
-- ============================================================================
SELECT 
  'proximity_settings table' as item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'proximity_settings') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
  'postal_codes table',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'postal_codes') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'proximity_matches table',
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'proximity_matches') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'merchants columns added',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'merchants' AND column_name = 'delivery_range_km'
  ) THEN '✅ YES' ELSE '❌ NO' END
UNION ALL
SELECT 
  'couriers columns added',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'couriers' AND column_name = 'service_range_km'
  ) THEN '✅ YES' ELSE '❌ NO' END
UNION ALL
SELECT 
  'indexes',
  '✅ ' || COUNT(*)::text || ' indexes' as status
FROM pg_indexes 
WHERE (tablename IN ('proximity_settings', 'postal_codes', 'proximity_matches') OR indexname LIKE '%proximity%' OR indexname LIKE '%coords%')
UNION ALL
SELECT 
  'helper functions',
  '✅ ' || COUNT(*)::text || ' functions' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND (routine_name LIKE '%distance%' OR routine_name LIKE '%postal%' OR routine_name LIKE '%proximity%' OR routine_name LIKE '%nearby%')
UNION ALL
SELECT 
  'RLS policies',
  '✅ ' || COUNT(*)::text || ' policies' as status
FROM pg_policies 
WHERE tablename IN ('proximity_settings', 'postal_codes', 'proximity_matches')
UNION ALL
SELECT 
  'triggers',
  '✅ ' || COUNT(*)::text || ' triggers' as status
FROM information_schema.triggers
WHERE event_object_table IN ('proximity_settings', 'postal_codes')
UNION ALL
SELECT 
  'sample postal codes',
  '✅ ' || COUNT(*)::text || ' codes' as status
FROM postal_codes
UNION ALL
SELECT 
  'RLS enabled',
  CASE WHEN bool_and(rowsecurity) THEN '✅ ALL ENABLED' ELSE '❌ SOME DISABLED' END as status
FROM pg_tables 
WHERE tablename IN ('proximity_settings', 'postal_codes', 'proximity_matches');

-- ============================================================================
-- OPTIONAL: Test find_nearby_couriers function
-- ============================================================================

-- Note: This requires actual merchant and courier data with coordinates
-- Uncomment to test after adding test data

/*
-- First, add test merchant with coordinates
INSERT INTO merchants (merchant_id, user_id, merchant_name, latitude, longitude)
VALUES (
  gen_random_uuid(),
  (SELECT user_id FROM users WHERE user_role = 'merchant' LIMIT 1),
  'Test Merchant Brussels',
  50.8503,
  4.3517
) ON CONFLICT DO NOTHING;

-- Add test courier with coordinates
INSERT INTO couriers (courier_id, user_id, courier_name, latitude, longitude, is_active)
VALUES (
  gen_random_uuid(),
  (SELECT user_id FROM users WHERE user_role = 'courier' LIMIT 1),
  'Test Courier Antwerp',
  51.2194,
  4.4025,
  true
) ON CONFLICT DO NOTHING;

-- Test find_nearby_couriers function
SELECT * FROM find_nearby_couriers(
  (SELECT merchant_id FROM merchants WHERE merchant_name = 'Test Merchant Brussels' LIMIT 1),
  '2000', -- Antwerp postal code
  100,    -- Max distance 100km
  10      -- Limit 10 results
);
*/
