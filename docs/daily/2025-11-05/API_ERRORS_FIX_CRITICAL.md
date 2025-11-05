# API ERRORS - CRITICAL FIXES NEEDED

**Date:** November 5, 2025, 6:44 PM  
**Status:** 🔴 CRITICAL - Production Errors  
**Priority:** P0 - Fix Immediately

---

## 🚨 ERRORS DETECTED

### **1. Merchant Analytics API - 500 Error**
```
GET /api/merchant/analytics?timeRange=month&shopId=:1
Status: 500 (Internal Server Error)
```

### **2. Merchant Preferences API - 500 Error**
```
POST /api/couriers/merchant-preferences
Status: 500 (Internal Server Error)
```

### **3. My Subscription API - 404 Error**
```
GET /api/subscriptions/my-subscription
Status: 404 (Not Found)
```

---

## 🔍 ROOT CAUSES

### **Issue #1: Database Connection Pool**

**Problem:**
```typescript
// api/merchant/analytics.ts
import { getPool } from '../lib/db';
const pool = getPool();
```

**Error:** `getPool()` is trying to use PostgreSQL connection pooling, but Vercel serverless functions should use Supabase client instead.

**Why It Fails:**
- Vercel serverless functions are stateless
- Connection pooling doesn't work in serverless
- Should use Supabase client for database access

---

### **Issue #2: Missing User Subscriptions**

**Problem:**
```typescript
// api/subscriptions/my-subscription.ts
const { data: userSubscription, error: subError } = await supabase
  .from('user_subscriptions')
  .eq('user_id', user.userId)
  .eq('status', 'active')
  .single();
```

**Error:** Returns 404 because test users don't have subscriptions created yet.

**Why It Fails:**
- New users don't automatically get a subscription
- No default "Starter" plan assigned
- Registration doesn't create subscription record

---

### **Issue #3: Column Name Mismatch**

**Problem:**
```typescript
// Uses: subscription_plan_id
// Should be: plan_id (based on database schema)
```

**Why It Fails:**
- Database uses `plan_id`
- Code uses `subscription_plan_id`
- Column doesn't exist

---

## 🔧 FIXES REQUIRED

### **FIX #1: Convert Analytics API to Supabase**

**File:** `api/merchant/analytics.ts`

**Change From:**
```typescript
import { getPool } from '../lib/db';
import { withRLS } from '../lib/rls';

const pool = getPool();

// Later in code:
const result = await withRLS(pool, { userId, role }, async (client) => {
  const orderTrendsResult = await client.query(`SELECT ...`);
  // ...
});
```

**Change To:**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Later in code:
const { data: orderTrends, error } = await supabase
  .from('orders')
  .select(`
    created_at,
    total_amount,
    delivery_rating,
    shops!inner(shop_id, owner_user_id)
  `)
  .eq('shops.owner_user_id', merchantId)
  .gte('created_at', getDateRange(timeRange));
```

**Time:** 2 hours

---

### **FIX #2: Auto-Create Default Subscription**

**File:** `api/auth/register.ts` (or create new migration)

**Add to Registration:**
```typescript
// After user creation
const { data: starterPlan } = await supabase
  .from('subscription_plans')
  .select('plan_id')
  .eq('plan_slug', 'starter')
  .eq('user_type', userRole)
  .single();

