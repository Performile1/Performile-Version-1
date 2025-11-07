# PLAYWRIGHT TESTING GUIDE - Analytics Dashboard

**Date:** November 7, 2025 - Week 2 Day 5  
**Feature:** Analytics Dashboard (Market List + Heatmap)  
**Test File:** `tests/e2e/analytics-dashboard.spec.ts`  
**Status:** ✅ Ready to Run

---

## 🚀 Quick Start

### **Option 1: Interactive Runner (Recommended)**

```powershell
.\scripts\test-analytics-dashboard.ps1
```

**Menu Options:**
1. Run all tests (headless) - Fast, no browser window
2. Run all tests (headed) - See browser, slower
3. Run specific test suite - Choose which suite to run
4. Run in UI mode - Interactive Playwright UI
5. Run in debug mode - Step through tests

### **Option 2: Direct Commands**

```powershell
# Run all tests
npx playwright test tests/e2e/analytics-dashboard.spec.ts

# Run with browser visible
npx playwright test tests/e2e/analytics-dashboard.spec.ts --headed

# Run in UI mode (best for debugging)
npx playwright test tests/e2e/analytics-dashboard.spec.ts --ui

# Run specific test
npx playwright test tests/e2e/analytics-dashboard.spec.ts --grep "should display Available Markets card"
```

---

## 📋 Test Coverage

### **8 Test Suites, 30+ Tests**

#### **Suite 1: Available Markets List (4 tests)**
- ✅ Display Available Markets card
- ✅ Load and display market list with data
- ✅ Display market statistics (orders, couriers, on-time rate)
- ✅ Show country flags in market list

#### **Suite 2: Market Selection & Filtering (2 tests)**
- ✅ Allow clicking on a market to filter data
- ✅ Highlight selected market

#### **Suite 3: Performance by Location - Table View (4 tests)**
- ✅ Display Performance by Location section
- ✅ Show country and time range filters
- ✅ Display subscription limits for admin
- ✅ Display performance data in table format

#### **Suite 4: Heatmap View (6 tests)**
- ✅ Show toggle buttons for Table and Heatmap views
- ✅ Switch to heatmap view when clicking Heatmap button
- ✅ Display color-coded postal code cards in heatmap
- ✅ Show performance legend in heatmap view
- ✅ Display postal code, city, and courier info in heatmap cards
- ✅ Switch back to table view from heatmap

#### **Suite 5: Filters & Interactions (2 tests)**
- ✅ Allow changing country filter
- ✅ Allow changing time range filter

#### **Suite 6: Mobile Responsive (2 tests)**
- ✅ Be responsive on mobile viewport
- ✅ Stack cards vertically on mobile

#### **Suite 7: Error Handling (2 tests)**
- ✅ Show appropriate message when no data available
- ✅ Handle API errors gracefully

#### **Suite 8: Performance (2 tests)**
- ✅ Load analytics page within acceptable time
- ✅ Not have memory leaks when switching views multiple times

---

## 🎯 What Each Test Validates

### **Functionality Tests:**
- Market list loads and displays data
- Clicking markets filters performance data
- Toggle between table and heatmap works
- Filters update data correctly
- Admin sees unlimited access

### **Visual Tests:**
- Country flags display correctly
- Color coding is applied
- Cards are properly styled
- Layout is responsive

### **UX Tests:**
- Loading states work
- Error messages display
- Interactions are smooth
- Mobile layout works

### **Performance Tests:**
- Page loads within 10 seconds
- No memory leaks
- Smooth view transitions

---

## 📊 Expected Results

### **All Tests Should Pass** ✅

**If tests fail, check:**
1. Is the app deployed to Vercel?
2. Is sample data generated in database?
3. Are admin credentials correct?
4. Is network connection stable?

### **Common Issues:**

#### **Issue 1: Timeout Errors**
```
Error: Timeout 60000ms exceeded
```
**Fix:** Increase timeout or check Vercel deployment

#### **Issue 2: Element Not Found**
```
Error: locator.click: Target closed
```
**Fix:** Check if selectors match actual UI

#### **Issue 3: No Data**
```
Test: should load and display market list with data - FAILED
```
**Fix:** Run sample data generator script

---

## 🧪 Running Specific Test Suites

### **Test Suite 1: Available Markets List**
```powershell
npx playwright test tests/e2e/analytics-dashboard.spec.ts --grep "Available Markets List"
```

### **Test Suite 2: Market Selection**
```powershell
npx playwright test tests/e2e/analytics-dashboard.spec.ts --grep "Market Selection"
```

### **Test Suite 3: Table View**
```powershell
npx playwright test tests/e2e/analytics-dashboard.spec.ts --grep "Table View"
```

### **Test Suite 4: Heatmap View**
```powershell
npx playwright test tests/e2e/analytics-dashboard.spec.ts --grep "Heatmap View"
```

### **Test Suite 5: Filters**
```powershell
npx playwright test tests/e2e/analytics-dashboard.spec.ts --grep "Filters"
```

### **Test Suite 6: Mobile**
```powershell
npx playwright test tests/e2e/analytics-dashboard.spec.ts --grep "Mobile"
```

### **Test Suite 7: Error Handling**
```powershell
npx playwright test tests/e2e/analytics-dashboard.spec.ts --grep "Error Handling"
```

