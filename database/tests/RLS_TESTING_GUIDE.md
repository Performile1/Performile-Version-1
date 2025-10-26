# RLS Policy Testing Guide

**Date:** October 26, 2025  
**Purpose:** Test Row Level Security policies for data isolation  
**Test Script:** `2025-10-26_test_rls_policies.sql`

---

## 🎯 What This Tests

This script verifies that RLS policies correctly isolate data between users:

- ✅ **Merchants** can only see their own orders, stores, and payments
- ✅ **Couriers** can only see their assigned deliveries and tracking
- ✅ **Admins** can see all data across the platform
- ✅ **Users** cannot access other users' private data

---

## 📋 Prerequisites

Before running the tests, ensure you have:

1. **Test users created** in your database:
   - `merchant@performile.com` (role: merchant)
   - `courier@performile.com` (role: courier)
   - `admin@performile.com` (role: admin)

2. **RLS policies deployed** (all 3 migration files):
   - `2025-10-26_create_rls_policies_critical.sql`
   - `2025-10-26_create_rls_policies_tracking.sql`
   - `2025-10-26_create_rls_policies_communication.sql`

3. **Test data** in the database:
   - At least 1 merchant with stores
   - At least 1 courier with assigned orders
   - At least 1 admin user
   - Some orders, tracking data, and reviews

---

## 🚀 How to Run the Tests

### Option 1: Supabase SQL Editor

1. Open Supabase Dashboard → SQL Editor
2. Copy the contents of `2025-10-26_test_rls_policies.sql`
3. Paste into SQL Editor
4. Click **Run**
5. Review the output in the Results panel

### Option 2: psql Command Line

```bash
psql -h your-db-host -U postgres -d your-database -f database/tests/2025-10-26_test_rls_policies.sql
```

### Option 3: DBeaver / pgAdmin

1. Open your database connection
2. Create a new SQL script
3. Copy the contents of `2025-10-26_test_rls_policies.sql`
4. Execute the script
5. Review the Messages/Output panel

---

## 📊 Test Scenarios

### Test 1: Merchant Data Isolation 🏪

**What it tests:**
- Merchant can see their own orders
- Merchant can see their own stores
- Merchant CANNOT see other merchants' data

**Expected output:**
```
✅ Orders visible to merchant: X
✅ Stores visible to merchant: Y
✅ PASS: Merchant CANNOT see other merchants orders
```

**If it fails:**
- Check that merchant has `merchant_id` in merchants table
- Verify RLS policies are enabled on `orders` and `stores` tables
- Check that `owner_user_id` matches in stores table

---

### Test 2: Courier Data Isolation 🚚

**What it tests:**
- Courier can see their assigned orders
- Courier can see tracking for their orders
- Courier CANNOT see other couriers' orders

**Expected output:**
```
✅ Orders assigned to courier: X
✅ Tracking records visible to courier: Y
✅ PASS: Courier CANNOT see other couriers orders
```

**If it fails:**
- Check that courier has `courier_id` in couriers table
- Verify orders have `courier_id` assigned
- Check RLS policies on `orders` and `tracking_data` tables

---

### Test 3: Admin Access 👑

**What it tests:**
- Admin can see ALL orders
- Admin can see ALL merchants
- Admin can see ALL couriers

**Expected output:**
```
✅ Total orders visible to admin: X
✅ Total merchants visible to admin: Y
✅ Total couriers visible to admin: Z
✅ PASS: Admin can see all data
```

**If it fails:**
- Check that user has `user_role = 'admin'`
- Verify RLS policies allow admin access (most policies should)
- Check that admin policies use `user_role = 'admin'` condition

---

### Test 4: Critical Tables RLS 🔐

**What it tests:**
- Payment methods isolation
- Subscription isolation
- API credentials isolation

**Expected output:**
```
✅ Payment methods visible: X
✅ Subscriptions visible: Y
✅ API credentials visible: Z
```

**If it fails:**
- Check that tables exist (some may not be created yet)
- Verify RLS policies on payment_methods, subscriptions, api_credentials
- Check that `user_id` matches in these tables

---

### Test 5: Tracking Tables RLS 📦

**What it tests:**
- Tracking data isolation
- Tracking events isolation

