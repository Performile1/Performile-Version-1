-- ============================================================================
-- CHECK WHAT TABLES EXIST
-- ============================================================================

-- List all tables related to ranking and analytics
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%ranking%' 
    OR table_name LIKE '%checkout%'
    OR table_name LIKE '%analytics%'
  )
ORDER BY table_name;
