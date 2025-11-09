-- =====================================================
-- VERIFICATION SCRIPT FOR PAYMENT TABLES
-- =====================================================

-- 1. Check if tables exist
SELECT 
  'TABLE CHECK' as check_type,
  table_name,
  'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('vipps_payments', 'swish_payments')
ORDER BY table_name;

-- 2. Check Vipps columns
SELECT 
  'VIPPS COLUMNS' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'vipps_payments'
ORDER BY ordinal_position;

-- 3. Check Swish columns
SELECT 
  'SWISH COLUMNS' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'swish_payments'
ORDER BY ordinal_position;

-- 4. Check Vipps indexes
SELECT 
  'VIPPS INDEXES' as check_type,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'vipps_payments'
ORDER BY indexname;

-- 5. Check Swish indexes
SELECT 
  'SWISH INDEXES' as check_type,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'swish_payments'
ORDER BY indexname;

-- 6. Check Vipps RLS policies
SELECT 
  'VIPPS POLICIES' as check_type,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'vipps_payments'
ORDER BY policyname;

-- 7. Check Swish RLS policies
SELECT 
  'SWISH POLICIES' as check_type,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'swish_payments'
ORDER BY policyname;

-- 8. Check users table payment columns
SELECT 
  'USERS COLUMNS' as check_type,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('vipps_phone_number', 'swish_phone_number')
ORDER BY column_name;

-- 9. Count records
SELECT 
  'RECORD COUNT' as check_type,
  'vipps_payments' as table_name, 
  COUNT(*) as record_count 
FROM vipps_payments
UNION ALL
SELECT 
  'RECORD COUNT' as check_type,
  'swish_payments' as table_name, 
  COUNT(*) as record_count 
FROM swish_payments;
