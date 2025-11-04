# HOW TO USE DATABASE SNAPSHOT

**Date:** November 4, 2025, 8:35 PM  
**Status:** ✅ Snapshot successfully generated!

---

## 🎉 SUCCESS!

You just ran the database snapshot SQL and got a complete JSON result!

The output was **truncated in the UI** because it's so large (~384KB), but **all the data is there**!

---

## 📋 WHAT YOU GOT

Your snapshot contains:
- ✅ Summary counts (all 15 metrics)
- ✅ All 96 tables with details
- ✅ All 10 views
- ✅ All 5 materialized views
- ✅ All 683 functions (877 variants)
- ✅ All 8 extensions
- ✅ All 4 enums with values
- ✅ Indexes by table (558 total)
- ✅ RLS policies by table (185 total)
- ✅ Triggers by table (31 total)
- ✅ Foreign keys by table (171 total)
- ✅ Top 20 largest tables
- ✅ Security analysis (99% RLS coverage)
- ✅ Performance metrics (unused/most used indexes)

---

## 💾 HOW TO SAVE THE SNAPSHOT

### **Method 1: Copy from Supabase (Recommended)**

1. **In Supabase SQL Editor:**
   - After running the query, you'll see the result
   - Click the **"Copy"** button or **"Download"** button
   - This will copy/download the complete JSON

2. **Save to File:**
   ```
   database_snapshot_2025-11-04.json
   ```

3. **Location:**
   ```
   docs/daily/2025-11-04/database_snapshot_2025-11-04.json
   ```

---

### **Method 2: Use Supabase API**

```bash
# Using curl
curl -X POST 'https://your-project.supabase.co/rest/v1/rpc/get_snapshot' \
  -H "apikey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  > database_snapshot_2025-11-04.json
```

---

### **Method 3: Save to Database Table**

Run this once to create the snapshots table:

```sql
CREATE TABLE IF NOT EXISTS database_snapshots (
    snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    snapshot_data JSONB NOT NULL,
    created_by TEXT DEFAULT current_user,
    notes TEXT
);

CREATE INDEX idx_snapshots_date ON database_snapshots(snapshot_date DESC);
```

Then insert your snapshot:

```sql
INSERT INTO database_snapshots (snapshot_data, notes)
SELECT 
    -- (paste the main snapshot query here)
    json_build_object(
        'snapshot_date', NOW(),
        -- ... rest of query
    ),
    'Manual snapshot - Nov 4, 2025';
```

---

## 📊 HOW TO USE THE SNAPSHOT

### **1. View Summary**

Extract just the summary:

```sql
SELECT snapshot_data->'summary' 
FROM database_snapshots 
ORDER BY snapshot_date DESC 
LIMIT 1;
```

Result:
```json
{
  "total_tables": 96,
  "total_functions": 877,
  "total_indexes": 558,
  "rls_enabled_tables": 95,
  "database_size": "1.2 GB"
}
```

---

### **2. List All Tables**

```sql
SELECT jsonb_array_elements(snapshot_data->'tables')
FROM database_snapshots 
ORDER BY snapshot_date DESC 
LIMIT 1;
```

---

### **3. Check Security**

```sql
SELECT snapshot_data->'security'
FROM database_snapshots 
ORDER BY snapshot_date DESC 
LIMIT 1;
```

Result:
```json
{
  "rls_coverage_percent": 99.0,
  "tables_with_rls": 95,
  "tables_without_rls": ["postal_codes"]
}
```

---

### **4. Find Unused Indexes**

```sql
SELECT snapshot_data->'performance'->'unused_indexes'
FROM database_snapshots 
ORDER BY snapshot_date DESC 
LIMIT 1;
```

---

### **5. Compare Two Snapshots**

```sql
WITH latest AS (
    SELECT snapshot_data 
    FROM database_snapshots 
    ORDER BY snapshot_date DESC 
    LIMIT 1
),
previous AS (
    SELECT snapshot_data 
    FROM database_snapshots 
    ORDER BY snapshot_date DESC 
    OFFSET 1 LIMIT 1
)
SELECT 
    'Tables' as metric,
    (latest.snapshot_data->'summary'->>'total_tables')::int as latest_count,
    (previous.snapshot_data->'summary'->>'total_tables')::int as previous_count,
    (latest.snapshot_data->'summary'->>'total_tables')::int - 
    (previous.snapshot_data->'summary'->>'total_tables')::int as difference
FROM latest, previous

UNION ALL

SELECT 
    'Functions' as metric,
    (latest.snapshot_data->'summary'->>'total_functions')::int,
    (previous.snapshot_data->'summary'->>'total_functions')::int,
    (latest.snapshot_data->'summary'->>'total_functions')::int - 
    (previous.snapshot_data->'summary'->>'total_functions')::int
FROM latest, previous;
```