### **Test Suite 8: Performance**
```powershell
npx playwright test tests/e2e/analytics-dashboard.spec.ts --grep "Performance"
```

---

## 📈 Viewing Test Results

### **HTML Report**
```powershell
npx playwright show-report
```

### **Console Output**
Tests run in console show:
- ✅ Passed tests (green)
- ❌ Failed tests (red)
- ⏭️ Skipped tests (yellow)
- Total time taken

### **Screenshots & Videos**
Failed tests automatically capture:
- Screenshot at failure point
- Video of entire test
- Trace file for debugging

**Location:** `test-results/` folder

---

## 🎨 Debugging Tests

### **Method 1: UI Mode (Best)**
```powershell
npx playwright test tests/e2e/analytics-dashboard.spec.ts --ui
```

**Features:**
- See tests run in real-time
- Pause and step through
- Inspect elements
- View network requests
- Time travel debugging

### **Method 2: Debug Mode**
```powershell
npx playwright test tests/e2e/analytics-dashboard.spec.ts --debug
```

**Features:**
- Opens Playwright Inspector
- Step through each action
- Inspect page state
- Modify selectors live

### **Method 3: Headed Mode**
```powershell
npx playwright test tests/e2e/analytics-dashboard.spec.ts --headed
```

**Features:**
- See browser window
- Watch tests execute
- Slower but visual

---

## 📝 Test Evaluation Checklist

After running tests, evaluate:

### **✅ Functionality (9/10)**
- [ ] All features work as expected
- [ ] Market list loads data
- [ ] Clicking markets filters data
- [ ] Toggle between views works
- [ ] Filters update correctly

### **✅ User Experience (9/10)**
- [ ] Interface is intuitive
- [ ] Interactions are smooth
- [ ] Loading states are clear
- [ ] Error messages are helpful
- [ ] Mobile layout works well

### **✅ Visual Design (9/10)**
- [ ] Color coding is clear
- [ ] Layout is clean
- [ ] Typography is readable
- [ ] Spacing is consistent
- [ ] Responsive design works

### **✅ Performance (8/10)**
- [ ] Page loads quickly
- [ ] No lag when switching views
- [ ] No memory leaks
- [ ] Smooth animations

### **✅ Comparison to Original (10/10)**
- [ ] All planned features implemented
- [ ] Additional enhancements added
- [ ] Better than expected
- [ ] Production ready

---

## 🎯 Success Criteria

### **Tests Must Pass:**
- ✅ At least 90% of tests pass
- ✅ No critical failures
- ✅ All major features work

### **User-Friendliness:**
- ✅ Rating: 8/10 or higher
- ✅ Intuitive navigation
- ✅ Clear visual hierarchy
- ✅ Responsive design

### **Implementation Quality:**
- ✅ Matches original plan
- ✅ Includes enhancements
- ✅ Production ready
- ✅ No major bugs

---

## 📊 Test Results Template

```markdown
# Analytics Dashboard Test Results

**Date:** November 7, 2025
**Tester:** [Your Name]
**Environment:** Vercel Production

## Test Execution

**Total Tests:** 30+
**Passed:** [X]
**Failed:** [X]
**Skipped:** [X]
**Duration:** [X] minutes

## Test Suites

1. Available Markets List: [X/4] ✅/❌
2. Market Selection: [X/2] ✅/❌
3. Table View: [X/4] ✅/❌
4. Heatmap View: [X/6] ✅/❌
5. Filters: [X/2] ✅/❌
6. Mobile: [X/2] ✅/❌
7. Error Handling: [X/2] ✅/❌
8. Performance: [X/2] ✅/❌

## User-Friendliness Rating

**Overall:** [X]/10

- Intuitive: [X]/10
- Visual: [X]/10
- Informative: [X]/10
- Interactive: [X]/10
- Responsive: [X]/10

## Comparison to Original

**Implementation Quality:** [A+/A/B/C/D/F]

**Better/Worse/Same:** [Better/Worse/Same]

**Reasons:**
- [Reason 1]
- [Reason 2]
- [Reason 3]

## Issues Found

1. [Issue description]
   - Severity: [Critical/High/Medium/Low]
   - Fix: [How to fix]

## Recommendations

1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]

## Conclusion

[Overall assessment and approval status]
```

---

## 🚀 Next Steps After Testing

1. **Document Results**
   - Fill out test results template
   - Create `ANALYTICS_TEST_RESULTS.md`
   - Update `FEATURE_COMPARISON.md`

2. **Fix Any Issues**
   - Address critical bugs
   - Document known issues
   - Create tickets for improvements

3. **Update Documentation**
   - Update master document
   - Update investor package
   - Update code audit

4. **Deploy to Production**
   - If all tests pass
   - If user-friendliness is 8+
   - If no critical issues

---

## 📚 Additional Resources

- **Playwright Docs:** https://playwright.dev
- **Test File:** `tests/e2e/analytics-dashboard.spec.ts`
- **Feature Comparison:** `docs/daily/2025-11-07/FEATURE_COMPARISON.md`
- **Start of Day:** `docs/daily/2025-11-07/START_OF_DAY_WEEK2_DAY5.md`

---

**Ready to test! Run the interactive script and let's validate the Analytics Dashboard! 🧪**
