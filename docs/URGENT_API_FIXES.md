# 🚨 URGENT API FIXES - November 9, 2025

**Status:** CRITICAL - Production Errors
**Time:** 12:58 AM

---

## 🔴 **ERRORS DETECTED**

```
1. api/notifications - 401 Unauthorized
2. api/orders?page=1&limit=10... - 500 Internal Server Error
```

---

## 🔍 **ROOT CAUSE**

### **Error 1: `/api/notifications` - 401**

**Problem:**
- Frontend is calling `GET /api/notifications`
- But `/api/notifications/index.ts` only handles POST (for sending emails)
- The GET endpoint is in `/api/notifications/list.ts`

**Current Routing:**
```
GET /api/notifications → index.ts (expects POST) → 401 error
```

**Should Be:**
```
GET /api/notifications → list.ts (handles GET) → Success
```

---

### **Error 2: `/api/orders` - 500**

**Possible Causes:**
1. **JWT_SECRET not set** in environment variables
2. **Database connection error**
3. **RLS context error** (user_id missing)
4. **Query syntax error**

---

## ✅ **FIXES**

### **Fix 1: Notifications Routing**

**Option A: Rename Files (RECOMMENDED)**
```bash
# Rename index.ts to emails.ts (for email sending)
mv api/notifications/index.ts api/notifications/emails.ts

# Rename list.ts to index.ts (for listing notifications)
mv api/notifications/list.ts api/notifications/index.ts
```

**Option B: Update Frontend** 
```typescript
// Change frontend API call from:
fetch('/api/notifications')

// To:
fetch('/api/notifications/list')
```

---

### **Fix 2: Orders 500 Error**

**Step 1: Check Environment Variables**
```bash
# Verify JWT_SECRET is set
echo $JWT_SECRET

# If not set, add to .env.local:
JWT_SECRET=your-secret-key-min-32-characters-long
```

**Step 2: Check Database Connection**
```typescript
// Add logging to api/orders/index.ts line 247
console.error('Get orders error:', error);
console.error('Error stack:', error.stack);
console.error('User object:', user);
```

**Step 3: Check Token Format**
```typescript
// Verify token includes required fields
const decoded = jwt.verify(token, process.env.JWT_SECRET);
console.log('Decoded token:', decoded);
// Should have: { userId, user_id, role, user_role }
```

---

## 🚀 **IMMEDIATE ACTION PLAN**

### **Priority 1: Fix Notifications (5 minutes)**

**Execute these commands:**
```bash
cd api/notifications

# Backup current files
cp index.ts index.ts.backup
cp list.ts list.ts.backup

# Rename for correct routing
mv index.ts emails.ts
mv list.ts index.ts

# Update emails.ts export path if needed
```

**Or update frontend:**
```typescript
// In your frontend code, change:
const response = await fetch('/api/notifications', {
  headers: { Authorization: `Bearer ${token}` }
});

// To:
const response = await fetch('/api/notifications/list', {
  headers: { Authorization: `Bearer ${token}` }
});
```

---

### **Priority 2: Fix Orders Error (10 minutes)**

**Step 1: Add Debug Logging**

Edit `api/orders/index.ts` at line 247:

```typescript
} catch (error) {
  console.error('=== ORDERS API ERROR ===');
  console.error('Error:', error);
  console.error('Error message:', error instanceof Error ? error.message : 'Unknown');
  console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
  console.error('Request query:', req.query);
  console.error('Request headers:', req.headers);
  console.error('User object:', user);
  console.error('========================');
  
  res.status(500).json({
    success: false,
    message: error instanceof Error ? error.message : 'Failed to fetch orders',
    error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
  });
}
```

**Step 2: Check Environment**

Create `.env.local` if it doesn't exist:
```bash
# .env.local
JWT_SECRET=your-super-secret-key-that-is-at-least-32-characters-long
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=your-database-url
NODE_ENV=development
```

**Step 3: Test Token**

