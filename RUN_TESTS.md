# 🧪 Run Playwright Tests - Quick Guide

## ✅ **Option 1: Run All Courier Credentials Tests**

```powershell
npm run test:e2e -- tests/e2e/courier-credentials.spec.ts
```

## 👀 **Option 2: Run with Browser Visible (Headed Mode)**

```powershell
npm run test:e2e:headed -- tests/e2e/courier-credentials.spec.ts
```

## 🐛 **Option 3: Run in Debug Mode (Step Through)**

```powershell
npm run test:e2e:debug -- tests/e2e/courier-credentials.spec.ts
```

## 🎨 **Option 4: Run with UI (Best for Development)**

```powershell
npm run test:e2e:ui -- tests/e2e/courier-credentials.spec.ts
```

## 🌐 **Option 5: Run Specific Browser**

```powershell
# Chrome only
npm run test:e2e:chromium -- tests/e2e/courier-credentials.spec.ts

# Firefox only
npm run test:e2e:firefox -- tests/e2e/courier-credentials.spec.ts

# Safari only
npm run test:e2e:webkit -- tests/e2e/courier-credentials.spec.ts
```

## 📱 **Option 6: Run Mobile Tests**

```powershell
npm run test:e2e:mobile -- tests/e2e/courier-credentials.spec.ts
```

## 🎯 **Option 7: Run Single Test**

```powershell
npm run test:e2e -- tests/e2e/courier-credentials.spec.ts -g "should navigate to courier settings"
```

## 📊 **Option 8: View Test Report**

```powershell
npm run test:e2e:report
```

---

## 🚀 **RECOMMENDED: Interactive Script**

```powershell
.\scripts\test-courier-credentials.ps1
```

This will give you a menu to choose:
1. Run all tests
2. Run specific test
3. Run in headed mode (see browser)
4. Run in debug mode

---

## 📋 **What Tests Are Available?**

1. ✅ **Navigation test** - Navigate to courier settings
2. ✅ **View selected couriers** - Display list of couriers
3. ✅ **Add credentials modal** - Open credentials form
4. ✅ **Form validation** - Validate form fields
5. ✅ **Test connection** - Test courier API connection
6. ✅ **Save credentials** - Save and verify status
7. ✅ **Edit credentials** - Edit existing credentials
8. ✅ **API endpoints** - Verify API calls
9. ✅ **Error handling** - Handle API errors
10. ✅ **Multiple couriers** - Manage multiple couriers

---

## 🔧 **Environment Variables**

The tests use these defaults:
- **BASE_URL:** `https://frontend-two-swart-31.vercel.app`
- **TEST_MERCHANT_EMAIL:** `merchant@performile.com`
- **TEST_MERCHANT_PASSWORD:** `TestPassword123!`

To override:
```powershell
$env:BASE_URL = "http://localhost:3000"
$env:TEST_MERCHANT_PASSWORD = "YourPassword"
npm run test:e2e -- tests/e2e/courier-credentials.spec.ts
```

---

## 📊 **Expected Results**

**Total Tests:** 10
**Browsers:** 6 (Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari, iPad)
**Total Runs:** 60 (10 tests × 6 browsers)

**Estimated Time:**
- All tests: 5-10 minutes
- Single test: 30-60 seconds
- Headed mode: 2-3 minutes

---

## ✅ **Success Criteria**

Tests pass if:
- ✅ Can navigate to Settings → Couriers
- ✅ Can view selected couriers
- ✅ Can open credentials modal
- ✅ Can fill and validate form
- ✅ Can test connection
- ✅ Can save credentials
- ✅ Can edit credentials
- ✅ API calls work correctly
- ✅ Errors handled gracefully
- ✅ Multiple couriers supported

---

## 🐛 **If Tests Fail**

1. **Check deployment:** Is Vercel app running?
2. **Check test user:** Does `merchant@performile.com` exist?
3. **Check password:** Is password correct?
4. **Check network:** Can you access the URL?
5. **Check browser:** Is Playwright installed?

**Install Playwright browsers:**
```powershell
npx playwright install
```

---

## 📝 **Current Test Status**

**Test Running:** ✅ Started
**Command ID:** 42
**Mode:** Headed (browser visible)
**Browser:** Chromium
**Target:** Vercel deployment

**To see live output, run in your terminal:**
```powershell
npm run test:e2e:headed -- tests/e2e/courier-credentials.spec.ts
```
