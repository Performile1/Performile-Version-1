# 🎭 Create Test Users via Playwright (Recommended!)

**Date:** October 23, 2025, 10:55 AM  
**Method:** Automated via signup flow  
**Status:** ✅ Ready to use

---

## 🎯 Why This Method is Better

### ✅ Advantages over SQL:
1. **Tests your auth system** - Validates signup/login works
2. **Fully automated** - No manual SQL copy/paste
3. **CI/CD ready** - Runs in GitHub Actions
4. **Reusable sessions** - Tests run 3-5 minutes faster
5. **Real user flow** - Tests actual user experience
6. **No database access needed** - Works with any environment

### ⚠️ When to use SQL instead:
- Signup flow is broken
- Email verification is required
- Need to test with pre-existing data
- Database-level testing needed

---

## 🚀 Quick Start (3 Commands)

### Option 1: Automated Script (Easiest!)

```bash
# Run the setup script
.\scripts\setup-test-users.ps1
```

This will:
1. ✅ Check Playwright installation
2. ✅ Create test users via signup
3. ✅ Create auth sessions
4. ✅ Verify everything works

### Option 2: Manual Commands

```bash
# 1. Create test users
npx playwright test setup/create-test-users.spec.ts

# 2. Create auth sessions
npx playwright test setup/auth.setup.ts

# 3. Run tests
npm run test:e2e
```

---

## 📁 What Was Created

### Files:
```
tests/e2e/setup/
├── create-test-users.spec.ts    # Creates users via signup
├── auth.setup.ts                # Creates reusable auth sessions
└── README.md                    # Setup documentation

scripts/
└── setup-test-users.ps1         # Automated setup script

docs/2025-10-23/
└── PLAYWRIGHT_USERS_VIA_SIGNUP.md  # This guide
```

### Test Users:
- ✅ `test-merchant@performile.com` (merchant role)
- ✅ `test-courier@performile.com` (courier role)
- ✅ Password: `TestPassword123!`

### Auth Sessions:
- ✅ `tests/e2e/.auth/merchant.json` (reusable merchant session)
- ✅ `tests/e2e/.auth/courier.json` (reusable courier session)

---

## 🔑 Test Credentials

```
Merchant:
  Email: test-merchant@performile.com
  Password: TestPassword123!
  Role: merchant

Courier:
  Email: test-courier@performile.com
  Password: TestPassword123!
  Role: courier
```

---

## 🎭 How It Works

### Step 1: Create Users (create-test-users.spec.ts)

```typescript
test('should create merchant test user', async ({ page }) => {
  await page.goto('/signup');
  await page.fill('input[type="email"]', 'test-merchant@performile.com');
  await page.fill('input[type="password"]', 'TestPassword123!');
  // ... fill other fields
  await page.click('button[type="submit"]');
  // User created! ✅
});
```

### Step 2: Create Auth Sessions (auth.setup.ts)

```typescript
setup('authenticate as merchant', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test-merchant@performile.com');
  await page.fill('input[type="password"]', 'TestPassword123!');
  await page.click('button[type="submit"]');
  
  // Save session for reuse
  await page.context().storageState({ 
    path: 'tests/e2e/.auth/merchant.json' 
  });
});
```

### Step 3: Use in Tests

```typescript
// Use saved auth session (no login needed!)
test.use({ storageState: 'tests/e2e/.auth/merchant.json' });

test('my test', async ({ page }) => {
  await page.goto('/dashboard');
  // Already logged in! 🎉
});
```

---

## 📊 Performance Benefits

### Without Auth Sessions:
```
Login time per test: ~2-3 seconds
100 tests × 3 seconds = 300 seconds (5 minutes)
```

### With Auth Sessions:
```
Login time per test: ~0 seconds (already logged in)
100 tests × 0 seconds = 0 seconds
Savings: 5 minutes per test run! 🚀
```

---

## 🔧 Troubleshooting

### Issue: "User already exists"
**Status:** ✅ Success! Users were created previously.

**Solution:** Skip to auth setup:
```bash
npx playwright test setup/auth.setup.ts
```

