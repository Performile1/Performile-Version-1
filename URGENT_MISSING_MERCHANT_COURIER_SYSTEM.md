# 🚨 URGENT: Missing Merchant Courier Selection System

**Date:** October 31, 2025  
**Priority:** CRITICAL  
**Status:** ❌ NOT DEPLOYED

---

## 🔍 PROBLEM IDENTIFIED:

The **merchant courier selection system** exists in code but **NOT in the database!**

### **What's Missing:**
1. ✅ Frontend UI exists (`MerchantCourierSettings.tsx`)
2. ✅ API endpoint exists (`/api/couriers/merchant-preferences`)
3. ❌ **Database table MISSING** (`merchant_courier_selections`)
4. ❌ **Database view MISSING** (`vw_merchant_courier_preferences`)
5. ❌ **Database functions MISSING** (subscription limits, courier management)

### **Impact:**
- ❌ Merchants **CANNOT** select which couriers they use
- ❌ Shopify extension **CANNOT** fetch merchant-specific couriers
- ❌ Platform **CANNOT** enforce subscription limits
- ❌ Courier ratings **CANNOT** be filtered by merchant preferences

---

## ✅ SOLUTION:

Apply the migration file:
```
database/migrations/2025-10-31_merchant_courier_selections.sql
```

### **How to Apply:**

#### **Option 1: Supabase SQL Editor (RECOMMENDED)**
1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Open the file: `database/migrations/2025-10-31_merchant_courier_selections.sql`
3. Copy the entire contents
4. Paste into Supabase SQL Editor
5. Click **RUN**
6. Verify all items show ✅ CREATED

#### **Option 2: Command Line (if psql installed)**
```bash
psql $DATABASE_URL -f database/migrations/2025-10-31_merchant_courier_selections.sql
```

---

## 📋 WHAT THIS MIGRATION CREATES:

### **1. Table: `merchant_courier_selections`**
Stores which couriers each merchant has selected:
- `merchant_id` - Which merchant
- `courier_id` - Which courier
- `display_order` - Order to show in checkout
- `is_active` - Enable/disable courier
- `custom_name` - Merchant can rename courier
- `priority_level` - 0=normal, 1=recommended, 2=premium

### **2. View: `vw_merchant_courier_preferences`**
Joins merchant selections with courier data and ratings:
- Courier details (name, logo, code)
- Trust scores and ratings
- Total deliveries
- Reliability scores

### **3. Function: `get_merchant_subscription_info()`**
Returns merchant's subscription limits and current usage:
```json
{
  "subscription": {
    "plan_name": "Professional",
    "tier": 2,
    "max_couriers": 10,
    "max_shops": 5,
    "has_api_access": true
  },
  "usage": {
    "couriers_selected": 3,
    "shops_created": 2,
    "can_add_courier": true
  }
}
```

### **4. Function: `get_available_couriers_for_merchant()`**
Returns all couriers with selection status:
- All active couriers
- Which ones merchant has selected
- Trust scores and ratings
- Whether merchant can add more (based on subscription)

### **5. RLS Policies**
- Merchants can only see/edit their own selections
- Admins can see all selections

---

## 🧪 HOW TO TEST AFTER APPLYING:

### **1. Verify Migration Applied:**
```sql
-- Check table exists
SELECT * FROM merchant_courier_selections LIMIT 1;

-- Check view exists
SELECT * FROM vw_merchant_courier_preferences LIMIT 1;

-- Check functions exist
SELECT get_merchant_subscription_info('YOUR_MERCHANT_ID');
SELECT * FROM get_available_couriers_for_merchant('YOUR_MERCHANT_ID');
```

### **2. Test in Frontend:**
1. Log in as a merchant
2. Go to: **Settings → Couriers**
3. You should see:
   - List of available couriers
   - "Add Courier" button
   - Subscription limits displayed
   - Selected couriers with toggle switches

### **3. Test API Endpoint:**
```bash
curl -X POST https://YOUR_DOMAIN/api/couriers/merchant-preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "get_selected_couriers"}'
```

Should return:
```json
{
  "success": true,
  "couriers": [...]
}
```

---

## 🔗 RELATED FILES:

### **Frontend:**
- `apps/web/src/pages/settings/MerchantCourierSettings.tsx`
- `apps/web/src/components/settings/merchant/CouriersSettings.tsx`

### **Backend:**
- `api/couriers/merchant-preferences.ts`

### **Database:**
- `database/migrations/2025-10-31_merchant_courier_selections.sql` ← **APPLY THIS!**
- `database/archive/old-migrations/merchant-courier-selection-with-limits.sql` (original, archived)

---

## 🎯 NEXT STEPS AFTER APPLYING:

1. ✅ Apply the migration
2. ✅ Verify tables/functions created
3. ✅ Test merchant courier selection UI
4. ✅ Add some test courier selections
5. ✅ Update Shopify extension to fetch merchant-specific couriers
6. ✅ Test end-to-end flow

---

## 🚀 FOR SHOPIFY EXTENSION:

Once this is applied, update the Shopify extension to fetch couriers based on merchant:

```javascript
// Instead of showing all couriers
const response = await fetch(`${apiBaseUrl}/couriers/ratings-by-postal?postal_code=${postalCode}`);

// Fetch merchant-specific couriers
const response = await fetch(`${apiBaseUrl}/couriers/merchant-preferences`, {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${merchantApiKey}`
  },
  body: JSON.stringify({ action: 'get_selected_couriers' })
});
```

---

**APPLY THIS MIGRATION IMMEDIATELY TO UNBLOCK THE SHOPIFY APP!** 🚨
