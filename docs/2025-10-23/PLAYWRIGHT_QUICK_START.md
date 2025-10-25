# 🎭 Playwright E2E Testing - Quick Start

**Date:** October 23, 2025  
**Time to Setup:** 5-10 minutes  
**Time to Run:** 2-3 minutes

---

## 🚀 FASTEST WAY TO START (3 commands)

```bash
# 1. Install Playwright
npm install -D @playwright/test

# 2. Install browsers
npx playwright install

# 3. Run tests
npm run test:e2e:ui
```

**Done!** 🎉

---

## 📦 WHAT YOU GET

### Test Files Created:
- ✅ **`tests/e2e/smoke-tests.spec.ts`** - 39+ E2E tests (500+ lines)
- ✅ **`playwright.config.ts`** - Configuration
- ✅ **`.github/workflows/playwright.yml`** - CI/CD integration
- ✅ **`scripts/setup-playwright.ps1`** - Automated setup

### Test Coverage:
- ✅ **11 test suites**
- ✅ **39+ individual tests**
- ✅ **All critical flows**

---

## 🎯 WHAT'S TESTED

### ✅ Authentication (4 tests)
- Login page loads
- Invalid credentials show error
- Merchant login works
- Courier login works

### ✅ Merchant Dashboard (4 tests)
- Metrics display
- Orders table works
- Analytics charts show
- No console errors

### ✅ Courier Dashboard (3 tests)
- Courier metrics display
- Delivery list works
- Performance analytics show

### ✅ Order Creation (1 test)
- Create new order flow

### ✅ Review System (2 tests)
- Reviews page displays
- Filter by rating works

### ✅ Week 4: Service Performance (5 tests)
- Service cards display (Home/Shop/Locker)
- Comparison chart works
- Geographic heatmap shows
- Service reviews display
- API endpoint works

### ✅ Week 4: Parcel Points (5 tests)
- Map displays
- Search by postal code works
- Point details show
- Coverage checker works
- API endpoint works

### ✅ API Endpoints (8 tests)
- All 8 Week 4 APIs tested
- Response validation
- Data structure checks

### ✅ Performance (2 tests)
- Homepage loads < 3s
- Dashboard loads < 3s

### ✅ Mobile Responsive (2 tests)
- Mobile menu works
- Mobile navigation works

### ✅ Accessibility (3 tests)
- Heading hierarchy correct
- Images have alt text
- Keyboard navigation works

---

## 🎬 RUNNING TESTS

### UI Mode (Recommended):
```bash
npm run test:e2e:ui
```

**Features:**
- ✅ Visual test runner
- ✅ Step through tests
- ✅ Time travel debugging
- ✅ Network inspection

### Headless Mode (CI/CD):
```bash
npm run test:e2e
```

**Features:**
- ✅ Fast execution
- ✅ No browser window
- ✅ Perfect for CI/CD

### Headed Mode (Watch):
```bash
npm run test:e2e:headed
```

**Features:**
- ✅ See browser window
- ✅ Watch tests run
- ✅ Good for debugging

### Debug Mode:
```bash
npm run test:e2e:debug
```

**Features:**
- ✅ Pause execution
- ✅ Inspect elements
- ✅ Console access

---

## 🔧 QUICK SETUP (PowerShell)

### Automated Setup:
```powershell
# Run setup script
.\scripts\setup-playwright.ps1
```

**What it does:**
1. ✅ Checks Node.js
2. ✅ Installs Playwright
3. ✅ Installs browsers
4. ✅ Updates package.json
5. ✅ Creates .env.test
6. ✅ Runs first test

**Time:** 5-10 minutes

---

## 📊 EXPECTED RESULTS

### All Tests Passing:

```
Running 39 tests using 4 workers

  ✓ Authentication Tests (4/4)
  ✓ Merchant Dashboard Tests (4/4)
  ✓ Courier Dashboard Tests (3/3)
  ✓ Order Creation Tests (1/1)
  ✓ Review System Tests (2/2)
  ✓ Week 4: Service Performance (5/5)
  ✓ Week 4: Parcel Points (5/5)
  ✓ API Endpoint Tests (8/8)
  ✓ Performance Tests (2/2)
  ✓ Mobile Responsive Tests (2/2)
  ✓ Accessibility Tests (3/3)

  39 passed (2m 15s)
```

