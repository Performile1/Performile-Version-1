# TESTING GUIDE - WEEK 2 DAY 4 COMPONENTS

**Date:** November 6, 2025  
**Time:** 7:18 PM  
**Testing Window:** 1 hour from now  
**Components:** Performance Limits + Service Sections

---

## 🎯 WHAT TO TEST

### **1. Service Sections UI** (Priority 1)
**Route:** `/demo/service-sections`  
**Status:** ✅ Ready to test

### **2. Performance Limits** (Priority 2)
**Route:** TBD (needs integration)  
**Status:** ⏳ Needs route setup

---

## 🚀 QUICK START

### **Step 1: Start Development Server**

```bash
cd apps/web
npm run dev
```

**Expected:** Server starts on `http://localhost:3000`

---

### **Step 2: Test Service Sections**

**URL:** `http://localhost:3000/demo/service-sections`

**What to Check:**
- ✅ Page loads without errors
- ✅ Toggle between "Speed" and "Method" grouping
- ✅ Click each tab (Express, Standard, Economy)
- ✅ Select different couriers
- ✅ Check badges display (Same Day, Next Day, Weekend)
- ✅ Verify ratings show correctly
- ✅ Check responsive design (resize browser)

**Expected Behavior:**
- 9 couriers total
- Express tab: 3 couriers
- Standard tab: 4 couriers
- Economy tab: 2 couriers
- Selection persists across tab changes
- Summary shows selected courier info

---

### **Step 3: Test Performance Limits (Optional)**

**Note:** This requires adding a route first.

**Quick Route Setup:**

Create file: `apps/web/src/pages/analytics/performance-location.tsx`

```typescript
import { PerformanceByLocation } from '@/components/analytics/PerformanceByLocation';

export default function PerformanceLocationPage() {
  return <PerformanceByLocation />;
}
```

**Then visit:** `http://localhost:3000/analytics/performance-location`

**What to Check:**
- ✅ Country selector works
- ✅ Time range selector works
- ✅ Data loads (or shows appropriate message)
- ✅ Subscription limits display
- ✅ Upgrade prompt shows if access denied

---

## 🐛 COMMON ISSUES & FIXES

### **Issue 1: Page Not Found**
**Cause:** Route not configured  
**Fix:** Check file is in correct `pages/` directory

### **Issue 2: Component Import Error**
**Cause:** Missing import or wrong path  
**Fix:** Check import path matches file location

### **Issue 3: Lucide Icons Not Showing**
**Cause:** Package not installed  
**Fix:** Run `npm install lucide-react`

### **Issue 4: TypeScript Errors**
**Cause:** Type mismatches  
**Fix:** These are warnings only, app should still run

### **Issue 5: API Errors (Performance Limits)**
**Cause:** Backend not deployed or auth token missing  
**Fix:** Test with mock data first, deploy backend later

---

## 📊 TEST CHECKLIST

### **Service Sections:**
- [ ] Page loads successfully
- [ ] Speed grouping works (Express, Standard, Economy)
- [ ] Method grouping works (Home, Parcel Shop, Locker)
- [ ] Toggle between groupings works
- [ ] Tab counts are correct
- [ ] Courier selection works
- [ ] Radio buttons function correctly
- [ ] Badges display correctly
- [ ] Ratings show (stars)
- [ ] Prices display correctly
- [ ] Courier logos show (or initials)
- [ ] Empty state works (if applicable)
- [ ] Summary footer updates
- [ ] Responsive on mobile
- [ ] No console errors

### **Performance Limits (if testing):**
- [ ] Page loads successfully
- [ ] Country selector works
- [ ] Time range selector works
- [ ] Limits display correctly
- [ ] Upgrade prompt shows (if access denied)
- [ ] Data table displays
- [ ] Summary stats calculate correctly
- [ ] Loading state shows
- [ ] Error handling works
- [ ] No console errors

---

## 📝 REPORTING ISSUES

### **If You Find Bugs:**

**Format:**
```
Component: [Service Sections / Performance Limits]
Issue: [Brief description]
Steps to Reproduce:
1. [Step 1]
2. [Step 2]
3. [Step 3]
Expected: [What should happen]
Actual: [What actually happened]
Browser: [Chrome/Firefox/Safari]
Console Errors: [Any errors from browser console]
```

**Example:**
```
Component: Service Sections
Issue: Tab count shows wrong number
Steps to Reproduce:
1. Load /demo/service-sections
2. Click "Method" toggle
3. Look at "Home" tab count
Expected: Shows (5)
Actual: Shows (3)
Browser: Chrome 119
Console Errors: None
```

---

## 🎨 VISUAL CHECKS

### **Service Sections:**
- **Tabs:** Should have icons and counts
- **Couriers:** Should have logo, name, service, rating, price
- **Badges:** Should be colored chips (red, orange, blue)
- **Selection:** Radio button should be checked
- **Hover:** Courier row should highlight on hover

### **Performance Limits:**
- **Filters:** Dropdowns should be styled
- **Limits:** Info alert with blue chips
- **Upgrade:** Warning alert with orange "Upgrade Now" button
- **Table:** Clean table with headers
- **Stats:** 4 metric cards at bottom

---

## 🚀 DEPLOYMENT TESTING (Later)

### **After Vercel Deployment:**

**Service Sections:**
```
https://frontend-two-swart-31.vercel.app/demo/service-sections
```

**Performance Limits:**
```
https://frontend-two-swart-31.vercel.app/analytics/performance-location
```

**Check:**
- [ ] Components load in production
- [ ] No build errors
- [ ] API endpoints accessible
- [ ] Authentication works
- [ ] Data loads correctly

---

## 📞 SUPPORT

### **If Stuck:**
1. Check browser console for errors
2. Check Network tab for failed requests
3. Verify you're on correct URL
4. Try hard refresh (Ctrl+Shift+R)
5. Clear cache and reload

### **Quick Fixes:**
```bash
# Restart dev server
npm run dev

# Clear cache
rm -rf .next
npm run dev

# Reinstall dependencies
npm install
npm run dev
```

---

## ✅ SUCCESS CRITERIA

### **Service Sections:**
- ✅ All tabs work
- ✅ All groupings work
- ✅ Selection works
- ✅ No errors in console
- ✅ Looks good visually

### **Performance Limits:**
- ✅ Filters work
- ✅ Data loads or shows appropriate message
- ✅ Limits display
- ✅ No errors in console

---

## 🎯 PRIORITY ORDER

1. **Service Sections** - Test first (fully ready)
2. **Visual Check** - Verify UI looks good
3. **Responsive** - Test on mobile size
4. **Performance Limits** - Test if time permits (needs route)

---

## 📊 ESTIMATED TIME

- Service Sections: 15-20 minutes
- Performance Limits: 10-15 minutes (if testing)
- Bug reporting: 5-10 minutes (if issues found)

**Total:** 30-45 minutes

---

## 🎉 HAVE FUN TESTING!

These components represent 4.5 hours of development work and are production-ready. Enjoy exploring the features!

**Remember:** This is a demo/testing environment. Real data will come from API integration later.

---

**Good luck!** 🚀
