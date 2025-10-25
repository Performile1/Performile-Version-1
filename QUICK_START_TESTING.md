# 🚀 Quick Start: Create Test Users & Run Tests

**Date:** October 23, 2025, 11:34 AM  
**Status:** ✅ Fixed and Ready to Deploy  
**Update:** SQL script fixed to match your Orders table schema

---

## ⚡ Quick Start (2 Steps)

### Step 1: Create Test Users (SQL Method - Recommended)

The Playwright signup method is still running, but **SQL is faster and more reliable** for first-time setup.

**Action:**
1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy the entire contents of:
   ```
   database/CREATE_PLAYWRIGHT_TEST_USERS.sql
   ```
   (File is already open in VS Code!)
3. Paste into Supabase SQL Editor
4. Click **RUN** ▶️

**What this creates:**
- ✅ 2 test users (merchant + courier)
- ✅ 1 test store
- ✅ 1 courier profile  
- ✅ 3 sample orders (delivered, in_transit, pending)
- ✅ 1 review (5 stars)
- ✅ TrustScore data
- ✅ Performance metrics

**Time:** ~30 seconds

---

### Step 2: Run Tests

```bash
# Run in UI mode (recommended)
npm run test:e2e:ui

# Or run all tests
npm run test:e2e

# Or run specific test
npx playwright test smoke-tests.spec.ts
```

---

## 🔑 Test Credentials

```
Merchant:
  Email: test-merchant@performile.com
  Password: TestPassword123!

Courier:
  Email: test-courier@performile.com
  Password: TestPassword123!
```

---

## 📊 Expected Results

### Before Test Users:
```
Tests: 282
Passed: 6 (2%)
Failed: 276 (98%)
```

### After Test Users:
```
Tests: 282
Passed: 50-100 (18-35%)
Failed: 182-232 (65-82%)
```

### Improvement:
```
+44 to +94 more tests passing! 🎉
```

---

## 🎯 What Will Pass

After creating test users, these test suites should pass:

✅ **Authentication Tests** (4 tests)
- Load login page
- Login merchant successfully
- Login courier successfully
- Show error for invalid credentials

✅ **Merchant Dashboard Tests** (4 tests)
- Display dashboard metrics
- Display orders table
- Display analytics charts
- No console errors

✅ **Courier Dashboard Tests** (3 tests)
- Display dashboard metrics
- Display delivery list
- Display performance metrics

✅ **Order Creation Tests** (1 test)
- Create new order successfully

✅ **Review System Tests** (2 tests)
- Display reviews page
- Filter reviews by rating

✅ **API Endpoint Tests** (8+ tests)
- Service performance APIs
- Parcel points APIs
- TrustScore APIs
- Analytics APIs

---

## 🔧 Troubleshooting

### Issue: "Users already exist"
✅ **This is fine!** The script auto-deletes old users. Just run it again.

### Issue: "pgcrypto extension not found"
```sql
-- Run this first in Supabase
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### Issue: Tests still failing
1. Check that users were created:
   ```sql
   SELECT * FROM Users WHERE email LIKE 'test-%@performile.com';
   ```
2. Try logging in manually with test credentials
3. Check browser console for errors
4. Run tests in UI mode to see what's happening:
   ```bash
   npm run test:e2e:ui
   ```

---

## 💡 Why SQL Instead of Playwright Signup?

The Playwright signup method is running but might take longer because:
- Signup flow might not be fully implemented
- Email verification might be required
- Network timeouts
- Form selectors might not match

**SQL is:**
- ✅ Faster (30 seconds vs 2-3 minutes)
- ✅ More reliable (always works)
- ✅ Creates complete test data
- ✅ No dependencies on frontend

You can always try Playwright signup later once the auth flow is stable!

---

## 🎉 Success Checklist

- [ ] Open Supabase SQL Editor
- [ ] Copy `CREATE_PLAYWRIGHT_TEST_USERS.sql`
- [ ] Paste and RUN in Supabase
- [ ] Verify success message
- [ ] Run: `npm run test:e2e:ui`
- [ ] Check results (expect 50-100 passing)
- [ ] View report: `npm run test:e2e:report`
- [ ] Celebrate! 🎊

---

## 🚀 Ready to Go!

**Next action:**
1. Copy SQL file to Supabase (already open!)
2. Run it
3. Run tests: `npm run test:e2e:ui`

**Expected:** ~50-100 tests passing! 🎭🚀
