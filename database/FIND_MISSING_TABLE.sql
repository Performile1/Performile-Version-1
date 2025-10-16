-- =====================================================
-- FIND MISSING TABLE
-- =====================================================
-- Query to list all tables in the public schema
-- =====================================================

SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Count total tables
SELECT 
    'Total Tables:' as info,
    COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- List all table names (easy to copy)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
