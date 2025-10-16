# ALL ROLES COMPREHENSIVE AUDIT

**Tests all 4 user roles in one go!**

---

## 🚀 QUICK START

```powershell
# Run the complete audit (with browser visible)
npm run test:all-roles

# Or run faster (headless mode)
npm run test:all-roles-fast
```

---

## 📋 WHAT IT DOES

### Tests All 4 Roles:
1. **Admin** - admin@performile.com
2. **Merchant** - merchant@performile.com
3. **Courier** - courier@performile.com
4. **Consumer** - consumer@performile.com

### For Each Role, It:
1. ✅ Logs in automatically
2. ✅ Screenshots the dashboard
3. ✅ Lists all navigation menu items
4. ✅ Visits every page and screenshots it
5. ✅ Captures console errors
6. ✅ Captures network errors (failed API calls)
7. ✅ Records all API calls made
8. ✅ Identifies missing API endpoints (404s)
9. ✅ Analyzes API call success/failure rates

---

## 📊 OUTPUT

### 1. Screenshots
**Location:** `screenshots/`

Files generated:
- `admin-dashboard.png`
- `admin-orders.png`
- `admin-trustscores.png`
- ... (all pages for all roles)
- `merchant-dashboard.png`
- `merchant-orders.png`
- ... etc

### 2. JSON Report
**Location:** `audit-results.json`

Contains:
```json
{
  "timestamp": "2025-10-16T...",
  "roles": {
    "admin": {
      "menuItems": ["Dashboard", "Orders", ...],
      "pages": [{...}],
      "consoleErrors": [{...}],
      "networkErrors": [{...}],
      "apiCalls": [{...}],
      "apiAnalysis": {
        "total": 45,
        "successful": 40,
        "failed": 5,
        "missing": 2,
        "missingEndpoints": [...]
      }
    },
    "merchant": {...},
    "courier": {...},
    "consumer": {...}
  }
}
```

### 3. Console Output
Real-time progress showing:
- Login status
- Menu items found
- Pages tested
- Errors encountered
- API calls made
- Missing endpoints

---

## 🔍 WHAT IT CAPTURES

### Console Errors
- JavaScript errors
- React errors
- Page errors
- Error stack traces

### Network Errors
- Failed API calls (4xx, 5xx)
- Missing endpoints (404)
- Request method
- Response status

### API Calls
- All API requests made
- Request methods (GET, POST, etc.)
- Response status codes
- Unique endpoints called
- Success/failure rates

### Missing Endpoints
Automatically identifies:
- 404 Not Found endpoints
- API calls that should exist but don't
- Broken API integrations

---

## 📈 EXAMPLE OUTPUT

```
========================================
ADMIN ROLE AUDIT
========================================

✓ Logged in successfully
  Current URL: https://frontend-two-swart-31.vercel.app/#/dashboard
  Screenshot: admin-dashboard.png

=== ADMIN: Navigation Menu ===
Found 28 navigation buttons

Menu Items (15):
  1. Dashboard
  2. Trust Scores
  3. Orders
  4. Manage Couriers
  5. Manage Stores
  6. Reviews
  7. Analytics
  8. Users
  9. Settings
  ...

=== ADMIN: Testing All Pages ===

Testing: Dashboard
  URL: https://frontend-two-swart-31.vercel.app/#/dashboard
  Errors: 0
  Empty states: 0
  Screenshot: admin-dashboard.png

Testing: Orders
  URL: https://frontend-two-swart-31.vercel.app/#/orders
  Errors: 0
  Empty states: 1
  Screenshot: admin-orders.png

=== ADMIN: Errors & API Calls ===

Console Errors: 3
  1. TypeError: Cannot read properties of undefined (reading 'slice')...
  2. ErrorBoundary caught an error...
  3. WebSocket is already in CLOSING or CLOSED state

Network Errors: 2
  1. 404 GET /api/claims
  2. 500 POST /api/analytics/calculate

API Calls Made: 45
  1. GET /api/trustscore/dashboard (200)
  2. GET /api/orders (200)
  3. GET /api/couriers (200)
  4. GET /api/claims (404) ❌
  5. POST /api/analytics/calculate (500) ❌
  ...

=== ADMIN: API Analysis ===

API Call Summary:
  Total API calls: 45
  Successful (2xx): 40
  Failed (4xx/5xx): 5
  Not Found (404): 2

Missing API Endpoints (404):
  1. GET /api/claims
  2. GET /api/lead-marketplace

Failed API Calls:
  1. 500 POST /api/analytics/calculate
  2. 403 GET /api/admin/settings
  3. 401 POST /api/subscriptions/change-plan

========================================
[Repeats for MERCHANT, COURIER, CONSUMER]
========================================

=== SUMMARY ===

ADMIN:
  Menu Items: 15
  Pages Tested: 15
  Console Errors: 3
  Network Errors: 2
  API Calls: 45
  Missing Endpoints: 2

MERCHANT:
  Menu Items: 14
  Pages Tested: 14
  Console Errors: 3
  Network Errors: 1
  API Calls: 38
  Missing Endpoints: 1

COURIER:
  Menu Items: 12
  Pages Tested: 12
  Console Errors: 2
  Network Errors: 0
  API Calls: 32
  Missing Endpoints: 0

CONSUMER:
  Menu Items: 8
  Pages Tested: 8
  Console Errors: 1
  Network Errors: 0
  API Calls: 15
  Missing Endpoints: 0
```

---

## 🎯 USE CASES

### 1. Find Missing API Endpoints
Quickly identify which API endpoints return 404:
```json
"missingEndpoints": [
  "GET /api/claims",
  "GET /api/lead-marketplace",
  "POST /api/review-requests"
]
```

### 2. Identify Role-Specific Issues
See which errors occur for which roles:
- Admin sees 500 error on analytics
- Merchant can't access claims
- Courier has no errors

### 3. Compare Role Capabilities
See what each role can access:
- Admin: 15 menu items
- Merchant: 14 menu items
- Courier: 12 menu items
- Consumer: 8 menu items

### 4. Track API Usage
See which endpoints are called most:
- `/api/trustscore/dashboard` - called by all roles
- `/api/orders` - called by admin, merchant, courier
- `/api/claims` - 404 (needs implementation)

---

## 🐛 TROUBLESHOOTING

### If test fails to login:
- Check credentials in the test file
- Verify login page URL
- Check if accounts exist in database

### If screenshots are blank:
- Increase `waitForTimeout` values
- Check if pages are loading correctly
- Verify authentication is working

### If API calls aren't captured:
- Check if backend is running
- Verify API base URL
- Check network tab in browser

---

## 📝 CUSTOMIZATION

Edit `all-roles-audit.spec.js` to:
- Add more roles
- Change test credentials
- Add specific page tests
- Modify error detection
- Add custom assertions

---

## ⏱️ ESTIMATED TIME

- **With browser visible:** ~10-15 minutes
- **Headless mode:** ~5-8 minutes

Each role takes about 2-3 minutes to test completely.

---

## 🎊 BENEFITS

1. **Complete Coverage** - Tests all roles in one run
2. **Error Detection** - Finds console and network errors
3. **API Analysis** - Identifies missing/broken endpoints
4. **Visual Proof** - Screenshots of every page
5. **Automated** - No manual clicking required
6. **Repeatable** - Run anytime to check status
7. **Comprehensive** - Captures everything in one report

---

## 🚀 RUN IT NOW!

```powershell
npm run test:all-roles
```

Then check:
- `screenshots/` folder for all page screenshots
- `audit-results.json` for complete data
- Console output for summary

**This will give you a complete picture of your entire frontend!** 🎯
