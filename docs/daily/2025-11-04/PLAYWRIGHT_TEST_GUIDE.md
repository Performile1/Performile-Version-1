# Playwright Test Guide - Courier Credentials

**Date:** November 4, 2025  
**Feature:** Courier Credentials Management  
**Test File:** `tests/e2e/courier-credentials.spec.ts`

---

## 🚀 Quick Start

### **Option 1: Using PowerShell Script (Recommended)**

```powershell
# Run from project root
.\scripts\test-courier-credentials.ps1
```

**Interactive menu will let you:**
1. Run all tests
2. Run specific test
3. Run in headed mode (see browser)
4. Run in debug mode

---

### **Option 2: Direct Playwright Commands**

```bash
# Run all courier credentials tests
npx playwright test tests/e2e/courier-credentials.spec.ts

# Run in headed mode (see browser)
npx playwright test tests/e2e/courier-credentials.spec.ts --headed

# Run specific test
npx playwright test tests/e2e/courier-credentials.spec.ts -g "should navigate"

# Run in debug mode
npx playwright test tests/e2e/courier-credentials.spec.ts --debug

# Run with UI mode
npx playwright test tests/e2e/courier-credentials.spec.ts --ui
```

---

## 📋 Test Coverage

### **10 Comprehensive Tests:**

1. **Navigation Test**
   - Navigate to Settings
   - Click Couriers tab
   - Verify page loads

2. **View Selected Couriers**
   - Display list of couriers
   - Show credentials status

3. **Add Credentials Modal**
   - Open modal
   - Verify form fields

4. **Form Validation**
   - Test required fields
   - Validate input

5. **Test Connection**
   - Fill credentials
   - Click Test Connection
   - Verify result

6. **Save Credentials**
   - Fill form
   - Save credentials
   - Verify status updates

7. **Edit Credentials**
   - Open edit modal
   - Update values
   - Save changes

8. **API Endpoints**
   - Verify correct endpoints called
   - Check request/response

9. **Error Handling**
   - Test invalid credentials
   - Verify error messages

10. **Multiple Couriers**
    - Manage multiple couriers
    - Verify each has credentials button

---

## 🔧 Prerequisites

### **1. Start Development Server**

```bash
cd apps/web
npm run dev
```

Server should be running at `http://localhost:3000`

---

### **2. Ensure Test User Exists**

**Email:** `merchant@performile.com`  
**Password:** `TestPassword123!`

If user doesn't exist, run:

```sql
-- Create test merchant user
INSERT INTO users (email, password_hash, user_role, full_name)
VALUES (
  'merchant@performile.com',
  '$2a$10$...', -- Hash for TestPassword123!
  'merchant',
  'Test Merchant'
);
```

Or use the existing test user creation script.

---

### **3. Install Playwright (if not installed)**

```bash
npm install -D @playwright/test
npx playwright install
```

---

## 📊 Test Execution

### **Expected Results:**

```
Running 10 tests using 1 worker

✓ should navigate to courier settings from dashboard (5s)
✓ should display list of selected couriers (3s)
✓ should open credentials modal when clicking Add Credentials (4s)
✓ should validate credentials form fields (3s)
✓ should test courier connection (6s)
✓ should save credentials and update status (5s)
✓ should edit existing credentials (4s)
✓ should call correct API endpoints (4s)
✓ should handle API errors gracefully (5s)
✓ should manage credentials for multiple couriers (3s)

10 passed (42s)
```

---

## 🐛 Debugging

### **Debug Mode:**

```bash
npx playwright test tests/e2e/courier-credentials.spec.ts --debug
```

**Features:**
- Playwright Inspector opens
- Step through tests line by line
- Inspect page elements
- View network requests
- Take screenshots

---

### **Headed Mode:**

```bash
npx playwright test tests/e2e/courier-credentials.spec.ts --headed
```

**Features:**
- See browser window
- Watch tests execute
- Slower execution (easier to follow)

