# How to Run E2E Tests
**Created:** October 17, 2025, 7:10 AM  
**Status:** Ready to run

---

## 🚀 QUICK START

### **Run All Tests:**
```bash
cd e2e-tests
npm test
```

### **Run Specific Test Suite:**

**Authentication Tests (10 tests):**
```bash
npm test tests/auth/login.spec.js
```

**Merchant Dashboard Tests (6 tests - BUG DETECTION):**
```bash
npm test tests/merchant/dashboard.spec.js
```

---

## 📊 WHAT GETS LOGGED

Each test generates:
1. **Console logs** → `logs/*.json`
2. **API call logs** → `api-logs/*.json`
3. **API reports** → `api-reports/*.md`
4. **Screenshots** → `screenshots/*.png`
5. **HTML report** → `playwright-report/index.html`

---

## 🔍 MERCHANT DASHBOARD BUG INVESTIGATION

The merchant dashboard test is specifically designed to capture the bug:

**What it logs:**
- ✅ All console errors
- ✅ All failed API calls
- ✅ All network failures
- ✅ Page load metrics
- ✅ Dashboard element presence
- ✅ Navigation functionality
- ✅ Full page screenshots

**After running:**
```bash
npm test tests/merchant/dashboard.spec.js
```

**Check these files:**
- `api-logs/merchant-*.json` - All API calls
- `logs/merchant-*-console.json` - Console errors
- `api-reports/merchant-*.md` - Detailed API report
- `screenshots/merchant-*.png` - Visual state

---

## 📋 TEST COVERAGE

### **Authentication Tests (10 tests):**
1. ✅ Admin login
2. ✅ Merchant login (with bug detection)
3. ✅ Courier login
4. ✅ Consumer login
5. ✅ Invalid email
6. ✅ Invalid password
7. ✅ Empty fields validation
8. ✅ Logout functionality
9. ✅ Session persistence
10. ✅ API response time

### **Merchant Dashboard Tests (6 tests):**
1. ✅ Dashboard loads without critical errors
2. ✅ Dashboard statistics are displayed
3. ✅ Orders section visible
4. ✅ Navigation menu functional
5. ✅ Performance check
6. ✅ JavaScript error detection

---

## 🎯 EXPECTED OUTPUT

### **Successful Test:**
```
✅ Admin can login successfully
  Console errors: 0
  Failed API calls: 0
  Login API response time: 245ms
```

### **Test with Issues (Merchant):**
```
⚠️ Merchant dashboard loads without critical errors
  Console errors: 3
  Failed API calls: 1
  ❌ Error 1: TypeError: Cannot read property 'data' of undefined
  ❌ Failed Call 1: GET /api/merchant/checkout-analytics - 500
```

---

## 📊 VIEW REPORTS

### **HTML Report (Interactive):**
```bash
npm run report
```

This opens an interactive HTML report in your browser with:
- Test results
- Screenshots
- Traces
- Timings

### **Console Output:**
All tests print detailed summaries to console including:
- API call statistics
- Console error counts
- Network failure counts
- Performance metrics

---

## 🐛 DEBUGGING TIPS

### **If a test fails:**

1. **Check console output** - Detailed logs are printed
2. **Open HTML report** - `npm run report`
3. **Review API logs** - `api-logs/*.json`
4. **Check screenshots** - `screenshots/*.png`
5. **Read API report** - `api-reports/*.md`

### **For merchant dashboard bug:**

1. Run: `npm test tests/merchant/dashboard.spec.js`
2. Check console output for errors
3. Open: `api-reports/merchant-*.md`
4. Review: `logs/merchant-*-console.json`
5. Look at: `screenshots/merchant-*.png`

---

## ⚙️ CONFIGURATION

**Base URL:** https://performile-platform-main.vercel.app  
**Test Directory:** `./tests`  
**Timeout:** 60 seconds per test  
**Retries:** 0 (to see real failures)  
**Workers:** 1 (sequential execution)

---

## 🎯 NEXT STEPS

After running these tests:
1. Review all logs
2. Document bugs found
3. Prioritize fixes
4. Create bug tickets
5. Fix issues
6. Re-run tests to verify fixes

---

**Ready to run!** Execute `npm test` to start testing! 🚀
