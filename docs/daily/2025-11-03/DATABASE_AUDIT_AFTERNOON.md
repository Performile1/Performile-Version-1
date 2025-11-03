# DATABASE AUDIT - NOVEMBER 3, 2025 (AFTERNOON)

**Date:** November 3, 2025  
**Time:** 1:01 PM  
**Session:** Afternoon (Before PostNord API Integration)  
**Purpose:** Complete database state snapshot before continuing work

---

## 📊 AUDIT QUERIES TO RUN

Copy and paste these queries into Supabase SQL Editor and document results below.

---

### **QUERY 1: Total Database Objects**

```sql
SELECT 
  'Tables' as object_type,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL
SELECT 
  'Functions',
  COUNT(DISTINCT routine_name)
FROM information_schema.routines
WHERE routine_schema = 'public'
UNION ALL
SELECT 
  'Views',
  COUNT(*)
FROM information_schema.views
WHERE table_schema = 'public'
UNION ALL
SELECT 
  'Materialized Views',
  COUNT(*)
FROM pg_matviews
WHERE schemaname = 'public';
```

**RESULTS:**
```
| object_type        | count |
|--------------------|-------|
| Tables             |       |
| Functions          |       |
| Views              |       |
| Materialized Views |       |
```

---

### **QUERY 2: All Tables (Alphabetical)**

```sql
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns,
  pg_size_pretty(pg_total_relation_size(quote_ident(t.table_name)::regclass)) as size
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**RESULTS:**
```
Paste results here...
```

---

### **QUERY 3: Courier-Related Tables**

```sql
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name LIKE '%courier%'
ORDER BY table_name;
```

**RESULTS:**
```
| table_name                   | columns |
|------------------------------|---------|
|                              |         |
```

---

### **QUERY 4: Shipment/Booking Related Tables**

```sql
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND (
    table_name LIKE '%shipment%' 
    OR table_name LIKE '%booking%'
    OR table_name LIKE '%label%'
  )
ORDER BY table_name;
```

**RESULTS:**
```
| table_name              | columns |
|-------------------------|---------|
| shipment_bookings       |         |
| shipment_booking_errors |         |
```

---

### **QUERY 5: Order-Related Tables**

```sql
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name LIKE '%order%'
ORDER BY table_name;
```

**RESULTS:**
```
| table_name    | columns |
|---------------|---------|
|               |         |
```

---

### **QUERY 6: Ranking/Analytics Tables**

```sql
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND (
    table_name LIKE '%ranking%'
    OR table_name LIKE '%analytics%'
    OR table_name LIKE '%checkout%'
  )
ORDER BY table_name;
```

**RESULTS:**
```
| table_name                  | columns |
|-----------------------------|---------|
|                             |         |
```

---

### **QUERY 7: All Functions**

```sql
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

**RESULTS:**
```
| routine_name                      | routine_type | return_type |
|-----------------------------------|--------------|-------------|
|                                   |              |             |
```

---

### **QUERY 8: Ranking/Courier Functions**

```sql
SELECT 
  routine_name,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_name LIKE '%ranking%'
    OR routine_name LIKE '%courier%'
    OR routine_name LIKE '%score%'
  )
ORDER BY routine_name;
```

**RESULTS:**
```
| routine_name                        | return_type |
|-------------------------------------|-------------|
|                                     |             |
```

---

### **QUERY 9: Tables with RLS Enabled**

```sql
SELECT 
  tablename,
  rowsecurity,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
  AND rowsecurity = true
ORDER BY tablename;
```

**RESULTS:**
```
| tablename               | rowsecurity | policy_count |
|-------------------------|-------------|--------------|
|                         |             |              |
```

---

### **QUERY 10: Key Table Record Counts**

```sql
SELECT 'users' as table_name, COUNT(*) as records FROM users
UNION ALL SELECT 'stores', COUNT(*) FROM stores
UNION ALL SELECT 'couriers', COUNT(*) FROM couriers
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'reviews', COUNT(*) FROM reviews
UNION ALL SELECT 'shipment_bookings', COUNT(*) FROM shipment_bookings
UNION ALL SELECT 'courier_ranking_scores', COUNT(*) FROM courier_ranking_scores
UNION ALL SELECT 'checkout_courier_analytics', COUNT(*) FROM checkout_courier_analytics
ORDER BY table_name;
```

