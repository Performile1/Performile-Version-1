# WEEK 2 DAY 4 - PLAYWRIGHT TESTING GUIDE

**Date:** November 6, 2025  
**Features Tested:** Performance By Location Integration  
**Test File:** `tests/e2e/performance-by-location.spec.ts`  
**Test Script:** `scripts/test-performance-by-location.ps1`

---

## 🎯 WHAT WE'RE TESTING

### **Today's Features:**

1. **PerformanceByLocation Component**
   - Geographic performance analytics
   - Subscription-based access control
   - Upgrade prompts for limited users

2. **Analytics Integration**
   - Admin Analytics (Market Insights tab)
   - Merchant Analytics (via `/analytics`)
   - Courier Analytics (via `/analytics`)

3. **Subscription Limits**
   - Merchant tiers: Starter, Professional, Enterprise
   - Courier tiers: Basic, Pro, Premium
   - Admin: Full access (no limits)

---

## 📋 TEST COVERAGE

### **10 Tests Created:**

| # | Test Name | What It Tests | User Role |
|---|-----------|---------------|-----------|
| 1 | Admin: Full access | Component renders, no upgrade prompts | Admin |
| 2 | Admin: Country selector | Can select different countries | Admin |
| 3 | Admin: Time range selector | Can change time range (7, 30, 90 days) | Admin |
| 4 | Merchant: Subscription limits | Component renders with subscription info | Merchant |
| 5 | Courier: Subscription limits | Component renders with subscription info | Courier |
| 6 | Data table display | Shows data table or "no data" message | Admin |
| 7 | Loading state | Shows loading indicator initially | Admin |
| 8 | Error handling | Handles API errors gracefully | Admin |
| 9 | Navigation | Market Insights tab is accessible | Admin |
| 10 | Mobile responsive | Works on mobile viewport (375x667) | Admin |

### **Cross-Browser Testing:**

Each test runs on **6 browser configurations:**
1. Chromium (Desktop)
2. Firefox (Desktop)
3. WebKit/Safari (Desktop)
4. Mobile Chrome (375x667)
5. Mobile Safari (375x667)
6. iPad (768x1024)

**Total Test Runs:** 10 tests × 6 browsers = **60 test executions**

---

## 🚀 HOW TO RUN TESTS

### **Method 1: PowerShell Script (Recommended)**

```powershell
cd c:\Users\ricka\Downloads\performile-platform-main\performile-platform-main
.\scripts\test-performance-by-location.ps1
```

**Interactive Menu:**
1. Run all tests (headless)
2. Run specific test (headless)
3. Run all tests (headed - see browser)
4. Run specific test (headed)
5. Debug mode (headed + slow)
6. Run on specific browser only

### **Method 2: Direct Playwright Commands**

**Run all tests:**
```bash
npx playwright test tests/e2e/performance-by-location.spec.ts
```

**Run specific test:**
```bash
npx playwright test tests/e2e/performance-by-location.spec.ts -g "Admin: Full access"
```

**Run with browser visible:**
```bash
npx playwright test tests/e2e/performance-by-location.spec.ts --headed
```

**Debug mode:**
```bash
npx playwright test tests/e2e/performance-by-location.spec.ts --debug
```

**Run on specific browser:**
```bash
npx playwright test tests/e2e/performance-by-location.spec.ts --project=chromium
```

**View HTML report:**
```bash
npx playwright show-report
```

---

## 🧪 TEST SCENARIOS

### **Scenario 1: Admin User**

**Expected Behavior:**
- ✅ Can access `/analytics` page
- ✅ Can click "Market Insights" tab
- ✅ Sees "Performance by Location" component
- ✅ Sees country selector (all countries available)
- ✅ Sees time range selector (7, 30, 90 days)
- ✅ Can select different countries
- ✅ Can change time range
- ✅ NO upgrade prompts
- ✅ Full data access

**Test Commands:**
```bash
npx playwright test tests/e2e/performance-by-location.spec.ts -g "Admin"
```

### **Scenario 2: Merchant User**

**Expected Behavior:**
- ✅ Can access `/analytics` page
- ✅ Can click "Market Insights" tab
- ✅ Sees "Performance by Location" component
- ✅ Sees subscription info (Current Plan: Starter/Professional/Enterprise)
- ✅ Country selector limited by subscription
- ✅ Time range limited by subscription
- ✅ MAY see upgrade prompts (depending on tier)
- ✅ Data limited by subscription

**Test Commands:**
```bash
npx playwright test tests/e2e/performance-by-location.spec.ts -g "Merchant"
```

### **Scenario 3: Courier User**

**Expected Behavior:**
- ✅ Can access `/analytics` page
- ✅ Can click "Market Insights" tab
- ✅ Sees "Performance by Location" component
- ✅ Sees subscription info (Current Plan: Basic/Pro/Premium)
- ✅ Country selector limited by subscription
- ✅ Time range limited by subscription
- ✅ MAY see upgrade prompts (depending on tier)
- ✅ Data limited by subscription

**Test Commands:**
```bash
npx playwright test tests/e2e/performance-by-location.spec.ts -g "Courier"
```

### **Scenario 4: Mobile Responsive**

**Expected Behavior:**
- ✅ Component renders on mobile viewport (375x667)
- ✅ Selectors are accessible
- ✅ No horizontal scroll
- ✅ Touch-friendly controls

**Test Commands:**
```bash
npx playwright test tests/e2e/performance-by-location.spec.ts -g "Responsive"
```

---

## 📊 TEST DATA REQUIREMENTS

### **Test Users (Must Exist in Database):**

```sql
-- Admin User
email: admin@performile.com
password: Admin123!@#

-- Merchant User
email: merchant@performile.com
password: Merchant123!@#

-- Courier User
email: courier@performile.com
password: Courier123!@#
```

