# Run All Tests - One Command
**Created:** October 17, 2025, 7:11 AM  
**Total Tests:** 20 comprehensive tests

---

## 🚀 ONE COMMAND TO RUN EVERYTHING

```bash
cd e2e-tests && npm run test:all
```

**That's it!** This will run all 20 tests covering:
- ✅ All 4 user roles (Admin, Merchant, Courier, Consumer)
- ✅ Authentication (5 tests)
- ✅ Admin Dashboard (2 tests)
- ✅ Merchant Dashboard with bug detection (3 tests)
- ✅ Courier Dashboard (2 tests)
- ✅ Consumer (2 tests)
- ✅ Cross-cutting tests (2 tests)

---

## 📊 WHAT YOU'LL GET

### **Real-time Console Output:**
```
🧪 Test 1.1: Admin Login
✅ Admin login successful

🧪 Test 1.2: Merchant Login
✅ Merchant login successful

🔍 Test 3.1: MERCHANT DASHBOARD BUG INVESTIGATION
⚠️ CONSOLE ERRORS: 2
⚠️ FAILED API CALLS: 1
📊 TOTAL API CALLS: 5
✅ Merchant dashboard investigation complete - CHECK LOGS
```

### **Generated Files:**
- `api-logs/*.json` - 20 files with complete API data
- `logs/*-console.json` - 20 files with console logs
- `api-reports/*.md` - 20 human-readable reports
- `screenshots/*.png` - 20 screenshots
- `playwright-report/index.html` - Interactive report

---

## 🎯 TEST BREAKDOWN

### **1. Authentication Tests (5 tests)**
- 1.1 - Admin Login
- 1.2 - Merchant Login
- 1.3 - Courier Login
- 1.4 - Consumer Login
- 1.5 - Invalid Credentials

### **2. Admin Dashboard Tests (2 tests)**
- 2.1 - Admin Dashboard Loads
- 2.2 - Admin Can View Users

### **3. Merchant Dashboard Tests (3 tests) - BUG DETECTION**
- 3.1 - Merchant Dashboard Bug Investigation ⚠️
- 3.2 - Merchant Orders Section
- 3.3 - Merchant Dashboard Performance

### **4. Courier Dashboard Tests (2 tests)**
- 4.1 - Courier Dashboard Loads
- 4.2 - Courier Deliveries Section

### **5. Consumer Tests (2 tests)**
- 5.1 - Consumer Page Loads
- 5.2 - Consumer Tracking Available

### **6. Cross-Cutting Tests (2 tests)**
- 6.1 - Logout Functionality
- 6.2 - API Performance Overall

---

## ⏱️ ESTIMATED TIME

**Total execution time:** ~5-8 minutes
- Each test: ~15-30 seconds
- 20 tests × 30 seconds = 10 minutes max
- Optimized with sequential execution

---

## 🔍 MERCHANT BUG DETECTION

**Test 3.1** is specifically designed to capture the merchant dashboard bug:

**What it logs:**
```
🔍 Test 3.1: MERCHANT DASHBOARD BUG INVESTIGATION
Page title: Performile - Dashboard
Current URL: https://performile-platform-main.vercel.app/dashboard
Headings: ["Dashboard", "Overview"]

⚠️ CONSOLE ERRORS: 2
Error 1:
  TypeError: Cannot read property 'data' of undefined

⚠️ FAILED API CALLS: 1
Failed Call 1:
  GET /api/merchant/checkout-analytics - 500
  Error: Internal server error

📊 TOTAL API CALLS: 5
  POST /api/auth/login - 200 (245ms)
  GET /api/merchant/checkout-analytics - 500 (1234ms)
  GET /api/tracking/summary - 200 (156ms)
  GET /api/orders - 200 (234ms)
  GET /api/subscriptions/current - 200 (189ms)
```

---

## 📋 AFTER RUNNING

### **View Interactive Report:**
```bash
npm run report
```

### **Check Specific Logs:**
```bash
# Merchant bug investigation
cat api-logs/3.1-Merchant-Dashboard-Bug-Investigation.json
cat api-reports/3.1-Merchant-Dashboard-Bug-Investigation.md
cat logs/3.1-Merchant-Dashboard-Bug-Investigation-console.json

# View screenshot
# Open: screenshots/3.1-Merchant-Dashboard-Bug-Investigation-*.png
```

---

## 🎯 OTHER COMMANDS

### **Run with visible browser:**
```bash
npm run test:all-headed
```

### **Run only authentication tests:**
```bash
npm run test:auth
```

### **Run only merchant tests:**
```bash
npm run test:merchant
```

### **Debug mode:**
```bash
npm run test:debug
```

---

## ✅ SUCCESS CRITERIA

**Tests pass if:**
- ✅ All 4 users can login
- ✅ Dashboards load
- ✅ No critical errors (tests will log warnings)
- ✅ API calls complete (may have failures - logged)

**Bugs are captured if:**
- ⚠️ Console errors logged
- ⚠️ API calls fail (4xx, 5xx)
- ⚠️ Performance issues detected
- ⚠️ Elements missing

---

## 🚀 READY TO RUN!

**Execute this command:**
```bash
cd e2e-tests && npm run test:all
```

**Or from project root:**
```bash
cd e2e-tests
npm run test:all
```

---

**All 20 tests will run automatically and generate comprehensive logs!** 🎯

**Estimated completion:** 5-8 minutes  
**Output:** 80+ log files with detailed analysis  
**Focus:** Merchant dashboard bug detection with full logging
