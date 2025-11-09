-- =====================================================
-- VERIFICATION SCRIPT FOR PAYMENT TABLES
-- =====================================================

\echo '=================================================='
\echo 'VERIFYING VIPPS AND SWISH PAYMENT TABLES'
\echo '=================================================='

-- Check if tables exist
\echo ''
\echo '1. CHECKING IF TABLES EXIST:'
\echo '----------------------------'
SELECT 
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('vipps_payments', 'swish_payments')
ORDER BY table_name;

-- Check Vipps columns
\echo ''
\echo '2. VIPPS_PAYMENTS COLUMNS:'
\echo '-------------------------'
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'vipps_payments'
ORDER BY ordinal_position;

-- Check Swish columns
\echo ''
\echo '3. SWISH_PAYMENTS COLUMNS:'
\echo '-------------------------'
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'swish_payments'
ORDER BY ordinal_position;

-- Check Vipps indexes
\echo ''
\echo '4. VIPPS_PAYMENTS INDEXES:'
\echo '-------------------------'
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'vipps_payments'
ORDER BY indexname;

-- Check Swish indexes
\echo ''
\echo '5. SWISH_PAYMENTS INDEXES:'
\echo '-------------------------'
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'swish_payments'
ORDER BY indexname;

-- Check Vipps RLS policies
\echo ''
\echo '6. VIPPS_PAYMENTS RLS POLICIES:'
\echo '-------------------------------'
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has conditions'
    ELSE 'No conditions'
  END as has_conditions
FROM pg_policies
WHERE tablename = 'vipps_payments'
ORDER BY policyname;

-- Check Swish RLS policies
\echo ''
\echo '7. SWISH_PAYMENTS RLS POLICIES:'
\echo '-------------------------------'
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has conditions'
    ELSE 'No conditions'
  END as has_conditions
FROM pg_policies
WHERE tablename = 'swish_payments'
ORDER BY policyname;

-- Check users table columns
\echo ''
\echo '8. USERS TABLE - PAYMENT COLUMNS:'
\echo '---------------------------------'
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('vipps_phone_number', 'swish_phone_number')
ORDER BY column_name;

-- Count records (should be 0 for new tables)
\echo ''
\echo '9. RECORD COUNTS:'
\echo '----------------'
SELECT 'vipps_payments' as table_name, COUNT(*) as record_count FROM vipps_payments
UNION ALL
SELECT 'swish_payments' as table_name, COUNT(*) as record_count FROM swish_payments;

\echo ''
\echo '=================================================='
\echo 'VERIFICATION COMPLETE!'
\echo '=================================================='
