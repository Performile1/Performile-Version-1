# What to Change in Vercel - Simple Guide
**Date:** October 17, 2025, 7:05 AM

---

## 🔍 CHECK FIRST

Go to: https://vercel.com/dashboard → `performile-platform-main` → Settings → Environment Variables

Look at the **current values** for these variables:

---

## ⚠️ WHAT NEEDS TO CHANGE

### **1. DATABASE_URL**

**Check if it has:**
- ❌ `M3nv4df4n17!` (with exclamation mark) - **WRONG**
- ✅ `M3nv4df4n17%21` (with %21) - **CORRECT**

**If it's wrong, change to:**
```
postgresql://postgres.ukeikwsmpofydmelrslq:M3nv4df4n17%21@aws-1-eu-north-1.pooler.supabase.com:6543/postgres
```

The only difference: `!` → `%21`

---

### **2. SUPABASE_ANON_KEY**

**Check if it has:**
- ❌ `YOUR_ANON_KEY_HERE` or any placeholder - **WRONG**
- ❌ A key from a different project - **WRONG**
- ✅ This exact key - **CORRECT**

**Should be:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZWlrd3NtcG9meWRtZWxyc2xxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMjUzMzAsImV4cCI6MjA3NDgwMTMzMH0.OtmOkufOv8U5u3zfnv8nRhLGVThosrrcQO2HVaIbRV4
```

---

### **3. SUPABASE_SERVICE_ROLE**

**Check if it has:**
- ❌ `YOUR_SERVICE_ROLE_KEY_HERE` or any placeholder - **WRONG**
- ❌ A key from a different project - **WRONG**
- ✅ This exact key - **CORRECT**

**Should be:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZWlrd3NtcG9meWRtZWxyc2xxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyNTMzMCwiZXhwIjoyMDc0ODAxMzMwfQ.lGG_-8VQWgNyPjCTAB3Mhgs-BGbQcsTprUed5WLiGjY
```

---

### **4. SUPABASE_URL**

**Check if it has:**
- ❌ `https://ulcyiwdpwjrujpavxwix.supabase.co` (old/wrong project) - **WRONG**
- ✅ `https://ukeikwsmpofydmelrslq.supabase.co` - **CORRECT**

**Should be:**
```
https://ukeikwsmpofydmelrslq.supabase.co
```

---

## 🎯 SIMPLE STEPS

1. **Open Vercel:**
   - https://vercel.com/dashboard
   - Click on `performile-platform-main`
   - Click "Settings" tab
   - Click "Environment Variables"

2. **For EACH variable above:**
   - Click "Edit" (pencil icon)
   - Compare current value with correct value above
   - If different, paste the correct value
   - Click "Save"

3. **After updating all variables:**
   - Go to "Deployments" tab
   - Find the latest deployment
   - Click "..." menu
   - Click "Redeploy"
   - Wait 3-5 minutes

4. **Test:**
   - Go to: https://performile-platform-main.vercel.app
   - Try login: admin@performile.com / Test1234!
   - Should work without "Tenant or user not found" error

---

## 🤔 MAYBE THEY'RE ALREADY CORRECT?

**If all 4 variables above are already correct in Vercel:**
- ✅ DATABASE_URL has `%21` (not `!`)
- ✅ SUPABASE_ANON_KEY has the JWT token (not placeholder)
- ✅ SUPABASE_SERVICE_ROLE has the JWT token (not placeholder)
- ✅ SUPABASE_URL has `ukeikwsmpofydmelrslq` (not `ulcyiwdpwjrujpavxwix`)

**Then:**
- No changes needed!
- Just try logging in: https://performile-platform-main.vercel.app
- If login works → We're good to go!
- If login fails → Something else is wrong

---

## 🚨 THE PROBLEM WE'RE FIXING

**From V1.12 Audit:**
> User tried to login and got "Tenant or user not found" error

**Why?**
- Wrong database was configured (old project)
- Or password wasn't URL-encoded
- Or API keys were missing/wrong

**Solution:**
- Make sure all 4 variables point to project `ukeikwsmpofydmelrslq`
- This project has the test users seeded

---

## ✅ HOW TO KNOW IT'S FIXED

After redeployment:
- ✅ Can login as admin@performile.com
- ✅ Can login as merchant@performile.com
- ✅ Can login as courier@performile.com
- ✅ Can login as consumer@performile.com
- ✅ No "Tenant or user not found" error
- ✅ Dashboard loads with data

---

**TL;DR:** Check if those 4 variables in Vercel match the values above. If not, update them. If yes, just test login!
