# TRACKING COLUMNS ADDED TO ORDERS TABLE

**Date:** November 1, 2025, 8:13 PM  
**Status:** ✅ SQL READY - Deploy to add missing columns  
**Priority:** CRITICAL

---

## 🎯 PROBLEM IDENTIFIED

**Error:** `column "delivery_attempts" does not exist`

**Root Cause:** Orders table missing critical tracking columns needed for:
- TrustScore calculation
- Performance metrics
- On-time delivery tracking
- Issue resolution tracking

---

## ✅ SOLUTION CREATED

**File:** `database/ADD_MISSING_TRACKING_COLUMNS.sql`

**Adds 15 critical columns to `orders` table**

---

## 📊 COLUMNS ADDED

### **1. Delivery Performance** (4 columns)
- ✅ `delivery_attempts` (INTEGER) - How many tries to deliver
- ✅ `first_response_time` (INTERVAL) - Courier response speed
- ✅ `last_mile_duration` (INTERVAL) - Final delivery time
- ✅ `delivery_date` (DATE) - Actual delivery date

### **2. Issue Tracking** (4 columns)
- ✅ `issue_reported` (BOOLEAN) - Problem flagged
- ✅ `issue_resolved` (BOOLEAN) - Problem fixed
- ✅ `issue_description` (TEXT) - What went wrong
- ✅ `resolution_time` (INTERVAL) - Time to fix

### **3. Timestamps** (3 columns)
- ✅ `picked_up_at` (TIMESTAMP) - Pickup time
- ✅ `out_for_delivery_at` (TIMESTAMP) - Out for delivery
- ✅ `delivered_at` (TIMESTAMP) - Actual delivery

### **4. Location Data** (3 columns)
- ✅ `pickup_postal_code` (VARCHAR) - Where picked up
- ✅ `delivery_postal_code` (VARCHAR) - Where delivered
- ✅ `pickup_city`, `delivery_city` (VARCHAR) - City names

### **5. Planning** (2 columns)
- ✅ `estimated_delivery` (TIMESTAMP) - Promised delivery
- ✅ `tracking_number` (VARCHAR) - Tracking ID

---

## 🎯 HOW THIS FEEDS INTO TRUSTSCORE

### **TrustScore Calculation Uses:**

```sql
-- Completion Rate (20% weight)
COUNT(CASE WHEN order_status = 'delivered' THEN 1 END) / COUNT(*)

-- On-Time Rate (20% weight)
COUNT(CASE WHEN delivery_date <= estimated_delivery THEN 1 END) / COUNT(delivered)

-- Response Time (10% weight)
AVG(first_response_time) -- ✅ NEW COLUMN

-- Delivery Attempts (5% weight)
AVG(delivery_attempts) -- ✅ NEW COLUMN

-- Last Mile Performance (5% weight)
AVG(last_mile_duration) -- ✅ NEW COLUMN

-- Issue Resolution (5% weight)
COUNT(issue_resolved = true) / COUNT(issue_reported = true) -- ✅ NEW COLUMNS
```

---

## 📋 DEPLOYMENT STEPS

### **Step 1: Deploy SQL (5 min)**
```bash
# Run in Supabase SQL Editor
database/ADD_MISSING_TRACKING_COLUMNS.sql
```

**This will:**
- ✅ Add all 15 columns
- ✅ Create 6 indexes for performance
- ✅ Update existing orders with defaults
- ✅ Add column comments
- ✅ Verify everything worked

---

### **Step 2: Verify Deployment**
```sql
-- Check columns exist
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN (
    'delivery_attempts',
    'first_response_time',
    'last_mile_duration',
    'issue_reported'
  );

-- Should return 4 rows
```

---

### **Step 3: Update APIs to Collect Data**

**Order Update API** (`api/orders/[orderId]/status.ts`):
```typescript
// When courier picks up
await pool.query(`
  UPDATE orders 
  SET 
    order_status = 'in_transit',
    picked_up_at = NOW(),
    first_response_time = NOW() - created_at
  WHERE order_id = $1
`, [orderId]);

// When courier delivers
await pool.query(`
  UPDATE orders 
  SET 
    order_status = 'delivered',
    delivered_at = NOW(),
    delivery_date = CURRENT_DATE,
    delivery_attempts = $2
  WHERE order_id = $1
`, [orderId, attempts]);
```

---

### **Step 4: Test TrustScore Calculation**
```sql
-- Should now work without errors
SELECT calculate_courier_trustscore(
  (SELECT courier_id FROM couriers LIMIT 1)
);
```

---

## 🎉 BENEFITS

### **For TrustScore:**
- ✅ More accurate calculations
- ✅ Uses complete tracking data
- ✅ Rewards fast response times
- ✅ Penalizes multiple delivery attempts
- ✅ Tracks issue resolution

### **For Analytics:**
- ✅ On-time delivery rate
- ✅ Average delivery attempts
- ✅ Response time metrics
- ✅ Issue resolution rate
- ✅ Geographic performance

### **For Merchants:**
- ✅ See courier response times
- ✅ Track delivery reliability
- ✅ Monitor issue resolution
- ✅ Better courier selection

### **For Customers:**
- ✅ More accurate delivery estimates
- ✅ Better courier recommendations
- ✅ Transparent performance data

---

## 📊 DEFAULT VALUES

**For existing orders:**
- `delivery_attempts` = 1 (if delivered)
- `issue_resolved` = false (if no issue)
- `first_response_time` = calculated from pickup
- `delivery_date` = extracted from delivered_at

---

## 🔄 DATA COLLECTION GOING FORWARD

### **When Order is Created:**
```sql
INSERT INTO orders (
  ...,
  estimated_delivery,
  pickup_postal_code,
  delivery_postal_code
) VALUES (...);
```

### **When Courier Picks Up:**
```sql
UPDATE orders SET
  picked_up_at = NOW(),
  first_response_time = NOW() - created_at;
```

### **When Out for Delivery:**
```sql
UPDATE orders SET
  out_for_delivery_at = NOW();
```

### **When Delivered:**
```sql
UPDATE orders SET
  delivered_at = NOW(),
  delivery_date = CURRENT_DATE,
  delivery_attempts = ?;
```

### **If Issue Reported:**
```sql
UPDATE orders SET
  issue_reported = true,
  issue_description = ?;
```

### **When Issue Resolved:**
```sql
UPDATE orders SET
  issue_resolved = true,
  resolution_time = NOW() - (timestamp when issue was reported);
```

---

## ✅ VERIFICATION CHECKLIST

After deployment:

- [ ] All 15 columns added to orders table
- [ ] 6 indexes created
- [ ] Existing orders updated with defaults
- [ ] TrustScore calculation works without errors
- [ ] APIs updated to collect new data
- [ ] No NULL values in critical fields

---

## 🚀 NEXT STEPS

1. **Deploy SQL** (5 min) - Run ADD_MISSING_TRACKING_COLUMNS.sql
2. **Update APIs** (15 min) - Collect data in order update endpoints
3. **Test TrustScore** (5 min) - Verify calculation works
4. **Continue with dynamic ranking** - Now we have complete data!

---

*Created: November 1, 2025, 8:13 PM*  
*Status: Ready for deployment*  
*Priority: CRITICAL - Required for TrustScore*
