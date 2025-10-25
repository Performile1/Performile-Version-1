-- ============================================================================
-- CHECK NOTIFICATION PREFERENCES DUPLICATE
-- ============================================================================
-- Date: October 23, 2025, 8:42 AM
-- Purpose: Investigate duplicate notification preferences tables
-- Issue: Both notification_preferences AND notificationpreferences exist
-- ============================================================================

-- ============================================================================
-- STEP 1: Check if both tables exist
-- ============================================================================

SELECT 
    'Table Existence Check' as check_type,
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN ('notification_preferences', 'notificationpreferences')
ORDER BY table_name;

-- ============================================================================
-- STEP 2: Check row counts
-- ============================================================================

SELECT 'notification_preferences' as table_name, COUNT(*) as row_count 
FROM notification_preferences;

SELECT 'notificationpreferences' as table_name, COUNT(*) as row_count 
FROM notificationpreferences;

-- ============================================================================
-- STEP 3: Compare table structures
-- ============================================================================

-- Structure of notification_preferences
SELECT 
    'notification_preferences' as table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'notification_preferences'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Structure of notificationpreferences
SELECT 
    'notificationpreferences' as table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'notificationpreferences'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 4: Check for foreign key references
-- ============================================================================

-- Check what references notification_preferences
SELECT
    'notification_preferences' as referenced_table,
    tc.table_name as referencing_table,
    kcu.column_name as referencing_column,
    ccu.column_name as referenced_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'notification_preferences';

-- Check what references notificationpreferences
SELECT
    'notificationpreferences' as referenced_table,
    tc.table_name as referencing_table,
    kcu.column_name as referencing_column,
    ccu.column_name as referenced_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'notificationpreferences';

-- ============================================================================
-- STEP 5: Check indexes
-- ============================================================================

-- Indexes on notification_preferences
SELECT 
    'notification_preferences' as table_name,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'notification_preferences'
ORDER BY indexname;

-- Indexes on notificationpreferences
SELECT 
    'notificationpreferences' as table_name,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'notificationpreferences'
ORDER BY indexname;

-- ============================================================================
-- STEP 6: Check RLS policies
-- ============================================================================

-- RLS policies on notification_preferences
SELECT 
    'notification_preferences' as table_name,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'notification_preferences';

-- RLS policies on notificationpreferences
SELECT 
    'notificationpreferences' as table_name,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'notificationpreferences';

-- ============================================================================
-- STEP 7: Sample data comparison (if any data exists)
-- ============================================================================

-- Sample from notification_preferences (first 5 rows)
SELECT 'notification_preferences' as source, * 
FROM notification_preferences 
LIMIT 5;

-- Sample from notificationpreferences (first 5 rows)
SELECT 'notificationpreferences' as source, * 
FROM notificationpreferences 
LIMIT 5;

-- ============================================================================
-- STEP 8: Check creation dates (if available)
-- ============================================================================

SELECT 
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as total_size,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('notification_preferences', 'notificationpreferences')
ORDER BY table_name;

-- ============================================================================
-- ANALYSIS SUMMARY
-- ============================================================================

-- Based on the results above, determine:
-- 1. Which table has data? (row_count > 0)
-- 2. Which table has foreign key references? (other tables depend on it)
-- 3. Which table has more indexes/policies? (more actively used)
-- 4. Which table structure is more complete? (more columns, better design)
--
-- RECOMMENDATION:
-- - Keep the table that is actively used (has data, references, policies)
-- - Drop the unused/duplicate table
-- - Update any code references to use the correct table name
--
-- NEXT STEPS:
-- 1. Review results of this script
-- 2. Decide which table to keep
-- 3. If needed, migrate data from one to the other
-- 4. Drop the unused table
-- 5. Update code references (grep -r "table_name" apps/)
-- ============================================================================

-- Instructions:
-- 1. Copy this entire script
-- 2. Paste into Supabase SQL Editor
-- 3. Run all sections
-- 4. Review results to determine which table to keep
-- 5. Make decision based on data, references, and usage
