# 🔧 SUBSCRIPTION DISPLAY ISSUES - FIXES

**Date:** October 21, 2025, 10:23 PM  
**Issues:** Admin view shows cards, Public/Merchant views show "Failed to load subscription"

---

## 🐛 ISSUE 1: Admin View Shows Card Layout

**Problem:** Admin sees cards with "Edit/Deactivate" buttons instead of a clean table view.

**Current File:** `apps/web/src/pages/admin/SubscriptionManagement.tsx`

**What You See:**
- Cards with pricing
- Edit/Deactivate buttons
- Not ideal for admin management

**What You Want:**
- Clean table view
- Easy editing
- Professional admin interface

**Solution:** Use `AdminSubscriptionsSettings.tsx` instead - it has the table view!

**File:** `apps/web/src/components/settings/admin/AdminSubscriptionsSettings.tsx`

This component has:
- ✅ Clean table layout
- ✅ Merchant/Courier tabs
- ✅ Edit dialog
- ✅ Professional admin UI

---

## 🐛 ISSUE 2: Public/Merchant View Shows "Failed to load subscription"

**Problem:** Frontend can't fetch subscription plans

**Root Causes:**

### **Cause A: Column Name Mismatch**

**Database has:** `subscription_plan_id`  
**Frontend expects:** `plan_id`

**Files Affected:**
- `apps/web/src/components/settings/admin/AdminSubscriptionsSettings.tsx` (line 33)
- `apps/web/src/pages/admin/SubscriptionManagement.tsx`

### **Cause B: Wrong API Endpoint**

**Frontend calls:** `/admin/subscription-plans`  
**Should call:** `/subscriptions/public` (for public view)

### **Cause C: API Response Format**

**API returns:**
```json
{
  "success": true,
  "plans": [...],
  "count": 7
}
```

**Frontend expects:**
```json
{
  "plans": [...]
}
```

---

## ✅ FIXES NEEDED

### **Fix 1: Update Database Column Name in API**

The API should use `subscription_plan_id` (your actual column name):

**File:** `api/admin/subscription-plans.ts`

Change:
```typescript
plan_id,  // ❌ WRONG
```

To:
```typescript
subscription_plan_id as plan_id,  // ✅ CORRECT - alias it
```

### **Fix 2: Use Correct Public Endpoint**

**For Public/Merchant Views:**

Change from:
```typescript
const response = await apiClient.get('/admin/subscription-plans');
```

To:
```typescript
const response = await apiClient.get('/subscriptions/public');
```

### **Fix 3: Handle API Response Format**

The public API returns `response.data.plans`, not just `response.data`:

```typescript
// ✅ CORRECT
const response = await apiClient.get('/subscriptions/public');
setPlans(response.data.plans);  // Note: .plans
```

---

## 📋 QUICK FIX CHECKLIST

### **For Admin View (Remove Cards):**
- [ ] Use `AdminSubscriptionsSettings.tsx` component
- [ ] Remove `SubscriptionManagement.tsx` (has cards)
- [ ] Update admin route to use table component

### **For Public/Merchant View (Fix "Failed to load"):**
- [ ] Update API to alias `subscription_plan_id` as `plan_id`
- [ ] Change frontend to call `/subscriptions/public`
- [ ] Handle `response.data.plans` correctly
- [ ] Add error handling for missing data

---

## 🎯 RECOMMENDED SOLUTION

### **Step 1: Check Your Database Column Name**

```sql
-- Run this in Supabase
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'subscription_plans' 
  AND column_name LIKE '%plan_id%';
```

**Expected Result:**
- `subscription_plan_id` (PRIMARY KEY)

### **Step 2: Update API to Alias Column**

**File:** `api/admin/subscription-plans.ts` (line 43)

```typescript
SELECT 
  subscription_plan_id as plan_id,  // ✅ Add alias
  plan_name,
  plan_slug,
  // ... rest of columns
```

### **Step 3: Update Public API Too**

**File:** `api/subscriptions/public.ts`

The Supabase query should work, but verify the column name:

```typescript
const { data: plans, error } = await supabase
  .from('subscription_plans')
  .select('subscription_plan_id, plan_name, plan_slug, *')  // Explicit columns
  .eq('is_active', true);
```

### **Step 4: Update Frontend to Use Public Endpoint**

**File:** `apps/web/src/pages/SubscriptionPlans.tsx` (or wherever public view is)

```typescript
// For public/merchant view
const response = await apiClient.get('/subscriptions/public');
setPlans(response.data.plans);  // Note: .plans

// For admin view
const response = await apiClient.get('/admin/subscription-plans');
setPlans(response.data.plans);  // Note: .plans
```

---

## 🔍 DEBUGGING STEPS

### **1. Check if API is Accessible**

```bash
# Test public endpoint
curl https://your-domain.vercel.app/api/subscriptions/public

# Should return:
# {"success":true,"plans":[...],"count":7}
```

### **2. Check Database Column**

```sql
-- In Supabase SQL Editor
SELECT * FROM subscription_plans LIMIT 1;
-- Look at the column names
```

### **3. Check Frontend Console**

Open browser console and look for:
- Network tab → Failed requests
- Console tab → Error messages
- Response data format

### **4. Check Environment Variables**

Make sure these are set in Vercel:
```
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...
DATABASE_URL=postgresql://...
```

---

## 🚀 IMMEDIATE ACTION

**Run this SQL to verify your schema:**

```sql
-- Check column names
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'subscription_plans'
ORDER BY ordinal_position;

-- Check if plans exist
SELECT 
    subscription_plan_id,
    plan_name,
    user_type,
    monthly_price,
    is_active
FROM subscription_plans
ORDER BY user_type, tier;
```

**Expected Output:**
```
subscription_plan_id | plan_name      | user_type | monthly_price | is_active
---------------------|----------------|-----------|---------------|----------
1                    | Starter        | merchant  | 29.00         | true
2                    | Professional   | merchant  | 79.00         | true
3                    | Enterprise     | merchant  | 199.00        | true
4                    | Basic          | courier   | 19.00         | true
5                    | Pro            | courier   | 49.00         | true
6                    | Premium        | courier   | 99.00         | true
7                    | Enterprise     | courier   | 199.00        | true
```

---

## 💡 ROOT CAUSE SUMMARY

**The issues are NOT related to the Stripe sync system.**

**They are:**
1. ✅ **Column name mismatch** - DB uses `subscription_plan_id`, frontend expects `plan_id`
2. ✅ **Wrong endpoint** - Public view calling admin endpoint
3. ✅ **Response format** - Not handling `response.data.plans` correctly

**Fix these 3 things and both issues will be resolved!**

---

**Want me to make these fixes now?** Let me know and I'll update the files! 🚀
