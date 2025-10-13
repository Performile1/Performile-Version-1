# 🧪 Testing Guide - Checkout Analytics Integration

**Feature:** Shopify Plugin Checkout Position Tracking  
**Status:** Ready for Testing  
**Date:** October 13, 2025

---

## ✅ **What Was Implemented**

### **Shopify Plugin Changes:**
1. ✅ Added session ID generation
2. ✅ Added cart/order data hooks (`useCartLines`, `useTotalAmount`)
3. ✅ Created `trackCourierDisplay()` function
4. ✅ Created `trackCourierSelection()` function
5. ✅ Track all couriers on display
6. ✅ Track selection with `was_selected = true`
7. ✅ Capture order value, items count, package weight
8. ✅ Capture delivery address (postal code, city, country)
9. ✅ Prevent duplicate tracking with `useRef`

### **Backend Changes:**
1. ✅ Made `/track` endpoint public (no auth required)
2. ✅ Added Shopify domains to CORS whitelist
3. ✅ Added WooCommerce/WordPress to CORS whitelist

---

## 🚀 **Testing Steps**

### **Prerequisites:**

1. **Backend Running:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Database Schema Deployed:**
   - Run `courier-checkout-analytics-FRESH.sql` in Supabase
   - Verify tables exist: `courier_checkout_positions`, `courier_position_history`

3. **Shopify Plugin Configured:**
   - `merchant_id` set in plugin settings
   - `api_url` points to your backend

---

### **Test 1: Display Tracking** ✅

**Objective:** Verify all couriers are tracked when displayed

**Steps:**
1. Open Shopify test store
2. Add items to cart
3. Go to checkout
4. Enter shipping address with valid postal code
5. Wait for couriers to load

**Expected Result:**
- 3 couriers displayed
- 3 records in database with `was_selected = false`
- Positions are 1, 2, 3
- Same `checkout_session_id` for all 3

**Verify in Database:**
```sql
SELECT 
  position_shown,
  courier_id,
  was_selected,
  checkout_session_id,
  order_value,
  items_count,
  package_weight_kg,
  delivery_postal_code,
  created_at
FROM courier_checkout_positions
ORDER BY created_at DESC
LIMIT 10;
```

**Success Criteria:**
- ✅ 3 records created
- ✅ `position_shown` = 1, 2, 3
- ✅ `was_selected` = false for all
- ✅ `checkout_session_id` is same for all
- ✅ `order_value` > 0
- ✅ `items_count` > 0
- ✅ `delivery_postal_code` matches address

---

### **Test 2: Selection Tracking** ✅

**Objective:** Verify selection updates `was_selected` field

**Steps:**
1. Continue from Test 1
2. Click on courier #2 (middle courier)
3. Verify selection visually

**Expected Result:**
- Courier #2 highlighted as selected
- New record created with `was_selected = true`
- Position = 2

**Verify in Database:**
```sql
SELECT 
  position_shown,
  courier_id,
  was_selected,
  checkout_session_id,
  created_at
FROM courier_checkout_positions
WHERE checkout_session_id = 'YOUR_SESSION_ID'
ORDER BY created_at;
```

**Success Criteria:**
- ✅ 4 total records (3 displays + 1 selection)
- ✅ Last record has `was_selected = true`
- ✅ Last record has `position_shown = 2`
- ✅ Same `checkout_session_id`

---

### **Test 3: Order Data Capture** ✅

**Objective:** Verify order details are captured correctly

**Steps:**
1. Add specific items to cart:
   - Product A: $50 (1 item, 2kg)
   - Product B: $30 (2 items, 1kg each)
2. Go to checkout
3. View couriers

**Expected Result:**
- `order_value` = 80.00
- `items_count` = 2 (cart lines, not quantity)
- `package_weight_kg` = 4.0 (2kg + 2kg)

**Verify in Database:**
```sql
SELECT 
  order_value,
  items_count,
  package_weight_kg,
  delivery_postal_code,
  delivery_city,
  delivery_country
FROM courier_checkout_positions
ORDER BY created_at DESC
LIMIT 1;
```

**Success Criteria:**
- ✅ `order_value` matches cart total
- ✅ `items_count` = number of cart lines
- ✅ `package_weight_kg` = total weight
- ✅ Address fields populated

---

### **Test 4: Multiple Checkouts** ✅

**Objective:** Verify different sessions have different IDs

**Steps:**
1. Complete Test 1-3
2. Open new incognito window
3. Repeat checkout process

**Expected Result:**
- Different `checkout_session_id`
- New set of records created

**Verify in Database:**
```sql
SELECT 
  DISTINCT checkout_session_id,
  COUNT(*) as records
FROM courier_checkout_positions
GROUP BY checkout_session_id
ORDER BY MAX(created_at) DESC;
```

