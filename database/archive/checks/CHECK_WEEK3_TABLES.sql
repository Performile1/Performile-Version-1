-- ============================================================================
-- CHECK WEEK 3 TABLES
-- ============================================================================
-- Date: October 23, 2025, 8:47 AM
-- Purpose: Check if week3_ prefixed tables have non-prefixed equivalents
-- Decision: Determine if we should merge, rename, or keep separate
-- ============================================================================

-- ============================================================================
-- STEP 1: Check which tables exist
-- ============================================================================

SELECT 
    table_name,
    CASE 
        WHEN table_name LIKE 'week3_%' THEN '⚠️ TEMPORARY'
        ELSE '✅ PERMANENT'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (
    table_name IN ('api_keys', 'integration_events', 'webhooks')
    OR table_name LIKE 'week3_%'
  )
ORDER BY table_name;

-- ============================================================================
-- STEP 2: Check structures and row counts
-- ============================================================================

-- week3_api_keys
SELECT 'week3_api_keys' as table_name, COUNT(*) as row_count 
FROM week3_api_keys;

SELECT 
    'week3_api_keys' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'week3_api_keys'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- week3_integration_events
SELECT 'week3_integration_events' as table_name, COUNT(*) as row_count 
FROM week3_integration_events;

SELECT 
    'week3_integration_events' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'week3_integration_events'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- week3_webhooks
SELECT 'week3_webhooks' as table_name, COUNT(*) as row_count 
FROM week3_webhooks;

SELECT 
    'week3_webhooks' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'week3_webhooks'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 3: Check if non-prefixed versions exist
-- ============================================================================

-- Check for api_keys (non-week3)
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_keys' AND table_schema = 'public')
        THEN '✅ api_keys EXISTS'
        ELSE '❌ api_keys DOES NOT EXIST'
    END as status;

-- If api_keys exists, check its structure
SELECT 
    'api_keys' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'api_keys'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check for integration_events (non-week3)
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'integration_events' AND table_schema = 'public')
        THEN '✅ integration_events EXISTS'
        ELSE '❌ integration_events DOES NOT EXIST'
    END as status;

-- If integration_events exists, check its structure
SELECT 
    'integration_events' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'integration_events'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check for webhooks (non-week3)
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhooks' AND table_schema = 'public')
        THEN '✅ webhooks EXISTS'
        ELSE '❌ webhooks DOES NOT EXIST'
    END as status;

-- ============================================================================
-- STEP 4: Check code references
-- ============================================================================

-- This will help determine which tables are actively used
-- (Run these commands in terminal after SQL check)

-- grep -r "week3_api_keys" apps/
-- grep -r "week3_integration_events" apps/
-- grep -r "week3_webhooks" apps/
-- grep -r "api_keys" apps/ | grep -v "week3"
-- grep -r "integration_events" apps/ | grep -v "week3"
-- grep -r "webhooks" apps/ | grep -v "week3"

-- ============================================================================
-- DECISION MATRIX
-- ============================================================================

-- SCENARIO A: Non-prefixed versions DO NOT exist
-- → Recommendation: Remove week3_ prefix, make permanent
-- → Action: RENAME tables (week3_api_keys → api_keys)

-- SCENARIO B: Non-prefixed versions DO exist
-- → Recommendation: Compare structures, merge if same, keep separate if different
-- → Action: MERGE or KEEP BOTH with clear documentation

-- SCENARIO C: Week3 tables have no data
-- → Recommendation: Drop week3_ tables, use non-prefixed versions
-- → Action: DROP week3_ tables

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
