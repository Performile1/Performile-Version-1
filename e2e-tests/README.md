# Performile E2E Tests with Playwright

## 🚀 Quick Start

### 1. Install Dependencies

```powershell
# Navigate to e2e-tests folder
cd c:\Users\ricka\Downloads\performile-platform-main\performile-platform-main\e2e-tests

# Install Playwright
npm install

# Install browsers (Chrome, Firefox, Safari)
npx playwright install
```

### 2. Create Screenshots Folder

```powershell
mkdir screenshots
```

### 3. Run Tests

```powershell
# Run all tests
npm test

# Run specific test suites
npm run test:homepage          # Homepage tests
npm run test:subscription      # My Subscription tests
npm run test:admin-subs        # Admin subscription management
npm run test:navigation        # Navigation menu tests
npm run test:all               # Comprehensive all-users test

# Run with browser visible
npm run test:headed

# Run in debug mode (step through)
npm run test:debug
```

## 📋 What the Tests Do

### Homepage Tests (`homepage.spec.js`)
- ✅ Top navigation bar with Login/Register buttons
- ✅ Hero section with CTA buttons
- ✅ Feature showcase with 3 major features
- ✅ Feature grid with 6 cards
- ✅ Enhanced stats section (4 statistics)
- ✅ Customer testimonial with 5 stars
- ✅ CTA section and footer
- ✅ Responsive design (mobile/tablet)
- ✅ Performance checks

### My Subscription Tests (`subscription/my-subscription.spec.js`)
- ✅ Subscription page display
- ✅ Current plan details
- ✅ Usage statistics with progress bars
- ✅ Plan limits (merchant/courier specific)
- ✅ Quick actions (Upgrade, Manage Billing)
- ✅ Next renewal date
- ✅ Plan features display
- ✅ Error handling
- ✅ Access control
- ✅ Responsive design

### Admin Subscription Management (`admin/subscription-management.spec.js`)
- ✅ Subscription management page
- ✅ Merchant/Courier plan tabs
- ✅ Plan table display
- ✅ Edit dialog functionality
- ✅ Save plan changes
- ✅ Field validation
- ✅ Active status toggle
- ✅ Error handling
- ✅ Access control (admin only)
- ✅ Data validation

### Navigation Menu Tests (`navigation/menu-items.spec.js`)
- ✅ New menu items display
- ✅ My Subscription navigation
- ✅ Parcel Points navigation
- ✅ Service Performance navigation
- ✅ Coverage Checker navigation
- ✅ Active item highlighting
- ✅ Mobile drawer functionality
- ✅ Role-based access
- ✅ Sidebar behavior
- ✅ Performance checks

## 📁 Output

After running, you'll find:
- **screenshots/** - PNG files of every page
- **Console output** - Detailed test results
- **test-results/** - Full test report

## 🎯 Test Files

### Core Tests
- `all-users-comprehensive.spec.js` - Comprehensive test for all user roles
- `homepage.spec.js` - **NEW** Homepage with navigation and features
- `playwright.config.js` - Playwright configuration
- `package.json` - Dependencies and scripts

### Feature Tests (October 21, 2025)
- `subscription/my-subscription.spec.js` - **NEW** My Subscription page tests
- `admin/subscription-management.spec.js` - **NEW** Admin subscription editing
- `navigation/menu-items.spec.js` - **NEW** Navigation menu items

### Role-Specific Tests
- `auth/login.spec.js` - Authentication tests
- `merchant/dashboard.spec.js` - Merchant dashboard tests

## 📊 View Results

```powershell
# View HTML report
npm run report
```

## 🔧 Troubleshooting

### If browsers don't install:
```powershell
npx playwright install --force
```

### If test fails to login:
- Check credentials in `merchant-audit.spec.js`
- Verify login page URL
- Check if selectors match your login form

### If screenshots are blank:
- Increase `waitForTimeout` values
- Check if pages are loading correctly

## 📝 Customization

Edit `merchant-audit.spec.js` to:
- Change login credentials
- Add more test cases
- Modify selectors
- Add specific feature tests

## 🎨 Example Output

```
=== TESTING: Login & Dashboard ===
Current URL: https://frontend-two-swart-31.vercel.app/#/dashboard
Errors found: 0
✅ Dashboard test complete

=== TESTING: Navigation Menu ===
Found 8 navigation items:
  1. Dashboard -> #/dashboard
  2. Orders -> #/orders
  3. Trust Scores -> #/trustscores
  4. Analytics -> #/analytics
  ...
✅ Navigation menu documented
```

## 🚨 Important Notes

- Tests run in **Chrome** by default
- Browser will open and you can watch it work
- Screenshots saved to `screenshots/` folder
- Each test runs independently
- Login happens before each test

## 📞 Need Help?

If tests fail or you need to modify them, check:
1. Console output for error messages
2. Screenshots to see what the browser saw
3. `test-results/` folder for detailed logs
