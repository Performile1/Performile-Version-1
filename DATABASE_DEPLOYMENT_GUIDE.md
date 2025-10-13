# 🗄️ Database Deployment Guide

**Last Updated:** October 13, 2025, 9:51 PM

---

## ✅ **What Needs to Be Deployed**

Your application code is calling these database functions that may not exist yet:

### **1. RLS Helper Functions** (Required for Role-Based Access)
- `current_user_id()` - Gets user ID from session
- `current_user_role()` - Gets user role from session  
- `is_admin()` - Checks if user is admin
- `is_merchant()` - Checks if user is merchant
- `is_courier()` - Checks if user is courier
- `is_consumer()` - Checks if user is consumer

### **2. Subscription Limit Functions** (Required for Tier Enforcement)
- `get_user_subscription_limits(user_id)` - Gets user's plan limits
- `check_subscription_limit(user_id, limit_type)` - Checks if action allowed
- `increment_usage(user_id, usage_type, amount)` - Tracks usage

---

## 🚀 **How to Deploy**

### **Option 1: Quick Deploy (Recommended)**

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Click on "SQL Editor" in the left sidebar

2. **Run the Deployment Script**
   - Open `database/DEPLOY_TO_SUPABASE.sql`
   - Copy the entire contents
   - Paste into Supabase SQL Editor
   - Click "Run" button

3. **Verify Deployment**
   - You should see success messages:
     - ✅ Step 1: RLS Helper Functions Created
     - ✅ Step 2: Subscription Limit Functions Created
     - ✅ ALL FUNCTIONS DEPLOYED SUCCESSFULLY!

4. **Done!**
   - Your application will now work correctly
   - Orders page will load without errors
   - Subscription limits will be enforced

---

### **Option 2: Manual Deploy (If Quick Deploy Fails)**

If the quick deploy fails, run these files in order:

#### **Step 1: RLS Functions**
```sql
-- File: database/row-level-security-safe.sql
-- Run lines 10-64 (just the helper functions)
```

#### **Step 2: Subscription Functions**
```sql
-- File: database/create-subscription-limits-function.sql
-- Run the entire file
```

---

## 🧪 **How to Verify Deployment**

### **Test 1: Check Functions Exist**

Run this in Supabase SQL Editor:

```sql
SELECT 
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc
WHERE proname IN (
  'current_user_id',
  'current_user_role', 
  'is_admin',
  'is_merchant',
  'is_courier',
  'is_consumer',
  'get_user_subscription_limits',
  'check_subscription_limit',
  'increment_usage'
)
ORDER BY proname;
```

**Expected Result:** Should return 9 rows (all functions)

---

### **Test 2: Test RLS Functions**

```sql
-- Set test context
SET app.user_id = 'your-user-id-here';
SET app.user_role = 'admin';

-- Test functions
SELECT 
  current_user_id() as user_id,
  current_user_role() as user_role,
  is_admin() as is_admin;
```

**Expected Result:**
- user_id: your-user-id-here
- user_role: admin
- is_admin: true

---

### **Test 3: Test Subscription Functions**

```sql
-- Get limits for a user (replace with actual user_id)
SELECT * FROM get_user_subscription_limits(
  (SELECT user_id FROM users WHERE email = 'admin@performile.com' LIMIT 1)
);

-- Check if user can create order
SELECT check_subscription_limit(
  (SELECT user_id FROM users WHERE email = 'admin@performile.com' LIMIT 1),
  'order'
) as can_create_order;
```

**Expected Result:**
- Should return plan details and limits
- can_create_order should be true or false

---

## ❌ **Troubleshooting**

### **Error: "function does not exist"**

**Problem:** Functions not deployed to database

**Solution:**
1. Run `DEPLOY_TO_SUPABASE.sql` in Supabase SQL Editor
2. Check for error messages
3. If errors, run files individually (Option 2)

---

### **Error: "permission denied for function"**

**Problem:** Functions created but permissions not granted

**Solution:**
```sql
GRANT EXECUTE ON FUNCTION current_user_id() TO PUBLIC;
GRANT EXECUTE ON FUNCTION current_user_role() TO PUBLIC;
GRANT EXECUTE ON FUNCTION is_admin() TO PUBLIC;
GRANT EXECUTE ON FUNCTION is_merchant() TO PUBLIC;
GRANT EXECUTE ON FUNCTION is_courier() TO PUBLIC;
GRANT EXECUTE ON FUNCTION is_consumer() TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_user_subscription_limits(UUID) TO PUBLIC;
GRANT EXECUTE ON FUNCTION check_subscription_limit(UUID, VARCHAR) TO PUBLIC;
GRANT EXECUTE ON FUNCTION increment_usage(UUID, VARCHAR, INTEGER) TO PUBLIC;
```

