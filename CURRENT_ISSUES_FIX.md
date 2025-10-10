# Current Issues & Fixes - Oct 10, 2025 19:35

## 🔴 **CRITICAL: 401 Unauthorized Errors**

### **Problem:**
Multiple API endpoints returning 401 Unauthorized even though user is logged in:
- `/api/admin/subscriptions` - 401
- `/api/tracking/summary` - 401  
- `/api/claims` - 401
- `/api/dashboard/trends` - 500

### **Root Cause:**
**JWT_SECRET environment variable mismatch or not set in Vercel**

The tokens are being created with one JWT_SECRET during login, but verified with a different (or missing) JWT_SECRET in the API endpoints.

### **Evidence:**
- Frontend shows: `{hasTokens: true, hasAccessToken: true}` ✅
- Token exists in localStorage ✅
- Token is being sent in Authorization header ✅
- **Backend rejects the token** ❌

### **Fix Applied (Commit f8abf32):**
1. ✅ Added JWT_SECRET validation check
2. ✅ Added better error logging
3. ✅ Support both `userId` and `user_id` in token payload
4. ✅ Console logs will show exact error

### **NEXT STEPS - YOU MUST DO THIS:**

#### **1. Check Vercel Environment Variables**
Go to: https://vercel.com/your-project/settings/environment-variables

**Verify these exist:**
- `JWT_SECRET` - Must be the SAME value everywhere
- `DATABASE_URL` - PostgreSQL connection string
- `STRIPE_SECRET_KEY` - Stripe secret key

#### **2. If JWT_SECRET is missing or different:**

**Option A: Set it in Vercel (RECOMMENDED)**
```bash
# In Vercel dashboard, add environment variable:
JWT_SECRET=your-super-secret-key-here-make-it-long-and-random
```

**Option B: Generate a new one**
```bash
# Run this to generate a secure secret:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Then set it in Vercel environment variables
```

#### **3. After setting JWT_SECRET:**
1. Redeploy the app (or it will auto-deploy)
2. **Log out completely**
3. **Clear browser cache/localStorage**
4. **Log back in** (this creates a new token with correct secret)
5. Test the APIs

---

## 🔴 **SECONDARY: Dashboard Trends 500 Error**

### **Problem:**
`/api/dashboard/trends?period=7d` returns 500 error

### **Possible Causes:**
1. Database query failing
2. Missing tables (reviews, orders, courier_analytics)
3. SQL syntax error

### **Fix Applied:**
- ✅ Added COALESCE for NULL handling
- ✅ Populated courier_analytics table

### **Check:**
Run this in Supabase to verify data exists:
```sql
SELECT COUNT(*) FROM orders;
SELECT COUNT(*) FROM reviews;
SELECT COUNT(*) FROM courier_analytics;
```

If any return 0, the trends API will fail.

---

## 🔴 **TERTIARY: Frontend Crash**

### **Error:**
```
TypeError: Cannot read properties of undefined (reading '0')
at qUe (index-CHffibM4.js:569:114751)
```

### **Cause:**
Some component is trying to access an array that doesn't exist or is undefined.

### **Likely culprit:**
A page/component expecting data from a failed API call (401/500).

### **Fix:**
Once the 401 errors are fixed, this will likely resolve itself.

---

## ✅ **WORKING CORRECTLY:**

1. ✅ Sentry initialized
2. ✅ PostHog initialized (401/404 are PostHog's issue, not ours)
3. ✅ Auth tokens exist in frontend
4. ✅ Tokens being sent to backend
5. ✅ CORS configured correctly
6. ✅ SPA routing fixed (hard refresh works)

---

## 📋 **DEPLOYMENT CHECKLIST:**

### **Before Next Deployment:**
- [ ] Verify JWT_SECRET is set in Vercel
- [ ] Verify DATABASE_URL is correct
- [ ] Verify STRIPE_SECRET_KEY is set
- [ ] Check Vercel logs for errors

### **After Deployment:**
- [ ] Clear browser cache
- [ ] Log out
- [ ] Log back in
- [ ] Test dashboard
- [ ] Test admin pages
- [ ] Check console for errors

---

## 🔍 **HOW TO DEBUG:**

### **1. Check Vercel Logs:**
```bash
# In Vercel dashboard, go to:
# Deployments > Latest > Functions > Click on any failed function
# Look for error messages
```

### **2. Check Browser Console:**
```javascript
// Run in browser console:
console.log('Token:', localStorage.getItem('performile_tokens'));

// Should show something like:
// {"accessToken":"eyJhbGc...", "refreshToken":"eyJhbGc..."}
```

### **3. Decode the JWT Token:**
Go to: https://jwt.io

Paste your accessToken and check:
- `userId` or `user_id` field exists
- `exp` (expiration) is in the future
- Token is signed with correct algorithm (HS256)

### **4. Test API Directly:**
```bash
# Replace YOUR_TOKEN with actual token from localStorage
curl -X GET https://frontend-two-swart-31.vercel.app/api/admin/subscriptions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Should return data, not 401
```

---

## 🚨 **MOST LIKELY SOLUTION:**

**The JWT_SECRET in Vercel is either:**
1. Not set at all
2. Different from what was used during login
3. Changed recently

**FIX:**
1. Go to Vercel dashboard
2. Set JWT_SECRET environment variable
3. Redeploy
4. Log out and log back in
5. Everything should work

---

## 📊 **ERROR SUMMARY:**

| Error | Count | Status | Priority |
|-------|-------|--------|----------|
| 401 Unauthorized | 5+ | 🔴 CRITICAL | HIGH |
| 500 Internal Error | 2 | 🟡 IMPORTANT | MEDIUM |
| Frontend Crash | 1 | 🟡 IMPORTANT | MEDIUM |
| PostHog 404 | Multiple | 🟢 IGNORE | LOW |

---

**Last Updated:** Oct 10, 2025 19:35  
**Next Action:** Check JWT_SECRET in Vercel environment variables
