-- ============================================================================
-- LIST ALL TABLES IN DATABASE
-- ============================================================================
-- Date: October 22, 2025, 8:07 PM
-- Purpose: List all 78 tables with details
-- Framework: SPEC_DRIVEN_FRAMEWORK v1.20 Rule #23 (Check for duplicates)
-- ============================================================================

-- ============================================================================
-- SECTION 1: SIMPLE TABLE LIST (Alphabetical)
-- ============================================================================

SELECT 
    '=== ALL TABLES (Alphabetical) ===' as section,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================================================
-- SECTION 2: TABLES WITH COLUMN COUNTS
-- ============================================================================

SELECT 
    '=== TABLES WITH DETAILS ===' as section,
    t.table_name,
    COUNT(c.column_name) as column_count,
    pg_size_pretty(pg_total_relation_size(t.table_name::regclass)) as total_size,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = t.table_name) as index_count,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.table_name) as policy_count
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name AND c.table_schema = 'public'
WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name
ORDER BY t.table_name;

-- ============================================================================
-- SECTION 3: TABLES BY CATEGORY (Pattern Matching)
-- ============================================================================

-- Core Tables
SELECT '=== CORE TABLES ===' as section, table_name
FROM information_schema.tables
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN ('users', 'stores', 'orders', 'couriers', 'reviews', 'products', 'categories')
ORDER BY table_name;

-- Analytics Tables
SELECT '=== ANALYTICS TABLES ===' as section, table_name
FROM information_schema.tables
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND (table_name LIKE '%analytics%' OR table_name LIKE '%snapshot%' OR table_name LIKE '%metrics%')
ORDER BY table_name;

-- Tracking Tables
SELECT '=== TRACKING TABLES ===' as section, table_name
FROM information_schema.tables
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND (table_name LIKE '%tracking%' OR table_name LIKE '%shipment%')
ORDER BY table_name;

-- Integration Tables
SELECT '=== INTEGRATION TABLES ===' as section, table_name
FROM information_schema.tables
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND (table_name LIKE '%integration%' OR table_name LIKE '%api%' OR table_name LIKE '%webhook%')
ORDER BY table_name;

-- Courier Tables
SELECT '=== COURIER TABLES ===' as section, table_name
FROM information_schema.tables
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name LIKE '%courier%'
ORDER BY table_name;

-- Claims Tables
SELECT '=== CLAIMS TABLES ===' as section, table_name
FROM information_schema.tables
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name LIKE '%claim%'
ORDER BY table_name;

-- Subscription Tables
SELECT '=== SUBSCRIPTION TABLES ===' as section, table_name
FROM information_schema.tables
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND (table_name LIKE '%subscription%' OR table_name LIKE '%plan%' OR table_name LIKE '%payment%')
ORDER BY table_name;

-- Service Performance Tables (Week 4)
SELECT '=== SERVICE PERFORMANCE TABLES ===' as section, table_name
FROM information_schema.tables
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND (table_name LIKE '%service%' OR table_name LIKE '%parcel%' OR table_name LIKE '%coverage%')
ORDER BY table_name;

-- Notification Tables
SELECT '=== NOTIFICATION TABLES ===' as section, table_name
FROM information_schema.tables
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND (table_name LIKE '%notification%' OR table_name LIKE '%rule%' OR table_name LIKE '%queue%')
ORDER BY table_name;

-- Admin/Settings Tables
SELECT '=== ADMIN/SETTINGS TABLES ===' as section, table_name
FROM information_schema.tables
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND (table_name LIKE '%admin%' OR table_name LIKE '%setting%' OR table_name LIKE '%config%')
ORDER BY table_name;

-- ============================================================================
-- SECTION 4: CHECK FOR SPECIFIC DUPLICATE TABLES
-- ============================================================================

SELECT '=== CHECKING FOR DUPLICATES ===' as section;

-- Check if courier_integrations exists (duplicate of courier_api_credentials)
SELECT 
    'courier_integrations' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_integrations')
        THEN '⚠️ EXISTS (DUPLICATE of courier_api_credentials)'
        ELSE '✅ DOES NOT EXIST (Good)'
    END as status;

-- Check if shipment_events exists (duplicate of tracking_events)
SELECT 
    'shipment_events' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shipment_events')
        THEN '⚠️ EXISTS (DUPLICATE of tracking_events)'
        ELSE '✅ DOES NOT EXIST (Good)'
    END as status;

-- ============================================================================
-- SECTION 5: CHECK FOR EXPECTED EXISTING TABLES
-- ============================================================================

SELECT '=== CHECKING EXISTING TABLES (Should exist) ===' as section;

-- Core tables that should exist
SELECT 
    'users' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
        THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 'stores', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stores')
        THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'orders', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders')
        THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'couriers', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'couriers')
        THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'reviews', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews')
        THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'tracking_data', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tracking_data')
        THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'tracking_events', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tracking_events')
        THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'courier_api_credentials', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_api_credentials')
        THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'ecommerce_integrations', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ecommerce_integrations')
        THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'tracking_api_logs', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tracking_api_logs')
        THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'courier_analytics', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_analytics')
        THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'platform_analytics', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'platform_analytics')
        THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'shopanalyticssnapshots', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shopanalyticssnapshots')
        THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'claims', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'claims')
        THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'subscription_plans', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans')
        THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'user_subscriptions', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_subscriptions')
        THEN '✅ EXISTS' ELSE '❌ MISSING' END;

-- ============================================================================
-- SECTION 6: CHECK FOR NEW TABLES (From consolidated migration)
-- ============================================================================

SELECT '=== CHECKING NEW TABLES (From consolidated migration) ===' as section;

SELECT 
    'notification_rules' as table_name,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_rules')
        THEN '✅ EXISTS (Already deployed)' ELSE '⏳ DOES NOT EXIST (Need to deploy)' END as status
UNION ALL
SELECT 'rule_executions',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rule_executions')
        THEN '✅ EXISTS (Already deployed)' ELSE '⏳ DOES NOT EXIST (Need to deploy)' END
UNION ALL
SELECT 'notification_queue',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_queue')
        THEN '✅ EXISTS (Already deployed)' ELSE '⏳ DOES NOT EXIST (Need to deploy)' END
UNION ALL
SELECT 'notification_templates',
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_templates')
        THEN '✅ EXISTS (Already deployed)' ELSE '⏳ DOES NOT EXIST (Need to deploy)' END;

-- ============================================================================
-- SECTION 7: TABLES WITH ROW COUNTS (Top 20 by size)
-- ============================================================================

SELECT '=== TOP 20 TABLES BY SIZE ===' as section;

SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;

-- ============================================================================
-- SECTION 8: SUMMARY
-- ============================================================================

SELECT '=== SUMMARY ===' as section;

SELECT 
    'Total Tables' as metric,
    COUNT(*) as value
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- ============================================================================
-- END OF TABLE LIST
-- ============================================================================

-- Instructions:
-- 1. Copy this entire file
-- 2. Paste into Supabase SQL Editor
-- 3. Run to see all 78 tables organized by category
-- 4. Check for duplicates
-- 5. Verify expected tables exist
-- 6. Check if new tables need deployment
-- 
-- Following SPEC_DRIVEN_FRAMEWORK Rule #23: Check for duplicates before building
-- ============================================================================
