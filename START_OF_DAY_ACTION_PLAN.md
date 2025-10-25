# 🌅 Start of Day - Action Plan
## October 24, 2025, 9:39 AM

**Status:** Ready to fix critical issues  
**Goal:** 100% working by end of day  
**Estimated Time:** 4-5 hours

---

## 🔍 CRITICAL BUG FOUND!

### Bug in `/api/claims/index.ts` (Line 87-99)

**Problem:** Duplicate `WHERE 1=1` clause causing SQL syntax error

**Current Code (BROKEN):**
```typescript
// Line 87-99
let query = `
  SELECT c.*, o.order_number, s.store_name, co.courier_name
  FROM claims c
  LEFT JOIN orders o ON c.order_id = o.order_id
  LEFT JOIN stores s ON o.store_id = s.store_id
  LEFT JOIN couriers co ON o.courier_id = co.courier_id
  WHERE 1=1          // ← First WHERE
`;
const params: any[] = [];
let paramCount = 1;

// RLS will handle role-based filtering automatically
query += ` WHERE 1=1`;  // ← DUPLICATE WHERE! This breaks SQL!
```

**Result:** SQL error: `syntax error at or near "WHERE"`

**Fix:** Remove the duplicate WHERE clause (line 99)

---

## ⚡ IMMEDIATE ACTIONS (Next 30 Minutes)

### 1. Fix Claims API Bug (5 minutes)

**File:** `api/claims/index.ts`  
**Line:** 99  
**Action:** Remove duplicate `WHERE 1=1`

**Change:**
```typescript
// BEFORE (lines 87-99):
let query = `
  SELECT c.*, o.order_number, s.store_name, co.courier_name
  FROM claims c
  LEFT JOIN orders o ON c.order_id = o.order_id
  LEFT JOIN stores s ON o.store_id = s.store_id
  LEFT JOIN couriers co ON o.courier_id = co.courier_id
  WHERE 1=1
`;
const params: any[] = [];
let paramCount = 1;

// RLS will handle role-based filtering automatically
query += ` WHERE 1=1`;  // ← DELETE THIS LINE

// AFTER:
let query = `
  SELECT c.*, o.order_number, s.store_name, co.courier_name
  FROM claims c
  LEFT JOIN orders o ON c.order_id = o.order_id
  LEFT JOIN stores s ON o.store_id = s.store_id
  LEFT JOIN couriers co ON o.courier_id = co.courier_id
  WHERE 1=1
`;
const params: any[] = [];
let paramCount = 1;

// Continue with status and courier filters...
```

---

### 2. Check Analytics APIs (15 minutes)

The `order-trends.ts` API looks correct. It has fallback logic:
1. Try materialized view `order_trends`
2. If empty, query `orders` table directly

**Potential Issues:**
- ❌ `order_trends` materialized view doesn't exist
- ❌ `orders` table missing data
- ❌ RLS policies blocking queries

**Action:** Check Vercel logs to see exact error

---

### 3. Check Database Tables (10 minutes)

Run in Supabase SQL Editor:

```sql
-- 1. Check if order_trends view exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'order_trends'
);

-- 2. Check if claims table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'claims'
);

-- 3. Check orders table for test users
SELECT COUNT(*) FROM orders 
WHERE courier_id = '617f3f03-ec94-415a-8400-dc5c7e29d96f';

SELECT COUNT(*) FROM orders o
JOIN stores s ON o.store_id = s.store_id
WHERE s.owner_user_id = 'fc1a0fdb-a82c-4a83-82bb-fa7a4b4b13c9';

-- 4. Check courier count
SELECT COUNT(*) FROM couriers;
SELECT status, COUNT(*) FROM couriers GROUP BY status;
```

---

## 🎯 PRIORITY ORDER

### Priority 1: Fix Claims API (5 min) ✅ BUG FOUND
- [x] Identified duplicate WHERE clause
- [ ] Remove line 99 in `api/claims/index.ts`
- [ ] Test API endpoint
- [ ] Commit fix

### Priority 2: Check Analytics APIs (30 min)
- [ ] Check Vercel logs for exact error
- [ ] Verify `order_trends` table exists
- [ ] Check if test users have orders
- [ ] Fix any SQL errors found
- [ ] Test endpoints

### Priority 3: Add Missing Routes (30 min)
- [ ] Add `/parcel-points` route
- [ ] Add `/coverage-checker` route
- [ ] Add `/marketplace` route
- [ ] Fix `/courier/checkout-analytics` redirect
- [ ] Test all routes

