# RUN DATABASE AUDIT STEP BY STEP

**Date:** November 4, 2025  
**Purpose:** Run audit queries one at a time to identify which one causes errors

---

## 🎯 INSTRUCTIONS

**Run each query SEPARATELY in Supabase SQL Editor**

If a query fails, note which number it is and share the error.

---

## ✅ QUERY 1: COUNT ALL TABLES

```sql
SELECT 
    'TOTAL TABLES' as metric,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name NOT LIKE 'pg_%'
  AND table_name NOT LIKE 'sql_%';
```

---

## ✅ QUERY 2: LIST ALL TABLES WITH DETAILS

```sql
SELECT 
    t.table_name,
    (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema = 'public') as column_count,
    pg_size_pretty(pg_total_relation_size(quote_ident(t.table_name)::regclass)) as total_size,
    (SELECT COUNT(*) FROM information_schema.table_constraints tc 
     WHERE tc.table_name = t.table_name AND tc.table_schema = 'public' AND tc.constraint_type = 'FOREIGN KEY') as fk_count,
    COALESCE((SELECT reltuples::bigint FROM pg_class pc WHERE pc.relname = t.table_name LIMIT 1), 0) as estimated_rows
FROM information_schema.tables t
WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
  AND t.table_name NOT LIKE 'pg_%'
  AND t.table_name NOT LIKE 'sql_%'
ORDER BY t.table_name;
```

---

## ✅ QUERY 3: CHECK RLS STATUS

```sql
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as rls_status,
    (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = c.tablename AND p.schemaname = 'public') as policy_count
FROM pg_tables c
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%'
ORDER BY rowsecurity, tablename;
```

---

## ✅ QUERY 4: FIND TABLES WITHOUT RLS

```sql
SELECT 
    '⚠️ TABLES WITHOUT RLS' as issue,
    tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%'
  AND tablename != 'spatial_ref_sys'
ORDER BY tablename;
```

---

## ✅ QUERY 5: COUNT ALL FUNCTIONS

```sql
SELECT 
    'TOTAL FUNCTIONS' as metric,
    COUNT(*) as count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f';
```

---

## ✅ QUERY 6: LIST ALL FUNCTIONS

```sql
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) LIKE '%SECURITY DEFINER%' as is_security_definer,
    CASE 
        WHEN pg_get_functiondef(p.oid) LIKE '%search_path%' THEN '⚠️ HAS MUTABLE SEARCH_PATH'
        ELSE '✅ OK'
    END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
ORDER BY p.proname;
```

---

## ⚠️ QUERY 7: FIND DUPLICATE FUNCTIONS (MIGHT CAUSE ERROR)

**Try this version first:**

```sql
SELECT 
    p.proname as function_name,
    COUNT(*) as occurrences
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
GROUP BY p.proname
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC, p.proname;
```

**If that works, try with signatures:**

```sql
SELECT 
    p.proname as function_name,
    COUNT(*) as occurrences,
    string_agg(pg_get_function_arguments(p.oid), ' | ') as all_signatures
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
GROUP BY p.proname
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC, p.proname;
```

---

## ✅ QUERY 8: COUNT ALL VIEWS

```sql
SELECT 
    'TOTAL VIEWS' as metric,
    COUNT(*) as count
FROM information_schema.views
WHERE table_schema = 'public';
```

---

## ✅ QUERY 9: LIST ALL VIEWS

```sql
SELECT 
    table_name as view_name,
    CASE 
        WHEN view_definition LIKE '%SECURITY DEFINER%' THEN '⚠️ SECURITY DEFINER'
        ELSE '✅ OK'
    END as security_status
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY view_name;
```

---

## ✅ QUERY 10: COUNT MATERIALIZED VIEWS

```sql
SELECT 
    'TOTAL MATERIALIZED VIEWS' as metric,
    COUNT(*) as count
FROM pg_matviews
WHERE schemaname = 'public';
```

---

## ✅ QUERY 11: LIST MATERIALIZED VIEWS

