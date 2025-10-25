# 🔧 Claims Schema Fix - Column Name Mismatch

## 🚨 **Error**

```
ERROR: 42703: column "claim_status" does not exist
```

## 🔍 **Root Cause**

The claims table in your database has a different column name than expected. Possible causes:

1. **Column named "status"** instead of "claim_status"
2. **Column named "claimStatus"** (camelCase) instead of "claim_status"
3. **Column doesn't exist** at all

## 🎯 **Solution - 3 Steps**

### **Step 1: Check Current Schema (2 min)**

Run this in Supabase SQL Editor:

```sql
-- See all columns in claims table
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'claims'
ORDER BY ordinal_position;
```

**Look for status-related columns:**
- Is it `status`?
- Is it `claim_status`?
- Is it `claimStatus`?
- Does it not exist?

### **Step 2: Run Fix Script (1 min)**

Copy and run **`database/FIX_CLAIMS_SCHEMA.sql`** in Supabase SQL Editor.

This script will:
- ✅ Rename `status` → `claim_status` (if needed)
- ✅ Rename `claimStatus` → `claim_status` (if needed)
- ✅ Add `claim_status` column (if missing)
- ✅ Add constraint for valid values
- ✅ Add index for performance

### **Step 3: Re-run Migration (2 min)**

After fixing the schema, re-run the analytics function:

```sql
-- Drop old function
DROP FUNCTION IF EXISTS get_claims_trends(TEXT, UUID, DATE);
DROP FUNCTION IF EXISTS get_claims_summary(TEXT, UUID, DATE);

-- Then run the full migration again
-- Copy from: database/migrations/2025-10-25_claims_analytics_function.sql
```

---

## 📋 **Quick Fix Commands**

### **If column is named "status":**
```sql
ALTER TABLE claims RENAME COLUMN status TO claim_status;
```

### **If column is named "claimStatus":**
```sql
ALTER TABLE claims RENAME COLUMN "claimStatus" TO claim_status;
```

### **If column doesn't exist:**
```sql
ALTER TABLE claims ADD COLUMN claim_status VARCHAR(50) DEFAULT 'draft';

ALTER TABLE claims ADD CONSTRAINT valid_claim_status 
CHECK (claim_status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid', 'closed'));

CREATE INDEX idx_claims_status ON claims(claim_status);
```

---

## ✅ **Verify Fix**

Run this to confirm:

```sql
-- Should return 1 row
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'claims' 
AND column_name = 'claim_status';

-- Should work now
SELECT * FROM get_claims_trends(
  'merchant', 
  'fc1a0fdb-a82c-4a83-82bb-fa7a4b4b13c9',
  CURRENT_DATE - INTERVAL '30 days'
);
```

---

## 🤔 **Why This Happened**

**Possible reasons:**

1. **Different migration ran first** - An older migration created the table with different column names
2. **Manual table creation** - Table was created manually without following the schema
3. **Case sensitivity** - PostgreSQL is case-sensitive for quoted identifiers

---

## 📝 **Next Steps**

1. Run `CHECK_CLAIMS_SCHEMA.sql` to see current schema
2. Run `FIX_CLAIMS_SCHEMA.sql` to fix the column name
3. Re-run the analytics migration
4. Test the function

**Let me know what column name you see, and I'll help you fix it!**
