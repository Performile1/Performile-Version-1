-- =====================================================
-- Check Claims Table Schema
-- =====================================================
-- Run this to see the actual column names in your database
-- =====================================================

-- 1. Check if claims table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'claims'
) as claims_table_exists;

-- 2. List ALL columns in claims table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'claims'
ORDER BY ordinal_position;

-- 3. Check for status-related columns (case variations)
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'claims'
  AND column_name ILIKE '%status%';

-- 4. Show first few rows to see actual data
SELECT *
FROM claims
LIMIT 3;

-- 5. Check constraints on claims table
SELECT
  con.conname as constraint_name,
  con.contype as constraint_type,
  pg_get_constraintdef(con.oid) as constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'claims';
