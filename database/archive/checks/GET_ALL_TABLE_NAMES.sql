-- ============================================================================
-- GET ALL TABLE NAMES
-- ============================================================================
-- Date: October 22, 2025, 8:13 PM
-- Purpose: Simple query to list all 78 table names
-- Framework: SPEC_DRIVEN_FRAMEWORK v1.20
-- ============================================================================

-- Simple alphabetical list
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================================================
-- Alternative: With row counts (slower but more informative)
-- ============================================================================

/*
SELECT 
    t.table_name,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;
*/

-- ============================================================================
-- Alternative: Export as comma-separated list
-- ============================================================================

/*
SELECT string_agg(table_name, ', ' ORDER BY table_name) as all_tables
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';
*/

-- ============================================================================
-- Alternative: Export as JSON array
-- ============================================================================

/*
SELECT json_agg(table_name ORDER BY table_name) as tables_json
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';
*/
