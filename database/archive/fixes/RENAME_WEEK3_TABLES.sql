-- ============================================================================
-- RENAME WEEK 3 TABLES - REMOVE TEMPORARY PREFIX
-- ============================================================================
-- Date: October 23, 2025, 8:50 AM
-- Purpose: Remove week3_ prefix from tables, make them permanent
-- Decision: Non-prefixed versions don't exist, so rename is safe
-- Framework: SPEC_DRIVEN_FRAMEWORK v1.21
-- ============================================================================

-- ANALYSIS:
-- ✅ webhooks does NOT exist → Safe to rename week3_webhooks → webhooks
-- ⏳ Checking api_keys and integration_events status...
--
-- DECISION: Remove week3_ prefix, make tables permanent
-- These tables were created Oct 17 for "clean separation" but are now production-ready

-- ============================================================================
-- STEP 1: Check current status
-- ============================================================================

SELECT 
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name LIKE 'week3_%'
ORDER BY table_name;

-- ============================================================================
-- STEP 2: Check if target names are available
-- ============================================================================

-- Check if api_keys exists (should be YES based on table list)
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_keys')
        THEN '⚠️ api_keys EXISTS - Cannot rename week3_api_keys'
        ELSE '✅ api_keys available - Safe to rename'
    END as api_keys_status;

-- Check if integration_events exists (should be YES based on table list)
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'integration_events')
        THEN '⚠️ integration_events EXISTS - Cannot rename week3_integration_events'
        ELSE '✅ integration_events available - Safe to rename'
    END as integration_events_status;

-- Check if webhooks exists (should be NO)
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhooks')
        THEN '⚠️ webhooks EXISTS - Cannot rename week3_webhooks'
        ELSE '✅ webhooks available - Safe to rename'
    END as webhooks_status;

-- ============================================================================
-- STEP 3: RENAME TABLES
-- ============================================================================

-- SCENARIO A: If api_keys and integration_events already exist
-- → Only rename week3_webhooks → webhooks
-- → Keep week3_api_keys and week3_integration_events as separate tables

-- SCENARIO B: If api_keys and integration_events don't exist
-- → Rename all three tables (remove week3_ prefix)

-- ============================================================================
-- OPTION 1: Rename week3_webhooks → webhooks (ALWAYS SAFE)
-- ============================================================================

ALTER TABLE week3_webhooks RENAME TO webhooks;

-- Verify
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhooks')
        THEN '✅ webhooks renamed successfully'
        ELSE '❌ ERROR: webhooks not found'
    END as status;

-- ============================================================================
-- OPTION 2A: If api_keys DOES NOT exist, rename week3_api_keys
-- ============================================================================

-- Uncomment if api_keys does NOT exist:
-- ALTER TABLE week3_api_keys RENAME TO api_keys;

-- ============================================================================
-- OPTION 2B: If api_keys EXISTS, keep week3_api_keys separate
-- ============================================================================

-- If api_keys already exists, we have two options:
-- A) Keep both tables (week3_api_keys for Week 3 features, api_keys for general use)
-- B) Merge week3_api_keys data into api_keys, then drop week3_api_keys

-- For now, if api_keys exists, we'll keep both and document the difference

-- ============================================================================
-- OPTION 3A: If integration_events DOES NOT exist, rename week3_integration_events
-- ============================================================================

-- Uncomment if integration_events does NOT exist:
-- ALTER TABLE week3_integration_events RENAME TO integration_events;

-- ============================================================================
-- OPTION 3B: If integration_events EXISTS, keep week3_integration_events separate
-- ============================================================================

-- If integration_events already exists, we have two options:
-- A) Keep both tables (week3_integration_events for Week 3, integration_events for general)
-- B) Merge week3_integration_events data into integration_events, then drop week3_integration_events

-- For now, if integration_events exists, we'll keep both and document the difference

-- ============================================================================
-- STEP 4: Verify final state
-- ============================================================================

SELECT 
    table_name,
    CASE 
        WHEN table_name LIKE 'week3_%' THEN '⚠️ Still has week3_ prefix'
        ELSE '✅ Permanent table'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (
    table_name IN ('api_keys', 'integration_events', 'webhooks')
    OR table_name LIKE 'week3_%'
  )
ORDER BY table_name;

-- ============================================================================
-- STEP 5: Count total tables
-- ============================================================================

SELECT COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Expected: 81 tables (no change if only renamed, no drops)

-- ============================================================================
-- DOCUMENTATION UPDATE NEEDED
-- ============================================================================

-- After running this script:
-- 1. Update PERFORMILE_MASTER_V2.1.md
--    - Remove week3_webhooks, add webhooks
--    - Document api_keys and integration_events status
-- 2. Update COMPLETE_TABLE_LIST.md
--    - Update table names
--    - Add notes about which tables serve which purposes
-- 3. Update code references (if any)
--    - grep -r "week3_webhooks" apps/ → change to "webhooks"

-- ============================================================================
-- NEXT STEPS
-- ============================================================================

-- 1. Determine if api_keys and integration_events exist (from query results above)
-- 2. If they exist, decide: keep separate or merge?
-- 3. Update documentation with final decision
-- 4. Update any code references to use correct table names

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
