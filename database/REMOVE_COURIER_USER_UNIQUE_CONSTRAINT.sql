-- =====================================================
-- REMOVE UNIQUE CONSTRAINT ON couriers.user_id
-- =====================================================
-- Date: November 3, 2025, 8:45 PM
-- Purpose: Allow multiple couriers per user (needed for platform couriers)
-- =====================================================

-- =====================================================
-- WHY THIS IS NEEDED:
-- =====================================================
-- The couriers table currently has UNIQUE constraint on user_id
-- This prevents creating multiple platform couriers (PostNord, Bring, DHL, etc.)
-- 
-- Current constraint: One user = One courier
-- After removal: One user = Multiple couriers (needed for platform)
-- =====================================================

-- Check current constraint
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'couriers'::regclass
  AND conname = 'couriers_user_id_key';

-- Remove the unique constraint
ALTER TABLE couriers DROP CONSTRAINT IF EXISTS couriers_user_id_key;

-- Verify it's removed
SELECT 
  CASE 
    WHEN EXISTS(
      SELECT 1 FROM pg_constraint 
      WHERE conrelid = 'couriers'::regclass 
      AND conname = 'couriers_user_id_key'
    ) 
    THEN '❌ Constraint still exists'
    ELSE '✅ Constraint removed successfully'
  END as status;

-- Show current constraints on couriers table
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  CASE contype
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'c' THEN 'CHECK'
    ELSE contype::text
  END as constraint_description
FROM pg_constraint
WHERE conrelid = 'couriers'::regclass
ORDER BY contype, conname;
