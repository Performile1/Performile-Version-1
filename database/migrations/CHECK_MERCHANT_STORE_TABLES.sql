-- ============================================================================
-- CHECK FOR MERCHANT, SHOP, STORE TABLES
-- ============================================================================

-- Check if any of these tables exist
SELECT 
  table_name,
  '✅ EXISTS' as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (
    table_name ILIKE '%merchant%' OR
    table_name ILIKE '%shop%' OR
    table_name ILIKE '%store%'
  )
ORDER BY table_name;

-- If no results, check ALL tables
SELECT 
  'ALL TABLES IN DATABASE:' as info,
  STRING_AGG(table_name, ', ' ORDER BY table_name) as tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';

-- Check for columns with merchant/shop/store in any table
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    column_name ILIKE '%merchant%' OR
    column_name ILIKE '%shop%' OR
    column_name ILIKE '%store%'
  )
ORDER BY table_name, column_name;
