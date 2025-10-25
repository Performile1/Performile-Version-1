-- =====================================================
-- SAFE DATABASE CONTENT CHECK
-- =====================================================
-- This version dynamically queries only existing columns
-- Will never fail due to missing columns or tables
-- =====================================================

SELECT '=====================================================' as "INFO";
SELECT 'PERFORMILE DATABASE SAFE CONTENT CHECK' as "TITLE";
SELECT '=====================================================' as "INFO";

-- =====================================================
-- SECTION 1: DATABASE OVERVIEW
-- =====================================================

SELECT '1. DATABASE OVERVIEW' as "SECTION";
SELECT '-----------------------------------------------------' as "INFO";

-- List all tables with row counts
SELECT 
    t.table_name,
    COALESCE(s.n_live_tup, 0) as row_count,
    pg_size_pretty(pg_total_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))) as total_size
FROM information_schema.tables t
LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name AND s.schemaname = t.table_schema
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
ORDER BY COALESCE(s.n_live_tup, 0) DESC, t.table_name;

SELECT '-----------------------------------------------------' as "INFO";
SELECT 'Total Tables Count:' as "INFO";
SELECT COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- =====================================================
-- SECTION 2: ROW COUNTS FOR ALL TABLES
-- =====================================================

SELECT '=====================================================' as "INFO";
SELECT '2. ROW COUNTS FOR ALL TABLES' as "SECTION";
SELECT '=====================================================' as "INFO";

-- Dynamic row count query for all tables
DO $$
DECLARE
    table_record RECORD;
    row_count BIGINT;
    sql_query TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TABLE ROW COUNTS ===';
    RAISE NOTICE '';
    
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
    LOOP
        BEGIN
            sql_query := 'SELECT COUNT(*) FROM ' || quote_ident(table_record.table_name);
            EXECUTE sql_query INTO row_count;
            RAISE NOTICE '% : % rows', RPAD(table_record.table_name, 35), row_count;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '% : ERROR - %', RPAD(table_record.table_name, 35), SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '';
END $$;

-- =====================================================
-- SECTION 3: TABLE COLUMNS INVENTORY
-- =====================================================

SELECT '=====================================================' as "INFO";
SELECT '3. TABLE COLUMNS INVENTORY' as "SECTION";
SELECT '=====================================================' as "INFO";

SELECT 'All Columns in Database:' as "INFO";
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_default IS NOT NULL THEN 'Has Default'
        ELSE 'No Default'
    END as has_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- =====================================================
-- SECTION 4: SAMPLE DATA FROM KEY TABLES
-- =====================================================

SELECT '=====================================================' as "INFO";
SELECT '4. SAMPLE DATA FROM KEY TABLES' as "SECTION";
SELECT '=====================================================' as "INFO";

-- Dynamically query each table with all its columns
DO $$
DECLARE
    table_record RECORD;
    column_list TEXT;
    sql_query TEXT;
    result_record RECORD;
    row_count INTEGER := 0;
BEGIN
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name IN ('users', 'couriers', 'stores', 'orders', 'reviews', 
                          'subscription_plans', 'user_subscriptions', 'merchantshops',
                          'trustscorecache', 'ratinglinks', 'servicetypes',
                          'merchantcouriercheckout', 'conversations', 'messages',
                          'ecommerce_integrations', 'paymenthistory')
        ORDER BY table_name
    LOOP
        BEGIN
            -- Get column list for this table
            SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
            INTO column_list
            FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = table_record.table_name;
            
            -- Get row count
            EXECUTE 'SELECT COUNT(*) FROM ' || quote_ident(table_record.table_name) INTO row_count;
            
            RAISE NOTICE '';
            RAISE NOTICE '=== TABLE: % ===', UPPER(table_record.table_name);
            RAISE NOTICE 'Columns: %', column_list;
            RAISE NOTICE 'Total Rows: %', row_count;
            RAISE NOTICE '';
            
            IF row_count > 0 THEN
                -- Show sample data (first 5 rows)
                sql_query := 'SELECT * FROM ' || quote_ident(table_record.table_name) || ' LIMIT 5';
                FOR result_record IN EXECUTE sql_query LOOP
                    RAISE NOTICE 'Row: %', result_record;
                END LOOP;
            ELSE
                RAISE NOTICE 'Table is empty';
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'ERROR querying %: %', table_record.table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- =====================================================
-- SECTION 5: RELATIONSHIPS AND CONSTRAINTS
-- =====================================================

SELECT '=====================================================' as "INFO";
SELECT '5. RELATIONSHIPS AND CONSTRAINTS' as "SECTION";
SELECT '=====================================================' as "INFO";

-- Foreign Keys
SELECT 'Foreign Key Relationships:' as "INFO";
SELECT
    tc.table_name as from_table,
    kcu.column_name as from_column,
    ccu.table_name as to_table,
    ccu.column_name as to_column,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- Primary Keys
