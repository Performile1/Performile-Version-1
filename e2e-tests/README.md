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

### 3. Run the Merchant Audit

```powershell
# Run with browser visible (recommended)
npm run test:merchant

# Or run all tests
npm test

# Or run in debug mode (step through)
npm run test:debug
```

## 📋 What the Test Does

The merchant audit test will:
1. ✅ Log in as merchant
2. ✅ Screenshot the dashboard
3. ✅ List all navigation menu items
4. ✅ Visit every page and screenshot it
5. ✅ Check for errors on each page
6. ✅ Record console errors
7. ✅ Record network errors (failed API calls)
8. ✅ Document all buttons and forms

## 📁 Output

After running, you'll find:
- **screenshots/** - PNG files of every page
- **Console output** - Detailed test results
- **test-results/** - Full test report

## 🎯 Test Files

- `merchant-audit.spec.js` - Main merchant role test
- `playwright.config.js` - Playwright configuration
- `package.json` - Dependencies and scripts

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
