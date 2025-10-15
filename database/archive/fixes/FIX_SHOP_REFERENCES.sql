-- =====================================================
-- FIX SHOP REFERENCES IN DATABASE
-- =====================================================
-- This fixes any references to 'shops' table (should be 'stores')

-- =====================================================
-- STEP 1: Check all policies that reference 'shops'
-- =====================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  qual as using_expression,
  with_check
FROM pg_policies
WHERE qual LIKE '%shops%' OR with_check LIKE '%shops%';

-- =====================================================
-- STEP 2: Check if shops table exists
-- =====================================================
SELECT 
  tablename,
  CASE 
    WHEN tablename = 'shops' THEN '❌ Should be renamed to stores'
    WHEN tablename = 'stores' THEN '✅ Correct table name'
  END as status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('shops', 'stores');

-- =====================================================
-- STEP 3: Drop any policies that reference shops
-- =====================================================
-- This will remove broken policies so we can recreate them correctly

DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT tablename, policyname
    FROM pg_policies
    WHERE qual LIKE '%shops%' OR with_check LIKE '%shops%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_record.policyname, policy_record.tablename);
    RAISE NOTICE 'Dropped policy: % on table %', policy_record.policyname, policy_record.tablename;
  END LOOP;
END $$;

-- =====================================================
-- STEP 4: Verify all policies are clean
-- =====================================================
SELECT 
  tablename,
  policyname,
  CASE 
    WHEN qual LIKE '%shops%' OR with_check LIKE '%shops%' THEN '❌ Still references shops'
    ELSE '✅ Clean'
  END as status
FROM pg_policies
WHERE tablename IN ('orders', 'stores', 'shops');

SELECT '
========================================
✅ SHOP REFERENCES CLEANED
========================================

What Was Done:
1. Checked for policies referencing "shops"
2. Dropped broken policies
3. Verified cleanup

Next Steps:
1. Run CHECK_AND_ENABLE_RLS.sql again
2. This will create correct policies using "stores"
3. Test Orders page

Note:
- Your database uses "stores" table
- Some old policies may have referenced "shops"
- Those have been removed
- New policies will use correct table name

========================================
' as status;
