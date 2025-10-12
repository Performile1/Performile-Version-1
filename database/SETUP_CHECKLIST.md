# Database Setup Checklist

**Last Updated:** October 12, 2025, 6:10 PM

---

## 📋 Required Database Setup Steps

### Step 1: Audit Current Database

Run this to see what you have:

```bash
psql -U your_username -d performile_db -f database/audit-database.sql
```

**This will show you:**
- ✅ What tables exist
- ✅ If RLS is enabled
- ✅ If RLS functions exist
- ✅ How much data you have
- ✅ What's missing

---

### Step 2: Apply RLS Policies (REQUIRED)

**This is the most important step!**

```bash
psql -U your_username -d performile_db -f database/row-level-security-safe.sql
```

**What this does:**
- Creates 6 helper functions (`current_user_id`, `current_user_role`, `is_admin`, etc.)
- Enables RLS on 6+ tables
- Creates role-based policies for data isolation
- Protects your data at the database level

**Expected output:**
```
NOTICE: Setting up RLS for Stores table...
NOTICE: Stores table RLS configured successfully
NOTICE: Setting up RLS for Orders table...
NOTICE: Orders table RLS configured successfully
NOTICE: ✅ RLS setup complete!
```

---

### Step 3: Verify RLS Setup

Run the audit again to confirm:

```bash
psql -U your_username -d performile_db -f database/audit-database.sql
```

**Look for:**
- ✅ All 6 RLS functions exist
- ✅ RLS is ENABLED on tables
- ✅ Policies are created

---

### Step 4: Test RLS (Optional but Recommended)

```sql
-- Connect to database
psql -U your_username -d performile_db

-- Test as merchant
SET app.user_id = 'your-merchant-uuid';
SET app.user_role = 'merchant';
SELECT * FROM Stores;  -- Should only show merchant's stores

-- Test as courier
SET app.user_id = 'your-courier-uuid';
SET app.user_role = 'courier';
SELECT * FROM Orders;  -- Should only show courier's deliveries

-- Reset
RESET app.user_id;
RESET app.user_role;
```

---

## 🗂️ Database Files Reference

| File | Purpose | When to Run |
|------|---------|-------------|
| `audit-database.sql` | Check what exists | **Run first** |
| `row-level-security-safe.sql` | Apply RLS policies | **Required** |
| `create-test-users.sql` | Create test users | Optional (testing) |
| `demo_users_crypto.sql` | Demo data | Optional (testing) |
| `merchant-courier-selection-with-limits.sql` | Courier selection limits | Optional (if using this feature) |

---

## ✅ Quick Setup (Copy-Paste)

```bash
# 1. Check what you have
psql -U postgres -d performile_db -f database/audit-database.sql

# 2. Apply RLS (REQUIRED)
psql -U postgres -d performile_db -f database/row-level-security-safe.sql

# 3. Verify it worked
psql -U postgres -d performile_db -f database/audit-database.sql

# 4. (Optional) Create test users
psql -U postgres -d performile_db -f database/create-test-users.sql
```

**Replace `postgres` with your database username**

---

## 🚨 Common Issues

### Issue: "relation does not exist"

**Cause:** Table names might be different (Stores vs shops, Orders vs orders)  
**Solution:** The RLS script handles this automatically - it checks for both naming conventions

### Issue: "permission denied"

**Cause:** User doesn't have permission to create functions  
**Solution:** Run as database owner or superuser

```bash
# Run as superuser
psql -U postgres -d performile_db -f database/row-level-security-safe.sql
```

### Issue: "function already exists"

**Cause:** RLS script was run before  
**Solution:** This is fine! The script uses `CREATE OR REPLACE` so it will update existing functions

---

## 📊 What Tables Need RLS?

**Already Protected (if they exist):**
- ✅ `Stores` / `shops` - Merchant shop data
- ✅ `Orders` - All order data
- ✅ `merchant_courier_selections` - Courier selections
- ✅ `team_members` - Team management
- ✅ `claims` - Claims and disputes
- ✅ `reviews` - Customer reviews

**The script automatically:**
- Checks if each table exists
- Only applies policies to existing tables
- Skips tables that don't exist
- Works with both naming conventions (Stores/shops, etc.)

---

## 🎯 Success Criteria

After running the setup, you should see:

```
✅ 6 RLS helper functions exist
✅ RLS ENABLED on all protected tables
✅ Multiple policies per table (select, insert, update, delete)
✅ No errors in the audit report
```

---

## 📞 Need Help?

**Check the documentation:**
- `docs/RLS_IMPLEMENTATION_GUIDE.md` - How RLS works
- `docs/RLS_INTEGRATION_COMPLETE.md` - Complete reference
- `docs/RLS_API_INTEGRATION_STATUS.md` - API integration details

**Run the audit:**
```bash
psql -U your_user -d performile_db -f database/audit-database.sql
```

This will tell you exactly what's missing!
