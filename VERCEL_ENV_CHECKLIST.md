# Vercel Environment Variables Checklist
**Date:** October 17, 2025, 6:58 AM  
**Project:** performile-platform-main  
**Action Required:** Verify and update environment variables

---

## 🔴 CRITICAL: Environment Variables to Verify

### **Required Updates:**

Go to: https://vercel.com/dashboard → `performile-platform-main` → Settings → Environment Variables

### **1. DATABASE_URL** ⚠️ MUST UPDATE
**Current (in .env):** 
```
postgresql://postgres.ukeikwsmpofydmelrslq:M3nv4df4n17!@aws-1-eu-north-1.pooler.supabase.com:6543/postgres
```

**Correct (URL-encoded password):**
```
postgresql://postgres.ukeikwsmpofydmelrslq:M3nv4df4n17%21@aws-1-eu-north-1.pooler.supabase.com:6543/postgres
```

**Note:** The `!` must be encoded as `%21`

---

### **2. SUPABASE_URL** ✅ Should be correct
```
https://ukeikwsmpofydmelrslq.supabase.co
```

---

### **3. SUPABASE_ANON_KEY** ⚠️ NEEDS TO BE ADDED
**Status:** Currently shows `YOUR_ANON_KEY_HERE` in .env

**How to get:**
1. Go to https://supabase.com/dashboard
2. Select project: `ukeikwsmpofydmelrslq`
3. Settings → API
4. Copy **anon public** key
5. Add to Vercel environment variables

---

### **4. SUPABASE_SERVICE_ROLE** ⚠️ NEEDS TO BE ADDED
**Status:** Currently shows `YOUR_SERVICE_ROLE_KEY_HERE` in .env

**How to get:**
1. Go to https://supabase.com/dashboard
2. Select project: `ukeikwsmpofydmelrslq`
3. Settings → API
4. Copy **service_role** key (secret)
5. Add to Vercel environment variables

---

### **5. JWT_SECRET** ✅ Already configured
```
4a8f3c7e2b5d1a9f6c3e8b2a5d9f1e7c
```

---

### **6. JWT_REFRESH_SECRET** ✅ Already configured
```
7b3e9a2d5f8c1e6b4a9d2f7e1c5b8a3d
```

---

### **7. NODE_ENV** ✅ Should be set
```
production
```

---

### **8. CORS_ALLOWED_ORIGINS** ✅ Should include Vercel URL
```
https://performile-platform-main.vercel.app
```

---

## 📋 VERIFICATION CHECKLIST

Before proceeding with tests:

- [ ] **Step 1:** Go to Supabase Dashboard
  - URL: https://supabase.com/dashboard
  - Project: `ukeikwsmpofydmelrslq`

- [ ] **Step 2:** Get API Keys
  - [ ] Copy `anon public` key
  - [ ] Copy `service_role` key

- [ ] **Step 3:** Update Vercel Environment Variables
  - [ ] Update `DATABASE_URL` with URL-encoded password (`%21`)
  - [ ] Add `SUPABASE_ANON_KEY`
  - [ ] Add `SUPABASE_SERVICE_ROLE`
  - [ ] Verify `SUPABASE_URL` is correct
  - [ ] Verify `NODE_ENV=production`
  - [ ] Verify `CORS_ALLOWED_ORIGINS` includes deployment URL

- [ ] **Step 4:** Redeploy
  - [ ] Go to Deployments tab
  - [ ] Click "Redeploy" on latest deployment
  - [ ] Wait for deployment to complete

- [ ] **Step 5:** Test Deployment
  - [ ] Visit https://performile-platform-main.vercel.app
  - [ ] Check if login page loads
  - [ ] Try logging in with admin@performile.com / Test1234!
  - [ ] Verify no "Tenant or user not found" error

---

## 🚨 KNOWN ISSUE

**From V1.12 Audit:**
> User tried to login and got "Tenant or user not found" error because wrong database was configured.

**Resolution:**
The database URL and Supabase keys MUST point to project `ukeikwsmpofydmelrslq` which has the seeded test users.

---

## ✅ EXPECTED RESULT

After updating environment variables and redeploying:
- ✅ Login page loads without errors
- ✅ Can login as admin@performile.com
- ✅ Can login as merchant@performile.com
- ✅ Can login as courier@performile.com
- ✅ Can login as consumer@performile.com
- ✅ Dashboard loads with data
- ✅ No console errors

---

## 🎯 NEXT STEPS AFTER VERIFICATION

Once environment variables are confirmed correct:
1. ✅ Deployment accessible
2. ✅ All 4 users can login
3. ✅ No database connection errors
4. → **Proceed with writing E2E tests**

---

## 📞 NEED HELP?

**Supabase Dashboard:** https://supabase.com/dashboard  
**Vercel Dashboard:** https://vercel.com/dashboard  
**Project ID:** ukeikwsmpofydmelrslq  
**Deployment URL:** https://performile-platform-main.vercel.app

---

**Status:** ⚠️ Awaiting environment variable verification  
**Blocker:** Cannot proceed with testing until deployment is verified working  
**ETA:** 10-15 minutes to update and redeploy

---

**Last Updated:** October 17, 2025, 6:58 AM UTC+2