```bash
# In browser console:
const token = localStorage.getItem('token');
console.log('Token:', token);

# Decode token (use jwt.io):
# Verify it has: userId, user_id, role, user_role
```

---

## 🔧 **QUICK FIX SCRIPT**

Create `scripts/fix-api-errors.sh`:

```bash
#!/bin/bash

echo "🔧 Fixing API errors..."

# Fix 1: Notifications routing
cd api/notifications
if [ -f "index.ts" ] && [ -f "list.ts" ]; then
  echo "📝 Renaming notifications files..."
  mv index.ts emails.ts
  mv list.ts index.ts
  echo "✅ Notifications routing fixed"
fi

# Fix 2: Check environment
cd ../..
if [ ! -f ".env.local" ]; then
  echo "⚠️  .env.local not found!"
  echo "Creating template..."
  cat > .env.local << EOF
JWT_SECRET=change-this-to-a-secure-random-string-min-32-chars
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=your-database-url
NODE_ENV=development
EOF
  echo "✅ .env.local template created - PLEASE UPDATE VALUES!"
fi

# Fix 3: Restart dev server
echo "🔄 Please restart your dev server"
echo "✅ Fixes applied!"
```

---

## 📋 **VERIFICATION CHECKLIST**

After applying fixes:

### **Test Notifications:**
```bash
# Should return 200 with notifications list
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/notifications
```

### **Test Orders:**
```bash
# Should return 200 with orders list
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/orders?page=1&limit=10"
```

### **Check Logs:**
```bash
# Look for error details in console
# Should see detailed error messages if still failing
```

---

## 🎯 **EXPECTED RESULTS**

### **Before Fix:**
```
❌ GET /api/notifications → 401 Unauthorized
❌ GET /api/orders → 500 Internal Server Error
```

### **After Fix:**
```
✅ GET /api/notifications → 200 OK (notifications list)
✅ GET /api/orders → 200 OK (orders list)
```

---

## 🚨 **IF STILL FAILING**

### **Notifications Still 401:**
1. Check token is valid: `jwt.verify(token, JWT_SECRET)`
2. Check token includes `user_id` field
3. Check Authorization header format: `Bearer <token>`
4. Check CORS headers are set

### **Orders Still 500:**
1. Check database connection
2. Check RLS policies allow user access
3. Check user has correct role (merchant/courier/admin)
4. Check stores/couriers tables have data for user
5. Run SQL queries manually to test

---

## 📞 **DEBUGGING COMMANDS**

### **Check Token:**
```javascript
// In browser console:
const token = localStorage.getItem('token');
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]));
console.log('Token payload:', payload);
```

### **Check Database:**
```sql
-- Check if user exists
SELECT * FROM users WHERE user_id = 'YOUR_USER_ID';

-- Check if stores exist for merchant
SELECT * FROM stores WHERE owner_user_id = 'YOUR_USER_ID';

-- Check if orders exist
SELECT COUNT(*) FROM orders;
```

### **Check Environment:**
```bash
# Verify environment variables are loaded
node -e "console.log(process.env.JWT_SECRET)"
```

---

## ✅ **APPLY FIXES NOW**

**Option 1: Manual Fix (Recommended)**
```bash
# 1. Rename notifications files
cd api/notifications
mv index.ts emails.ts
mv list.ts index.ts

# 2. Check .env.local exists and has JWT_SECRET
cat .env.local | grep JWT_SECRET

# 3. Restart dev server
npm run dev
```

**Option 2: Frontend Fix (Temporary)**
```typescript
// Update API calls in frontend:
// Change: /api/notifications
// To: /api/notifications/list
```

---

**STATUS:** Ready to apply fixes
**TIME TO FIX:** 5-10 minutes
**PRIORITY:** CRITICAL

---

**NEXT STEPS:**
1. Apply Fix 1 (notifications routing)
2. Test notifications endpoint
3. Apply Fix 2 (orders debugging)
4. Check logs for specific error
5. Report back with results