---

### **UI Mode:**

```bash
npx playwright test tests/e2e/courier-credentials.spec.ts --ui
```

**Features:**
- Interactive test runner
- Time travel debugging
- Watch mode
- Visual test execution

---

## 📸 Screenshots & Videos

### **Capture on Failure:**

Playwright automatically captures:
- Screenshots on failure
- Videos of failed tests
- Trace files for debugging

**Location:** `test-results/`

---

### **Manual Screenshots:**

Add to test:

```typescript
await page.screenshot({ path: 'screenshot.png' });
```

---

## 🔍 Troubleshooting

### **Issue: Tests timeout**

**Solution:**
- Increase timeout in test
- Check if dev server is running
- Verify BASE_URL is correct

```typescript
test('my test', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes
  // ... test code
});
```

---

### **Issue: Element not found**

**Solution:**
- Check selectors in test
- Verify page loaded completely
- Add wait conditions

```typescript
await page.waitForSelector('button:has-text("Add Credentials")');
```

---

### **Issue: API calls failing**

**Solution:**
- Check API endpoints exist
- Verify authentication
- Check network tab in debug mode

---

## 📝 Test Configuration

### **Environment Variables:**

```bash
# .env.test
BASE_URL=http://localhost:3000
TEST_MERCHANT_PASSWORD=TestPassword123!
```

---

### **Playwright Config:**

Located at: `playwright.config.ts`

**Key settings:**
- Timeout: 60 seconds
- Retries: 2 on CI
- Workers: 1 (sequential)
- Browsers: Chromium, Firefox, WebKit

---

## 🎯 What Tests Verify

### **Frontend:**
- ✅ Navigation works
- ✅ UI components render
- ✅ Forms validate input
- ✅ Modals open/close
- ✅ Status updates display

### **Backend:**
- ✅ API endpoints respond
- ✅ Authentication works
- ✅ Data saves correctly
- ✅ Errors handled gracefully

### **Integration:**
- ✅ End-to-end flow works
- ✅ Frontend ↔ Backend communication
- ✅ Database updates correctly

---

## 📊 Test Reports

### **Generate HTML Report:**

```bash
npx playwright test tests/e2e/courier-credentials.spec.ts --reporter=html
```

**View report:**

```bash
npx playwright show-report
```

---

### **Generate JSON Report:**

```bash
npx playwright test tests/e2e/courier-credentials.spec.ts --reporter=json
```

---

## 🚀 CI/CD Integration

### **GitHub Actions:**

```yaml
- name: Run Courier Credentials Tests
  run: |
    npx playwright test tests/e2e/courier-credentials.spec.ts
```

---

### **Vercel Deployment:**

Tests can run against deployed Vercel URL:

```bash
BASE_URL=https://your-app.vercel.app npx playwright test
```

---

## ✅ Success Criteria

**Tests pass when:**
- ✅ All 10 tests pass
- ✅ No timeout errors
- ✅ No element not found errors
- ✅ API calls succeed
- ✅ Database updates correctly

---

## 📚 Additional Resources

**Playwright Docs:**
- https://playwright.dev/docs/intro

**Best Practices:**
- Use data-testid attributes
- Avoid brittle selectors
- Wait for network idle
- Handle async operations

**Debugging:**
- Use `page.pause()` to pause execution
- Use `console.log()` for debugging
- Check Playwright trace viewer

---

## 🎯 Next Steps

After tests pass:

1. ✅ Mark feature as complete
2. ✅ Update documentation
3. ✅ Create merchant onboarding guide
4. ✅ Move to next task (checkout audit)

---

**Status:** ✅ READY TO TEST  
**Confidence:** HIGH - Comprehensive test coverage  
**Estimated Time:** 5-10 minutes to run all tests

---

*Created: November 4, 2025*  
*Test File: tests/e2e/courier-credentials.spec.ts*  
*Script: scripts/test-courier-credentials.ps1*