### Issue: "Cannot find signup page"
**Solution:** Check your BASE_URL:
```bash
BASE_URL=https://your-app.vercel.app npx playwright test setup/
```

### Issue: "Email verification required"
**Solutions:**
1. Disable email verification for test environment
2. Use SQL script as fallback:
   ```bash
   # Run in Supabase:
   database/CREATE_PLAYWRIGHT_TEST_USERS.sql
   ```

### Issue: "Login fails after signup"
**Debug steps:**
1. Check browser console for errors
2. Run in UI mode to see what's happening:
   ```bash
   npx playwright test setup/ --ui
   ```
3. Verify password requirements match
4. Check database for user creation

### Issue: "Auth session not working"
**Solution:** Recreate sessions:
```bash
# Delete old sessions
rm -rf tests/e2e/.auth

# Create new ones
npx playwright test setup/auth.setup.ts
```

---

## 🎯 Recommended Workflow

### First Time Setup:
```bash
# Run automated script
.\scripts\setup-test-users.ps1

# Or manual:
npx playwright test setup/create-test-users.spec.ts
npx playwright test setup/auth.setup.ts
```

### Daily Development:
```bash
# Just run tests (auth sessions already exist)
npm run test:e2e:ui
```

### After Code Changes:
```bash
# Recreate auth sessions if login flow changed
npx playwright test setup/auth.setup.ts

# Run tests
npm run test:e2e
```

### CI/CD Pipeline:
```yaml
- name: Setup test users
  run: npx playwright test setup/

- name: Run E2E tests
  run: npm run test:e2e
```

---

## 📈 Expected Results

### Test Creation:
```
✅ should create merchant test user (5-10s)
✅ should create courier test user (5-10s)
✅ should verify merchant can login (3-5s)
✅ should verify courier can login (3-5s)

Total: ~20-30 seconds
```

### Auth Sessions:
```
✅ authenticate as merchant (3-5s)
✅ authenticate as courier (3-5s)

Total: ~6-10 seconds
```

### Main Tests (After Setup):
```
Before: 6/282 tests passing (2%)
After: 50-100/282 tests passing (18-35%)

Improvement: +44 to +94 tests! 🎉
```

---

## 🎉 Success Checklist

- [ ] Run setup script: `.\scripts\setup-test-users.ps1`
- [ ] Verify users created (check output)
- [ ] Verify auth sessions created (check `.auth/` folder)
- [ ] Run main tests: `npm run test:e2e:ui`
- [ ] Check test results (expect 50-100 passing)
- [ ] View HTML report: `npm run test:e2e:report`
- [ ] Celebrate! 🎊

---

## 💡 Pro Tips

### Tip 1: Use UI Mode for Debugging
```bash
npx playwright test setup/ --ui
```
Watch tests run in real-time and see exactly what's happening.

### Tip 2: Run Setup Only Once
Auth sessions are reusable! Only recreate if:
- Login flow changes
- Sessions expire
- Tests start failing

### Tip 3: Check Auth Files
```bash
# View saved auth state
cat tests/e2e/.auth/merchant.json
```

### Tip 4: Parallel Setup
```bash
# Create both users at once
npx playwright test setup/create-test-users.spec.ts --workers=2
```

---

## 🔄 Comparison: Playwright vs SQL

| Feature | Playwright | SQL |
|---------|-----------|-----|
| **Setup Time** | 30 seconds | 2 minutes |
| **Automation** | ✅ Full | ⚠️ Manual |
| **Tests Auth** | ✅ Yes | ❌ No |
| **CI/CD Ready** | ✅ Yes | ⚠️ Requires DB access |
| **Reusable Sessions** | ✅ Yes | ❌ No |
| **Database Access** | ❌ Not needed | ✅ Required |
| **Test Data** | ⚠️ Basic | ✅ Complete |
| **Fallback Option** | ✅ SQL available | ✅ Always works |

**Recommendation:** Use Playwright for speed and automation. Use SQL as fallback if needed.

---

## 🚀 You're Ready!

Run the setup script and watch your tests pass! 🎭

```bash
.\scripts\setup-test-users.ps1
```

Then:
```bash
npm run test:e2e:ui
```

**Expected:** ~50-100 tests passing (up from 6)! 🎉