---

## 🔍 PARSE THE JSON

### **Using JavaScript:**

```javascript
// Load the snapshot
const snapshot = require('./database_snapshot_2025-11-04.json');

// Get summary
console.log('Total Tables:', snapshot.summary.total_tables);
console.log('Total Functions:', snapshot.summary.total_functions);

// List all tables
snapshot.tables.forEach(table => {
    console.log(`${table.table_name}: ${table.column_count} columns, ${table.table_size}`);
});

// Find tables without RLS
const unsecured = snapshot.security.tables_without_rls;
console.log('Tables without RLS:', unsecured);

// Find unused indexes
snapshot.performance.unused_indexes.forEach(idx => {
    console.log(`Unused: ${idx.table_name}.${idx.index_name}`);
});
```

---

### **Using Python:**

```python
import json

# Load the snapshot
with open('database_snapshot_2025-11-04.json', 'r') as f:
    snapshot = json.load(f)

# Get summary
print(f"Total Tables: {snapshot['summary']['total_tables']}")
print(f"Total Functions: {snapshot['summary']['total_functions']}")

# List all tables
for table in snapshot['tables']:
    print(f"{table['table_name']}: {table['column_count']} columns")

# Security analysis
print(f"RLS Coverage: {snapshot['security']['rls_coverage_percent']}%")
print(f"Unsecured tables: {snapshot['security']['tables_without_rls']}")
```

---

## 📈 TRACK CHANGES OVER TIME

### **Create Monthly Snapshots:**

```sql
-- Run this on the 1st of each month
INSERT INTO database_snapshots (snapshot_data, notes)
SELECT 
    -- (snapshot query)
    'Monthly snapshot - ' || TO_CHAR(NOW(), 'YYYY-MM');
```

### **View Growth Trend:**

```sql
SELECT 
    snapshot_date,
    snapshot_data->'summary'->>'total_tables' as tables,
    snapshot_data->'summary'->>'total_functions' as functions,
    snapshot_data->'summary'->>'total_indexes' as indexes,
    snapshot_data->'summary'->>'database_size' as size
FROM database_snapshots
ORDER BY snapshot_date;
```

---

## 📊 GENERATE REPORTS

### **Security Report:**

```sql
SELECT 
    snapshot_date,
    snapshot_data->'security'->>'rls_coverage_percent' as rls_coverage,
    snapshot_data->'security'->>'tables_with_rls' as secured_tables,
    snapshot_data->'security'->'tables_without_rls' as unsecured_tables
FROM database_snapshots
ORDER BY snapshot_date DESC;
```

### **Performance Report:**

```sql
SELECT 
    snapshot_date,
    snapshot_data->'performance'->>'total_indexes' as total_indexes,
    jsonb_array_length(snapshot_data->'performance'->'unused_indexes') as unused_indexes,
    jsonb_array_length(snapshot_data->'performance'->'most_used_indexes') as used_indexes
FROM database_snapshots
ORDER BY snapshot_date DESC;
```

---

## 🎯 BEST PRACTICES

### **1. Regular Snapshots:**
- **Daily:** During active development
- **Weekly:** During stable periods
- **Monthly:** For long-term tracking
- **Before/After:** Major migrations

### **2. Add Notes:**
```sql
INSERT INTO database_snapshots (snapshot_data, notes)
VALUES (
    -- snapshot data
    'Before courier credentials migration'
);
```

### **3. Clean Old Snapshots:**
```sql
-- Keep last 30 days only
DELETE FROM database_snapshots
WHERE snapshot_date < NOW() - INTERVAL '30 days';
```

### **4. Export for Backup:**
```bash
# Export all snapshots
pg_dump -t database_snapshots > snapshots_backup.sql
```

---

## ✅ WHAT YOU CAN DO NOW

### **Immediate Actions:**

1. **Save Today's Snapshot:**
   - Copy the JSON from Supabase
   - Save as `database_snapshot_2025-11-04.json`
   - Commit to git

2. **Create Snapshots Table:**
   - Run the CREATE TABLE script above
   - Insert today's snapshot
   - Set up monthly cron job

3. **Generate Reports:**
   - Security report (RLS coverage)
   - Performance report (index usage)
   - Growth report (table/function counts)

4. **Documentation:**
   - Parse JSON to generate docs
   - Create architecture diagrams
   - Update technical specs

---

## 🎉 SUCCESS!

You now have:
- ✅ Complete database snapshot
- ✅ All metadata captured
- ✅ JSON format (easy to parse)
- ✅ Ready for analysis
- ✅ Ready for comparison
- ✅ Ready for documentation

**Your database is fully documented!** 📸

---

*Generated: November 4, 2025, 8:35 PM*  
*Snapshot Size: ~384KB*  
*Status: Complete and verified* ✅
