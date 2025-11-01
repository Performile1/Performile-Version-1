# DEPLOYMENT PLAN - November 1, 2025

**Status:** Ready to Deploy  
**Priority:** High (blocking Shopify + Ranking features)

---

## **📋 What Needs to be Deployed**

### **1. Shopify Checkout Analytics (HIGH PRIORITY)**

**Missing Tables:**
- ❌ `checkout_courier_analytics`
- ❌ `courier_checkout_positions`

**Deploy:**
```sql
database/CREATE_CHECKOUT_ANALYTICS_TABLE.sql
```

**Purpose:**
- Track which couriers are shown in Shopify checkout
- Track which couriers are selected
- Calculate conversion rates
- Feed into dynamic ranking

**Impact:** Enables Shopify checkout analytics tracking

---

### **2. Dynamic Ranking System (MEDIUM PRIORITY)**

**Missing Tables:**
- ❌ `courier_ranking_scores`
- ❌ `courier_ranking_history`

**Deploy:**
```sql
database/CREATE_DYNAMIC_RANKING_TABLES.sql
database/CREATE_RANKING_FUNCTIONS.sql
```

**Purpose:**
- Self-optimizing courier ranking
- Performance-based positioning
- Geographic-specific rankings
- Historical trend tracking

**Impact:** Enables data-driven courier ranking

---

### **3. TrustScore Functions (MEDIUM PRIORITY)**

**Missing Functions:**
- ❌ `calculate_courier_trustscore()`
- ❌ `update_courier_trustscore_cache()`
- ❌ `refresh_all_trustscores()`
- ❌ `trigger_trustscore_update()`

**Deploy:**
```sql
database/functions/trustscore_functions.sql
```

**Purpose:**
- Automated TrustScore calculation
- Auto-update on new reviews
- Batch recalculation

**Impact:** Automated TrustScore management

---

### **4. Tracking Data Population (IMMEDIATE)**

**Already Created, Need to Run:**
```sql
database/ADD_MISSING_TRACKING_COLUMNS.sql
database/POPULATE_MISSING_TRACKING_DATA.sql
```

**Purpose:**
- Add 15 tracking columns to orders
- Populate existing data
- Enable complete analytics

**Impact:** Complete order tracking data

---

## **🚀 Deployment Order**

### **Step 1: Add Tracking Columns (5 min)**
```sql
-- Run in Supabase SQL Editor
database/ADD_MISSING_TRACKING_COLUMNS.sql
database/POPULATE_MISSING_TRACKING_DATA.sql
```

**Verify:**
```sql
SELECT COUNT(*) FROM orders WHERE delivery_postal_code IS NOT NULL;
-- Should show all orders have postal codes
```

---

### **Step 2: Deploy Shopify Analytics (10 min)**
```sql
-- Run in Supabase SQL Editor
database/CREATE_CHECKOUT_ANALYTICS_TABLE.sql
```

**Verify:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'checkout_courier_analytics';
-- Should return 1 row
```

**Then Deploy Shopify App:**
1. Uninstall app from Shopify Admin
2. Run: `npm run shopify app deploy`
3. Reinstall app and approve new scopes
4. Configure extension settings (api_url, merchant_id)

---

### **Step 3: Deploy TrustScore Functions (5 min)**
```sql
-- Run in Supabase SQL Editor
database/functions/trustscore_functions.sql
```

**Verify:**
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_name LIKE '%trustscore%';
-- Should show 4 functions
```

**Test:**
```sql
SELECT calculate_courier_trustscore(courier_id) 
FROM couriers LIMIT 1;
-- Should return a score 0-100
```

---

### **Step 4: Deploy Ranking System (10 min)**
```sql
-- Run in Supabase SQL Editor
database/CREATE_DYNAMIC_RANKING_TABLES.sql
database/CREATE_RANKING_FUNCTIONS.sql
```

**Verify:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'courier_ranking%';
-- Should return 2 rows
```

**Test:**
```sql
SELECT update_courier_ranking_scores();
-- Should calculate rankings for all couriers
```

---

## **⚠️ Important Notes**

### **Don't Deploy:**
- ❌ `merchants` table - Not needed (using stores.owner_user_id)
- ❌ `couriertrustscore` / `couriertrustscores` - Duplicates (trustscorecache exists)

### **Already Deployed:**
- ✅ `trustscorecache` - TrustScore cache exists
- ✅ `courier_analytics` - Analytics table exists
- ✅ Core tables (users, couriers, stores, orders, reviews)

---

## **📊 Expected Results**

**After Deployment:**
- ✅ Shopify checkout analytics working
- ✅ TrustScore auto-calculating
- ✅ Dynamic ranking active
- ✅ Complete order tracking
- ✅ All 15 tracking columns populated

**Tables:**
- Before: 8 critical tables
- After: 12 critical tables (4 new)

**Functions:**
- Before: ? functions
- After: 12+ functions (8 new)

---

## **🎯 Testing Checklist**

### **After Step 1 (Tracking Columns):**
- [ ] Run: `SELECT * FROM orders LIMIT 1;`
- [ ] Verify new columns exist
- [ ] Verify data is populated

### **After Step 2 (Shopify Analytics):**
- [ ] Test Shopify checkout
- [ ] Verify no 401 errors
- [ ] Check analytics table for data

### **After Step 3 (TrustScore Functions):**
- [ ] Run TrustScore calculation
- [ ] Verify trustscorecache updated
- [ ] Check courier_analytics updated

### **After Step 4 (Ranking System):**
- [ ] Run ranking calculation
- [ ] Verify ranking_scores populated
- [ ] Check ranking_history has snapshots

---

## **⏱️ Total Time Estimate**

- Step 1: 5 minutes
- Step 2: 10 minutes (+ Shopify redeploy)
- Step 3: 5 minutes
- Step 4: 10 minutes
- **Total: 30 minutes** (+ Shopify redeploy time)

---

## **🚨 Rollback Plan**

If something goes wrong:

```sql
-- Drop new tables
DROP TABLE IF EXISTS checkout_courier_analytics CASCADE;
DROP TABLE IF EXISTS courier_ranking_scores CASCADE;
DROP TABLE IF EXISTS courier_ranking_history CASCADE;

-- Drop new functions
DROP FUNCTION IF EXISTS calculate_courier_trustscore CASCADE;
DROP FUNCTION IF EXISTS update_courier_trustscore_cache CASCADE;
DROP FUNCTION IF EXISTS refresh_all_trustscores CASCADE;
DROP FUNCTION IF EXISTS trigger_trustscore_update CASCADE;

-- Revert tracking columns (if needed)
-- See: database/ROLLBACK_TRACKING_COLUMNS.sql
```

---

## **✅ Success Criteria**

**Deployment is successful when:**
1. ✅ All 4 new tables exist
2. ✅ All 8 new functions exist
3. ✅ Shopify checkout works without errors
4. ✅ TrustScore calculates automatically
5. ✅ Rankings update daily
6. ✅ All tests pass

---

**Ready to deploy?** Start with Step 1! 🚀
