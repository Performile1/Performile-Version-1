# 🐛 Bugs Found & Fixes - Start of Day

**Date:** October 24, 2025, 9:39 AM  
**Status:** 1 bug fixed, 2 more identified

---

## ✅ BUG 1: Claims API - Duplicate WHERE Clause (FIXED)

**File:** `api/claims/index.ts`  
**Line:** 99  
**Status:** ✅ FIXED

**Problem:**
```typescript
// Duplicate WHERE clause causing SQL syntax error
let query = `
  SELECT c.*, o.order_number, s.store_name, co.courier_name
  FROM claims c
  LEFT JOIN orders o ON c.order_id = o.order_id
  LEFT JOIN stores s ON o.store_id = s.store_id
  LEFT JOIN couriers co ON o.courier_id = co.courier_id
  WHERE 1=1          // ← First WHERE
`;

query += ` WHERE 1=1`;  // ← DUPLICATE! Causes SQL error
```

**SQL Error:**
```
syntax error at or near "WHERE"
```

**Fix Applied:**
Removed the duplicate `WHERE 1=1` line

**Result:**
✅ Claims API should now work (needs testing)

---

## 🔍 BUG 2: Analytics APIs - Missing/Wrong Column Names (LIKELY)

**Files:**
- `api/analytics/order-trends.ts`
- `api/analytics/claims-trends.ts`

**Problem:**
The APIs query columns that might not exist in the database:

### Order Trends API Issues:
```typescript
// Queries these columns from 'claims' table:
.select('created_at, status, claim_type, claim_amount, approved_amount, resolved_at, courier_id, merchant_id')
```

**Potential Issues:**
- ❌ Column `status` might be `claim_status`
- ❌ Column `claim_amount` might be `claimed_amount`
- ❌ Column `merchant_id` doesn't exist in claims table
- ❌ Column `courier_id` might not exist in claims table

### Claims Trends API Issues:
```typescript
// Queries 'claim_trends' materialized view (probably doesn't exist)
.from('claim_trends')

// Falls back to claims table with wrong columns
```

**Investigation Needed:**
1. Check actual claims table schema in Supabase
2. Verify column names match
3. Check if materialized views exist

---

## 🔍 BUG 3: Missing Test Data (LIKELY)

**Problem:**
Test users might not have any orders or claims in the database.

**Test IDs:**
- Courier: `617f3f03-ec94-415a-8400-dc5c7e29d96f`
- Merchant: `fc1a0fdb-a82c-4a83-82bb-fa7a4b4b13c9`

**Check in Supabase:**
```sql
-- Check if courier has orders
SELECT COUNT(*) FROM orders 
WHERE courier_id = '617f3f03-ec94-415a-8400-dc5c7e29d96f';

-- Check if merchant has orders
SELECT COUNT(*) FROM orders o
JOIN stores s ON o.store_id = s.store_id
WHERE s.owner_user_id = 'fc1a0fdb-a82c-4a83-82bb-fa7a4b4b13c9';

-- Check if any claims exist
SELECT COUNT(*) FROM claims;
```

**If no data:**
Need to create test orders and claims for these users.

---

## 📋 NEXT STEPS

### Step 1: Test Claims API Fix (5 min)
```bash
# Commit the fix
git add api/claims/index.ts
git commit -m "Fix duplicate WHERE clause in claims API"
git push

# Wait for Vercel deploy
# Test: https://performile-platform-main.vercel.app/api/claims?entity_type=courier&entity_id=617f3f03-ec94-415a-8400-dc5c7e29d96f
```

### Step 2: Check Database Schema (10 min)
```sql
-- Run in Supabase SQL Editor:

-- 1. Get claims table schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'claims'
ORDER BY ordinal_position;

-- 2. Check if materialized views exist
SELECT tablename FROM pg_tables 
WHERE tablename LIKE '%trend%';

-- 3. Check test data
SELECT COUNT(*) FROM orders 
WHERE courier_id = '617f3f03-ec94-415a-8400-dc5c7e29d96f';
```

### Step 3: Fix Analytics APIs Based on Schema (30 min)
- Update column names to match database
- Remove references to non-existent columns
- Test queries in Supabase first
- Deploy fixes

### Step 4: Add Test Data if Missing (15 min)
- Create sample orders for test users
- Create sample claims
- Verify APIs return data

---

## 🎯 EXPECTED RESULTS

After all fixes:
- ✅ `/api/claims` returns 200 (not 500)
- ✅ `/api/analytics/order-trends` returns data
- ✅ `/api/analytics/claims-trends` returns data or empty array
- ✅ Dashboards show analytics (not error messages)

---

## 📝 COMMIT HISTORY

1. ✅ **Fixed duplicate WHERE clause in claims API**
   - File: `api/claims/index.ts`
   - Line: 99
   - Commit: "Fix duplicate WHERE clause in claims API"

2. ⏳ **Pending: Fix analytics API column names**
   - Files: `api/analytics/order-trends.ts`, `api/analytics/claims-trends.ts`
   - Waiting for database schema check

3. ⏳ **Pending: Add test data**
   - Waiting for data check results

---

**Status:** 1/3 bugs fixed, 2 pending investigation 🔧
