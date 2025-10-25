# 🧪 Test Order-Trends API - October 25, 2025

## 📋 Test Instructions

### **Method 1: Browser Test (Recommended)**

1. **Open Merchant Dashboard:**
   - URL: https://performile-platform-main.vercel.app/#/dashboard
   - Login: merchant@performile.com
   - Password: (your password)

2. **Open DevTools:**
   - Press F12
   - Go to **Network** tab
   - Filter by "order-trends"

3. **Refresh the page**

4. **Check the order-trends request:**
   - Look for: `order-trends?entity_type=merchant&entity_id=fc1a0fdb-a82c-4a83-82bb-fa7a4b4b13c9&period=30d`
   - Status should be: **200** (not 500)
   - Click on it → **Response** tab

5. **Expected Response:**
   ```json
   {
     "success": true,
     "data": [
       {
         "date": "2025-10-14",
         "total_orders": 1,
         "delivered_orders": 1,
         "in_transit_orders": 0,
         "pending_orders": 0,
         "cancelled_orders": 0,
         "avg_order_value": 123.45
       },
       // ... more days
     ],
     "meta": {
       "entity_type": "merchant",
       "entity_id": "fc1a0fdb-a82c-4a83-82bb-fa7a4b4b13c9",
       "period": "30d",
       "tier": "tier1",
       "days_returned": 10,
       "source": "materialized_view"
     }
   }
   ```

6. **Check Dashboard:**
   - Should see order trends chart
   - No "Failed to load order trends" error

---

### **Method 2: Direct API Test (cURL)**

```bash
# Replace YOUR_TOKEN with actual auth token
curl -X GET "https://performile-platform-main.vercel.app/api/analytics/order-trends?entity_type=merchant&entity_id=fc1a0fdb-a82c-4a83-82bb-fa7a4b4b13c9&period=30d" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### **Method 3: Postman/Insomnia**

**Request:**
- Method: GET
- URL: `https://performile-platform-main.vercel.app/api/analytics/order-trends`
- Query Params:
  - `entity_type`: merchant
  - `entity_id`: fc1a0fdb-a82c-4a83-82bb-fa7a4b4b13c9
  - `period`: 30d
- Headers:
  - `Authorization`: Bearer YOUR_TOKEN

---

## ✅ Success Criteria

**API is working if:**
- ✅ Status code: 200 (not 500)
- ✅ Response has `"success": true`
- ✅ Data array has 10+ entries (we verified merchant has orders)
- ✅ Dashboard shows order trends chart
- ✅ No error messages in console

**API is still broken if:**
- ❌ Status code: 500
- ❌ Response has `"success": false`
- ❌ Dashboard shows "Failed to load order trends"
- ❌ Console shows errors

---

## 🔍 If Still Failing

### **Check Console Logs:**
Look for our debug messages:
- "Could not fetch subscription tier: ..."
- "Auth error (non-fatal): ..."

### **Check Response Error:**
If status 500, check response body:
```json
{
  "success": false,
  "error": "...",
  "details": "..."
}
```

### **Check Vercel Logs:**
1. Go to Vercel dashboard
2. Select project
3. Go to Functions
4. Find `order-trends` function
5. Check logs for errors

---

## 📊 Expected Data

Based on our database check yesterday:
- Merchant has 20 orders
- Date range: 2025-09-25 to 2025-10-14
- Should return ~20 days of data
- Each day should have 1 order

---

## 🐛 Troubleshooting

### **Issue: Still getting 500 error**

**Possible causes:**
1. Subscription tier lookup still failing
2. Materialized view data format issue
3. Date parsing error
4. Auth token invalid

**Next steps:**
1. Share the exact error message
2. Check Vercel function logs
3. May need to add more error handling

### **Issue: Returns empty data**

**Possible causes:**
1. Entity ID mismatch
2. Date range issue
3. Materialized view not refreshed

**Fix:**
```sql
-- Refresh materialized view
REFRESH MATERIALIZED VIEW order_trends;
```

---

## 📝 Test Results Template

**Date:** October 25, 2025
**Time:** 
**Tester:** 

**Status Code:** 
**Success:** Yes / No
**Data Returned:** Yes / No / Empty
**Days Returned:** 
**Source:** materialized_view / direct_query / no_data
**Dashboard Working:** Yes / No

**Error Message (if any):**
```
[paste error here]
```

**Console Logs:**
```
[paste console logs here]
```

**Next Steps:**
- [ ] If working: Mark as complete, move to next task
- [ ] If failing: Share error details for debugging