---

## 🎯 SPECIFIC TEST RUNS

### Run Single Suite:
```bash
# Authentication only
npx playwright test --grep "Authentication"

# Week 4 only
npx playwright test --grep "Week 4"

# API tests only
npx playwright test --grep "API"
```

### Run Single Browser:
```bash
# Chrome only
npx playwright test --project=chromium

# Firefox only
npx playwright test --project=firefox

# Mobile only
npx playwright test --project="Mobile Chrome"
```

### Run Single Test:
```bash
# Specific test
npx playwright test --grep "should login merchant"
```

---

## 🐛 DEBUGGING

### Method 1: UI Mode (Best)
```bash
npm run test:e2e:ui
```

### Method 2: Headed Mode
```bash
npm run test:e2e:headed
```

### Method 3: Debug Mode
```bash
npm run test:e2e:debug
```

### View Report:
```bash
npm run test:e2e:report
```

---

## 🔐 TEST USERS

Create these users in your database:

```sql
-- Merchant test user
INSERT INTO users (email, password, role, name)
VALUES (
  'test-merchant@performile.com',
  -- Hash of 'TestPassword123!'
  '$2a$10$...',
  'merchant',
  'Test Merchant'
);

-- Courier test user
INSERT INTO users (email, password, role, name)
VALUES (
  'test-courier@performile.com',
  -- Hash of 'TestPassword123!'
  '$2a$10$...',
  'courier',
  'Test Courier'
);
```

---

## 🌍 DIFFERENT ENVIRONMENTS

### Production:
```bash
BASE_URL=https://frontend-two-swart-31.vercel.app npm run test:e2e
```

### Staging:
```bash
BASE_URL=https://staging.performile.com npm run test:e2e
```

### Local:
```bash
BASE_URL=http://localhost:3000 npm run test:e2e
```

---

## 🤖 CI/CD INTEGRATION

### GitHub Actions:

Already configured in `.github/workflows/playwright.yml`!

**Triggers:**
- ✅ Push to main/develop
- ✅ Pull requests
- ✅ Manual workflow dispatch

**Features:**
- ✅ Runs all tests
- ✅ Uploads test reports
- ✅ Comments on PRs
- ✅ Blocks bad deployments

---

## 📈 BENEFITS

### 1. Automated Testing ✅
- Run 39+ tests in 2-3 minutes
- No manual testing needed
- Catch bugs before production

### 2. Confidence ✅
- Every deployment tested
- Critical flows verified
- Regression prevention

### 3. Documentation ✅
- Tests = living documentation
- Shows how features work
- Onboarding tool

### 4. CI/CD Ready ✅
- GitHub Actions integrated
- Automated quality gates
- PR validation

---

## 🎯 NEXT STEPS

### Today (5 min):
1. Run setup script
2. Run tests in UI mode
3. Fix any failures

### This Week (30 min):
4. Add test users to database
5. Run full test suite
6. Integrate with CI/CD

### Future (ongoing):
7. Add more tests
8. Increase coverage
9. Monitor test results

---

## 📚 DOCUMENTATION

**Full Guide:** `docs/2025-10-23/PLAYWRIGHT_SETUP_GUIDE.md`

**Includes:**
- ✅ Detailed setup instructions
- ✅ Test writing guide
- ✅ Debugging tips
- ✅ CI/CD integration
- ✅ Troubleshooting

---

## 🎉 SUMMARY

**Created:**
- ✅ 39+ automated E2E tests
- ✅ Complete test infrastructure
- ✅ CI/CD integration
- ✅ Comprehensive documentation

**Time Investment:**
- ⏱️ Setup: 5-10 minutes
- ⏱️ Run: 2-3 minutes
- ⏱️ Value: Priceless! 🎉

**Status:** ✅ **READY TO USE!**

---

## 🚀 START NOW

```bash
# Quick start (3 commands)
npm install -D @playwright/test
npx playwright install
npm run test:e2e:ui
```

**That's it!** 🎭✅

---

**Document Type:** Quick Start Guide  
**Version:** 1.0  
**Date:** October 23, 2025  
**Status:** ✅ Ready

---

*Automated testing made easy!* 🎭🚀