```sql
SELECT 
    matviewname as view_name,
    pg_size_pretty(pg_total_relation_size(matviewname::regclass)) as size,
    ispopulated
FROM pg_matviews
WHERE schemaname = 'public'
ORDER BY matviewname;
```

---

## ⚠️ QUERY 12: FIND SIMILAR TABLE NAMES (MIGHT CAUSE ERROR)

**Try this version first:**

```sql
WITH table_analysis AS (
    SELECT 
        table_name,
        LOWER(REGEXP_REPLACE(table_name, '[_-]', '', 'g')) as normalized_name
    FROM information_schema.tables
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
)
SELECT 
    normalized_name,
    COUNT(*) as table_count
FROM table_analysis
GROUP BY normalized_name
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;
```

**If that works, try with table names:**

```sql
WITH table_analysis AS (
    SELECT 
        table_name,
        LOWER(REGEXP_REPLACE(table_name, '[_-]', '', 'g')) as normalized_name
    FROM information_schema.tables
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
)
SELECT 
    normalized_name,
    COUNT(*) as table_count,
    string_agg(table_name, ', ') as similar_tables
FROM table_analysis
GROUP BY normalized_name
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;
```

---

## ✅ QUERY 13: CHECK FOR DUPLICATE DATA STORAGE

```sql
SELECT 
    t1.table_name as table1,
    t2.table_name as table2,
    COUNT(*) as matching_columns
FROM information_schema.columns t1
JOIN information_schema.columns t2 
    ON t1.column_name = t2.column_name 
    AND t1.table_name < t2.table_name
    AND t1.table_schema = 'public'
    AND t2.table_schema = 'public'
WHERE t1.table_schema = 'public' 
  AND t2.table_schema = 'public'
GROUP BY t1.table_name, t2.table_name
HAVING COUNT(*) >= 5
ORDER BY COUNT(*) DESC
LIMIT 20;
```

---

## ✅ QUERY 14: CHECK EXTENSIONS

```sql
SELECT 
    extname as extension_name,
    extnamespace::regnamespace as schema,
    extversion as version,
    CASE 
        WHEN extnamespace::regnamespace::text = 'public' THEN '⚠️ IN PUBLIC SCHEMA'
        ELSE '✅ OK'
    END as status
FROM pg_extension
WHERE extname IN ('postgis', 'cube', 'earthdistance')
ORDER BY extname;
```

---

## ✅ QUERY 15: SUMMARY OF ISSUES

```sql
SELECT 
    'SECURITY ISSUES SUMMARY' as category,
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false AND tablename NOT IN ('spatial_ref_sys')) as tables_without_rls,
    (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public' AND view_definition LIKE '%SECURITY DEFINER%') as views_with_security_definer,
    (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND pg_get_functiondef(p.oid) LIKE '%search_path%') as functions_with_mutable_search_path,
    (SELECT COUNT(*) FROM pg_extension WHERE extnamespace::regnamespace::text = 'public' AND extname IN ('postgis', 'cube', 'earthdistance')) as extensions_in_public_schema;
```

---

## ✅ QUERY 16: DATABASE SIZE

```sql
SELECT 
    'DATABASE SIZE' as metric,
    pg_size_pretty(pg_database_size(current_database())) as size;
```

---

## ✅ QUERY 17: TOP 10 LARGEST TABLES

```sql
SELECT 
    'TOP 10 LARGEST TABLES' as category,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

---

## ✅ QUERY 18: UNUSED INDEXES

```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC
LIMIT 20;
```

---

## ✅ QUERY 19: TABLE RELATIONSHIPS

```sql
SELECT 
    tc.table_name,
    COUNT(DISTINCT kcu.column_name) as fk_columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
GROUP BY tc.table_name
ORDER BY COUNT(DISTINCT kcu.column_name) DESC;
```

---

## 📊 RESULTS

**After running each query, note:**
1. Which queries work ✅
2. Which queries fail ❌
3. Error message for failed queries

**Most likely culprits:**
- Query #7 (string_agg with function arguments)
- Query #12 (string_agg with table names)

---

**Status:** Run step by step to identify exact problem query
