-- ============================================================================
-- CREATE DATABASE SNAPSHOT - November 4, 2025, 8:29 PM
-- ============================================================================
-- Purpose: Generate a complete database snapshot in JSON format
-- Output: Single JSON object with all database metadata
-- Usage: Run this query to get a complete snapshot of your database
-- ============================================================================

-- ============================================================================
-- COMPLETE DATABASE SNAPSHOT (Single Query)
-- ============================================================================

SELECT json_build_object(
    'snapshot_date', NOW(),
    'database_name', current_database(),
    'database_version', version(),
    
    -- Summary Counts
    'summary', json_build_object(
        'total_tables', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'),
        'total_views', (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public'),
        'total_materialized_views', (SELECT COUNT(*) FROM pg_matviews WHERE schemaname = 'public'),
        'total_functions', (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.prokind IN ('f', 'p')),
        'unique_function_names', (SELECT COUNT(DISTINCT proname) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.prokind IN ('f', 'p')),
        'total_extensions', (SELECT COUNT(*) FROM pg_extension WHERE extname NOT IN ('plpgsql')),
        'total_indexes', (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public'),
        'total_rls_policies', (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public'),
        'total_triggers', (SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public' AND NOT t.tgisinternal),
        'total_foreign_keys', (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND constraint_type = 'FOREIGN KEY'),
        'total_unique_constraints', (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND constraint_type = 'UNIQUE'),
        'total_check_constraints', (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND constraint_type = 'CHECK'),
        'total_sequences', (SELECT COUNT(*) FROM information_schema.sequences WHERE sequence_schema = 'public'),
        'total_enums', (SELECT COUNT(*) FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typtype = 'e'),
        'rls_enabled_tables', (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true),
        'database_size', pg_size_pretty(pg_database_size(current_database()))
    ),
    
    -- All Tables with Details
    'tables', (
        SELECT json_agg(json_build_object(
            'table_name', table_name,
            'column_count', (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name),
            'has_primary_key', EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE table_schema = 'public' AND table_name = t.table_name AND constraint_type = 'PRIMARY KEY'),
            'has_rls', EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t.table_name AND rowsecurity = true),
            'row_count', (SELECT reltuples::bigint FROM pg_class WHERE relname = t.table_name AND relnamespace = 'public'::regnamespace),
            'table_size', pg_size_pretty(pg_total_relation_size('public.' || t.table_name))
        ) ORDER BY table_name)
        FROM information_schema.tables t
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ),
    
    -- All Views
    'views', (
        SELECT json_agg(json_build_object(
            'view_name', table_name
        ) ORDER BY table_name)
        FROM information_schema.views
        WHERE table_schema = 'public'
    ),
    
    -- All Materialized Views
    'materialized_views', (
        SELECT json_agg(json_build_object(
            'view_name', matviewname,
            'is_populated', ispopulated,
            'has_indexes', hasindexes
        ) ORDER BY matviewname)
        FROM pg_matviews
        WHERE schemaname = 'public'
    ),
    
    -- All Functions (unique names only)
    'functions', (
        SELECT json_agg(
            json_build_object(
                'function_name', function_name,
                'variant_count', variant_count
            ) ORDER BY function_name
        )
        FROM (
            SELECT 
                proname as function_name,
                COUNT(*) as variant_count
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.prokind IN ('f', 'p')
            GROUP BY proname
        ) f
    ),
    
    -- All Extensions
    'extensions', (
        SELECT json_agg(json_build_object(
            'extension_name', extname,
            'version', extversion
        ) ORDER BY extname)
        FROM pg_extension
        WHERE extname NOT IN ('plpgsql')
    ),
    
    -- All Enums
    'enums', (
        SELECT json_agg(
            json_build_object(
                'enum_name', enum_name,
                'values', values
            ) ORDER BY enum_name
        )
        FROM (
            SELECT 
                t.typname as enum_name,
                array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
            FROM pg_type t
            JOIN pg_namespace n ON t.typnamespace = n.oid
            JOIN pg_enum e ON t.oid = e.enumtypid
            WHERE n.nspname = 'public' AND t.typtype = 'e'
            GROUP BY t.typname
        ) en
    ),
    
    -- Index Summary by Table
    'indexes_by_table', (
        SELECT json_agg(
            json_build_object(
                'table_name', table_name,
                'index_count', index_count,
                'indexes', indexes
            ) ORDER BY index_count DESC
        )
        FROM (
            SELECT 
                tablename as table_name,
                COUNT(*) as index_count,
                array_agg(indexname ORDER BY indexname) as indexes
            FROM pg_indexes
            WHERE schemaname = 'public'
            GROUP BY tablename
        ) idx
    ),
    
    -- RLS Policy Summary by Table
    'rls_policies_by_table', (
        SELECT json_agg(
            json_build_object(
                'table_name', table_name,
                'policy_count', policy_count,
                'policies', policies
            ) ORDER BY policy_count DESC
        )
        FROM (
            SELECT 
                tablename as table_name,
                COUNT(*) as policy_count,
                array_agg(policyname ORDER BY policyname) as policies
            FROM pg_policies
            WHERE schemaname = 'public'
            GROUP BY tablename
        ) pol
    ),
    
    -- Trigger Summary by Table
    'triggers_by_table', (
        SELECT json_agg(
            json_build_object(
                'table_name', table_name,
                'trigger_count', trigger_count,
                'triggers', triggers
            ) ORDER BY trigger_count DESC
        )
        FROM (
            SELECT 
                c.relname as table_name,
                COUNT(*) as trigger_count,
                array_agg(t.tgname ORDER BY t.tgname) as triggers
            FROM pg_trigger t
            JOIN pg_class c ON t.tgrelid = c.oid
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE n.nspname = 'public' AND NOT t.tgisinternal
            GROUP BY c.relname
        ) trg
    ),
    
    -- Foreign Key Summary by Table
    'foreign_keys_by_table', (
        SELECT json_agg(
            json_build_object(
                'table_name', table_name,
                'fk_count', fk_count,
                'foreign_keys', foreign_keys
            ) ORDER BY fk_count DESC
        )
        FROM (
            SELECT 
                tc.table_name,
                COUNT(*) as fk_count,
                array_agg(tc.constraint_name ORDER BY tc.constraint_name) as foreign_keys
            FROM information_schema.table_constraints tc
            WHERE tc.constraint_schema = 'public' AND tc.constraint_type = 'FOREIGN KEY'
            GROUP BY tc.table_name
        ) fk
    ),
    
    -- Top 20 Largest Tables
    'largest_tables', (
        SELECT json_agg(json_build_object(
            'table_name', tablename,
            'total_size', pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)),
            'table_size', pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)),
            'indexes_size', pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename))
        ) ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC)
        FROM pg_tables
        WHERE schemaname = 'public'
        LIMIT 20
    ),
    
    -- Security Analysis
    'security', json_build_object(
        'rls_coverage_percent', ROUND((SELECT COUNT(*)::numeric FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) / NULLIF((SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public'), 0) * 100, 2),
        'tables_with_rls', (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true),
        'tables_without_rls', (
            SELECT json_agg(tablename ORDER BY tablename)
            FROM pg_tables
            WHERE schemaname = 'public' AND rowsecurity = false
        )
    ),
    
    -- Performance Metrics
    'performance', json_build_object(
        'total_indexes', (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public'),
        'unused_indexes', (
            SELECT json_agg(json_build_object(
                'table_name', schemaname || '.' || relname,
                'index_name', indexrelname
            ))
            FROM pg_stat_user_indexes
            WHERE schemaname = 'public' AND idx_scan = 0
            LIMIT 20
        ),
        'most_used_indexes', (
            SELECT json_agg(json_build_object(
                'table_name', schemaname || '.' || relname,
                'index_name', indexrelname,
                'times_used', idx_scan
            ) ORDER BY idx_scan DESC)
            FROM pg_stat_user_indexes
            WHERE schemaname = 'public' AND idx_scan > 0
            LIMIT 20
        )
    )
    
) AS database_snapshot;

-- ============================================================================
-- ALTERNATIVE: Simplified Snapshot (Counts Only)
-- ============================================================================

-- Uncomment to use simplified version:
/*
SELECT json_build_object(
    'snapshot_date', NOW(),
    'database_name', current_database(),
    'tables', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'),
    'views', (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public'),
    'materialized_views', (SELECT COUNT(*) FROM pg_matviews WHERE schemaname = 'public'),
    'functions', (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.prokind IN ('f', 'p')),
    'extensions', (SELECT COUNT(*) FROM pg_extension WHERE extname NOT IN ('plpgsql')),
    'indexes', (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public'),
    'rls_policies', (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public'),
    'triggers', (SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public' AND NOT t.tgisinternal),
    'foreign_keys', (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND constraint_type = 'FOREIGN KEY'),
    'unique_constraints', (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND constraint_type = 'UNIQUE'),
    'check_constraints', (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND constraint_type = 'CHECK'),
    'sequences', (SELECT COUNT(*) FROM information_schema.sequences WHERE sequence_schema = 'public'),
    'enums', (SELECT COUNT(*) FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND t.typtype = 'e'),
    'rls_enabled_tables', (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true),
    'database_size', pg_size_pretty(pg_database_size(current_database()))
) AS snapshot;
*/

-- ============================================================================
-- SAVE SNAPSHOT TO TABLE (Optional)
-- ============================================================================

-- Create snapshots table (run once):
/*
CREATE TABLE IF NOT EXISTS database_snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    snapshot_data JSONB NOT NULL,
    created_by TEXT DEFAULT current_user,
    notes TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON database_snapshots(snapshot_date DESC);
*/

-- Insert snapshot into table:
/*
INSERT INTO database_snapshots (snapshot_data, notes)
SELECT 
    json_build_object(
        'snapshot_date', NOW(),
        'database_name', current_database(),
        -- ... (same as above)
    ),
    'Manual snapshot - Nov 4, 2025';
*/

-- Query snapshots:
/*
-- Get latest snapshot
SELECT * FROM database_snapshots ORDER BY snapshot_date DESC LIMIT 1;

-- Compare two snapshots
SELECT 
    s1.snapshot_date as snapshot_1_date,
    s2.snapshot_date as snapshot_2_date,
    (s1.snapshot_data->'summary'->>'total_tables')::int as s1_tables,
    (s2.snapshot_data->'summary'->>'total_tables')::int as s2_tables,
    (s2.snapshot_data->'summary'->>'total_tables')::int - (s1.snapshot_data->'summary'->>'total_tables')::int as table_diff
FROM database_snapshots s1
CROSS JOIN database_snapshots s2
WHERE s1.snapshot_date < s2.snapshot_date
ORDER BY s1.snapshot_date DESC, s2.snapshot_date DESC
LIMIT 1;
*/

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

-- 1. Get complete snapshot:
--    Run the main query above

-- 2. Save to file:
--    Copy the JSON output and save to a file

-- 3. Compare snapshots:
--    Run at different times and compare the JSON

-- 4. Extract specific data:
--    SELECT snapshot_data->'tables' FROM database_snapshots WHERE ...

-- 5. Track growth over time:
--    SELECT 
--        snapshot_date,
--        snapshot_data->'summary'->>'total_tables' as tables,
--        snapshot_data->'summary'->>'total_functions' as functions
--    FROM database_snapshots
--    ORDER BY snapshot_date;

-- ============================================================================
-- END OF SNAPSHOT SCRIPT
-- ============================================================================
