# Authentication Debug Guide

**Issue:** Logged in as admin but getting 401 errors

---

## 🔍 **CHECK 1: JWT Token in Browser**

Open browser console and check:

```javascript
// Check if token exists
localStorage.getItem('token')
// or
sessionStorage.getItem('token')
// or check cookies
document.cookie
```

**Expected:** Should see a JWT token string

---

## 🔍 **CHECK 2: API Client Configuration**

Check if `apiClient` is sending the token:

**File:** `apps/web/src/services/apiClient.ts`

Should have:
```typescript
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 🔍 **CHECK 3: Backend JWT Verification**

Week 2 APIs use this pattern:

```typescript
const verifyAdmin = (req: VercelRequest): any => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, getJWTSecret()) as any;
  
  if (decoded.role !== 'admin') {
    throw new Error('Admin access required');
  }
  
  return decoded;
};
```

**Check:**
1. Is `JWT_SECRET` set in environment variables?
2. Is the token being sent in headers?
3. Is the token valid and not expired?

---

## 🔍 **CHECK 4: Environment Variables**

In Vercel, check these are set:

```
JWT_SECRET=your-secret-key
DATABASE_URL=your-supabase-url
```

---

## 🔍 **CHECK 5: Token Payload**

Decode your JWT token at https://jwt.io

Should contain:
```json
{
  "user_id": "uuid",
  "email": "admin@example.com",
  "role": "admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Check:**
- `role` field exists and equals "admin"
- `exp` (expiration) is in the future
- Token is signed with correct secret

---

## 🔍 **CHECK 6: Network Tab**

In browser DevTools > Network:

1. Find a failing request (e.g., `/api/admin/subscriptions`)
2. Check **Request Headers**
3. Look for: `Authorization: Bearer eyJhbGc...`

**If missing:** Frontend not sending token  
**If present:** Backend not accepting it

---

## 🔧 **QUICK FIX: Test Token Manually**

In browser console:

```javascript
// Get your token
const token = localStorage.getItem('token');
console.log('Token:', token);

// Test an API call
fetch('/api/analytics/platform?period=30', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

---

## 🎯 **MOST LIKELY ISSUES:**

### **1. Token Not Being Sent**
**Fix:** Check `apiClient.ts` has interceptor

### **2. JWT_SECRET Mismatch**
**Fix:** Ensure Vercel env var matches token signing secret

### **3. Token Expired**
**Fix:** Log out and log back in to get fresh token

### **4. Role Field Missing**
**Fix:** Check login API returns `role` in JWT payload

### **5. CORS Issues**
**Fix:** Check API responses have proper CORS headers

---

## 📝 **DEBUG STEPS:**

1. ✅ Check browser console for token
2. ✅ Check Network tab for Authorization header
3. ✅ Decode token at jwt.io
4. ✅ Verify JWT_SECRET in Vercel
5. ✅ Check apiClient.ts interceptor
6. ✅ Test API call manually in console

---

## 🔧 **TEMPORARY WORKAROUND:**

If you need to test Week 2 features immediately, you can temporarily disable auth:

**In API files, comment out:**
```typescript
// verifyAdmin(req); // TEMPORARY - REMOVE AFTER TESTING
```

**⚠️ WARNING:** Only do this in development, never in production!

---

## ✅ **EXPECTED BEHAVIOR:**

When auth is working:
- ✅ Token in localStorage/cookies
- ✅ Authorization header in requests
- ✅ APIs return 200 with data
- ✅ No 401 errors

---

**Run through these checks and let me know what you find!**
