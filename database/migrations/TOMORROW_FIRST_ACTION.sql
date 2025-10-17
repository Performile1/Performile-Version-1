-- ============================================================================
-- FIRST ACTION TOMORROW MORNING
-- Purpose: Investigate ecommerce_integrations table structure issue
-- Date: October 18, 2025
-- Issue: column e.shop_id does not exist
-- ============================================================================

-- ============================================================================
-- STEP 1: CHECK IF TABLE OR VIEW
-- ============================================================================

SELECT 
  table_name,
  table_type,
  CASE 
    WHEN table_type = 'BASE TABLE' THEN '✅ Real Table'
    WHEN table_type = 'VIEW' THEN '⚠️ View (not real table)'
    ELSE '❓ Unknown'
  END as status
FROM information_schema.tables
WHERE table_name IN ('ecommerce_integrations', 'shopintegrations')
ORDER BY table_name;

-- ============================================================================
-- STEP 2: GET ACTUAL COLUMN STRUCTURE
-- ============================================================================

-- Check ecommerce_integrations
SELECT 
  'ecommerce_integrations' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'ecommerce_integrations'
ORDER BY ordinal_position;

-- Check shopintegrations
SELECT 
  'shopintegrations' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'shopintegrations'
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 3: IF IT'S A VIEW, FIND THE BASE TABLE
-- ============================================================================

SELECT 
  viewname,
  definition
FROM pg_views
WHERE viewname IN ('ecommerce_integrations', 'shopintegrations');

-- ============================================================================
-- STEP 4: CHECK DATA EXISTS
-- ============================================================================

-- Count rows in ecommerce_integrations
SELECT 
  'ecommerce_integrations' as table_name,
  COUNT(*) as row_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '⚠️ Empty - no data to migrate'
    WHEN COUNT(*) > 0 THEN '✅ Has data - need to migrate'
  END as migration_needed
FROM ecommerce_integrations;

-- Count rows in shopintegrations
SELECT 
  'shopintegrations' as table_name,
  COUNT(*) as row_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '⚠️ Empty - no data to migrate'
    WHEN COUNT(*) > 0 THEN '✅ Has data - need to migrate'
  END as migration_needed
FROM shopintegrations;

-- ============================================================================
-- STEP 5: CHECK STORES TABLE STRUCTURE (FOR REFERENCE)
-- ============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'stores'
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 6: CHECK CONSTRAINTS
-- ============================================================================

SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('ecommerce_integrations', 'shopintegrations', 'stores')
ORDER BY tc.table_name, tc.constraint_type;

-- ============================================================================
-- DECISION MATRIX
-- ============================================================================

/*
BASED ON RESULTS ABOVE, CHOOSE:

SCENARIO A: Both are VIEWS with 0 rows
→ DECISION: Skip migration, create fresh tables with week3_ prefix
→ ACTION: Run WEEK3_FRESH_START.sql

SCENARIO B: Both are TABLES with data
→ DECISION: Fix migration to use correct column names
→ ACTION: Update WEEK3_COMPLETE_SETUP.sql with actual columns

SCENARIO C: Mixed (one VIEW, one TABLE)
→ DECISION: Work with base tables only
→ ACTION: Find base tables and migrate from those

SCENARIO D: Both are VIEWS created from webhooks table
→ DECISION: Tables already migrated! Just use webhooks table
→ ACTION: Verify webhooks table exists and has data

RECOMMENDATION: Scenario A (Fresh Start)
- Create week3_webhooks, week3_api_keys, week3_integration_events
- No migration needed
- Clean separation
- Fast implementation
*/

-- ============================================================================
-- VERIFICATION SUMMARY
-- ============================================================================

SELECT 
  '=== INVESTIGATION COMPLETE ===' as status,
  'Review results above and choose Option A, B, C, or D' as next_step,
  'See PERFORMILE_PROJECT_AUDIT_OCT17.md for detailed options' as documentation;
