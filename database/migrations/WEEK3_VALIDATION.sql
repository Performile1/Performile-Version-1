-- ============================================================================
-- WEEK 3 PRE-SPRINT VALIDATION
-- Focus: Courier Integrations & API Platform
-- Date: October 17, 2025
-- ============================================================================

-- ============================================================================
-- 1. CHECK EXISTING COURIER INFRASTRUCTURE
-- ============================================================================

-- Check couriers table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'couriers'
ORDER BY ordinal_position;

-- Check courier data
SELECT 
  courier_id,
  courier_name,
  courier_code,
  api_endpoint,
  tracking_url_template,
  service_types,
  coverage_countries
FROM couriers
LIMIT 5;

-- ============================================================================
-- 2. CHECK INTEGRATION-RELATED TABLES
-- ============================================================================

-- List all tables that might be related to integrations
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND (
    table_name LIKE '%integration%' OR
    table_name LIKE '%webhook%' OR
    table_name LIKE '%api%' OR
    table_name LIKE '%credential%' OR
    table_name LIKE '%connection%'
  )
ORDER BY table_name;

-- ============================================================================
-- 3. CHECK ORDERS TABLE FOR INTEGRATION FIELDS
-- ============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
  AND (
    column_name LIKE '%tracking%' OR
    column_name LIKE '%label%' OR
    column_name LIKE '%shipment%' OR
    column_name LIKE '%carrier%'
  )
ORDER BY ordinal_position;

-- ============================================================================
-- 4. CHECK SHOPS TABLE FOR API CREDENTIALS
-- ============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'shops'
  AND (
    column_name LIKE '%api%' OR
    column_name LIKE '%key%' OR
    column_name LIKE '%credential%' OR
    column_name LIKE '%token%'
  )
ORDER BY ordinal_position;

-- ============================================================================
-- 5. CHECK FOR WEBHOOK/EVENT TABLES
-- ============================================================================

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND (
    table_name LIKE '%event%' OR
    table_name LIKE '%log%' OR
    table_name LIKE '%audit%'
  )
ORDER BY table_name;

-- ============================================================================
-- 6. CHECK EXISTING API KEYS/CREDENTIALS STORAGE
-- ============================================================================

-- Check users table for API keys
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'users'
  AND (
    column_name LIKE '%api%' OR
    column_name LIKE '%key%' OR
    column_name LIKE '%token%'
  );

-- ============================================================================
-- 7. SUMMARY: WHAT WE NEED FOR INTEGRATIONS
-- ============================================================================

SELECT 
  'VALIDATION COMPLETE' as status,
  'Check results above to determine:' as next_step,
  '1. Do we have courier_integrations table?' as check_1,
  '2. Do we have api_credentials table?' as check_2,
  '3. Do we have webhooks table?' as check_3,
  '4. Do we have integration_logs table?' as check_4,
  '5. What courier fields already exist?' as check_5;

-- ============================================================================
-- 8. COUNT EXISTING COURIERS
-- ============================================================================

SELECT 
  COUNT(*) as total_couriers,
  COUNT(CASE WHEN api_endpoint IS NOT NULL THEN 1 END) as couriers_with_api,
  COUNT(CASE WHEN tracking_url_template IS NOT NULL THEN 1 END) as couriers_with_tracking
FROM couriers;