---

### **Error: "column does not exist"**

**Problem:** Database schema mismatch

**Solution:**
1. Check if `user_subscriptions` table exists
2. Check if `subscription_plans` table exists
3. If missing, run `database/create-subscription-system.sql`

---

## 📊 **What Each Function Does**

### **RLS Helper Functions:**

| Function | Purpose | Returns |
|----------|---------|---------|
| `current_user_id()` | Gets user ID from session context | UUID |
| `current_user_role()` | Gets user role from session context | TEXT |
| `is_admin()` | Checks if current user is admin | BOOLEAN |
| `is_merchant()` | Checks if current user is merchant | BOOLEAN |
| `is_courier()` | Checks if current user is courier | BOOLEAN |
| `is_consumer()` | Checks if current user is consumer | BOOLEAN |

**Used By:** RLS policies to filter data by role

---

### **Subscription Limit Functions:**

| Function | Purpose | Returns |
|----------|---------|---------|
| `get_user_subscription_limits(user_id)` | Gets all limits for user's plan | TABLE |
| `check_subscription_limit(user_id, type)` | Checks if user can perform action | BOOLEAN |
| `increment_usage(user_id, type, amount)` | Increments usage counter | BOOLEAN |

**Used By:** API endpoints to enforce subscription limits

---

## 🔄 **When to Re-Deploy**

You need to re-deploy if:

1. ✅ **First time setup** - Functions don't exist yet
2. ✅ **After database reset** - Functions were deleted
3. ✅ **After schema changes** - Function signatures changed
4. ❌ **After code changes** - Functions are in database, not code

---

## 📝 **Deployment Checklist**

Before deploying:
- [ ] Backup your database (Supabase does this automatically)
- [ ] Test in development first (if you have a dev database)
- [ ] Read through the SQL script
- [ ] Have rollback plan ready

During deployment:
- [ ] Open Supabase SQL Editor
- [ ] Copy `DEPLOY_TO_SUPABASE.sql` contents
- [ ] Paste and run
- [ ] Check for success messages
- [ ] Look for any error messages

After deployment:
- [ ] Run verification tests
- [ ] Test Orders page in application
- [ ] Test creating an order
- [ ] Check subscription limit enforcement
- [ ] Monitor logs for errors

---

## 🎯 **Expected Behavior After Deployment**

### **Orders Page:**
- ✅ Loads without 500 error
- ✅ Shows orders based on user role
- ✅ Merchants see their store orders
- ✅ Couriers see assigned orders
- ✅ Admins see all orders

### **Order Creation:**
- ✅ Checks subscription limit before creating
- ✅ Shows error if limit reached
- ✅ Increments usage counter on success
- ✅ Provides upgrade prompt if needed

### **Role-Based Access:**
- ✅ Users only see their own data
- ✅ RLS policies automatically filter
- ✅ No manual WHERE clauses needed
- ✅ Secure by default

---

## 🆘 **Need Help?**

### **Check These Files:**
- `CURRENT_STATE.md` - Current platform status
- `DEVELOPMENT_PLAN.md` - Future improvements
- `AUTH_FLOW_VERIFICATION.md` - Authentication testing

### **Common Issues:**
1. **Orders page 500 error** → Deploy functions
2. **Can't create orders** → Check subscription limits
3. **See wrong data** → Check RLS policies
4. **Permission denied** → Grant execute permissions

---

## 📞 **Quick Reference**

**Supabase SQL Editor:**
- Dashboard → SQL Editor → New Query

**Run Script:**
1. Copy SQL
2. Paste in editor
3. Click "Run" or press Ctrl+Enter

**Check Logs:**
- Dashboard → Logs → Postgres Logs

**Rollback:**
```sql
-- Drop functions if needed
DROP FUNCTION IF EXISTS current_user_id();
DROP FUNCTION IF EXISTS current_user_role();
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS is_merchant();
DROP FUNCTION IF EXISTS is_courier();
DROP FUNCTION IF EXISTS is_consumer();
DROP FUNCTION IF EXISTS get_user_subscription_limits(UUID);
DROP FUNCTION IF EXISTS check_subscription_limit(UUID, VARCHAR);
DROP FUNCTION IF EXISTS increment_usage(UUID, VARCHAR, INTEGER);
```

---

**Last Updated:** October 13, 2025  
**Status:** Ready to Deploy  
**Estimated Time:** 2-5 minutes
