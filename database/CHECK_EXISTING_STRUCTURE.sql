-- =====================================================
-- CHECK EXISTING DATABASE STRUCTURE
-- =====================================================
-- Date: November 3, 2025, 9:42 PM
-- Purpose: Verify what tables, policies, and functions already exist
-- =====================================================

-- =====================================================
-- 1. CHECK COURIER-RELATED TABLES
-- =====================================================

SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%courier%'
ORDER BY table_name;

-- =====================================================
-- 2. CHECK INVOICING/BILLING TABLES
-- =====================================================

SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%invoice%' OR
    table_name LIKE '%billing%' OR
    table_name LIKE '%shipment_cost%' OR
    table_name LIKE '%label_charge%' OR
    table_name LIKE '%usage%'
  )
ORDER BY table_name;

-- =====================================================
-- 3. CHECK COURIER_API_CREDENTIALS STRUCTURE
-- =====================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'courier_api_credentials'
ORDER BY ordinal_position;

-- =====================================================
-- 4. CHECK MERCHANT_COURIER_SELECTIONS STRUCTURE
-- =====================================================

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'merchant_courier_selections'
ORDER BY ordinal_position;

-- =====================================================
-- 5. CHECK RLS POLICIES ON COURIER TABLES
-- =====================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename LIKE '%courier%'
   OR tablename LIKE '%invoice%'
   OR tablename LIKE '%billing%'
ORDER BY tablename, policyname;

-- =====================================================
-- 6. CHECK COURIER-RELATED FUNCTIONS
-- =====================================================

SELECT 
  proname as function_name,
  pronargs as arg_count,
  pg_get_function_result(oid) as return_type
FROM pg_proc
WHERE proname LIKE '%courier%'
   OR proname LIKE '%invoice%'
   OR proname LIKE '%billing%'
   OR proname LIKE '%credential%'
ORDER BY proname;

-- =====================================================
-- 7. CHECK INDEXES ON COURIER TABLES
-- =====================================================

SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    tablename LIKE '%courier%' OR
    tablename LIKE '%invoice%' OR
    tablename LIKE '%billing%'
  )
ORDER BY tablename, indexname;

-- =====================================================
-- 8. CHECK CONSTRAINTS
-- =====================================================

SELECT
  conrelid::regclass AS table_name,
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid::regclass::text LIKE '%courier%'
   OR conrelid::regclass::text LIKE '%invoice%'
ORDER BY table_name, constraint_name;

-- =====================================================
-- 9. CHECK VIEWS
-- =====================================================

SELECT 
  table_name as view_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%courier%' OR
    table_name LIKE '%invoice%' OR
    table_name LIKE '%billing%'
  )
ORDER BY table_name;

-- =====================================================
-- 10. SUMMARY: WHAT EXISTS
-- =====================================================

SELECT 
  'Tables' as object_type,
  COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%courier%' OR
    table_name LIKE '%invoice%' OR
    table_name LIKE '%billing%'
  )
UNION ALL
SELECT 
  'Policies',
  COUNT(*)
FROM pg_policies
WHERE tablename LIKE '%courier%'
   OR tablename LIKE '%invoice%'
   OR tablename LIKE '%billing%'
UNION ALL
SELECT 
  'Functions',
  COUNT(*)
FROM pg_proc
WHERE proname LIKE '%courier%'
   OR proname LIKE '%invoice%'
   OR proname LIKE '%billing%'
UNION ALL
SELECT 
  'Views',
  COUNT(*)
FROM information_schema.views
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%courier%' OR
    table_name LIKE '%invoice%' OR
    table_name LIKE '%billing%'
  );
