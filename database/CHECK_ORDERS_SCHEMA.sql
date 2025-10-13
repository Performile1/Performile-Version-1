-- =====================================================
-- CHECK ORDERS TABLE SCHEMA
-- =====================================================
-- Run this to see what columns actually exist

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'orders'
ORDER BY ordinal_position;
