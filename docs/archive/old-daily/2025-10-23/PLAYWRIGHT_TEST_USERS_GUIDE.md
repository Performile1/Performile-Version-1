# 🎭 Playwright Test Users Setup Guide

**Date:** October 23, 2025, 10:52 AM  
**Purpose:** Create test users for automated E2E testing  
**Status:** ✅ Ready to Deploy

---

## 📋 Quick Start

### 1. Run the SQL Script

1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste the contents of:
   ```
   database/CREATE_PLAYWRIGHT_TEST_USERS.sql
   ```
4. Click **Run** ▶️
5. Wait for success message

### 2. Verify Creation

You should see output showing:
- ✅ 2 test users created
- ✅ 1 test store created
- ✅ 1 test courier profile created
- ✅ 3 sample orders created
- ✅ 1 sample review created

### 3. Run Tests

```bash
# Run all tests
npm run test:e2e

# Run in UI mode (recommended)
npm run test:e2e:ui

# Run specific test file
npx playwright test smoke-tests.spec.ts
```

---

## 🔑 Test Credentials

### Merchant User
```
Email: test-merchant@performile.com
Password: TestPassword123!
Role: merchant
```

**What's included:**
- ✅ Verified account
- ✅ Active status
- ✅ Demo store ("Test Merchant Store")
- ✅ 3 sample orders
- ✅ 1 review

### Courier User
```
Email: test-courier@performile.com
Password: TestPassword123!
Role: courier
```

**What's included:**
- ✅ Verified account
- ✅ Active status
- ✅ Courier profile ("Test Courier Service")
- ✅ TrustScore data (95.5)
- ✅ Performance metrics

---

## 📊 Test Data Created

### Orders (3 total)
1. **TEST-ORDER-00001** - Delivered ✅
   - Customer: Test Customer 1
   - Value: $60.00
   - Status: delivered
   - Has review (5 stars)

2. **TEST-ORDER-00002** - In Transit 🚚
   - Customer: Test Customer 2
   - Value: $70.00
   - Status: in_transit

3. **TEST-ORDER-00003** - Pending ⏳
   - Customer: Test Customer 3
   - Value: $80.00
   - Status: pending

### Reviews (1 total)
- **Rating:** 5 stars ⭐⭐⭐⭐⭐
- **Text:** "Excellent service! Fast and reliable delivery."
- **Order:** TEST-ORDER-00001

### TrustScore Data
- **Score:** 95.5/100
- **Total Deliveries:** 100
- **Success Rate:** 98%
- **Average Rating:** 4.8/5
- **Total Reviews:** 50

---

## 🧪 What Tests Will Pass Now

With these test users, the following test suites should pass:

### ✅ Authentication Tests (4 tests)
- Load login page
- Login merchant successfully
- Login courier successfully
- Show error for invalid credentials

### ✅ Merchant Dashboard Tests (4 tests)
- Display dashboard metrics
- Display orders table
- Display analytics charts
- No console errors

### ✅ Courier Dashboard Tests (3 tests)
- Display dashboard metrics
- Display delivery list
- Display performance metrics

### ✅ Order Creation Tests (1 test)
- Create new order successfully

### ✅ Review System Tests (2 tests)
- Display reviews page
- Filter reviews by rating

### ✅ API Endpoint Tests (8 tests)
- All Week 4 API endpoints should respond

**Expected Pass Rate:** ~50-100 tests (up from 6!)

---

## 🔧 Troubleshooting

### Issue: Users already exist
**Solution:** The script automatically deletes existing test users before creating new ones.

### Issue: Password doesn't work
**Solution:** 
1. Make sure you're using: `TestPassword123!`
2. Check that pgcrypto extension is enabled
3. Re-run the SQL script

### Issue: Store/Courier not created
**Solution:**
1. Check that Users table has the test users
2. Re-run the SQL script (it has conflict handling)

### Issue: Tests still failing
**Solution:**
1. Check browser console for errors
2. Run tests in UI mode: `npm run test:e2e:ui`
3. View test report: `npm run test:e2e:report`
4. Check that frontend is deployed and accessible

---

## 📈 Next Steps

### After Creating Test Users:

1. **Run Tests**
   ```bash
   npm run test:e2e:ui
   ```

2. **Check Results**
   - Open HTML report
   - Review passed/failed tests
   - Check screenshots/videos

3. **Fix Remaining Failures**
   - Add missing `data-testid` attributes
   - Update component selectors
   - Add more test data if needed

4. **Integrate with CI/CD**
   - Tests will run automatically on push/PR
   - GitHub Actions workflow already configured

---

## 🎯 Success Metrics

### Before Test Users:
- ❌ 6/282 tests passing (2%)

### After Test Users (Expected):
- ✅ 50-100/282 tests passing (18-35%)

### After Component Updates (Goal):
- ✅ 250+/282 tests passing (90%+)

---

## 🔐 Security Notes

### ⚠️ Important:
- These are **TEST USERS ONLY**
- Do NOT use in production
- Passwords are simple for testing
- Delete before production launch

### Production Recommendations:
1. Use different test environment
2. Use stronger passwords
3. Implement test data isolation
4. Use separate test database

---

## 📝 File Locations

```
database/
  └── CREATE_PLAYWRIGHT_TEST_USERS.sql    # Main SQL script

tests/e2e/
  └── smoke-tests.spec.ts                 # Test file using these users

docs/2025-10-23/
  └── PLAYWRIGHT_TEST_USERS_GUIDE.md      # This guide
```

---

## ✅ Checklist

- [ ] Run SQL script in Supabase
- [ ] Verify users created successfully
- [ ] Test login with merchant credentials
- [ ] Test login with courier credentials
- [ ] Run Playwright tests
- [ ] Check test results
- [ ] Review HTML report
- [ ] Celebrate improved pass rate! 🎉

---

## 🎉 You're Ready!

Your Playwright tests now have:
- ✅ Valid test users
- ✅ Sample data
- ✅ Realistic scenarios
- ✅ Full test coverage

**Next:** Run `npm run test:e2e:ui` and watch the tests pass! 🚀