**Success Criteria:**
- ✅ At least 2 different session IDs
- ✅ Each session has 3-4 records

---

### **Test 5: Dashboard Display** ✅

**Objective:** Verify data appears in courier dashboard

**Steps:**
1. Log in as courier (one of the tracked couriers)
2. Navigate to `/courier/checkout-analytics`
3. View dashboard

**Expected Result:**
- Summary cards show data
- Position distribution chart shows data
- Top merchants table shows merchant

**Verify:**
- ✅ Average position calculated
- ✅ Selection rate shows percentage
- ✅ Order value displayed
- ✅ Package weight displayed
- ✅ Charts render correctly

---

### **Test 6: Aggregation** ✅

**Objective:** Verify daily aggregation works

**Steps:**
1. Run aggregation function manually:
   ```sql
   SELECT aggregate_courier_position_history(CURRENT_DATE);
   ```

2. Check history table:
   ```sql
   SELECT * FROM courier_position_history
   WHERE date = CURRENT_DATE
   ORDER BY created_at DESC;
   ```

**Expected Result:**
- Records created in `courier_position_history`
- Metrics calculated correctly

**Success Criteria:**
- ✅ `avg_position` calculated
- ✅ `total_appearances` = number of displays
- ✅ `times_selected` = number of selections
- ✅ `selection_rate` = percentage
- ✅ `avg_order_value` calculated
- ✅ `avg_package_weight_kg` calculated

---

## 🐛 **Troubleshooting**

### **Issue: No records created**

**Possible Causes:**
1. `merchant_id` not set in plugin settings
2. CORS blocking requests
3. Backend not running
4. Database connection issue

**Solutions:**
1. Check plugin configuration
2. Check browser console for CORS errors
3. Verify backend is running on correct port
4. Check database connection string

---

### **Issue: Duplicate records**

**Possible Causes:**
1. Multiple re-renders triggering tracking
2. `useRef` not working correctly

**Solutions:**
1. Check `trackedCouriers` ref is preventing duplicates
2. Add more specific tracking keys

---

### **Issue: Order data is 0 or null**

**Possible Causes:**
1. Cart hooks not available
2. Products don't have weight set
3. Shopify API not returning data

**Solutions:**
1. Check Shopify API version
2. Set product weights in Shopify admin
3. Add fallback values

---

### **Issue: CORS errors**

**Possible Causes:**
1. Shopify domain not whitelisted
2. Backend CORS config not applied

**Solutions:**
1. Check `security.ts` CORS config
2. Restart backend server
3. Check request origin in browser console

---

## 📊 **Expected Data Flow**

```
Customer enters checkout
    ↓
Shopify loads courier extension
    ↓
Extension generates session ID
    ↓
Extension fetches top 3 couriers
    ↓
Extension calls /track for each (position 1, 2, 3)
    ↓
Backend saves to courier_checkout_positions
    ↓
Customer selects courier #2
    ↓
Extension calls /track (was_selected = true, position = 2)
    ↓
Backend saves selection record
    ↓
Order completes
    ↓
Daily aggregation runs (scheduled job)
    ↓
Data aggregated to courier_position_history
    ↓
Courier views dashboard
    ↓
Dashboard fetches from courier_position_history
    ↓
Charts and tables display data
```

---

## ✅ **Success Checklist**

After testing, verify:

- [ ] Display tracking works (3 records per checkout)
- [ ] Selection tracking works (`was_selected = true`)
- [ ] Order value captured correctly
- [ ] Items count captured correctly
- [ ] Package weight captured (if available)
- [ ] Delivery address captured
- [ ] Session IDs are unique per checkout
- [ ] No duplicate records
- [ ] Dashboard displays data
- [ ] Charts render correctly
- [ ] Aggregation function works
- [ ] No CORS errors
- [ ] No console errors
- [ ] Performance is acceptable (< 500ms per track)

---

## 📈 **Performance Benchmarks**

**Acceptable:**
- Track API call: < 500ms
- Display tracking: < 1s total (3 calls)
- Selection tracking: < 500ms
- No impact on checkout load time

**Monitor:**
- Database query time
- API response time
- Network latency
- Error rate

---

## 🎯 **Next Steps After Testing**

1. **If tests pass:**
   - Deploy to production
   - Monitor for 24 hours
   - Run aggregation job
   - Notify couriers

2. **If tests fail:**
   - Review error logs
   - Check database records
   - Verify configuration
   - Fix issues and retest

3. **After successful deployment:**
   - Add WooCommerce plugin
   - Add more e-commerce platforms
   - Enhance analytics features
   - Build premium features

---

**Ready to test! Follow the steps and verify each checkpoint! 🚀**
