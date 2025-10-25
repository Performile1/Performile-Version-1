# 🎭 Playwright Test Setup

This directory contains setup scripts for creating and managing test users.

---

## 📁 Files

### `create-test-users.spec.ts`
Creates test users via the signup flow.

**Creates:**
- `test-merchant@performile.com` (merchant role)
- `test-courier@performile.com` (courier role)

**Run:**
```bash
npx playwright test setup/create-test-users.spec.ts
```

### `auth.setup.ts`
Creates reusable authentication sessions.

**Creates:**
- `tests/e2e/.auth/merchant.json` (merchant session)
- `tests/e2e/.auth/courier.json` (courier session)

**Run:**
```bash
npx playwright test setup/auth.setup.ts
```

---

## 🚀 Quick Start

### Option 1: Create Users via Signup Flow (Recommended)

```bash
# Create test users
npx playwright test setup/create-test-users.spec.ts

# Create auth sessions
npx playwright test setup/auth.setup.ts

# Run main tests
npm run test:e2e
```

### Option 2: Create Users via SQL

If signup flow doesn't work yet, use the SQL script:

```bash
# Run in Supabase SQL Editor:
database/CREATE_PLAYWRIGHT_TEST_USERS.sql
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

## 🎯 Usage in Tests

### Without Auth State (Login each time)
```typescript
test('my test', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test-merchant@performile.com');
  await page.fill('input[type="password"]', 'TestPassword123!');
  await page.click('button[type="submit"]');
  // ... rest of test
});
```

### With Auth State (Faster!)
```typescript
import { test } from '@playwright/test';

test.use({ storageState: 'tests/e2e/.auth/merchant.json' });

test('my test', async ({ page }) => {
  await page.goto('/dashboard');
  // Already logged in! 🎉
});
```

---

## 📊 Benefits of Playwright Setup

### ✅ Advantages:
1. **Tests your auth flow** - Validates signup/login works
2. **No manual SQL** - Fully automated
3. **Reusable sessions** - Tests run faster
4. **CI/CD friendly** - Runs in GitHub Actions
5. **Real user flow** - Tests actual user experience

### ⚠️ Considerations:
1. **Requires working signup** - If signup is broken, use SQL fallback
2. **Email verification** - May need to disable for test users
3. **Rate limiting** - May need to adjust for test environment

---

## 🔧 Troubleshooting

### Issue: "User already exists"
**Solution:** Users were created successfully! Skip to auth setup:
```bash
npx playwright test setup/auth.setup.ts
```

### Issue: "Cannot find signup page"
**Solution:** Check your BASE_URL:
```bash
BASE_URL=https://your-app.vercel.app npx playwright test setup/
```

### Issue: "Email verification required"
**Solution:** 
1. Disable email verification for test users in backend
2. Or use SQL script to create verified users

### Issue: "Login fails after signup"
**Solution:**
1. Check password requirements match
2. Verify user role is set correctly
3. Check database for user creation

---

## 🎯 Recommended Workflow

### First Time Setup:
```bash
# 1. Create test users
npx playwright test setup/create-test-users.spec.ts

# 2. Create auth sessions
npx playwright test setup/auth.setup.ts

# 3. Run all tests
npm run test:e2e
```

### Daily Development:
```bash
# Just run tests (auth sessions already exist)
npm run test:e2e:ui
```

### CI/CD Pipeline:
```yaml
- name: Setup test users
  run: npx playwright test setup/

- name: Run tests
  run: npm run test:e2e
```

---

## 📈 Performance

### Without Auth State:
- Login time: ~2-3 seconds per test
- 100 tests = 200-300 seconds wasted on login

### With Auth State:
- Login time: ~0 seconds (already logged in)
- 100 tests = 0 seconds wasted! 🚀

**Savings: 3-5 minutes per test run!**

---

## 🎉 You're Ready!

Run the setup scripts and start testing! 🎭
