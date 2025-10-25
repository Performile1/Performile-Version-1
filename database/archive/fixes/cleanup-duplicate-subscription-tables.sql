-- =====================================================
-- Cleanup Duplicate Subscription Tables
-- =====================================================
-- Removes old subscription tables and keeps new ones
-- Run this BEFORE running create-subscription-system.sql
-- =====================================================

-- Step 1: Check what exists
SELECT 
    '=====================================================' as status
UNION ALL
SELECT 'CHECKING FOR DUPLICATE TABLES...'
UNION ALL
SELECT '=====================================================';

-- Show which tables exist
SELECT 
    tablename as existing_subscription_tables,
    CASE 
        WHEN tablename IN ('subscriptionplans', 'subscriptions', 'subscriptionaddons', 'usersubscriptions', 'useraddons')
        THEN '⚠️ OLD TABLE (will be removed)'
        WHEN tablename IN ('subscription_plans', 'user_subscriptions', 'usage_logs', 'email_templates', 'ecommerce_integrations')
        THEN '✅ NEW TABLE (will be kept/created)'
        ELSE 'Unknown'
    END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND (tablename LIKE '%subscription%' OR tablename LIKE '%usage%' OR tablename LIKE '%email_template%')
ORDER BY tablename;

-- Step 2: Backup old data (optional - uncomment if you want to keep old data)
-- CREATE TABLE subscriptionplans_backup AS SELECT * FROM subscriptionplans;
-- CREATE TABLE subscriptions_backup AS SELECT * FROM subscriptions;

-- Step 3: Drop OLD subscription tables
DROP TABLE IF EXISTS useraddons CASCADE;
DROP TABLE IF EXISTS usersubscriptions CASCADE;
DROP TABLE IF EXISTS subscriptionaddons CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS subscriptionplans CASCADE;

-- Step 4: Verify cleanup
SELECT 
    '=====================================================' as status
UNION ALL
SELECT 'OLD TABLES REMOVED SUCCESSFULLY'
UNION ALL
SELECT '=====================================================';

-- Step 5: Show remaining tables
SELECT 
    tablename as remaining_tables
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE '%subscription%'
ORDER BY tablename;

-- Step 6: Final message
SELECT 
    '=====================================================' as divider
UNION ALL
SELECT 'CLEANUP COMPLETE!'
UNION ALL
SELECT ''
UNION ALL
SELECT 'Next steps:'
UNION ALL
SELECT '1. Run: database/create-subscription-system.sql'
UNION ALL
SELECT '2. This will create the NEW subscription tables'
UNION ALL
SELECT '3. Access admin panel: /admin/subscriptions'
UNION ALL
SELECT '=====================================================';