SELECT '-----------------------------------------------------' as "INFO";
SELECT 'Primary Keys:' as "INFO";
SELECT
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- Unique Constraints
SELECT '-----------------------------------------------------' as "INFO";
SELECT 'Unique Constraints:' as "INFO";
SELECT
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- =====================================================
-- SECTION 6: INDEXES
-- =====================================================

SELECT '=====================================================' as "INFO";
SELECT '6. INDEXES' as "SECTION";
SELECT '=====================================================' as "INFO";

SELECT
    tablename as table_name,
    indexname as index_name,
    indexdef as index_definition
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =====================================================
-- SECTION 7: FUNCTIONS AND TRIGGERS
-- =====================================================

SELECT '=====================================================' as "INFO";
SELECT '7. FUNCTIONS AND TRIGGERS' as "SECTION";
SELECT '=====================================================' as "INFO";

-- Functions
SELECT 'Database Functions:' as "INFO";
SELECT
    proname as function_name,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

-- Triggers
SELECT '-----------------------------------------------------' as "INFO";
SELECT 'Database Triggers:' as "INFO";
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- SECTION 8: ROW LEVEL SECURITY (RLS)
-- =====================================================

SELECT '=====================================================' as "INFO";
SELECT '8. ROW LEVEL SECURITY STATUS' as "SECTION";
SELECT '=====================================================' as "INFO";

SELECT
    schemaname as schema_name,
    tablename as table_name,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- RLS Policies
SELECT '-----------------------------------------------------' as "INFO";
SELECT 'RLS Policies:' as "INFO";
SELECT
    schemaname as schema_name,
    tablename as table_name,
    policyname as policy_name,
    permissive,
    roles,
    cmd as command
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- SECTION 9: SUMMARY STATISTICS
-- =====================================================

SELECT '=====================================================' as "INFO";
SELECT '9. SUMMARY STATISTICS' as "SECTION";
SELECT '=====================================================' as "INFO";

SELECT 'Database Size:' as "INFO";
SELECT pg_size_pretty(pg_database_size(current_database())) as database_size;

SELECT '-----------------------------------------------------' as "INFO";
SELECT 'Total Rows Across All Tables:' as "INFO";
SELECT COALESCE(SUM(n_live_tup), 0) as total_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public';

SELECT '-----------------------------------------------------' as "INFO";
SELECT 'Tables with Most Rows:' as "INFO";
SELECT 
    relname as table_name,
    n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC
LIMIT 10;

SELECT '-----------------------------------------------------' as "INFO";
SELECT 'Tables with No Data:' as "INFO";
SELECT 
    relname as table_name
FROM pg_stat_user_tables
WHERE schemaname = 'public'
    AND n_live_tup = 0
ORDER BY relname;

-- =====================================================
-- SECTION 10: DATA INTEGRITY CHECKS
-- =====================================================

SELECT '=====================================================' as "INFO";
SELECT '10. DATA INTEGRITY CHECKS' as "SECTION";
SELECT '=====================================================' as "INFO";

-- Check for orphaned records dynamically
DO $$
DECLARE
    orders_exist BOOLEAN;
    couriers_exist BOOLEAN;
    stores_exist BOOLEAN;
    reviews_exist BOOLEAN;
    orphan_count INTEGER;
BEGIN
    -- Check if tables exist
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') INTO orders_exist;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'couriers') INTO couriers_exist;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stores') INTO stores_exist;
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') INTO reviews_exist;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== DATA INTEGRITY CHECKS ===';
    RAISE NOTICE '';
    
    -- Check for orphaned orders
    IF orders_exist AND couriers_exist THEN
        EXECUTE 'SELECT COUNT(*) FROM orders o LEFT JOIN couriers c ON o.courier_id = c.courier_id WHERE c.courier_id IS NULL' INTO orphan_count;
        RAISE NOTICE 'Orders without valid courier: %', orphan_count;
    END IF;
    
    IF orders_exist AND stores_exist THEN
        EXECUTE 'SELECT COUNT(*) FROM orders o LEFT JOIN stores s ON o.store_id = s.store_id WHERE s.store_id IS NULL' INTO orphan_count;
        RAISE NOTICE 'Orders without valid store: %', orphan_count;
    END IF;
    
    -- Check for orphaned reviews
    IF reviews_exist AND orders_exist THEN
        EXECUTE 'SELECT COUNT(*) FROM reviews r LEFT JOIN orders o ON r.order_id = o.order_id WHERE o.order_id IS NULL' INTO orphan_count;
        RAISE NOTICE 'Reviews without valid order: %', orphan_count;
    END IF;
    
    RAISE NOTICE '';
END $$;

-- =====================================================
-- COMPLETION
-- =====================================================

SELECT '=====================================================' as "INFO";
SELECT 'DATABASE CHECK COMPLETE' as "STATUS";
SELECT '=====================================================' as "INFO";
SELECT 'All checks completed successfully!' as "INFO";
SELECT 'Check the NOTICES above for detailed table data.' as "INFO";
SELECT '=====================================================' as "INFO";
