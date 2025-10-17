-- ============================================================================
-- WEEK 2 - DAY 4-5: REPORTS & EXPORTS VALIDATION
-- Date: October 17, 2025
-- Purpose: Validate if we need new tables for reports system
-- Strategy: Use existing tables first, create new only if needed
-- ============================================================================

-- ============================================================================
-- 1. CHECK FOR EXISTING REPORT-RELATED TABLES
-- ============================================================================

-- Check for reports table
SELECT 
  'reports' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'reports'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check for generated_reports table
SELECT 
  'generated_reports' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'generated_reports'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check for report_templates table
SELECT 
  'report_templates' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'report_templates'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Search for any report-related tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (
    table_name LIKE '%report%' 
    OR table_name LIKE '%export%'
    OR table_name LIKE '%download%'
  )
ORDER BY table_name;

-- ============================================================================
-- 2. CHECK EXISTING ANALYTICS TABLES (CAN WE USE THESE FOR REPORTS?)
-- ============================================================================

-- We already have these analytics tables:
-- - platform_analytics (17 columns)
-- - shopanalyticssnapshots (19 columns)
-- - courier_analytics (19 columns)

-- Check if they have enough data for reports
SELECT 
  'platform_analytics' as table_name,
  COUNT(*) as total_rows,
  MIN(metric_date) as earliest_date,
  MAX(metric_date) as latest_date,
  COUNT(DISTINCT metric_date) as unique_dates
FROM platform_analytics;

SELECT 
  'shopanalyticssnapshots' as table_name,
  COUNT(*) as total_rows,
  MIN(snapshot_date) as earliest_date,
  MAX(snapshot_date) as latest_date,
  COUNT(DISTINCT shop_id) as unique_shops
FROM shopanalyticssnapshots;

SELECT 
  'courier_analytics' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT courier_id) as unique_couriers,
  AVG(total_orders) as avg_orders_per_courier
FROM courier_analytics;

-- ============================================================================
-- 3. CHECK ORDERS TABLE (PRIMARY DATA SOURCE FOR REPORTS)
-- ============================================================================

SELECT 
  'orders' as table_name,
  COUNT(*) as total_rows,
  MIN(created_at) as earliest_order,
  MAX(created_at) as latest_order,
  COUNT(DISTINCT order_status) as unique_statuses,
  COUNT(DISTINCT store_id) as unique_stores,
  COUNT(DISTINCT courier_id) as unique_couriers
FROM orders;

-- ============================================================================
-- 4. DECISION: DO WE NEED NEW TABLES?
-- ============================================================================

-- OPTION A: Use existing tables (NO NEW TABLES)
-- ✅ platform_analytics - for platform reports
-- ✅ shopanalyticssnapshots - for merchant reports
-- ✅ courier_analytics - for courier reports
-- ✅ orders - for detailed order reports
-- ✅ reviews - for review reports
-- Generate reports on-the-fly from existing data

-- OPTION B: Create generated_reports table (RECOMMENDED)
-- Store metadata about generated reports:
-- - report_id, user_id, report_type
-- - date_from, date_to, filters
-- - file_url, file_size, format (pdf/csv/xlsx)
-- - status (pending/processing/completed/failed)
-- - created_at, completed_at, expires_at

-- RECOMMENDATION: Create generated_reports table
-- WHY:
-- 1. Track report generation history
-- 2. Store file URLs for downloads
-- 3. Implement expiration/cleanup
-- 4. Show report status to users
-- 5. Prevent duplicate generation

SELECT 
  'RECOMMENDATION' as decision,
  'Create generated_reports table' as action,
  'Store report metadata, not data' as reason,
  'Use existing analytics tables for data' as data_source;

-- ============================================================================
-- 5. CHECK FILE STORAGE CAPABILITIES
-- ============================================================================

-- Check if we have file storage tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (
    table_name LIKE '%file%' 
    OR table_name LIKE '%storage%'
    OR table_name LIKE '%upload%'
  )
ORDER BY table_name;

-- ============================================================================
-- 6. SUMMARY
-- ============================================================================

SELECT 
  'VALIDATION COMPLETE' as status,
  'Need to create: generated_reports table' as required_tables,
  'Can use: platform_analytics, shopanalyticssnapshots, courier_analytics, orders' as existing_tables,
  'Strategy: Store metadata in generated_reports, query data from existing tables' as approach;