**RESULTS:**
```
| table_name                  | records |
|-----------------------------|---------|
|                             |         |
```

---

### **QUERY 11: Shipment Bookings Table Structure**

```sql
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'shipment_bookings'
ORDER BY ordinal_position;
```

**RESULTS:**
```
| column_name         | data_type | is_nullable | column_default |
|---------------------|-----------|-------------|----------------|
|                     |           |             |                |
```

---

### **QUERY 12: Courier API Credentials Table Structure**

```sql
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'courier_api_credentials'
ORDER BY ordinal_position;
```

**RESULTS:**
```
| column_name    | data_type | is_nullable |
|----------------|-----------|-------------|
|                |           |             |
```

---

### **QUERY 13: Check for Duplicate Tables**

```sql
-- Check for any tables that might be duplicates
SELECT 
  t1.table_name as table1,
  t2.table_name as table2,
  (
    SELECT COUNT(*) 
    FROM information_schema.columns c1
    WHERE c1.table_name = t1.table_name
  ) as columns1,
  (
    SELECT COUNT(*) 
    FROM information_schema.columns c2
    WHERE c2.table_name = t2.table_name
  ) as columns2
FROM information_schema.tables t1
CROSS JOIN information_schema.tables t2
WHERE t1.table_schema = 'public'
  AND t2.table_schema = 'public'
  AND t1.table_name < t2.table_name
  AND (
    -- Similar names
    t1.table_name LIKE '%' || SUBSTRING(t2.table_name FROM 1 FOR 5) || '%'
    OR t2.table_name LIKE '%' || SUBSTRING(t1.table_name FROM 1 FOR 5) || '%'
  )
ORDER BY t1.table_name, t2.table_name;
```

**RESULTS:**
```
| table1 | table2 | columns1 | columns2 | Notes |
|--------|--------|----------|----------|-------|
|        |        |          |          |       |
```

---

### **QUERY 14: Indexes on Key Tables**

```sql
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN (
  'shipment_bookings',
  'shipment_booking_errors',
  'courier_ranking_scores',
  'checkout_courier_analytics',
  'orders',
  'couriers'
)
ORDER BY tablename, indexname;
```

**RESULTS:**
```
| tablename               | indexname                  | indexdef |
|-------------------------|----------------------------|----------|
|                         |                            |          |
```

---

## 📋 AUDIT SUMMARY

### **Database Totals:**
- **Tables:** [X]
- **Functions:** [Y]
- **Views:** [Z]
- **Materialized Views:** [W]

### **Tables Added Today:**
1. `shipment_bookings` - [X] columns
2. `shipment_booking_errors` - [Y] columns

### **Functions Added Today:**
- None (reused existing)

### **Duplicate Check:**
- [ ] No duplicates found
- [ ] Duplicates found: [list them]

### **RLS Status:**
- Tables with RLS: [X]
- New tables with RLS: 2 (shipment_bookings, shipment_booking_errors)

---

## ✅ VALIDATION CHECKLIST

- [ ] All queries run successfully
- [ ] Results documented
- [ ] No duplicate tables found
- [ ] No duplicate columns found
- [ ] RLS enabled on new tables
- [ ] Indexes created on new tables
- [ ] No errors in database
- [ ] Ready to proceed with API integration

---

## 🎯 WHAT CAN BE REUSED

### **For PostNord API Integration:**

**Tables Available:**
- `courier_api_credentials` - Store API keys
- `couriers` - Courier information
- `orders` - Order data
- `shipment_bookings` - Store booking results
- `tracking_api_logs` - Log API calls

**Functions Available:**
- [List from Query 8]

**Services Available:**
- `CourierApiService` class (existing)
- Authentication middleware (existing)
- Database connection pool (existing)

---

## 📝 NOTES

**Observations:**
- [Any observations from the audit]

**Issues Found:**
- [Any issues discovered]

**Recommendations:**
- [Any recommendations]

---

**Status:** ⏳ **AWAITING RESULTS**  
**Next:** Run queries and document results  
**Then:** Proceed with PostNord API integration

---

*Created: November 3, 2025, 1:01 PM*  
*Purpose: Pre-integration database audit*  
*Framework: SPEC_DRIVEN_FRAMEWORK Rule #1*
