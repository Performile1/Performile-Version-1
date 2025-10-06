-- =====================================================
-- Complete Database Audit - All Tables and Row Counts
-- =====================================================
-- Shows every table in database with row counts
-- Identifies duplicate/conflicting tables
-- =====================================================

-- Get all tables with row counts
SELECT 
    schemaname as schema,
    tablename as table_name,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = schemaname AND table_name = tablename) as column_count,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, tablename;

-- =====================================================
-- Check for subscription-related tables
-- =====================================================
SELECT 
    tablename as subscription_tables
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE '%subscription%'
ORDER BY tablename;

-- =====================================================
-- Get row counts for all tables
-- =====================================================
DO $$
DECLARE
    r RECORD;
    row_count INTEGER;
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'TABLE ROW COUNTS';
    RAISE NOTICE '=====================================================';
    
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', r.tablename) INTO row_count;
        RAISE NOTICE '% : % rows', RPAD(r.tablename, 40), row_count;
    END LOOP;
    
    RAISE NOTICE '=====================================================';
END $$;

-- =====================================================
-- Check for duplicate subscription tables
-- =====================================================
SELECT 
    'Checking for subscription table duplicates...' as status;

-- Check if subscriptionplans exists (old)
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptionplans')
        THEN '⚠️ OLD TABLE EXISTS: subscriptionplans'
        ELSE '✅ No old subscriptionplans table'
    END as old_subscriptionplans_status;

-- Check if subscription_plans exists (new)
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans')
        THEN '✅ NEW TABLE EXISTS: subscription_plans'
        ELSE '⚠️ New subscription_plans table missing'
    END as new_subscription_plans_status;

-- =====================================================
-- Show all subscription-related data
-- =====================================================

-- If old subscriptionplans table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptionplans') THEN
        RAISE NOTICE '=====================================================';
        RAISE NOTICE 'OLD subscriptionplans table data:';
        RAISE NOTICE '=====================================================';
        
        FOR r IN SELECT * FROM subscriptionplans ORDER BY plan_id LOOP
            RAISE NOTICE 'Plan ID: %, Name: %, Price: $%, Type: %', 
                r.plan_id, r.plan_name, r.monthly_price, r.user_type;
        END LOOP;
    END IF;
END $$;

-- If new subscription_plans table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans') THEN
        RAISE NOTICE '=====================================================';
        RAISE NOTICE 'NEW subscription_plans table data:';
        RAISE NOTICE '=====================================================';
        
        FOR r IN SELECT * FROM subscription_plans ORDER BY plan_id LOOP
            RAISE NOTICE 'Plan ID: %, Name: %, Price: $%, Type: %', 
                r.plan_id, r.plan_name, r.monthly_price, r.user_type;
        END LOOP;
    END IF;
END $$;

-- =====================================================
-- List ALL tables with their schemas
-- =====================================================
SELECT 
    table_name,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_schema = 'public' 
     AND table_name = t.table_name) as columns,
    (SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
     FROM information_schema.columns 
     WHERE table_schema = 'public' 
     AND table_name = t.table_name
     LIMIT 5) as first_5_columns
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =====================================================
-- Summary Statistics
-- =====================================================
SELECT 
    'SUMMARY' as section,
    COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';

-- Count total rows across all tables
DO $$
DECLARE
    r RECORD;
    total_rows BIGINT := 0;
    row_count INTEGER;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', r.tablename) INTO row_count;
        total_rows := total_rows + row_count;
    END LOOP;
    
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'TOTAL ROWS ACROSS ALL TABLES: %', total_rows;
    RAISE NOTICE '=====================================================';
END $$;

-- =====================================================
-- Check for conflicting tables
-- =====================================================
SELECT 
    'POTENTIAL CONFLICTS' as section;

-- Check for both old and new naming conventions
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptionplans')
             AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans')
        THEN '⚠️ WARNING: Both subscriptionplans AND subscription_plans exist!'
        ELSE '✅ No naming conflicts'
    END as subscription_conflict_status;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions')
             AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_subscriptions')
        THEN '⚠️ WARNING: Both subscriptions AND user_subscriptions exist!'
        ELSE '✅ No user subscription conflicts'
    END as user_subscription_conflict_status;

-- =====================================================
-- Recommendation
-- =====================================================
SELECT 
    '=====================================================' as divider
UNION ALL
SELECT 'RECOMMENDATION:' 
UNION ALL
SELECT 'If you have duplicate tables (old + new), you should:'
UNION ALL
SELECT '1. Backup data from old tables'
UNION ALL
SELECT '2. Migrate data to new tables'
UNION ALL
SELECT '3. Drop old tables'
UNION ALL
SELECT '4. Update API code to use new table names'
UNION ALL
SELECT '=====================================================';
