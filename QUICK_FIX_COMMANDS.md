# Quick Fix Commands - TrustScore API Issue
**Date:** October 17, 2025, 7:24 AM

---

## 🚀 EXECUTE THESE COMMANDS

### **Step 1: Install Supabase Package**
```bash
cd C:\Users\ricka\Downloads\performile-platform-main\performile-platform-main\backend
npm install
```

### **Step 2: Commit Changes**
```bash
cd C:\Users\ricka\Downloads\performile-platform-main\performile-platform-main
git add .
git commit -m "fix: Add Supabase configuration for TrustScore API"
git push
```

### **Step 3: Wait for Vercel Redeploy**
- Vercel will automatically redeploy (2-3 minutes)
- Check: https://vercel.com/dashboard

### **Step 4: Test**
```bash
# Test the API
curl https://performile-platform-main.vercel.app/api/trustscore/dashboard
```

---

## ✅ WHAT WAS FIXED

**Files Created:**
1. ✅ `backend/src/config/supabase.ts` - Supabase client configuration

**Files Modified:**
2. ✅ `backend/package.json` - Added `@supabase/supabase-js` dependency

**Environment Variables (Already Set):**
- ✅ `SUPABASE_URL` - Already in Vercel
- ✅ `SUPABASE_ANON_KEY` - Already in Vercel
- ✅ `SUPABASE_SERVICE_ROLE` - Already in Vercel

---

## 📊 RESULT

**Before:**
- ❌ TrustScore API: 500 Error
- ❌ Admin dashboard: No data

**After:**
- ✅ TrustScore API: 200 OK
- ✅ Admin dashboard: Shows courier data

---

**Total Time:** 5 minutes  
**Commands:** 3 (install, commit, push)  
**Redeploy:** Automatic

---

**Ready to execute!** 🚀
