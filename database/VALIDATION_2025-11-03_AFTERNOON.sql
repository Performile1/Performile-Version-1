-- =====================================================
-- DATABASE VALIDATION - NOVEMBER 3, 2025 (AFTERNOON)
-- =====================================================
-- Purpose: Validate database before continuing with courier API integration
-- Framework: SPEC_DRIVEN_FRAMEWORK Rule #1
-- Time: 12:52 PM
-- =====================================================

-- =====================================================
-- STEP 1: LIST ALL TABLES
-- =====================================================

SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =====================================================
-- STEP 2: CHECK FOR SHIPMENT/BOOKING RELATED TABLES
-- =====================================================

-- Check for any existing shipment tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (
    table_name LIKE '%shipment%' 
    OR table_name LIKE '%booking%'
    OR table_name LIKE '%label%'
    OR table_name LIKE '%tracking%'
  )
ORDER BY table_name;

-- =====================================================
-- STEP 3: VERIFY OUR NEW TABLES EXIST
-- =====================================================

-- Check shipment_bookings table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'shipment_bookings'
ORDER BY ordinal_position;

-- Check shipment_booking_errors table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'shipment_booking_errors'
ORDER BY ordinal_position;

-- =====================================================
-- STEP 4: CHECK FOR DUPLICATE COLUMNS
-- =====================================================

-- Check for tracking_number columns across tables
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE column_name LIKE '%tracking%'
ORDER BY table_name, column_name;

-- Check for shipment_id columns across tables
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE column_name LIKE '%shipment%'
ORDER BY table_name, column_name;

-- =====================================================
-- STEP 5: CHECK INDEXES
-- =====================================================

SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('shipment_bookings', 'shipment_booking_errors')
ORDER BY tablename, indexname;

-- =====================================================
-- STEP 6: CHECK RLS POLICIES
-- =====================================================

SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('shipment_bookings', 'shipment_booking_errors')
ORDER BY tablename, policyname;

-- =====================================================
-- STEP 7: VERIFY RLS IS ENABLED
-- =====================================================

SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('shipment_bookings', 'shipment_booking_errors')
ORDER BY tablename;

-- =====================================================
-- STEP 8: CHECK DATA IN NEW TABLES
-- =====================================================

-- Count records in shipment_bookings
SELECT COUNT(*) as total_bookings FROM shipment_bookings;

-- Count records in shipment_booking_errors
SELECT COUNT(*) as total_errors FROM shipment_booking_errors;

-- =====================================================
-- STEP 9: CHECK COURIER-RELATED TABLES
-- =====================================================

-- List all courier-related tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%courier%'
ORDER BY table_name;

-- Check courier_api_credentials table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'courier_api_credentials'
ORDER BY ordinal_position;

-- =====================================================
-- STEP 10: CHECK ORDERS TABLE STRUCTURE
-- =====================================================

-- Verify orders table columns (for foreign keys)
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- =====================================================
-- STEP 11: CHECK STORES TABLE STRUCTURE
-- =====================================================

-- Verify stores table structure (for RLS policies)
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'stores'
ORDER BY ordinal_position;

-- =====================================================
-- STEP 12: CHECK COURIER RANKING TABLES
-- =====================================================

-- Verify courier_ranking_scores exists
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'courier_ranking_scores'
ORDER BY ordinal_position;

-- Check data in courier_ranking_scores
SELECT COUNT(*) as total_rankings FROM courier_ranking_scores;

-- =====================================================
-- STEP 13: CHECK FOR API CREDENTIALS
-- =====================================================

-- Check if courier_api_credentials table has data
-- First check what columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'courier_api_credentials'
ORDER BY ordinal_position;

-- Then select data (adjust columns based on above)
SELECT *
FROM courier_api_credentials
LIMIT 5;

-- =====================================================
-- STEP 14: VALIDATION SUMMARY
-- =====================================================

-- Summary of all relevant tables
SELECT 
  t.table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count,
  pg_size_pretty(pg_total_relation_size(quote_ident(t.table_name)::regclass)) as total_size
FROM information_schema.tables t
WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
  AND (
    t.table_name LIKE '%courier%'
    OR t.table_name LIKE '%shipment%'
    OR t.table_name LIKE '%booking%'
    OR t.table_name LIKE '%ranking%'
    OR t.table_name = 'orders'
    OR t.table_name = 'stores'
  )
ORDER BY t.table_name;

-- =====================================================
-- VALIDATION CHECKLIST
-- =====================================================

/*
VALIDATION RESULTS TO DOCUMENT:

[ ] All tables listed
[ ] No duplicate shipment/booking tables found
[ ] shipment_bookings table exists with correct columns
[ ] shipment_booking_errors table exists with correct columns
[ ] No duplicate tracking_number columns
[ ] No duplicate shipment_id columns
[ ] All indexes created
[ ] All RLS policies created
[ ] RLS enabled on both tables
[ ] No data in new tables (expected for new tables)
[ ] courier_api_credentials table exists
[ ] orders table structure verified
[ ] stores table structure verified
[ ] courier_ranking_scores table exists
[ ] Ready to proceed with API integration

NEXT STEPS:
1. Review validation results
2. Document any issues found
3. Fix any problems
4. Proceed with PostNord API integration
*/
