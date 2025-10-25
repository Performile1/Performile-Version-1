-- =====================================================
-- Simple Database Inventory - All Tables & Row Counts
-- =====================================================

-- Quick view of all tables with row counts
SELECT 
    tablename as table_name,
    (xpath('/row/count/text()', 
           query_to_xml(format('SELECT COUNT(*) as count FROM %I.%I', 
                              schemaname, tablename), 
                       false, true, '')))[1]::text::int as row_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Alternative simpler version (if above fails)
-- Run this to get table list, then manually count rows

SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Then run individual counts:
-- SELECT 'users' as table_name, COUNT(*) as rows FROM users;
-- SELECT 'orders' as table_name, COUNT(*) as rows FROM orders;
-- etc...