**Expected output:**
```
✅ Tracking data records visible: X
✅ Tracking events visible: Y
```

**If it fails:**
- Check that tracking_data and tracking_events tables exist
- Verify RLS policies link via order_id → courier_id
- Check that tracking_id relationships are correct

---

### Test 6: Communication Tables RLS 💬

**What it tests:**
- Conversation isolation
- Message isolation
- Review visibility (public)

**Expected output:**
```
✅ Conversations visible: X
✅ Messages visible: Y
✅ Reviews visible (public): Z
```

**If it fails:**
- Check that conversationparticipants table has user_id entries
- Verify RLS policies on conversations and messages
- Reviews should be public (visible to all)

---

## ✅ Success Criteria

The tests PASS if:

1. **Merchants** see only their own data (orders, stores, payments)
2. **Couriers** see only their assigned orders and tracking
3. **Admins** see ALL data across the platform
4. **No cross-user data leakage** (users can't see others' private data)
5. **Public data** (like reviews) is visible to everyone

---

## ❌ Common Issues & Fixes

### Issue: "No merchant user found"

**Cause:** Test user doesn't exist  
**Fix:** Create test users:

```sql
-- Create merchant user
INSERT INTO users (email, user_role, password_hash)
VALUES ('merchant@performile.com', 'merchant', 'hashed_password');

-- Create merchant profile
INSERT INTO merchants (user_id, store_name)
SELECT user_id, 'Test Store'
FROM users WHERE email = 'merchant@performile.com';
```

### Issue: "Merchant can see other merchants orders"

**Cause:** RLS policies not working  
**Fix:**

1. Check RLS is enabled: `ALTER TABLE orders ENABLE ROW LEVEL SECURITY;`
2. Verify policies exist: `SELECT * FROM pg_policies WHERE tablename = 'orders';`
3. Re-run RLS migration: `2025-10-26_create_rls_policies_critical.sql`

### Issue: "Table does not exist"

**Cause:** Table hasn't been created yet  
**Fix:** This is expected for some tables. The test will skip them with a warning.

### Issue: "Admin cannot see all data"

**Cause:** Admin RLS policies too restrictive  
**Fix:** Check that admin policies allow `user_role = 'admin'` to see all data

---

## 📝 Interpreting Results

### Good Results ✅

```
✅ Orders visible to merchant: 5
✅ Stores visible to merchant: 2
✅ PASS: Merchant CANNOT see other merchants orders
```

This means RLS is working correctly!

### Bad Results ❌

```
✅ Orders visible to merchant: 5
✅ Stores visible to merchant: 2
❌ FAIL: Merchant can see 10 other merchants orders
```

This means RLS is NOT working - merchant can see other merchants' data!

**Action:** Review and fix RLS policies for the `orders` table.

---

## 🔧 Troubleshooting

### Enable RLS on a table

```sql
ALTER TABLE your_table_name ENABLE ROW LEVEL SECURITY;
```

### Check if RLS is enabled

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

### List all RLS policies

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
ORDER BY tablename, policyname;
```

### Drop and recreate a policy

```sql
DROP POLICY IF EXISTS policy_name ON table_name;
CREATE POLICY policy_name ON table_name
  FOR SELECT USING (user_id = auth.uid());
```

---

## 📈 Next Steps After Testing

1. **If all tests pass:** ✅
   - Document test results
   - Move to production deployment
   - Set up monitoring for RLS violations

2. **If tests fail:** ❌
   - Identify which policies are failing
   - Review RLS policy logic
   - Fix and re-test
   - Document changes made

3. **Missing tables:** ⚠️
   - Create missing tables if needed
   - Add RLS policies for new tables
   - Re-run tests

---

## 📚 Additional Resources

- **Supabase RLS Docs:** https://supabase.com/docs/guides/auth/row-level-security
- **PostgreSQL RLS Docs:** https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- **Framework Rule #28:** Verify all column names before RLS policies

---

## 🎯 Summary

This test script validates that:

- ✅ 21 tables are protected with RLS
- ✅ 56 policies enforce data isolation
- ✅ Users can only access their own data
- ✅ Admins have full access
- ✅ No data leakage between users

**Run this test after every RLS policy change to ensure security!**
