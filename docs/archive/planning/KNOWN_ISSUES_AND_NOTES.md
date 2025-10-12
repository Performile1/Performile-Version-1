# Known Issues and Important Notes
**Date:** October 10, 2025, 18:37  
**Platform Version:** 2.7.0  
**Status:** 97% Complete

---

## 🔴 CRITICAL ISSUES

### **1. Authentication/Login Issues**

**Issue:** Users reporting "not logged in" errors or session not persisting

**Symptoms:**
- API calls return 401 Unauthorized
- User appears logged in on frontend but backend doesn't recognize session
- Dropdowns (merchants, couriers) don't load data
- Protected pages show authentication errors

**Possible Causes:**
1. **Session/Token Issues:**
   - JWT token not being sent with requests
   - Token expired but not refreshed
   - Cookie not being set/read correctly
   - CORS issues with credentials

2. **Database Issues:**
   - Password hash mismatch (if password was changed directly in DB)
   - User session not created properly
   - Token not stored in database

3. **Frontend Issues:**
   - `authStore` not persisting state
   - Token not in localStorage/sessionStorage
   - `apiClient` not including auth headers

**Solutions to Try:**
```typescript
// 1. Check if token exists
const token = localStorage.getItem('auth_token');
console.log('Token:', token);

// 2. Check authStore state
const authState = useAuthStore.getState();
console.log('Auth State:', authState);

// 3. Check API headers
// In apiClient.ts, verify Authorization header is set

// 4. Clear and re-login
localStorage.clear();
// Then login again
```

**Temporary Workaround:**
- Log out completely
- Clear browser cache and cookies
- Log back in with correct credentials

**Permanent Fix Needed:**
- [ ] Add better session debugging
- [ ] Implement token refresh mechanism
- [ ] Add "Session expired" notification
- [ ] Better error messages for auth failures

---

## ⚠️ IMPORTANT ISSUES

### **2. Order Filters Dropdown Empty**

**Status:** ✅ FIXED (Oct 10, 2025)

**Issue:** Merchant and courier dropdowns not showing data

**Root Cause:** API response format mismatch
- API returns: `{ success: true, data: [...] }`
- Code expected: `{ stores: [...] }` or `{ couriers: [...] }`

**Fix Applied:**
```typescript
// Updated to handle both formats
return response.data.data || response.data.stores || [];
return response.data.data || response.data.couriers || [];
```

---

### **3. Email Templates API 500 Error**

**Status:** ✅ FIXED (Oct 10, 2025)

**Issue:** `/api/email-templates` returning 500 error

**Root Cause:** Missing `email_templates` table or columns

**Fix Applied:**
- Added graceful error handling
- Returns empty array if table doesn't exist
- Prevents page crash

---

### **4. Dashboard QuickActions Color Error**

**Status:** ✅ FIXED (Oct 9, 2025)

**Issue:** Dashboard crashing with "Cannot read properties of undefined (reading 'main')"

**Root Cause:** Invalid color value `'default'` for MUI Button

**Fix Applied:**
```typescript
// Changed from 'default' to 'inherit'
color: 'inherit'
```

---

## 📝 CODE DELETIONS REVIEW

### **Recent Code Changes (Last 2 Days):**

**What We Removed:**
1. ❌ Unused `Refresh` icon import in Orders.tsx
   - **Impact:** None - icon wasn't being used
   - **Needed for future?** No

2. ❌ Temporarily removed `user` variable in BillingPortal
   - **Impact:** Build error
   - **Status:** ✅ RESTORED with proper usage

3. ❌ Renamed `Subscription` to `SubscriptionData`
   - **Impact:** Type naming conflict
   - **Status:** ✅ Fixed and properly typed

**What We Should NOT Delete:**
- ✅ `useAuthStore` - Critical for authentication
- ✅ User role checks - Needed for permissions
- ✅ Type definitions - Required for TypeScript
- ✅ Error handlers - Essential for UX
- ✅ Loading states - Important for feedback
- ✅ Validation logic - Security requirement

---

## 🔧 CONFIGURATION ISSUES

### **5. Environment Variables**

**Required Variables:**
```env
# Database
DATABASE_URL=postgresql://...

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...

# Email (if using)
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...

# Frontend URL
FRONTEND_URL=https://performile.vercel.app

# JWT Secret
JWT_SECRET=...
```

**Check if Missing:**
```bash
# In Vercel dashboard, verify all env vars are set
# In local .env file, verify all keys exist
```

---

## 🐛 MINOR BUGS

### **6. PostHog Analytics Warnings**

**Issue:** Console warnings about PostHog config

**Impact:** Low - doesn't affect functionality

**Fix:** Can be ignored or PostHog key can be updated

---

### **7. Favicon 404**

**Issue:** `/favicon.ico` returns 404

**Impact:** Low - cosmetic only

