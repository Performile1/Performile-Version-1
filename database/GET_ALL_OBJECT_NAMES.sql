-- ============================================================================
-- GET ALL OBJECT NAMES - November 4, 2025, 8:15 PM
-- ============================================================================
-- Purpose: Get actual names of all database objects
-- Run each section to get names for documentation
-- ============================================================================

-- ============================================================================
-- 1. ALL 96 TABLE NAMES
-- ============================================================================

SELECT table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================================================
-- 2. ALL 10 VIEW NAMES
-- ============================================================================

SELECT table_name as view_name
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- 3. ALL 5 MATERIALIZED VIEW NAMES
-- ============================================================================

SELECT matviewname as view_name
FROM pg_matviews 
WHERE schemaname = 'public'
ORDER BY matviewname;

-- ============================================================================
-- 4. ALL UNIQUE FUNCTION NAMES (without variants)
-- ============================================================================

SELECT DISTINCT proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind IN ('f', 'p')
ORDER BY proname;

-- ============================================================================
-- 5. ALL 8 EXTENSION NAMES
-- ============================================================================

SELECT extname as extension_name
FROM pg_extension
WHERE extname NOT IN ('plpgsql')
ORDER BY extname;

-- ============================================================================
-- 6. ALL 558 INDEX NAMES (grouped by table)
-- ============================================================================

SELECT 
    tablename,
    indexname
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- 7. ALL 185 RLS POLICY NAMES (grouped by table)
-- ============================================================================

SELECT 
    tablename,
    policyname
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 8. ALL 31 TRIGGER NAMES (grouped by table)
-- ============================================================================

SELECT 
    c.relname as table_name,
    t.tgname as trigger_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

-- ============================================================================
-- 9. ALL 171 FOREIGN KEY NAMES (grouped by table)
-- ============================================================================

SELECT 
    tc.table_name,
    tc.constraint_name as foreign_key_name
FROM information_schema.table_constraints AS tc 
WHERE tc.constraint_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================================
-- 10. ALL UNIQUE CONSTRAINT NAMES
-- ============================================================================

SELECT 
    tc.table_name,
    tc.constraint_name as unique_constraint_name
FROM information_schema.table_constraints AS tc 
WHERE tc.constraint_schema = 'public'
  AND tc.constraint_type = 'UNIQUE'
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================================
-- 11. ALL CHECK CONSTRAINT NAMES
-- ============================================================================

SELECT 
    tc.table_name,
    tc.constraint_name as check_constraint_name
FROM information_schema.table_constraints AS tc 
WHERE tc.constraint_schema = 'public'
  AND tc.constraint_type = 'CHECK'
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================================
-- 12. ALL SEQUENCE NAMES
-- ============================================================================

SELECT sequence_name
FROM information_schema.sequences
WHERE sequence_schema = 'public'
ORDER BY sequence_name;

-- ============================================================================
-- 13. ALL 4 ENUM NAMES (with values)
-- ============================================================================

SELECT 
    t.typname as enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
FROM pg_type t
JOIN pg_namespace n ON t.typnamespace = n.oid
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE n.nspname = 'public'
  AND t.typtype = 'e'
GROUP BY t.typname
ORDER BY t.typname;

-- ============================================================================
-- 14. ALL RLS ENABLED TABLE NAMES
-- ============================================================================

SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true
ORDER BY tablename;

-- ============================================================================
-- SUMMARY WITH COUNTS
-- ============================================================================

SELECT 'Tables' as object_type, COUNT(*)::text as count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'

UNION ALL

SELECT 'Views', COUNT(*)::text
FROM information_schema.views 
WHERE table_schema = 'public'

UNION ALL

SELECT 'Materialized Views', COUNT(*)::text
FROM pg_matviews 
WHERE schemaname = 'public'

UNION ALL

SELECT 'Unique Functions', COUNT(DISTINCT proname)::text
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.prokind IN ('f', 'p')

UNION ALL

SELECT 'Function Variants', COUNT(*)::text
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.prokind IN ('f', 'p')

UNION ALL

SELECT 'Extensions', COUNT(*)::text
FROM pg_extension
WHERE extname NOT IN ('plpgsql')

UNION ALL

SELECT 'Indexes', COUNT(*)::text
FROM pg_indexes 
WHERE schemaname = 'public'

UNION ALL

SELECT 'RLS Policies', COUNT(*)::text
FROM pg_policies 
WHERE schemaname = 'public'

UNION ALL

SELECT 'Triggers', COUNT(*)::text
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' AND NOT t.tgisinternal

UNION ALL

SELECT 'Foreign Keys', COUNT(*)::text
FROM information_schema.table_constraints
WHERE constraint_schema = 'public' AND constraint_type = 'FOREIGN KEY'

UNION ALL

SELECT 'Unique Constraints', COUNT(*)::text
FROM information_schema.table_constraints
WHERE constraint_schema = 'public' AND constraint_type = 'UNIQUE'

UNION ALL

SELECT 'Check Constraints', COUNT(*)::text
FROM information_schema.table_constraints
WHERE constraint_schema = 'public' AND constraint_type = 'CHECK'

UNION ALL

SELECT 'Sequences', COUNT(*)::text
FROM information_schema.sequences
WHERE sequence_schema = 'public'

UNION ALL

SELECT 'Enums', COUNT(*)::text
FROM pg_type t
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public' AND t.typtype = 'e'

UNION ALL

SELECT 'RLS Enabled Tables', COUNT(*)::text
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;