if (starterPlan) {
  await supabase
    .from('user_subscriptions')
    .insert({
      user_id: newUser.user_id,
      plan_id: starterPlan.plan_id,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
}
```

**OR Create Migration:**
```sql
-- Assign default subscriptions to existing users
INSERT INTO user_subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
SELECT 
  u.user_id,
  sp.plan_id,
  'active',
  NOW(),
  NOW() + INTERVAL '30 days'
FROM users u
CROSS JOIN LATERAL (
  SELECT plan_id 
  FROM subscription_plans 
  WHERE plan_slug = 'starter' 
    AND user_type = u.user_role
  LIMIT 1
) sp
WHERE NOT EXISTS (
  SELECT 1 FROM user_subscriptions 
  WHERE user_id = u.user_id
);
```

**Time:** 1 hour

---

### **FIX #3: Fix Column Names**

**File:** `api/subscriptions/my-subscription.ts`

**Change Line 99:**
```typescript
// FROM:
.eq('subscription_plan_id', userSubscription.subscription_plan_id)

// TO:
.eq('plan_id', userSubscription.plan_id)
```

**Also Update Line 73:**
```typescript
// FROM:
subscription_plan_id,

// TO:
plan_id,
```

**Time:** 5 minutes

---

### **FIX #4: Add Error Handling & Fallbacks**

**File:** `api/subscriptions/my-subscription.ts`

**Add Fallback for No Subscription:**
```typescript
if (subError || !userSubscription) {
  console.log('No subscription found, creating default...');
  
  // Get default Starter plan
  const { data: starterPlan } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('plan_slug', 'starter')
    .eq('user_type', user.role)
    .single();

  if (starterPlan) {
    // Create default subscription
    const { data: newSub } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: user.userId,
        plan_id: starterPlan.plan_id,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    // Return default plan
    return res.status(200).json({
      success: true,
      subscription: {
        plan_name: starterPlan.plan_name,
        tier: starterPlan.tier,
        status: 'active',
        // ... rest of plan details
      }
    });
  }
  
  // If still no plan, return error
  return res.status(404).json({
    success: false,
    error: 'No subscription found'
  });
}
```

**Time:** 30 minutes

---

### **FIX #5: Merchant Preferences API**

**File:** `api/couriers/merchant-preferences.ts`

**Check for:**
1. Database connection issues
2. Missing columns
3. RLS policies blocking access

**Likely Fix:**
```typescript
// Ensure using Supabase client, not connection pool
const { data, error } = await supabase
  .from('merchant_courier_selections')
  .select('*')
  .eq('merchant_id', userId);

if (error) {
  console.error('Merchant preferences error:', error);
  return res.status(500).json({ 
    error: 'Failed to fetch preferences',
    details: error.message 
  });
}
```

**Time:** 30 minutes

---

## 📋 IMPLEMENTATION CHECKLIST

### **CRITICAL (Do Today - 30 min):**
- [ ] Fix column name in my-subscription API (5 min)
- [ ] Add error logging to all 3 APIs (10 min)
- [ ] Create default subscriptions for existing users (15 min)

### **HIGH (Tomorrow Morning - 3 hours):**
- [ ] Convert analytics API to Supabase (2 hours)
- [ ] Fix merchant-preferences API (30 min)
- [ ] Add fallback subscription creation (30 min)
- [ ] Test all APIs (30 min)

### **TESTING:**
- [ ] Test merchant analytics with real data
- [ ] Test subscription API with new user
- [ ] Test subscription API with existing user
- [ ] Test merchant preferences API
- [ ] Verify error messages are helpful

---

## 🚀 QUICK FIX (30 MINUTES)

### **Immediate Actions:**

**1. Create Default Subscriptions (15 min):**
```sql
-- Run this in Supabase SQL Editor
INSERT INTO user_subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
SELECT 
  u.user_id,
  sp.plan_id,
  'active',
  NOW(),
  NOW() + INTERVAL '365 days'
FROM users u
CROSS JOIN LATERAL (
  SELECT plan_id 
  FROM subscription_plans 
  WHERE plan_slug = 'starter' 
    AND user_type = u.user_role
  LIMIT 1
) sp
WHERE NOT EXISTS (
  SELECT 1 FROM user_subscriptions 
  WHERE user_id = u.user_id
)
AND u.user_role IN ('merchant', 'courier');
```

**2. Fix Column Name (5 min):**
```typescript
// api/subscriptions/my-subscription.ts line 73 & 99
// Change: subscription_plan_id → plan_id
```

**3. Add Better Error Logging (10 min):**
```typescript
// Add to all 3 failing APIs:
catch (error: any) {
  console.error('API Error Details:', {
    endpoint: req.url,
    method: req.method,
    error: error.message,
    stack: error.stack,
    query: req.query
  });
  return res.status(500).json({ 
    error: 'Internal server error',
    message: error.message,
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
}
```

---

## 💰 IMPACT

### **Current State:**
- ❌ Dashboard broken (analytics not loading)
- ❌ Subscription page broken (404 error)
- ❌ Courier preferences broken (500 error)
- ❌ Poor user experience
- ❌ Can't demo to investors

### **After Fixes:**
- ✅ Dashboard working
- ✅ Subscription page working
- ✅ Courier preferences working
- ✅ Good user experience
- ✅ Demo-ready

---

## 📊 ERROR PRIORITY

| Error | Impact | Severity | Time to Fix | Priority |
|-------|--------|----------|-------------|----------|
| My Subscription 404 | HIGH | 🔴 Critical | 20 min | P0 |
| Analytics 500 | HIGH | 🔴 Critical | 2 hours | P0 |
| Merchant Prefs 500 | MEDIUM | 🟡 High | 30 min | P1 |

---

## 🎯 RECOMMENDATION

### **TODAY (30 minutes):**
1. Run SQL to create default subscriptions
2. Fix column name in my-subscription API
3. Add error logging to all APIs
4. Deploy fixes

### **TOMORROW (3 hours):**
1. Convert analytics API to Supabase
2. Fix merchant-preferences API
3. Add comprehensive error handling
4. Test everything

---

## 📝 FILES TO MODIFY

1. `api/subscriptions/my-subscription.ts` (5 min)
2. `api/merchant/analytics.ts` (2 hours)
3. `api/couriers/merchant-preferences.ts` (30 min)
4. `database/CREATE_DEFAULT_SUBSCRIPTIONS.sql` (new file, 15 min)

---

**Status:** 🔴 CRITICAL - Fix today  
**Time Required:** 30 min quick fix, 3 hours complete fix  
**Impact:** HIGH - Blocks user testing and demos
