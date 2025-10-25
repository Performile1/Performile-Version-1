-- ============================================================================
-- DROP DUPLICATE NOTIFICATION_PREFERENCES TABLE
-- ============================================================================
-- Date: October 23, 2025, 8:45 AM
-- Purpose: Remove duplicate/unused notification_preferences table
-- Decision: Keep notificationpreferences (21 columns, better structure)
--           Drop notification_preferences (11 columns, not used)
-- ============================================================================

-- ANALYSIS RESULTS:
-- ✅ notificationpreferences: 21 columns, granular control, better design
-- ❌ notification_preferences: 11 columns, simpler, not referenced in code
-- ❌ Neither table is currently used in frontend or API code
-- 
-- DECISION: Keep notificationpreferences, drop notification_preferences

-- ============================================================================
-- STEP 1: Verify no foreign key dependencies
-- ============================================================================

SELECT 
    'Foreign Key Check' as check_type,
    tc.table_name as referencing_table,
    kcu.column_name as referencing_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'notification_preferences';

-- If result is empty, safe to drop

-- ============================================================================
-- STEP 2: Backup data (just in case)
-- ============================================================================

-- Check if there's any data to backup
SELECT COUNT(*) as row_count FROM notification_preferences;

-- If row_count > 0, uncomment below to create backup:
-- CREATE TABLE notification_preferences_backup_20251023 AS 
-- SELECT * FROM notification_preferences;

-- ============================================================================
-- STEP 3: Drop the table
-- ============================================================================

-- Drop RLS policies first (if any)
DROP POLICY IF EXISTS "Users can view own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON notification_preferences;

-- Drop indexes (if any)
-- (Indexes will be dropped automatically with the table)

-- Drop the table
DROP TABLE IF EXISTS notification_preferences CASCADE;

-- ============================================================================
-- STEP 4: Verify deletion
-- ============================================================================

-- Check table no longer exists
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Table successfully dropped'
        ELSE '❌ Table still exists'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'notification_preferences';

-- Verify notificationpreferences still exists
SELECT 
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ notificationpreferences still exists'
        ELSE '❌ ERROR: notificationpreferences missing!'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'notificationpreferences';

-- ============================================================================
-- STEP 5: Final table count
-- ============================================================================

SELECT COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Expected: 81 tables (was 82, now 81 after dropping duplicate)

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- If you need to rollback, restore from backup:
-- CREATE TABLE notification_preferences AS 
-- SELECT * FROM notification_preferences_backup_20251023;

-- ============================================================================
-- DOCUMENTATION UPDATE NEEDED
-- ============================================================================

-- After running this script:
-- 1. Update PERFORMILE_MASTER_V2.1.md (81 tables, not 82)
-- 2. Update COMPLETE_TABLE_LIST.md (remove notification_preferences)
-- 3. Update TABLE_ANALYSIS_AND_RECOMMENDATIONS.md (mark as resolved)
-- 4. Note: notificationpreferences is the correct table to use going forward

-- ============================================================================
-- FUTURE: When implementing notification preferences feature
-- ============================================================================

-- Use this table: notificationpreferences (21 columns)
-- 
-- Columns available:
-- - user_id (FK to users)
-- - order_update_email, order_update_sms, order_update_in_app
-- - review_request_email, review_request_sms
-- - review_received_email, review_received_in_app
-- - message_email, message_sms, message_push, message_in_app
-- - marketing_email
-- - newsletter
-- - quiet_hours_timezone
-- - created_at, updated_at
-- 
-- This provides granular control over notification channels per notification type

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
