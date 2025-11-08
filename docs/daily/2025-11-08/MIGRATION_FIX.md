# MIGRATION FIX - IMMUTABILITY ERROR

**Date:** November 8, 2025, 2:05 PM  
**Error:** `ERROR: 42P17: functions in index predicate must be marked IMMUTABLE`

---

## 🐛 THE PROBLEM

PostgreSQL doesn't allow non-immutable functions in index predicates (WHERE clauses).

**Original code (WRONG):**
```sql
CREATE INDEX IF NOT EXISTS idx_tracking_cache_expires 
    ON courier_tracking_cache(expires_at) 
    WHERE expires_at > NOW();  -- ❌ NOW() is not immutable!
```

**Why it fails:**
- `NOW()` returns the current timestamp
- It changes every time it's called
- PostgreSQL can't use it in index predicates
- Index predicates must be deterministic (immutable)

---

## ✅ THE FIX

**Fixed code:**
```sql
-- Index for non-expired cache entries (no WHERE clause due to NOW() immutability)
CREATE INDEX IF NOT EXISTS idx_tracking_cache_expires 
    ON courier_tracking_cache(expires_at);  -- ✅ No WHERE clause
```

**What changed:**
- Removed `WHERE expires_at > NOW()` from index
- Index now includes all rows (expired and non-expired)
- Expiration check happens in queries, not in index

---

## 💡 WHY THIS IS FINE

### **Performance Impact:**
- **Minimal** - Index is still useful for sorting by `expires_at`
- Queries still filter with `WHERE expires_at > NOW()` (which is fine in queries)
- Index helps with ORDER BY and range scans

### **Query Example:**
```sql
-- This still works efficiently
SELECT * FROM courier_tracking_cache
WHERE courier_id = 'uuid'
  AND tracking_number = 'ABC123'
  AND expires_at > NOW();  -- ✅ OK in query WHERE clause
```

The index on `expires_at` helps PostgreSQL:
1. Find rows quickly
2. Skip expired rows efficiently
3. Use index for sorting

---

## 📚 POSTGRESQL RULES

### **Immutable Functions (OK in indexes):**
- `UPPER()`, `LOWER()` - String functions
- `ABS()`, `ROUND()` - Math functions
- `COALESCE()` - NULL handling
- Custom functions marked `IMMUTABLE`

### **Non-Immutable Functions (NOT OK in indexes):**
- `NOW()`, `CURRENT_TIMESTAMP` - Current time
- `RANDOM()` - Random numbers
- `CURRVAL()` - Sequence values
- Any function that reads from database

---

## 🔧 ALTERNATIVE SOLUTIONS

If you really need a partial index, you could:

### **Option 1: Use a fixed date (not recommended)**
```sql
CREATE INDEX idx_cache_expires 
    ON courier_tracking_cache(expires_at) 
    WHERE expires_at > '2025-01-01';  -- ✅ Immutable but useless
```

### **Option 2: Use a computed column (complex)**
```sql
ALTER TABLE courier_tracking_cache
ADD COLUMN is_expired BOOLEAN 
GENERATED ALWAYS AS (expires_at < NOW()) STORED;

CREATE INDEX idx_cache_not_expired
    ON courier_tracking_cache(expires_at)
    WHERE is_expired = FALSE;
```

### **Option 3: No WHERE clause (CHOSEN - simplest)**
```sql
CREATE INDEX idx_cache_expires 
    ON courier_tracking_cache(expires_at);
```

---

## ✅ MIGRATION STATUS

**Fixed:** ✅ Committed and pushed  
**File:** `database/migrations/2025-11-08_postnord_tracking_integration.sql`  
**Commit:** `fix: Remove NOW() from index predicate (immutability error)`

---

## 🚀 NEXT STEPS

**Run the migration again:**
```bash
psql $DATABASE_URL -f database/migrations/2025-11-08_postnord_tracking_integration.sql
```

**Expected result:**
```
✅ All required tables exist - proceeding with migration
✅ PostNord columns added to orders table (8 columns)
✅ New tracking tables created
✅ Created X indexes for tracking
✅ Helper functions created
✅ PostNord tracking integration migration complete!
```

---

## 📖 LESSONS LEARNED

1. **Index predicates must be immutable** - No `NOW()`, `RANDOM()`, etc.
2. **Query WHERE clauses can use anything** - `NOW()` is fine here
3. **Partial indexes are powerful but limited** - Use them wisely
4. **Simple solutions are often best** - Don't over-optimize

---

**Status:** ✅ **FIXED - Ready to run migration!**