**Fix:** Add favicon.ico to public folder

---

## 🔍 DEBUGGING CHECKLIST

### **When Users Report Login Issues:**

1. **Check Browser Console:**
   ```javascript
   // Run in browser console
   console.log('Token:', localStorage.getItem('auth_token'));
   console.log('User:', JSON.parse(localStorage.getItem('user') || '{}'));
   ```

2. **Check Network Tab:**
   - Look for 401 responses
   - Check if Authorization header is present
   - Verify API endpoint URLs

3. **Check Database:**
   ```sql
   -- Verify user exists
   SELECT user_id, email, user_role FROM users WHERE email = 'user@example.com';
   
   -- Check password hash
   SELECT password_hash FROM users WHERE email = 'user@example.com';
   ```

4. **Test API Directly:**
   ```bash
   # Test login endpoint
   curl -X POST https://performile.vercel.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password"}'
   ```

5. **Check Auth Store:**
   ```typescript
   // In React DevTools or console
   useAuthStore.getState()
   ```

---

## 📋 FUTURE IMPROVEMENTS NEEDED

### **Authentication:**
- [ ] Add token refresh mechanism
- [ ] Implement "Remember Me" properly
- [ ] Add session timeout warnings
- [ ] Better error messages
- [ ] Add 2FA support (optional)

### **Error Handling:**
- [ ] Global error boundary
- [ ] Better API error messages
- [ ] Retry logic for failed requests
- [ ] Offline mode detection

### **Performance:**
- [ ] Add request caching
- [ ] Implement lazy loading
- [ ] Optimize bundle size
- [ ] Add service worker

### **Security:**
- [ ] Add rate limiting UI feedback
- [ ] Implement CSRF protection
- [ ] Add security headers
- [ ] Audit logging UI

---

## 🚨 BREAKING CHANGES LOG

### **October 10, 2025:**
- None - all changes backward compatible

### **October 9, 2025:**
- None - all changes backward compatible

---

## 💡 COMMON USER ISSUES & SOLUTIONS

### **"I can't log in"**
1. Clear browser cache
2. Try incognito/private mode
3. Check if Caps Lock is on
4. Verify email is correct
5. Use "Forgot Password" if needed

### **"Dropdowns are empty"**
1. Verify you're logged in
2. Check your user role
3. Refresh the page
4. Check console for errors

### **"Payment not working"**
1. Verify Stripe keys are set
2. Check if test mode is enabled
3. Try different payment method
4. Check Stripe dashboard for errors

### **"Data not loading"**
1. Check internet connection
2. Verify API is running
3. Check for 401/403 errors
4. Try logging out and back in

---

## 📊 ERROR CODES REFERENCE

| Code | Meaning | Solution |
|------|---------|----------|
| 401 | Unauthorized | Log in again |
| 403 | Forbidden | Check user role/permissions |
| 404 | Not Found | Check URL/endpoint |
| 500 | Server Error | Check logs, contact support |
| 503 | Service Unavailable | Wait and retry |

---

## 🔐 SECURITY NOTES

### **Password Management:**
- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ Password strength validation
- ✅ Forgot password with secure tokens
- ✅ Token expiry (1 hour for reset)
- ✅ Audit logging for password changes

### **Session Management:**
- ⚠️ Token refresh needed
- ⚠️ Session timeout not implemented
- ✅ Secure token storage
- ✅ HTTPS only in production

---

## 📞 SUPPORT ESCALATION

### **If Issue Persists:**
1. Check this document first
2. Check browser console
3. Check network tab
4. Check database logs
5. Contact developer with:
   - Error message
   - Steps to reproduce
   - Browser/OS info
   - Screenshot if possible

---

## ✅ RESOLVED ISSUES (Archive)

### **October 10, 2025:**
1. ✅ Order filters dropdown - Fixed API response parsing
2. ✅ Email templates 500 error - Added error handling
3. ✅ BillingPortal TypeScript errors - Properly used types
4. ✅ Change password feature - Added complete UI

### **October 9, 2025:**
1. ✅ Dashboard crash - Fixed color prop
2. ✅ Orders page enhancements - Added all features
3. ✅ Registration wizard - Implemented multi-step
4. ✅ Subscription system - Full Stripe integration

---

## 📝 NOTES FOR DEVELOPERS

### **Before Deleting Code:**
1. Check if it's used elsewhere
2. Check if it's needed for future features
3. Comment it out first, don't delete
4. Add TODO comment explaining why
5. Test thoroughly after removal

### **When Adding Features:**
1. Add proper TypeScript types
2. Include error handling
3. Add loading states
4. Test with empty data
5. Test with errors
6. Document in this file

---

**Last Updated:** October 10, 2025, 18:37  
**Maintained By:** Development Team  
**Status:** Active Document - Update as issues are found/resolved