### **Subscription Plans (Must Exist):**

**Merchants:**
- Starter (Tier 1)
- Professional (Tier 2)
- Enterprise (Tier 3)

**Couriers:**
- Basic (Tier 1)
- Pro (Tier 2)
- Premium (Tier 3)

### **Performance Data (Optional):**

Tests will work with or without data:
- **With data:** Tests verify data table rendering
- **Without data:** Tests verify "No data" message

---

## 🔍 DEBUGGING FAILED TESTS

### **Common Issues:**

**1. Test users don't exist**
```
Error: Timeout waiting for login
```
**Fix:** Run `database/CREATE_PLAYWRIGHT_TEST_USERS.sql` in Supabase

**2. Component not deployed**
```
Error: Locator 'text=Performance by Location' not found
```
**Fix:** Wait for Vercel deployment, hard refresh browser

**3. Selectors changed**
```
Error: Locator not found
```
**Fix:** Update selectors in test file to match actual UI

**4. Timeout issues**
```
Error: Test timeout of 60000ms exceeded
```
**Fix:** Increase timeout or check if Vercel is slow

**5. API errors**
```
Error: 403 Forbidden or 500 Internal Server Error
```
**Fix:** Check API endpoint, verify authentication

### **Debug Mode:**

Run tests in debug mode to step through:
```bash
npx playwright test tests/e2e/performance-by-location.spec.ts --debug
```

This opens Playwright Inspector where you can:
- Step through each action
- Pause and inspect elements
- View console logs
- Take screenshots

---

## 📈 EXPECTED RESULTS

### **Success Criteria:**

✅ **All 10 tests pass** on all 6 browsers (60/60)  
✅ **No console errors** during test execution  
✅ **Component renders** correctly for all user roles  
✅ **Subscription limits** are enforced properly  
✅ **Upgrade prompts** show for limited users  
✅ **Mobile responsive** works on all viewports  

### **Acceptable Failures:**

⚠️ **Data table tests** may fail if no performance data exists (expected)  
⚠️ **Timeout issues** on slow Vercel cold starts (increase timeout)  
⚠️ **Selector mismatches** if UI changed (update selectors)  

### **Critical Failures:**

❌ **Component not rendering** - Deployment issue  
❌ **Authentication failing** - Test user issue  
❌ **API errors** - Backend issue  
❌ **All tests failing** - Environment issue  

---

## 📝 TEST RESULTS TEMPLATE

After running tests, document results:

```markdown
## Test Results - Week 2 Day 4

**Date:** November 6, 2025  
**Time:** [Time]  
**Environment:** Vercel Production  
**Commit:** [Commit Hash]  

### Summary:
- Total Tests: 10
- Passed: X/10
- Failed: X/10
- Skipped: X/10

### Browser Results:
- Chromium: X/10
- Firefox: X/10
- WebKit: X/10
- Mobile Chrome: X/10
- Mobile Safari: X/10
- iPad: X/10

### Failed Tests:
1. [Test Name] - [Reason]
2. [Test Name] - [Reason]

### Known Issues:
- [Issue description]

### Screenshots:
- [Attach screenshots of failures]

### Next Steps:
- [ ] Fix critical failures
- [ ] Document non-critical issues
- [ ] Update test suite if needed
```

---

## 🎯 NEXT STEPS

### **After Tests Pass:**

1. ✅ Document test results
2. ✅ Fix any critical failures
3. ✅ Update test suite for new features
4. ✅ Commit test files to repository
5. ✅ Add to CI/CD pipeline (future)

### **If Tests Fail:**

1. 🔍 Review error messages
2. 🔍 Check Vercel deployment status
3. 🔍 Verify test users exist
4. 🔍 Run in debug mode
5. 🔍 Update selectors if needed
6. 🔍 Document known issues

---

## 📚 RELATED DOCUMENTATION

**Implementation Docs:**
- `PERFORMANCE_LIMITS_IMPLEMENTATION_COMPLETE.md`
- `PERFORMANCE_BY_LOCATION_INTEGRATION_PLAN.md`
- `PERFORMANCE_BY_LOCATION_INTEGRATION_COMPLETE.md`

**Database Docs:**
- `CREATE_PERFORMANCE_VIEW_ACCESS_FUNCTION.sql`
- `DATABASE_VALIDATION_RESULTS.md`

**API Docs:**
- `api/analytics/performance-by-location.ts`

**Component Docs:**
- `apps/web/src/components/analytics/PerformanceByLocation.tsx`

---

## 🚀 QUICK START

**Run all tests now:**

```powershell
# 1. Navigate to project
cd c:\Users\ricka\Downloads\performile-platform-main\performile-platform-main

# 2. Install dependencies (if needed)
npm install

# 3. Install Playwright browsers (if needed)
npx playwright install --with-deps

# 4. Run tests
.\scripts\test-performance-by-location.ps1

# OR run directly
npx playwright test tests/e2e/performance-by-location.spec.ts

# 5. View report
npx playwright show-report
```

---

## ✅ CHECKLIST

Before running tests:
- [ ] Vercel deployment is complete
- [ ] Test users exist in database
- [ ] Subscription plans are configured
- [ ] API endpoint is working
- [ ] Component is deployed

After running tests:
- [ ] All tests passed (or documented failures)
- [ ] Test results documented
- [ ] Screenshots captured (if failures)
- [ ] Known issues documented
- [ ] Test files committed to repository

---

**Status:** ✅ READY TO RUN

**Estimated Time:** 5-10 minutes for all tests

**Next Test Session:** Friday, November 8, 2025 (End of Week 2)

---

**End of Testing Guide - November 6, 2025**
