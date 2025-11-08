# MIGRATION FIXES - COLUMN NAME ERRORS

**Date:** November 8, 2025, 3:24 PM  
**Status:** ✅ **FIXED**

---

## 🐛 ERRORS ENCOUNTERED

### **Error 1: Immutability Error**
```
ERROR: 42P17: functions in index predicate must be marked IMMUTABLE
```

**Location:** Line 148 of V2 migration  
**Cause:** `NOW()` function in index WHERE clause  
**Fix:** Removed WHERE clause from index

---

### **Error 2: Column Not Found**
```
ERROR: 42703: column orders.merchant_id does not exist
```

**Location:** Line 257 of V2 migration (RLS policy)  
**Cause:** Referenced non-existent `merchant_id` column  
**Fix:** Use `store_id` + `owner_user_id` instead

---

## 🔧 FIXES APPLIED

### **Fix 1: Index Predicate (2:05 PM)**

**Before:**
```sql
CREATE INDEX idx_tracking_cache_expires 
    ON courier_tracking_cache(expires_at) 
    WHERE expires_at > NOW();  -- ❌ NOW() not immutable
```

**After:**
```sql
CREATE INDEX idx_tracking_cache_expires 
    ON courier_tracking_cache(expires_at);  -- ✅ No WHERE clause
```

**Reason:** PostgreSQL doesn't allow non-immutable functions in index predicates.

---

### **Fix 2: RLS Policy (3:24 PM)**

**Before:**
```sql
CREATE POLICY "Users can view tracking cache"
    ON courier_tracking_cache FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.order_id = courier_tracking_cache.order_id
            AND (
                orders.merchant_id = auth.uid()  -- ❌ Column doesn't exist
                OR orders.customer_id = auth.uid()
                ...
            )
        )
    );
```

**After:**
```sql
CREATE POLICY "Users can view tracking cache"
    ON courier_tracking_cache FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM orders o
            LEFT JOIN stores s ON o.store_id = s.store_id  -- ✅ Join stores
            WHERE o.order_id = courier_tracking_cache.order_id
            AND (
                s.owner_user_id = auth.uid()  -- ✅ Merchant owns store
                OR o.customer_id = auth.uid()  -- ✅ Customer placed order
                ...
            )
        )
    );
```

**Reason:** Orders table doesn't have `merchant_id`. It has `store_id` which links to stores table with `owner_user_id`.

---

## 📊 DATABASE SCHEMA REFERENCE

### **Orders Table Structure:**
```sql
orders (
  order_id UUID,
  store_id UUID,          -- ✅ Links to stores
  courier_id UUID,
  customer_id UUID,       -- ✅ NOT consumer_id, NOT merchant_id
  tracking_number VARCHAR(100),
  order_status VARCHAR(50),
  ...
)
```

### **Stores Table Structure:**
```sql
stores (
  store_id UUID,
  owner_user_id UUID,     -- ✅ This is the merchant
  store_name VARCHAR(255),
  ...
)
```

### **Relationship:**
```
orders.store_id → stores.store_id
stores.owner_user_id → users.user_id (merchant)
orders.customer_id → users.user_id (customer)
```

---

## ✅ VERIFICATION

### **Test RLS Policy:**
```sql
-- As merchant (should see their orders)
SET LOCAL app.user_id = '<merchant_user_id>';
SET LOCAL app.user_role = 'merchant';

SELECT * FROM courier_tracking_cache ctc
WHERE EXISTS (
    SELECT 1 FROM orders o
    LEFT JOIN stores s ON o.store_id = s.store_id
    WHERE o.order_id = ctc.order_id
    AND s.owner_user_id = '<merchant_user_id>'
);
```

### **Test Index:**
```sql
-- Should use index efficiently
EXPLAIN ANALYZE
SELECT * FROM courier_tracking_cache
WHERE expires_at > NOW()
ORDER BY expires_at;
```

---

## 📋 LESSONS LEARNED

### **1. Always Validate Column Names:**
- ❌ Don't assume `merchant_id` exists
- ✅ Check actual schema first
- ✅ Use `store_id` + `owner_user_id` pattern

### **2. Index Predicates Must Be Immutable:**
- ❌ Can't use `NOW()`, `RANDOM()`, etc.
- ✅ Use simple column comparisons
- ✅ Or no WHERE clause at all

### **3. Follow Existing Schema Patterns:**
- Orders → Stores → Users (merchant)
- Orders → Users (customer)
- Not direct merchant_id on orders

---

## 🚀 MIGRATION STATUS

**File:** `database/migrations/2025-11-08_postnord_tracking_integration_v2.sql`

**Fixes Applied:**
- ✅ Removed `NOW()` from index predicate
- ✅ Fixed RLS policy to use `store_id` + `owner_user_id`
- ✅ Committed and pushed

**Ready to Run:**
```bash
psql $DATABASE_URL -f database/migrations/2025-11-08_postnord_tracking_integration_v2.sql
```

**Expected Output:**
```
✅ orders table exists
✅ tracking_events table exists
✅ courier_api_credentials table exists
✅ couriers table exists
✅ courier_metadata column added to orders table
✅ New tracking tables created
✅ Created X indexes for tracking
✅ Helper functions created
✅ Courier tracking integration migration complete!
```

---

## 🎯 NEXT STEPS

1. ✅ **Run Migration:**
   ```bash
   psql $DATABASE_URL -f database/migrations/2025-11-08_postnord_tracking_integration_v2.sql
   ```

2. ✅ **Test API Endpoints:**
   ```bash
   curl -X POST https://your-api.vercel.app/api/tracking/postnord \
     -H "Content-Type: application/json" \
     -d '{"shipmentId": "ABC123", "orderId": "uuid"}'
   ```

3. ✅ **Verify RLS Works:**
   - Test as merchant (should see own orders)
   - Test as customer (should see own orders)
   - Test as admin (should see all)

---

**Status:** 🟢 **ALL FIXES APPLIED - READY TO RUN MIGRATION**
