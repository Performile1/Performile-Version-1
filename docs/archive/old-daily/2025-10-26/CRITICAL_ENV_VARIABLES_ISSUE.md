# 🚨 CRITICAL: Environment Variables Missing in Vercel

**Discovered:** October 25, 2025, 10:50 PM  
**Status:** 🔴 BLOCKING - Multiple APIs Failing  
**Severity:** CRITICAL (Production Down)

---

## 🔥 THE PROBLEM

**Multiple APIs are failing with:**
```
Error: supabaseUrl is required.
Error: supabaseKey is required.
```

**Affected APIs:**
1. `/api/subscriptions/my-subscription` - 500 error
2. `/api/subscriptions/public` - 500 error
3. `/api/analytics/claims-trends` - 500 error
4. `/api/analytics/order-trends` - 500 error

**Working APIs:**
- ✅ `/api/dashboard/recent-activity` - 200 OK
- ✅ `/api/dashboard/trends` - 200 OK
- ✅ `/api/claims` - 200 OK
- ✅ `/api/trustscore/dashboard` - 200 OK
- ✅ `/api/notifications` - 200 OK

---

## 🔍 ROOT CAUSE

**Environment variables not set in Vercel:**
- `VITE_SUPABASE_URL` - Missing or undefined
- `VITE_SUPABASE_ANON_KEY` - Missing or undefined

**Why some APIs work:**
- Working APIs use `process.env.DATABASE_URL` (PostgreSQL connection string)
- Failing APIs use Supabase client (`createClient()`)

**Code Pattern (Failing):**
```typescript
// api/subscriptions/my-subscription.ts:12
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,      // ❌ undefined in Vercel
  process.env.VITE_SUPABASE_ANON_KEY!  // ❌ undefined in Vercel
);
```

**Code Pattern (Working):**
```typescript
// api/admin/dashboard.ts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL  // ✅ Set in Vercel
});
```

---

## ✅ THE FIX

### **Step 1: Add Environment Variables in Vercel**

Go to: https://vercel.com/performile1/performile-platform-main/settings/environment-variables

Add these variables:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Get values from:**
1. Supabase Dashboard → Project Settings → API
2. Copy "Project URL" → Use as `VITE_SUPABASE_URL`
3. Copy "anon public" key → Use as `VITE_SUPABASE_ANON_KEY`

### **Step 2: Redeploy**

After adding variables:
```bash
# Trigger redeploy (or push any commit)
git commit --allow-empty -m "chore: trigger redeploy for env vars"
git push
```

---

## 🎯 PRIORITY: P0 - CRITICAL

**This blocks:**
- ✅ Subscription pages (merchant/courier)
- ✅ Analytics pages (claims, orders)
- ✅ Public subscription plans page

**Must fix:** BEFORE any other work tomorrow

**Time:** 5 minutes (just add env vars)

---

## 📋 VERIFICATION

After fixing, test these URLs:
```
✅ /api/subscriptions/my-subscription → Should return 200 or 401 (not 500)
✅ /api/subscriptions/public → Should return 200
✅ /api/analytics/claims-trends → Should return 200 or 401 (not 500)
✅ /api/analytics/order-trends → Should return 200 or 401 (not 500)
```

---

**Status:** 🔴 CRITICAL - FIX FIRST TOMORROW  
**Time to Fix:** 5 minutes  
**Impact:** HIGH (unblocks 4+ APIs)
