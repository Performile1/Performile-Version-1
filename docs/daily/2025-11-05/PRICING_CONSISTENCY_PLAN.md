# PRICING CONSISTENCY PLAN

**Date:** November 5, 2025, 1:20 PM  
**Issue:** Subscription pricing not consistent across all displays  
**Goal:** Ensure same pricing shows everywhere

---

## 🎯 APPROVED PRICING (NEW)

### **Merchant Plans:**
- **Starter:** FREE (0 NOK/month)
- **Professional:** 299 NOK/month or 2,990 NOK/year ⭐
- **Enterprise:** 999 NOK/month or 9,990 NOK/year

### **Courier Plans:**
- **Basic:** FREE (0 NOK/month)
- **Professional:** 199 NOK/month or 1,990 NOK/year ⭐
- **Fleet:** 599 NOK/month or 5,990 NOK/year

---

## 📍 WHERE PRICING IS DISPLAYED

### **1. Registration Flow** ✅
**Component:** `apps/web/src/components/onboarding/SubscriptionSelector.tsx`  
**API:** `/api/public/subscription-plans`  
**Status:** ✅ Uses database (will show correct pricing after DB update)

**Displays:**
- Plan name
- Monthly price
- Annual price (with savings)
- Description
- Features list

---

### **2. Public Pricing Page** ⚠️
**Component:** `apps/web/src/pages/Pricing.tsx`  
**API:** `/api/subscriptions/plans` (different endpoint!)  
**Status:** ⚠️ May use different data source

**Displays:**
- Plan cards
- Monthly/annual toggle
- Feature comparison
- CTA buttons

**ACTION NEEDED:** Verify this uses same database table

---

### **3. Subscription Plans Page (Logged In)** ⚠️
**Component:** `apps/web/src/pages/SubscriptionPlans.tsx`  
**API:** Unknown (uses apiClient)  
**Status:** ⚠️ May use different data source

**Displays:**
- Current plan
- Available upgrades
- Billing cycle toggle
- Upgrade buttons

**ACTION NEEDED:** Verify this uses same database table

---

### **4. Admin Subscription Management** ⚠️
**Component:** `apps/web/src/pages/admin/SubscriptionManagement.tsx`  
**API:** `/api/admin/subscriptions`  
**Status:** ⚠️ Admin can edit plans

**Displays:**
- All plans (editable)
- Create/edit/delete
- Pricing fields
- Feature configuration

**ACTION NEEDED:** Ensure admin sees same data

---

### **5. My Subscription Page** ⚠️
**Component:** `apps/web/src/pages/MySubscription.tsx`  
**API:** Unknown  
**Status:** ⚠️ Shows current subscription

**Displays:**
- Current plan details
- Current pricing
- Usage stats
- Upgrade options

**ACTION NEEDED:** Verify pricing matches

---

## 🔧 REQUIRED ACTIONS

### **Action 1: Update Database** 🔴 CRITICAL
**File:** `database/INSERT_SUBSCRIPTION_PLANS.sql`  
**What:** Run SQL to insert/update subscription plans  
**Impact:** All API endpoints will return new pricing

```sql
-- Run in Supabase SQL Editor
-- This will insert or update plans with new pricing
```

---

### **Action 2: Verify API Endpoints** 🟡 HIGH
**Check these endpoints return same data:**

1. `/api/public/subscription-plans` (public, no auth)
2. `/api/subscriptions/plans` (used by Pricing page)
3. `/api/admin/subscriptions` (admin management)

**Expected:** All should query `subscription_plans` table

---

### **Action 3: Test All Pages** 🟡 HIGH

**Test Checklist:**
- [ ] Registration page shows: FREE / 299 / 999 (merchant)
- [ ] Registration page shows: FREE / 199 / 599 (courier)
- [ ] Public pricing page matches registration
- [ ] Logged-in subscription page matches
- [ ] Admin management shows same prices
- [ ] My Subscription shows correct current price

---

### **Action 4: Update Fallback Data** 🟢 MEDIUM

**Files with hardcoded pricing:**
- `apps/web/src/pages/Pricing.tsx` (lines 77-120)
- Any other components with fallback plans

**What:** Update fallback prices to match new pricing

---

## 📊 VERIFICATION QUERIES

### **Check Current Database Pricing:**
```sql
SELECT 
  plan_name,
  user_type,
  tier,
  monthly_price,
  annual_price,
  is_active,
  is_visible
FROM subscription_plans
ORDER BY user_type, tier;
```

### **Expected Result:**
```
plan_name    | user_type | tier | monthly_price | annual_price
-------------|-----------|------|---------------|-------------
Starter      | merchant  | 1    | 0.00          | 0.00
Professional | merchant  | 2    | 299.00        | 2990.00
Enterprise   | merchant  | 3    | 999.00        | 9990.00
Basic        | courier   | 1    | 0.00          | 0.00
Professional | courier   | 2    | 199.00        | 1990.00
Fleet        | courier   | 3    | 599.00        | 5990.00
```

---

## 🚀 DEPLOYMENT STEPS

### **Step 1: Database Update**
1. Open Supabase SQL Editor
2. Run `INSERT_SUBSCRIPTION_PLANS.sql`
3. Verify with SELECT query above
4. Confirm 6 plans exist with correct pricing

### **Step 2: Test Registration**
1. Go to registration page
2. Select "Merchant"
3. Verify pricing shows: 0 / 299 / 999
4. Select "Courier"
5. Verify pricing shows: 0 / 199 / 599

### **Step 3: Test Public Pricing Page**
1. Go to `/pricing` (logged out)
2. Verify same pricing as registration
3. Toggle monthly/annual
4. Verify savings calculation correct

### **Step 4: Test Logged-In Pages**
1. Login as merchant
2. Go to subscription/plans page
3. Verify pricing matches
4. Check "My Subscription" page
5. Verify current plan shows correct price

### **Step 5: Test Admin**
1. Login as admin
2. Go to subscription management
3. Verify all 6 plans show
4. Verify pricing is correct
5. Test edit (don't save)

---

## ⚠️ POTENTIAL ISSUES

### **Issue 1: Multiple API Endpoints**
**Problem:** Different pages may use different API endpoints  
**Solution:** Ensure all endpoints query same `subscription_plans` table

### **Issue 2: Cached Data**
**Problem:** Frontend may cache old pricing  
**Solution:** Clear browser cache, hard refresh (Ctrl+Shift+R)

### **Issue 3: Hardcoded Fallbacks**
**Problem:** Some components have hardcoded fallback pricing  
**Solution:** Update fallback data to match new pricing

### **Issue 4: Stripe Integration**
**Problem:** Stripe may have different prices configured  
**Solution:** Update Stripe prices to match (if using Stripe)

---

## ✅ SUCCESS CRITERIA

- [ ] Database has 6 plans with new pricing
- [ ] Registration shows correct pricing
- [ ] Public pricing page matches
- [ ] Logged-in pages match
- [ ] Admin panel shows correct data
- [ ] No hardcoded old prices anywhere
- [ ] All API endpoints return same data

---

## 📝 NEXT STEPS

1. **YOU DECIDE:** Confirm you want to use NEW pricing (FREE / 299 / 999)
2. **I RUN:** SQL script to update database
3. **WE TEST:** All pages to verify consistency
4. **WE FIX:** Any discrepancies found
5. **WE DOCUMENT:** Final pricing in master docs

---

**Status:** ⏳ Awaiting your confirmation to proceed  
**ETA:** 30 minutes to complete all actions