### Priority 4: Fix Courier Count (15 min)
- [ ] Find admin stats API
- [ ] Check SQL query
- [ ] Verify count in database
- [ ] Fix query if needed

### Priority 5: Component Visibility (1 hour)
- [ ] Check browser console
- [ ] Investigate layout issues
- [ ] Fix CSS/positioning

---

## 📝 QUICK FIX CHECKLIST

### Fix 1: Claims API (NOW!)
```typescript
// File: api/claims/index.ts
// Line: 99
// Action: Delete this line:
query += ` WHERE 1=1`;
```

### Fix 2: Add Missing Routes
```typescript
// File: apps/web/src/App.tsx
// Add before the 404 catch-all:

<Route
  path="/parcel-points"
  element={
    <ProtectedRoute>
      <div style={{ padding: '2rem' }}>
        <h1>Parcel Points</h1>
        <p>Coming soon...</p>
      </div>
    </ProtectedRoute>
  }
/>

<Route
  path="/coverage-checker"
  element={
    <ProtectedRoute>
      <div style={{ padding: '2rem' }}>
        <h1>Coverage Checker</h1>
        <p>Coming soon...</p>
      </div>
    </ProtectedRoute>
  }
/>

<Route
  path="/marketplace"
  element={
    <ProtectedRoute>
      <div style={{ padding: '2rem' }}>
        <h1>Marketplace</h1>
        <p>Coming soon...</p>
      </div>
    </ProtectedRoute>
  }
/>
```

---

## 🔍 INVESTIGATION NEEDED

### Analytics APIs - Check These:

1. **Vercel Logs**
   - Go to: https://vercel.com/your-project/deployments
   - Click latest deployment
   - Click "Functions" tab
   - Check `/api/analytics/order-trends` logs
   - Check `/api/analytics/claims-trends` logs

2. **Database Tables**
   - Does `order_trends` table exist?
   - Does `claims` table exist?
   - Do test users have orders?
   - Are RLS policies blocking?

3. **Test Data**
   - Courier ID: `617f3f03-ec94-415a-8400-dc5c7e29d96f`
   - Merchant ID: `fc1a0fdb-a82c-4a83-82bb-fa7a4b4b13c9`
   - Do they have orders in database?

---

## 🚀 DEPLOYMENT PLAN

### After Each Fix:
```bash
# 1. Test locally (if possible)
# 2. Commit
git add .
git commit -m "Fix: [description]"

# 3. Push
git push

# 4. Wait for Vercel deploy (~2 min)
# 5. Test on production
# 6. Move to next fix
```

---

## 📊 SUCCESS CRITERIA

By end of day:
- ✅ Claims API working (no 500 errors)
- ✅ Analytics APIs working (no 500 errors)
- ✅ All routes working (no 404 errors)
- ✅ Courier count accurate
- ✅ All components visible
- ✅ All dashboards functional

---

## 🎯 START HERE

### Step 1: Fix Claims API (5 min)
1. Open `api/claims/index.ts`
2. Go to line 99
3. Delete: `query += \` WHERE 1=1\`;`
4. Save file
5. Commit: `git commit -m "Fix duplicate WHERE clause in claims API"`
6. Push: `git push`

### Step 2: Check Vercel Logs (10 min)
1. Go to Vercel dashboard
2. Find latest deployment
3. Check function logs
4. Document exact errors

### Step 3: Fix Based on Logs (varies)
- If SQL errors → Fix queries
- If missing tables → Create tables
- If RLS blocking → Adjust policies
- If no data → Add test data

---

## 💡 TIPS

1. **Fix one thing at a time** - Don't accumulate broken code
2. **Test after each fix** - Verify it works before moving on
3. **Check Vercel logs** - They have all the answers
4. **Use Supabase SQL editor** - Test queries before deploying
5. **Follow SPEC_DRIVEN_FRAMEWORK.md** - Maintain quality

---

## 📞 QUICK REFERENCE

### Test Users:
```
Merchant: test-merchant@performile.com / TestPassword123!
Courier: test-courier@performile.com / TestPassword123!
```

### Test IDs:
```
Courier: 617f3f03-ec94-415a-8400-dc5c7e29d96f
Merchant: fc1a0fdb-a82c-4a83-82bb-fa7a4b4b13c9
```

### URLs:
```
Dashboard: https://performile-platform-main.vercel.app/#/dashboard
Vercel: https://vercel.com/your-project
Supabase: https://supabase.com/dashboard
```

---

**LET'S GO! Start with fixing the Claims API bug.** 🚀

**Estimated time to first fix: 5 minutes** ⏱️
