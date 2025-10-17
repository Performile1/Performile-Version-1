# Vercel Environment Variables - FINAL CONFIGURATION
**Date:** October 17, 2025, 7:03 AM  
**Project:** performile-platform-main  
**Status:** ✅ Ready to Deploy

---

## 🔐 ENVIRONMENT VARIABLES TO SET IN VERCEL

Go to: https://vercel.com/dashboard → `performile-platform-main` → Settings → Environment Variables

---

### **1. DATABASE_URL**
```
postgresql://postgres.ukeikwsmpofydmelrslq:M3nv4df4n17%21@aws-1-eu-north-1.pooler.supabase.com:6543/postgres
```
**Note:** Password is URL-encoded (`%21` instead of `!`)

---

### **2. SUPABASE_URL**
```
https://ukeikwsmpofydmelrslq.supabase.co
```

---

### **3. SUPABASE_ANON_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZWlrd3NtcG9meWRtZWxyc2xxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMjUzMzAsImV4cCI6MjA3NDgwMTMzMH0.OtmOkufOv8U5u3zfnv8nRhLGVThosrrcQO2HVaIbRV4
```

---

### **4. SUPABASE_SERVICE_ROLE**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZWlrd3NtcG9meWRtZWxyc2xxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyNTMzMCwiZXhwIjoyMDc0ODAxMzMwfQ.lGG_-8VQWgNyPjCTAB3Mhgs-BGbQcsTprUed5WLiGjY
```

---

### **5. JWT_SECRET**
```
4a8f3c7e2b5d1a9f6c3e8b2a5d9f1e7c
```

---

### **6. JWT_REFRESH_SECRET**
```
7b3e9a2d5f8c1e6b4a9d2f7e1c5b8a3d
```

---

### **7. NODE_ENV**
```
production
```

---

### **8. CORS_ALLOWED_ORIGINS**
```
https://performile-platform-main.vercel.app
```

---

## 📋 DEPLOYMENT STEPS

1. **Update Environment Variables:**
   - [ ] Go to Vercel Dashboard
   - [ ] Navigate to `performile-platform-main` → Settings → Environment Variables
   - [ ] Update/Add all 8 variables above
   - [ ] Click "Save" for each variable

2. **Redeploy:**
   - [ ] Go to Deployments tab
   - [ ] Click "..." menu on latest deployment
   - [ ] Click "Redeploy"
   - [ ] Wait for deployment to complete (~3-5 minutes)

3. **Verify:**
   - [ ] Visit https://performile-platform-main.vercel.app
   - [ ] Login page should load without errors
   - [ ] Try login with: admin@performile.com / Test1234!
   - [ ] Should successfully login and redirect to dashboard

---

## ✅ TEST USERS (After Deployment)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@performile.com | Test1234! |
| Merchant | merchant@performile.com | Test1234! |
| Courier | courier@performile.com | Test1234! |
| Consumer | consumer@performile.com | Test1234! |

---

## 🎯 EXPECTED RESULT

After redeployment:
- ✅ No "Tenant or user not found" error
- ✅ All 4 users can login successfully
- ✅ Dashboard loads with data
- ✅ No console errors
- ✅ API calls return 200 status

---

## 🚀 NEXT STEPS

Once deployment is verified:
1. ✅ Confirm all 4 users can login
2. ✅ Check console for errors (F12)
3. ✅ Verify API calls are successful
4. → **Begin E2E test writing**

---

**Status:** ⏳ Awaiting Vercel update and redeployment  
**ETA:** 10 minutes  
**Last Updated:** October 17, 2025, 7:03 AM UTC+2
